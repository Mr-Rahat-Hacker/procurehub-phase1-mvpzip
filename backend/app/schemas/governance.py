from pydantic import BaseModel
from typing import Optional
from app.models.governance import InvoiceStatus, ApprovalStatus

class ApprovalRuleCreate(BaseModel):
    name: str
    min_amount: float = 0.0
    max_amount: Optional[float] = None
    department: Optional[str] = None
    category: Optional[str] = None
    approver_role: str
    level: int = 1

class ApprovalRuleOut(ApprovalRuleCreate):
    id: int
    is_active: bool
    class Config:
        from_attributes = True

class BudgetLedgerCreate(BaseModel):
    department: str
    fiscal_year: int
    budget_allocated: float

class BudgetCheckRequest(BaseModel):
    department: str
    fiscal_year: int
    amount: float

class InvoiceCreate(BaseModel):
    invoice_number: str
    po_id: int
    vendor_id: int
    amount: float
    tax_amount: float = 0.0

class InvoiceOut(InvoiceCreate):
    id: int
    status: InvoiceStatus
    exception_reason: Optional[str]
    class Config:
        from_attributes = True

class ApprovalAction(BaseModel):
    action: ApprovalStatus
    remarks: Optional[str] = None

class SODPolicyCreate(BaseModel):
    name: str
    maker_role: str
    checker_role: str
    resource_type: str
