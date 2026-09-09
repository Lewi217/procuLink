"""
Seed script: creates 2 SUPPLIER accounts and 10 realistic CatalogItems.
Run with: docker compose exec web uv run python app/scripts/seed_catalog.py
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.catalog import CatalogItem, CatalogCategory, CatalogUnit
from app.core.security import get_password_hash as hash_password
from sqlalchemy import select


SUPPLIERS = [
    {"email": "kariuki.hardware@proculink.co.ke", "full_name": "Kariuki Hardware Ltd", "password": "Supplier@123"},
    {"email": "nairobi.metals@proculink.co.ke",  "full_name": "Nairobi Metals & Timber", "password": "Supplier@123"},
]

CATALOG_ITEMS = [
    # Kariuki Hardware (index 0) — METAL & PACKAGING
    dict(name="Mild steel sheets, 3mm", category=CatalogCategory.METAL, unit=CatalogUnit.SHEET,
         retail_price_per_unit=1800, bulk_price_per_unit=1450, bulk_threshold_quantity=60, stock_quantity=210),
    dict(name="Galvanized iron sheets, 28 gauge", category=CatalogCategory.METAL, unit=CatalogUnit.SHEET,
         retail_price_per_unit=950, bulk_price_per_unit=780, bulk_threshold_quantity=100, stock_quantity=500),
    dict(name="Corrugated iron sheets, 32 gauge", category=CatalogCategory.METAL, unit=CatalogUnit.SHEET,
         retail_price_per_unit=850, bulk_price_per_unit=690, bulk_threshold_quantity=120, stock_quantity=340),
    dict(name="Mild steel angle bar, 40x40x4mm", category=CatalogCategory.METAL, unit=CatalogUnit.METER,
         retail_price_per_unit=280, bulk_price_per_unit=220, bulk_threshold_quantity=200, stock_quantity=1500),
    dict(name="Polypropylene woven bags, 50kg", category=CatalogCategory.PACKAGING, unit=CatalogUnit.PIECE,
         retail_price_per_unit=35, bulk_price_per_unit=25, bulk_threshold_quantity=500, stock_quantity=10000),

    # Nairobi Metals & Timber (index 1) — TIMBER, CHEMICAL, METAL
    dict(name="Hardwood timber planks, 2x4 inch", category=CatalogCategory.TIMBER, unit=CatalogUnit.METER,
         retail_price_per_unit=180, bulk_price_per_unit=140, bulk_threshold_quantity=300, stock_quantity=2000),
    dict(name="Softwood timber, 2x2 inch", category=CatalogCategory.TIMBER, unit=CatalogUnit.METER,
         retail_price_per_unit=90, bulk_price_per_unit=72, bulk_threshold_quantity=500, stock_quantity=5000),
    dict(name="Portland cement, 50kg bag", category=CatalogCategory.CHEMICAL, unit=CatalogUnit.BAG,
         retail_price_per_unit=780, bulk_price_per_unit=650, bulk_threshold_quantity=50, stock_quantity=800),
    dict(name="Industrial paint thinner (litre)", category=CatalogCategory.CHEMICAL, unit=CatalogUnit.LITRE,
         retail_price_per_unit=120, bulk_price_per_unit=95, bulk_threshold_quantity=100, stock_quantity=600),
    dict(name="GI wire nails, 4 inch (kg)", category=CatalogCategory.METAL, unit=CatalogUnit.KG,
         retail_price_per_unit=150, bulk_price_per_unit=120, bulk_threshold_quantity=200, stock_quantity=3000),
]


async def seed():
    async for db in get_db():
        supplier_ids = []

        for s in SUPPLIERS:
            # Check if already exists
            result = await db.execute(select(User).where(User.email == s["email"]))
            existing = result.scalars().first()
            if existing:
                print(f"  Supplier already exists: {s['email']}")
                supplier_ids.append(existing.id)
                continue

            user = User(
                email=s["email"],
                full_name=s["full_name"],
                password_hash=hash_password(s["password"]),
                role=UserRole.SUPPLIER,
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            await db.flush()
            await db.refresh(user)
            supplier_ids.append(user.id)
            print(f"  Created supplier: {s['email']} (id={user.id})")

        # Distribute items: first 5 to supplier 0, next 5 to supplier 1
        for i, item_data in enumerate(CATALOG_ITEMS):
            owner_id = supplier_ids[0] if i < 5 else supplier_ids[1]
            item = CatalogItem(supplier_id=owner_id, **item_data)
            db.add(item)

        await db.commit()
        print(f"\n✅  Seeded {len(CATALOG_ITEMS)} catalog items across {len(supplier_ids)} suppliers.")
        break


if __name__ == "__main__":
    asyncio.run(seed())
