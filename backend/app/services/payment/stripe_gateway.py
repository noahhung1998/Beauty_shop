"""
Stripe payment gateway implementation.

Uses the Stripe Python SDK with async-compatible calls.
All amounts are converted to the smallest currency unit (cents for EUR).
"""

from __future__ import annotations

import logging
from decimal import Decimal
from typing import Any

import stripe

from app.config import get_settings
from app.services.payment.base import (
    PaymentGateway,
    PaymentGatewayFactory,
    PaymentResult,
)

logger = logging.getLogger(__name__)
settings = get_settings()

# Configure the Stripe SDK at module level
stripe.api_key = settings.STRIPE_SECRET_KEY


def _to_cents(amount: Decimal) -> int:
    """Convert a Decimal euro amount to integer cents."""
    return int((amount * 100).to_integral_value())


class StripeGateway(PaymentGateway):
    """Concrete Stripe implementation of PaymentGateway."""

    async def create_payment_intent(
        self,
        amount: Decimal,
        currency: str,
        metadata: dict[str, Any] | None = None,
    ) -> PaymentResult:
        """Create a Stripe PaymentIntent."""
        try:
            intent = stripe.PaymentIntent.create(
                amount=_to_cents(amount),
                currency=currency.lower(),
                metadata=metadata or {},
                automatic_payment_methods={"enabled": True},
            )
            return PaymentResult(
                success=True,
                payment_intent_id=intent.id,
                status=intent.status,
                raw_response=dict(intent),
            )
        except stripe.error.StripeError as exc:
            logger.error("Stripe create_payment_intent failed: %s", exc)
            return PaymentResult(
                success=False,
                error_message=str(exc),
            )

    async def confirm_payment(
        self,
        payment_intent_id: str,
    ) -> PaymentResult:
        """Confirm (capture) a Stripe PaymentIntent."""
        try:
            intent = stripe.PaymentIntent.confirm(payment_intent_id)
            return PaymentResult(
                success=True,
                payment_intent_id=intent.id,
                status=intent.status,
                raw_response=dict(intent),
            )
        except stripe.error.StripeError as exc:
            logger.error("Stripe confirm_payment failed: %s", exc)
            return PaymentResult(
                success=False,
                error_message=str(exc),
            )

    async def refund_payment(
        self,
        payment_intent_id: str,
        amount: Decimal | None = None,
    ) -> PaymentResult:
        """Issue a Stripe refund. Omit *amount* for a full refund."""
        try:
            params: dict[str, Any] = {"payment_intent": payment_intent_id}
            if amount is not None:
                params["amount"] = _to_cents(amount)

            refund = stripe.Refund.create(**params)
            return PaymentResult(
                success=True,
                payment_intent_id=payment_intent_id,
                status=refund.status,
                raw_response=dict(refund),
            )
        except stripe.error.StripeError as exc:
            logger.error("Stripe refund_payment failed: %s", exc)
            return PaymentResult(
                success=False,
                error_message=str(exc),
            )

    async def handle_webhook(
        self,
        payload: bytes,
        headers: dict[str, str],
    ) -> PaymentResult:
        """Verify Stripe webhook signature and extract event data."""
        sig_header = headers.get("stripe-signature", "")
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except stripe.error.SignatureVerificationError:
            logger.warning("Invalid Stripe webhook signature")
            return PaymentResult(
                success=False,
                error_message="Invalid webhook signature",
            )
        except ValueError:
            logger.warning("Invalid Stripe webhook payload")
            return PaymentResult(
                success=False,
                error_message="Invalid webhook payload",
            )

        # Extract PaymentIntent from the webhook event
        event_data = event.data.object
        payment_intent_id = getattr(event_data, "id", None)

        logger.info("Stripe webhook event: %s", event.type)
        return PaymentResult(
            success=True,
            payment_intent_id=payment_intent_id,
            status=event.type,
            raw_response=event.to_dict(),
        )


# Register with the factory
PaymentGatewayFactory.register("stripe", StripeGateway)
