"""
Abstract Factory for payment gateways.

New gateways are registered in ``PaymentGatewayFactory._registry`` and
looked up by name at runtime, decoupling the order service from any
concrete payment provider.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Any


class PaymentResult:
    """Standardized result returned by every gateway operation."""

    def __init__(
        self,
        success: bool,
        payment_intent_id: str | None = None,
        status: str | None = None,
        redirect_url: str | None = None,
        error_message: str | None = None,
        raw_response: dict[str, Any] | None = None,
    ) -> None:
        self.success = success
        self.payment_intent_id = payment_intent_id
        self.status = status
        self.redirect_url = redirect_url
        self.error_message = error_message
        self.raw_response = raw_response or {}


class PaymentGateway(ABC):
    """Abstract base class that all payment gateways must implement."""

    @abstractmethod
    async def create_payment_intent(
        self,
        amount: Decimal,
        currency: str,
        metadata: dict[str, Any] | None = None,
    ) -> PaymentResult:
        """Create a new payment intent / authorization request."""
        ...

    @abstractmethod
    async def confirm_payment(
        self,
        payment_intent_id: str,
    ) -> PaymentResult:
        """Confirm (capture) a previously created payment intent."""
        ...

    @abstractmethod
    async def refund_payment(
        self,
        payment_intent_id: str,
        amount: Decimal | None = None,
    ) -> PaymentResult:
        """Issue a full or partial refund for a captured payment."""
        ...

    @abstractmethod
    async def handle_webhook(
        self,
        payload: bytes,
        headers: dict[str, str],
    ) -> PaymentResult:
        """Verify and process an incoming webhook from the provider."""
        ...


class PaymentGatewayFactory:
    """Registry-based factory for obtaining payment gateways by name."""

    _registry: dict[str, type[PaymentGateway]] = {}

    @classmethod
    def register(cls, name: str, gateway_cls: type[PaymentGateway]) -> None:
        """Register a gateway class under a string key."""
        cls._registry[name.lower()] = gateway_cls

    @classmethod
    def get_gateway(cls, name: str) -> PaymentGateway:
        """Instantiate and return the gateway matching *name*.

        Raises:
            ValueError: If the requested gateway is not registered.
        """
        key = name.lower()
        if key not in cls._registry:
            available = ", ".join(sorted(cls._registry.keys())) or "(none)"
            raise ValueError(
                f"Unknown payment gateway '{name}'. Available: {available}"
            )
        return cls._registry[key]()
