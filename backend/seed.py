"""Seed script to populate the database with sample products and an admin user."""

import asyncio
import uuid
from decimal import Decimal
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from app.database import async_session_factory, engine
from app.models.user import User
from app.models.product import Product
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SAMPLE_PRODUCTS = [
    {
        "sku": "BS-SERUM-001",
        "name": "Sérum Ácido Hialurónico Puro",
        "slug": "serum-acido-hialuronico",
        "description": "Sérum facial de ácido hialurónico puro al 2% para una hidratación profunda. Fórmula ligera que penetra rápidamente en la piel, rellenando líneas finas y aportando luminosidad. Apto para todo tipo de pieles.",
        "description_short": "Hidratación profunda con ácido hialurónico al 2%",
        "price_net": Decimal("24.79"),
        "tax_rate": Decimal("21.00"),
        "currency": "EUR",
        "stock_quantity": 150,
        "category": "facial",
        "brand": "Beauty Lash",
        "image_urls": ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600"],
        "is_active": True,
        "weight_grams": 30,
    },
    {
        "sku": "BS-CREAM-001",
        "name": "Crema Hidratante Rosa Mosqueta",
        "slug": "crema-hidratante-rosa-mosqueta",
        "description": "Crema facial enriquecida con aceite de rosa mosqueta orgánico. Repara, nutre y protege la piel durante todo el día. Con vitamina E y extracto de aloe vera. Sin parabenos.",
        "description_short": "Nutrición intensiva con rosa mosqueta orgánica",
        "price_net": Decimal("32.23"),
        "tax_rate": Decimal("21.00"),
        "currency": "EUR",
        "stock_quantity": 200,
        "category": "facial",
        "brand": "Beauty Lash",
        "image_urls": ["https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600"],
        "is_active": True,
        "weight_grams": 50,
    },
    {
        "sku": "BS-MASK-001",
        "name": "Mascarilla de Arcilla Purificante",
        "slug": "mascarilla-arcilla-purificante",
        "description": "Mascarilla facial de arcilla verde con carbón activo. Limpia los poros en profundidad, absorbe el exceso de grasa y devuelve un aspecto fresco y mate. Uso semanal recomendado.",
        "description_short": "Limpieza profunda con arcilla verde y carbón activo",
        "price_net": Decimal("18.18"),
        "tax_rate": Decimal("21.00"),
        "currency": "EUR",
        "stock_quantity": 120,
        "category": "facial",
        "brand": "NaturSkin",
        "image_urls": ["https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600"],
        "is_active": True,
        "weight_grams": 100,
    },
    {
        "sku": "BS-OIL-001",
        "name": "Aceite Corporal de Argán Dorado",
        "slug": "aceite-corporal-argan-dorado",
        "description": "Aceite corporal 100% natural de argán marroquí prensado en frío. Hidrata, suaviza y da luminosidad a la piel. Con partículas doradas para un acabado radiante. Perfecto para después de la ducha.",
        "description_short": "Aceite de argán con partículas doradas",
        "price_net": Decimal("28.93"),
        "tax_rate": Decimal("21.00"),
        "currency": "EUR",
        "stock_quantity": 80,
        "category": "corporal",
        "brand": "Beauty Lash",
        "image_urls": ["https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600"],
        "is_active": True,
        "weight_grams": 200,
    },
    {
        "sku": "BS-LIP-001",
        "name": "Bálsamo Labial Cereza Orgánico",
        "slug": "balsamo-labial-cereza",
        "description": "Bálsamo labial con extracto de cereza orgánica y manteca de karité. Hidrata, protege y da un toque de color natural a los labios. Con SPF 15. Sin ingredientes sintéticos.",
        "description_short": "Hidratación labial con cereza orgánica y SPF 15",
        "price_net": Decimal("8.26"),
        "tax_rate": Decimal("21.00"),
        "currency": "EUR",
        "stock_quantity": 300,
        "category": "labios",
        "brand": "NaturSkin",
        "image_urls": ["https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600"],
        "is_active": True,
        "weight_grams": 10,
    },
    {
        "sku": "BS-EYE-001",
        "name": "Contorno de Ojos Antiedad Péptidos",
        "slug": "contorno-ojos-antiedad-peptidos",
        "description": "Crema contorno de ojos con péptidos bioactivos y cafeína. Reduce ojeras, bolsas e hinchazón. Fórmula ligera de rápida absorción con retinol encapsulado. Resultados visibles en 2 semanas.",
        "description_short": "Anti-ojeras con péptidos y cafeína",
        "price_net": Decimal("36.36"),
        "tax_rate": Decimal("21.00"),
        "currency": "EUR",
        "stock_quantity": 90,
        "category": "facial",
        "brand": "Beauty Lash",
        "image_urls": ["https://images.unsplash.com/photo-1570194065650-d99fb4b38b17?w=600"],
        "is_active": True,
        "weight_grams": 15,
    },
    {
        "sku": "BS-SHAM-001",
        "name": "Champú Reparador Keratina",
        "slug": "champu-reparador-keratina",
        "description": "Champú profesional con keratina hidrolizada para cabello dañado. Repara la fibra capilar desde el interior, aportando suavidad y brillo. Sin sulfatos ni siliconas. Apto para uso diario.",
        "description_short": "Reparación capilar con keratina profesional",
        "price_net": Decimal("14.88"),
        "tax_rate": Decimal("21.00"),
        "currency": "EUR",
        "stock_quantity": 250,
        "category": "cabello",
        "brand": "HairLux",
        "image_urls": ["https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600"],
        "is_active": True,
        "weight_grams": 250,
    },
    {
        "sku": "BS-PERF-001",
        "name": "Eau de Parfum Flor de Azahar",
        "slug": "parfum-flor-azahar",
        "description": "Perfume artesanal con notas de azahar de Sevilla, jazmín blanco y madera de sándalo. Fragancia fresca y sofisticada que evoca los jardines de Andalucía. Duración de hasta 8 horas.",
        "description_short": "Fragancia artesanal de azahar sevillano",
        "price_net": Decimal("49.59"),
        "tax_rate": Decimal("21.00"),
        "currency": "EUR",
        "stock_quantity": 60,
        "category": "perfumería",
        "brand": "Beauty Lash",
        "image_urls": ["https://images.unsplash.com/photo-1541643600914-78b084683601?w=600"],
        "is_active": True,
        "weight_grams": 100,
    },
]


