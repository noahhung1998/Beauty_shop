"""
Spanish IVA (Impuesto sobre el Valor Anadido) tax calculator.

Spain has three standard IVA bands:
    - 21 %  General          (most goods including cosmetics)
    - 10 %  Reduced          (food, water, pharma, hospitality)
    -  4 %  Super-reduced    (bread, milk, books, medicine, accessible devices)

References:
    - Ley 37/1992, de 28 de diciembre, del Impuesto sobre el Valor Anadido
    - https://www.agenciatributaria.es
"""

from decimal import Decimal, ROUND_HALF_UP

# ---------------------------------------------------------------------------
# Tax rate constants
# ---------------------------------------------------------------------------
IVA_GENERAL = Decimal("21.00")
IVA_REDUCED = Decimal("10.00")
IVA_SUPER_REDUCED = Decimal("4.00")

# Category -> tax rate mapping.
# "General" is the default for beauty / cosmetics products.
_CATEGORY_TAX_MAP: dict[str, Decimal] = {
    # Super-reduced (4 %)
    "bread": IVA_SUPER_REDUCED,
    "milk": IVA_SUPER_REDUCED,
    "books": IVA_SUPER_REDUCED,
    "medicine": IVA_SUPER_REDUCED,
    "accessibility_devices": IVA_SUPER_REDUCED,

    # Reduced (10 %)
    "food": IVA_REDUCED,
    "water": IVA_REDUCED,
    "pharma": IVA_REDUCED,
    "hospitality": IVA_REDUCED,
    "transport": IVA_REDUCED,

    # General (21 %) -- cosmetics & beauty are here
    "cosmetics": IVA_GENERAL,
    "beauty": IVA_GENERAL,
    "perfumery": IVA_GENERAL,
    "electronics": IVA_GENERAL,
    "clothing": IVA_GENERAL,
}

_TWO_PLACES = Decimal("0.01")


def calculate_tax(
    price_net: Decimal,
    tax_rate: Decimal,
) -> tuple[Decimal, Decimal]:
    """Calculate tax amount and gross price from a net price.

    Args:
        price_net: Price excluding tax.
        tax_rate: Tax rate as a percentage (e.g. ``Decimal("21.00")``).

    Returns:
        A tuple of ``(tax_amount, price_gross)`` both rounded to 2 decimals.

    Raises:
        ValueError: If ``price_net`` is negative or ``tax_rate`` is negative.
    """
    if price_net < 0:
        raise ValueError("price_net must be >= 0")
    if tax_rate < 0:
        raise ValueError("tax_rate must be >= 0")

    tax_amount = (price_net * tax_rate / Decimal("100")).quantize(
        _TWO_PLACES, rounding=ROUND_HALF_UP
    )
    price_gross = (price_net + tax_amount).quantize(
        _TWO_PLACES, rounding=ROUND_HALF_UP
    )
    return tax_amount, price_gross


def get_tax_rate_for_category(category: str | None) -> Decimal:
    """Return the IVA rate applicable to a product category.

    Defaults to the general 21 % rate if the category is unknown or None.
    """
    if category is None:
        return IVA_GENERAL
    return _CATEGORY_TAX_MAP.get(category.lower().strip(), IVA_GENERAL)
