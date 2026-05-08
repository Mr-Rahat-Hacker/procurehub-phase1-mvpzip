from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.procurement import PurchaseOrder, POLineItem, POStatus, PurchaseRequisition, PRStatus
from app.models.vendor import Vendor, VendorStatus
from app.models.user import User, UserRole
from app.schemas.procurement import POCreate, POOut, POUpdate
import random, string

router = APIRouter()

VALID_PO_TRANSITIONS = {
    POStatus.DRAFT: {POStatus.SENT, POStatus.CANCELLED},
    POStatus.SENT: {POStatus.ACKNOWLEDGED, POStatus.CANCELLED},
    POStatus.ACKNOWLEDGED: {POStatus.PARTIALLY_RECEIVED, POStatus.CANCELLED},
    POStatus.PARTIALLY_RECEIVED: {POStatus.FULLY_RECEIVED, POStatus.CANCELLED},
    POStatus.FULLY_RECEIVED: {POStatus.CLOSED},
    POStatus.CANCELLED: set(),
    POStatus.CLOSED: set(),
}

def generate_po_number():
    return "PO-" + "".join(random.choices(string.digits, k=8))

@router.get("", response_model=List[POOut])
def list_pos(
    status: Optional[POStatus] = Query(None),
    vendor_id: Optional[int] = Query(None),
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(PurchaseOrder)
    if status:
        q = q.filter(PurchaseOrder.status == status)
    if vendor_id:
        q = q.filter(PurchaseOrder.vendor_id == vendor_id)
    return q.order_by(PurchaseOrder.created_at.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=POOut, status_code=201)
def create_po(data: POCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vendor = db.query(Vendor).filter(Vendor.id == data.vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    if vendor.status != VendorStatus.APPROVED:
        raise HTTPException(status_code=400, detail="POs can only be created for approved vendors")
    if not data.line_items:
        raise HTTPException(status_code=400, detail="At least one line item is required")

    subtotal = sum(item.quantity * item.unit_price for item in data.line_items)
    avg_tax = sum(item.tax_rate for item in data.line_items) / len(data.line_items)
    tax_amount = round(subtotal * avg_tax / 100, 2)
    total = round(subtotal + tax_amount, 2)

    po = PurchaseOrder(
        po_number=generate_po_number(),
        vendor_id=data.vendor_id,
        requisition_id=data.requisition_id,
        payment_terms=data.payment_terms,
        delivery_address=data.delivery_address,
        expected_delivery=data.expected_delivery,
        notes=data.notes,
        subtotal=round(subtotal, 2),
        tax_amount=tax_amount,
        total_amount=total,
        created_by=current_user.full_name,
    )
    for item_data in data.line_items:
        tp = round(item_data.quantity * item_data.unit_price, 2)
        po.line_items.append(POLineItem(**item_data.model_dump(), total_price=tp))

    if data.requisition_id:
        pr = db.query(PurchaseRequisition).filter(PurchaseRequisition.id == data.requisition_id).first()
        if pr:
            if pr.status != PRStatus.APPROVED:
                raise HTTPException(status_code=400, detail="PO can only be linked to an approved PR")
            pr.status = PRStatus.PO_CREATED

    db.add(po)
    db.commit()
    db.refresh(po)
    return po

@router.get("/{po_id}", response_model=POOut)
def get_po(po_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    return po

@router.patch("/{po_id}", response_model=POOut)
def update_po(po_id: int, updates: POUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")

    if updates.status is not None:
        new_status = updates.status
        if new_status not in VALID_PO_TRANSITIONS.get(po.status, set()):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot transition PO from '{po.status}' to '{new_status}'"
            )

    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(po, field, value)
    db.commit()
    db.refresh(po)
    return po