async def seed():
    async with async_session_factory() as session:
        # Create admin user
        admin = User(
            id=uuid.uuid4(),
            email="admin@beautyshop.es",
            hashed_password=pwd_context.hash("admin123"),
            first_name="Admin",
            last_name="Beauty Shop",
            is_active=True,
            is_admin=True,
            country="ES",
            gdpr_consent_at=datetime.now(timezone.utc),
            gdpr_consent_ip="127.0.0.1",
        )
        session.add(admin)

        # Create test customer
        customer = User(
            id=uuid.uuid4(),
            email="cliente@test.es",
            hashed_password=pwd_context.hash("test123"),
            first_name="María",
            last_name="García López",
            phone="+34 612 345 678",
            street="Calle Gran Vía 28, 3º Izq",
            city="Madrid",
            postal_code="28013",
            province="Madrid",
            country="ES",
            is_active=True,
            is_admin=False,
            gdpr_consent_at=datetime.now(timezone.utc),
            gdpr_consent_ip="127.0.0.1",
        )
        session.add(customer)

        # Create products
        for p in SAMPLE_PRODUCTS:
            product = Product(**p)
            session.add(product)

        await session.commit()
        print(f"✅ Seed completed!")
        print(f"   - 1 admin user: admin@beautyshop.es / admin123")
        print(f"   - 1 test customer: cliente@test.es / test123")
        print(f"   - {len(SAMPLE_PRODUCTS)} sample products")


if __name__ == "__main__":
    asyncio.run(seed())
