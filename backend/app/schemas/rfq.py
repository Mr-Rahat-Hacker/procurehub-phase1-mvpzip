from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.rfq import RFQStatus, QuotationStatus

class RFQLineItemCreate(BaseModel):
    item_code: Optional[str] = None
    item_name: str
    description: Optional[str] = None
    quantity: float
    unit_of_measure: str = "EA"
    category: Optional[str] = None
    target_price: Optional[float] = None

class RFQLineItemOut(RFQLineItemCreate):
    id: int
    class Config:
        from_attributes = True

class RFQCreate(BaseModel):
    title: str
    description: Optional[str] = None
    department: str
    requisition_id: Optional[int] = None
    submission_deadline: Optional[datetime] = None
    delivery_terms: Optional[str] = None
    payment_terms: str = "NET30"
    special_instructions: Optional[str] = None
    vendor_ids: List[int] = []
    line_items: List[RFQLineItemCreate]

class RFQUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[RFQStatus] = None
    submission_deadline: Optional[datetime] = None
    special_instructions: Optional[str] = None

class VendorMini(BaseModel):
    id: int
    vendor_code: str
    company_name: str
    class Config:
        from_attributes = True

class RFQVendorOut(BaseModel):
    id: int
    vendor_id: int
    vendor: VendorMini
    invited_at: datetime
    responded: bool
    class Config:
        from_attributes = True

class RFQOut(BaseModel):
    id: int
    rfq_number: str
    title: str
    description: Optional[str]
    department: str
    requisition_id: Optional[int]
    status: RFQStatus
    submission_deadline: Optional[datetime]
    delivery_terms: Optional[str]
    payment_terms: str
    special_instructions: Optional[str]
    created_by_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    line_items: List[RFQLineItemOut]
    vendors: List[RFQVendorOut]
    quotation_count: Optional[int] = 0
    class Config:
        from_attributes = True

class QuotationLineItemCreate(BaseModel):
    rfq_line_item_id: Optional[int] = None
    item_name: str
    description: Optional[str] = None
    quantity: float
    unit_of_measure: str = "EA"
    unit_price: float
    tax_rate: float = 18.0
    hsn_code: Optional[str] = None

class QuotationLineItemOut(QuotationLineItemCreate):
    id: int
    total_price: float
    class Config:
        from_attributes = True

class QuotationCreate(BaseModel):
    rfq_id: int
    vendor_id: int
    validity_days: int = 30
    payment_terms: Optional[str] = None
    delivery_days: Optional[int] = None
    notes: Optional[str] = None
    currency: str = "INR"
    line_items: List[QuotationLineItemCreate]

class QuotationUpdate(BaseModel):
    status: Optional[QuotationStatus] = None
    notes: Optional[str] = None

class QuotationOut(BaseModel):
    id: int
    quotation_number: str
    rfq_id: int
    vendor_id: int
    vendor: Optional[VendorMini]
    status: QuotationStatus
    validity_days: int
    payment_terms: Optional[str]
    delivery_days: Optional[int]
    notes: Optional[str]
    subtotal: float
    tax_amount: float
    total_amount: float
    currency: str
    is_lowest: bool
    is_selected: bool
    submitted_at: datetime
    line_items: List[QuotationLineItemOut]
    class Config:
        from_attributes = True
