"""
Redsys payment gateway stub.

Redsys is the dominant card-processing gateway in Spain, used by most
Spanish banks.  A production implementation would:

1. Generate the ``Ds_MerchantParameters`` base64 payload.
2. Sign it with HMAC-SHA256 using the merchant secret key.
3. Redirect the user to the Redsys hosted payment page.
4. Verify the response signature on the notification callback.

Reference:
    - https://pagosonline.redsys.es/conexion-insite.html
    - https://canales.redsys.es/canales/ayuda/documentacion.html

TODO: Implement full Redsys REST/redirect integration.
TODO: Add Redsys test-environment sandbox credentials.
TODO: Implement 3-D Secure v2 (SCA) flow required by PSD2.
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


class RedsysGateway(PaymentGateway):
    """Redsys stub -- raises NotImplementedError for all operations."""

    async def create_payment_intent(
        self,
        amount: Decimal,
        currency: str,
        metadata: dict[str, Any] | None = None,
    ) -> PaymentResult:
        # TODO: Build Ds_MerchantParameters JSON, base64-encode, HMAC-sign,
        #       and return a redirect URL to the Redsys hosted payment page.
        raise NotImplementedError(
            "Redsys create_payment_intent is not yet implemented. "
            "See module docstring for integration plan."
        )

    async def confirm_payment(
        self,
        payment_intent_id: str,
    ) -> PaymentResult:
        # TODO: Redsys confirmations arrive via server-to-server notification
        #       (URL de notificacion). Parse Ds_Response code to confirm.
        raise NotImplementedError(
            "Redsys confirm_payment is not yet implemented."
        )

    async def refund_payment(
        self,
        payment_intent_id: str,
        amount: Decimal | None = None,
    ) -> PaymentResult:
        # TODO: Use Redsys REST API with transaction type "3" (refund).
        raise NotImplementedError(
            "Redsys refund_payment is not yet implemented."
        )

    async def handle_webhook(
        self,
        payload: bytes,
        headers: dict[str, str],
    ) -> PaymentResult:
        # TODO: Decode Ds_MerchantParameters, verify HMAC signature,
        #       extract Ds_Response and Ds_AuthorisationCode.
        raise NotImplementedError(
            "Redsys handle_webhook is not yet implemented."
        )


# Register with the factory
PaymentGatewayFactory.register("redsys", RedsysGateway)
