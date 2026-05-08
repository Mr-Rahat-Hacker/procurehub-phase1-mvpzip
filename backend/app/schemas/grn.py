from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.grn import GRNStatus

class GRNLineItemCreate(BaseModel):
    po_line_item_id: Optional[int] = None
    item_name: str
    ordered_quantity: float
    received_quantity: float
    rejected_quantity: float = 0.0
    unit_of_measure: str = "EA"
    batch_number: Optional[str] = None
    expiry_date: Optional[datetime] = None
    remarks: Optional[str] = None

class GRNLineItemOut(GRNLineItemCreate):
    id: int
    class Config:
        from_attributes = True

class GRNCreate(BaseModel):
    purchase_order_id: int
    vendor_id: int
    delivery_note_number: Optional[str] = None
    vehicle_number: Optional[str] = None
    received_date: Optional[datetime] = None
    warehouse_location: Optional[str] = None
    notes: Optional[str] = None
    line_items: List[GRNLineItemCreate]

class GRNUpdate(BaseModel):
    status: Optional[GRNStatus] = None
    notes: Optional[str] = None
    warehouse_location: Optional[str] = None

class POSummary(BaseModel):
    id: int
    po_number: str
    class Config:
        from_attributes = True

class VendorMini(BaseModel):
    id: int
    vendor_code: str
    company_name: str
    class Config:
        from_attributes = True

class GRNOut(BaseModel):
    id: int
    grn_number: str
    purchase_order_id: int
    purchase_order: Optional[POSummary]
    vendor_id: int
    vendor: Optional[VendorMini]
    received_by_id: int
    status: GRNStatus
    delivery_note_number: Optional[str]
    vehicle_number: Optional[str]
    received_date: Optional[datetime]
    warehouse_location: Optional[str]
    notes: Optional[str]
    created_at: datetime
    line_items: List[GRNLineItemOut]
    class Config:
        from_attributes = True
