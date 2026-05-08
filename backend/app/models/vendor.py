from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class VendorStatus(str, enum.Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    BLACKLISTED = "blacklisted"

class VendorCategory(str, enum.Enum):
    MANUFACTURING = "manufacturing"
    IT_SERVICES = "it_services"
    LOGISTICS = "logistics"
    RAW_MATERIALS = "raw_materials"
    MRO = "mro"
    PROFESSIONAL_SERVICES = "professional_services"
    UTILITIES = "utilities"
    OTHER = "other"

class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, index=True)
    vendor_code = Column(String, unique=True, index=True, nullable=False)
    company_name = Column(String, nullable=False, index=True)
    contact_name = Column(String, nullable=False)
    contact_email = Column(String, nullable=False)
    contact_phone = Column(String, nullable=True)
    gstin = Column(String, nullable=True)
    pan = Column(String, nullable=True)
    address_line1 = Column(String, nullable=True)
    address_city = Column(String, nullable=True)
    address_state = Column(String, nullable=True)
    address_pincode = Column(String, nullable=True)
    category = Column(Enum(VendorCategory), default=VendorCategory.OTHER)
    status = Column(Enum(VendorStatus), default=VendorStatus.PENDING)
    risk_score = Column(Float, default=0.0)
    payment_terms = Column(String, default="NET30")
    bank_name = Column(String, nullable=True)
    bank_account = Column(String, nullable=True)
    bank_ifsc = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    approved_at = Column(DateTime(timezone=True), nullable=True)

    purchase_orders = relationship("PurchaseOrder", back_populates="vendor")
