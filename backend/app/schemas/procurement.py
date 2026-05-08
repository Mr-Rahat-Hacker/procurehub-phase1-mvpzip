from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.procurement import PRStatus, POStatus, Priority

class PRLineItemCreate(BaseModel):
    item_code: Optional[str] = None
    item_name: str
    description: Optional[str] = None
    quantity: float
    unit_of_measure: str = "EA"
    estimated_unit_price: float = 0.0
    category: Optional[str] = None

class PRLineItemOut(PRLineItemCreate):
    id: int
    total_price: float

    class Config:
        from_attributes = True

class PRCreate(BaseModel):
    title: str
    description: Optional[str] = None
    department: str
    priority: Priority = Priority.MEDIUM
    required_by: Optional[datetime] = None
    line_items: List[PRLineItemCreate]

class PRUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[Priority] = None
    required_by: Optional[datetime] = None
    status: Optional[PRStatus] = None
    approval_notes: Optional[str] = None

class PROut(BaseModel):
    id: int
    pr_number: str
    title: str
    description: Optional[str]
    department: str
    status: PRStatus
    priority: Priority
    estimated_value: float
    required_by: Optional[datetime]
    approved_by: Optional[str]
    approval_notes: Optional[str]
    requester_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    line_items: List[PRLineItemOut]

    class Config:
        from_attributes = True

class POLineItemCreate(BaseModel):
    item_name: str
    description: Optional[str] = None
    quantity: float
    unit_of_measure: str = "EA"
    unit_price: float
    hsn_code: Optional[str] = None
    tax_rate: float = 18.0

class POLineItemOut(POLineItemCreate):
    id: int
    total_price: float

    class Config:
        from_attributes = True

class POCreate(BaseModel):
    requisition_id: Optional[int] = None
    vendor_id: int
    payment_terms: str = "NET30"
    delivery_address: Optional[str] = None
    expected_delivery: Optional[datetime] = None
    notes: Optional[str] = None
    line_items: List[POLineItemCreate]

class POUpdate(BaseModel):
    status: Optional[POStatus] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None
    expected_delivery: Optional[datetime] = None

class VendorSummary(BaseModel):
    id: int
    vendor_code: str
    company_name: str

    class Config:
        from_attributes = True

class POOut(BaseModel):
    id: int
    po_number: str
    vendor_id: int
    vendor: Optional[VendorSummary]
    requisition_id: Optional[int]
    status: POStatus
    payment_terms: str
    delivery_address: Optional[str]
    subtotal: float
    tax_amount: float
    total_amount: float
    currency: str
    notes: Optional[str]
    expected_delivery: Optional[datetime]
    created_by: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    line_items: List[POLineItemOut]

    class Config:
        from_attributes = True
