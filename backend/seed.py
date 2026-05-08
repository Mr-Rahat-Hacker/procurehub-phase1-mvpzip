"""
Seed script — run once to create an admin user + sample data.
Usage: cd backend && python seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import engine, Base, SessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.vendor import Vendor, VendorStatus, VendorCategory
from app.models.procurement import PurchaseRequisition, PRLineItem, PRStatus, Priority

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Admin user
if not db.query(User).filter(User.email == "admin@procurehub.in").first():
    db.add(User(
        email="admin@procurehub.in",
        full_name="Admin User",
        hashed_password=hash_password("admin123"),
        role=UserRole.ADMIN,
        department="Operations",
    ))
    print("✓ Admin user created: admin@procurehub.in / admin123")

# Buyer user
if not db.query(User).filter(User.email == "buyer@procurehub.in").first():
    db.add(User(
        email="buyer@procurehub.in",
        full_name="Rahat Buyer",
        hashed_password=hash_password("buyer123"),
        role=UserRole.BUYER,
        department="Manufacturing",
    ))
    print("✓ Buyer user created: buyer@procurehub.in / buyer123")

db.commit()

# Sample vendors
vendors_data = [
    dict(vendor_code="VEN-100001", company_name="Tata Steel Ltd", contact_name="Rajesh Kumar",
         contact_email="rajesh@tatasteel.com", gstin="27AAACT2727Q1ZW", pan="AAACT2727Q",
         address_city="Mumbai", address_state="Maharashtra", category=VendorCategory.RAW_MATERIALS,
         status=VendorStatus.APPROVED, payment_terms="NET45"),
    dict(vendor_code="VEN-100002", company_name="SKF India Ltd", contact_name="Priya Shah",
         contact_email="priya@skf.in", gstin="24AAACS1234A1ZP", pan="AAACS1234A",
         address_city="Pune", address_state="Maharashtra", category=VendorCategory.MANUFACTURING,
         status=VendorStatus.APPROVED, payment_terms="NET30"),
    dict(vendor_code="VEN-100003", company_name="Wipro Infrastructure", contact_name="Amit Verma",
         contact_email="amit@wipro.com", address_city="Bangalore", address_state="Karnataka",
         category=VendorCategory.IT_SERVICES, status=VendorStatus.PENDING, payment_terms="NET30"),
    dict(vendor_code="VEN-100004", company_name="Blue Dart Express", contact_name="Sunita Nair",
         contact_email="sunita@bluedart.com", address_city="Mumbai", address_state="Maharashtra",
         category=VendorCategory.LOGISTICS, status=VendorStatus.UNDER_REVIEW, payment_terms="NET15"),
]

for vd in vendors_data:
    if not db.query(Vendor).filter(Vendor.vendor_code == vd['vendor_code']).first():
        db.add(Vendor(**vd))
        print(f"✓ Vendor created: {vd['company_name']}")

db.commit()

# Sample PR
admin = db.query(User).filter(User.email == "admin@procurehub.in").first()
if admin and db.query(PurchaseRequisition).count() == 0:
    pr = PurchaseRequisition(
        pr_number="PR-20250001",
        title="CNC Machine Spare Parts - Q1 2025",
        description="Quarterly replenishment of critical spare parts for CNC lathes",
        department="Manufacturing",
        requester_id=admin.id,
        status=PRStatus.APPROVED,
        priority=Priority.HIGH,
        estimated_value=125000.0,
        approved_by="Admin User",
    )
    pr.line_items.extend([
        PRLineItem(item_code="SKU-001", item_name="Carbide Inserts CNMG 120408", quantity=100, unit_of_measure="EA", estimated_unit_price=450, total_price=45000),
        PRLineItem(item_code="SKU-002", item_name="Coolant Pump Assembly", quantity=2, unit_of_measure="EA", estimated_unit_price=18000, total_price=36000),
        PRLineItem(item_code="SKU-003", item_name="Hydraulic Oil 46 Grade (200L)", quantity=2, unit_of_measure="NOS", estimated_unit_price=9500, total_price=19000),
        PRLineItem(item_code="SKU-004", item_name="Chuck Jaw Set (3-piece)", quantity=5, unit_of_measure="SET", estimated_unit_price=5000, total_price=25000),
    ])
    db.add(pr)
    db.commit()
    print("✓ Sample PR created: PR-20250001")

db.close()
print("\n🚀 Seed complete. Start the backend with: uvicorn app.main:app --reload")
