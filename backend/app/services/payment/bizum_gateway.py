"""
Bizum payment gateway stub.

Bizum is a mobile-based P2P and e-commerce payment system used by
virtually all Spanish banks.  For e-commerce integration, Bizum
operates through the Redsys infrastructure with a specific payment
method indicator.

Production implementation notes:

1. Bizum e-commerce payments go through the Redsys API with
   ``Ds_Merchant_PayMethods`` set to ``z`` (Bizum).
2. The customer confirms the payment on their banking app via push
   notification.
3. Redsys sends an asynchronous notification with the result.

TODO: Implement Bizum flow via Redsys API (PayMethods=z).
TODO: Handle the async push-notification confirmation flow.
TODO: Add timeout handling -- Bizum gives the user ~5 minutes to confirm.
"""

from __future__ import annotations

import logging
from decimal import Decimal
from typing import Any

from app.services.payment.base import (
    PaymentGateway,
    PaymentGatewayFactory,
    PaymentResult,
)

logger = logging.getLogger(__name__)


class BizumGateway(PaymentGateway):
    """Bizum stub -- raises NotImplementedError for all operations."""

    async def create_payment_intent(
        self,
        amount: Decimal,
        currency: str,
        metadata: dict[str, Any] | None = None,
    ) -> PaymentResult:
        # TODO: Create Redsys payment request with Ds_Merchant_PayMethods="z"
        #       and return redirect/QR data for the Bizum mobile flow.
        raise NotImplementedError(
            "Bizum create_payment_intent is not yet implemented. "
            "See module docstring for integration plan."
        )

    async def confirm_payment(
        self,
        payment_intent_id: str,
    ) -> PaymentResult:
        # TODO: Confirmation arrives asynchronously via Redsys notification
        #       after the user approves the push notification in their bank app.
        raise NotImplementedError(
            "Bizum confirm_payment is not yet implemented."
        )

    async def refund_payment(
        self,
        payment_intent_id: str,
        amount: Decimal | None = None,
    ) -> PaymentResult:
        # TODO: Refunds follow the standard Redsys refund flow
        #       (transaction type "3") for Bizum-originated payments.
        raise NotImplementedError(
            "Bizum refund_payment is not yet implemented."
        )

    async def handle_webhook(
        self,
        payload: bytes,
        headers: dict[str, str],
    ) -> PaymentResult:
        # TODO: Webhook is the same Redsys notification endpoint;
        #       distinguish Bizum by checking Ds_Merchant_PayMethods in response.
        raise NotImplementedError(
            "Bizum handle_webhook is not yet implemented."
        )


# Register with the factory
PaymentGatewayFactory.register("bizum", BizumGateway)
