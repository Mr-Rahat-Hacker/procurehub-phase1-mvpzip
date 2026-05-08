from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.vendor import VendorStatus, VendorCategory

class VendorCreate(BaseModel):
    company_name: str
    contact_name: str
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    address_line1: Optional[str] = None
    address_city: Optional[str] = None
    address_state: Optional[str] = None
    address_pincode: Optional[str] = None
    category: VendorCategory = VendorCategory.OTHER
    payment_terms: str = "NET30"
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    bank_ifsc: Optional[str] = None
    notes: Optional[str] = None

class VendorUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    status: Optional[VendorStatus] = None
    category: Optional[VendorCategory] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None
    risk_score: Optional[float] = None

class VendorOut(BaseModel):
    id: int
    vendor_code: str
    company_name: str
    contact_name: str
    contact_email: str
    contact_phone: Optional[str]
    gstin: Optional[str]
    pan: Optional[str]
    address_city: Optional[str]
    address_state: Optional[str]
    category: VendorCategory
    status: VendorStatus
    risk_score: float
    payment_terms: str
    is_active: bool
    created_at: datetime
    approved_at: Optional[datetime]

    class Config:
        from_attributes = True

class VendorStatusUpdate(BaseModel):
    status: VendorStatus
    notes: Optional[str] = None
