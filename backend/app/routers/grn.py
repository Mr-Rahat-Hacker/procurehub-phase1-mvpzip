from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.grn import GoodsReceiptNote, GRNLineItem, GRNStatus
from app.models.procurement import PurchaseOrder, POStatus
from app.models.audit import AuditLog
from app.models.user import User
from app.schemas.grn import GRNCreate, GRNOut, GRNUpdate
import random, string

router = APIRouter()

def gen_grn_number():
    return "GRN-" + "".join(random.choices(string.digits, k=8))

def log_action(db, user, action, resource_type, resource_id, resource_number=None):
    db.add(AuditLog(
        user_id=user.id, user_email=user.email, action=action,
        resource_type=resource_type, resource_id=str(resource_id), resource_number=resource_number
    ))

@router.get("", response_model=List[GRNOut])
def list_grns(
    purchase_order_id: Optional[int] = Query(None),
    status: Optional[GRNStatus] = Query(None),
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(GoodsReceiptNote)
    if purchase_order_id:
        q = q.filter(GoodsReceiptNote.purchase_order_id == purchase_order_id)
    if status:
        q = q.filter(GoodsReceiptNote.status == status)
    return q.order_by(GoodsReceiptNote.created_at.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=GRNOut, status_code=201)
def create_grn(data: GRNCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == data.purchase_order_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    if po.status not in [POStatus.SENT, POStatus.ACKNOWLEDGED, POStatus.PARTIALLY_RECEIVED]:
        raise HTTPException(status_code=400, detail=f"Cannot create GRN for PO in {po.status} status")
    grn = GoodsReceiptNote(
        grn_number=gen_grn_number(),
        purchase_order_id=data.purchase_order_id,
        vendor_id=data.vendor_id,
        received_by_id=current_user.id,
        delivery_note_number=data.delivery_note_number,
        vehicle_number=data.vehicle_number,
        received_date=data.received_date,
        warehouse_location=data.warehouse_location,
        notes=data.notes,
    )
    db.add(grn)
    db.flush()
    for item in data.line_items:
        db.add(GRNLineItem(grn_id=grn.id, **item.model_dump()))
    all_items_received = all(item.received_quantity >= item.ordered_quantity for item in data.line_items)
    if all_items_received:
        po.status = POStatus.FULLY_RECEIVED
    else:
        po.status = POStatus.PARTIALLY_RECEIVED
    log_action(db, current_user, "CREATE", "GRN", grn.id, grn.grn_number)
    db.commit()
    db.refresh(grn)
    return grn

@router.get("/{grn_id}", response_model=GRNOut)
def get_grn(grn_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    grn = db.query(GoodsReceiptNote).filter(GoodsReceiptNote.id == grn_id).first()
    if not grn:
        raise HTTPException(status_code=404, detail="GRN not found")
    return grn

@router.patch("/{grn_id}", response_model=GRNOut)
def update_grn(grn_id: int, data: GRNUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    grn = db.query(GoodsReceiptNote).filter(GoodsReceiptNote.id == grn_id).first()
    if not grn:
        raise HTTPException(status_code=404, detail="GRN not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(grn, k, v)
    log_action(db, current_user, "UPDATE", "GRN", grn.id, grn.grn_number)
    db.commit()
    db.refresh(grn)
    return grn
