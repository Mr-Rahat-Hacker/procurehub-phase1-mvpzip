from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.rfq import RFQ, RFQLineItem, RFQVendor, Quotation, QuotationLineItem, RFQStatus, QuotationStatus
from app.models.vendor import Vendor, VendorStatus
from app.models.user import User, UserRole
from app.models.audit import AuditLog
from app.schemas.rfq import RFQCreate, RFQOut, RFQUpdate, QuotationCreate, QuotationOut, QuotationUpdate
import random, string

router = APIRouter()

def gen_rfq_number():
    return "RFQ-" + "".join(random.choices(string.digits, k=8))

def gen_quot_number():
    return "QT-" + "".join(random.choices(string.digits, k=8))

def log_action(db, user, action, resource_type, resource_id, resource_number=None, old=None, new=None):
    entry = AuditLog(
        user_id=user.id if user else None,
        user_email=user.email if user else None,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        resource_number=resource_number,
        old_value=old,
        new_value=new,
    )
    db.add(entry)

@router.get("", response_model=List[RFQOut])
def list_rfqs(
    status: Optional[RFQStatus] = Query(None),
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(RFQ)
    if status:
        q = q.filter(RFQ.status == status)
    rfqs = q.order_by(RFQ.created_at.desc()).offset(skip).limit(limit).all()
    result = []
    for rfq in rfqs:
        rfq_dict = rfq.__dict__.copy()
        rfq_dict['quotation_count'] = len(rfq.quotations)
        result.append(rfq_dict)
    return result

@router.post("", response_model=RFQOut, status_code=201)
def create_rfq(data: RFQCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not data.line_items:
        raise HTTPException(status_code=400, detail="At least one line item is required")
    rfq = RFQ(
        rfq_number=gen_rfq_number(),
        title=data.title,
        description=data.description,
        department=data.department,
        requisition_id=data.requisition_id,
        submission_deadline=data.submission_deadline,
        delivery_terms=data.delivery_terms,
        payment_terms=data.payment_terms,
        special_instructions=data.special_instructions,
        created_by_id=current_user.id,
    )
    db.add(rfq)
    db.flush()
    for item in data.line_items:
        db.add(RFQLineItem(rfq_id=rfq.id, **item.model_dump()))
    for vendor_id in data.vendor_ids:
        v = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if v:
            db.add(RFQVendor(rfq_id=rfq.id, vendor_id=vendor_id))
    log_action(db, current_user, "CREATE", "RFQ", rfq.id, rfq.rfq_number)
    db.commit()
    db.refresh(rfq)
    rfq.__dict__['quotation_count'] = 0
    return rfq

@router.get("/{rfq_id}", response_model=RFQOut)
def get_rfq(rfq_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    rfq.__dict__['quotation_count'] = len(rfq.quotations)
    return rfq

@router.patch("/{rfq_id}", response_model=RFQOut)
def update_rfq(rfq_id: int, data: RFQUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    old_status = rfq.status
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(rfq, k, v)
    if data.status and data.status != old_status:
        log_action(db, current_user, "STATUS_CHANGE", "RFQ", rfq.id, rfq.rfq_number,
                   old={"status": old_status}, new={"status": data.status})
    db.commit()
    db.refresh(rfq)
    rfq.__dict__['quotation_count'] = len(rfq.quotations)
    return rfq

@router.post("/{rfq_id}/send", response_model=RFQOut)
def send_rfq(rfq_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    if not rfq.vendors:
        raise HTTPException(status_code=400, detail="Add at least one vendor before sending")
    rfq.status = RFQStatus.SENT
    log_action(db, current_user, "SEND", "RFQ", rfq.id, rfq.rfq_number)
    db.commit()
    db.refresh(rfq)
    rfq.__dict__['quotation_count'] = len(rfq.quotations)
    return rfq

@router.post("/{rfq_id}/award/{quotation_id}", response_model=RFQOut)
def award_rfq(rfq_id: int, quotation_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    quot = db.query(Quotation).filter(Quotation.id == quotation_id, Quotation.rfq_id == rfq_id).first()
    if not quot:
        raise HTTPException(status_code=404, detail="Quotation not found")
    for q in rfq.quotations:
        q.is_selected = (q.id == quotation_id)
        if q.id == quotation_id:
            q.status = QuotationStatus.ACCEPTED
        else:
            q.status = QuotationStatus.REJECTED
    rfq.status = RFQStatus.AWARDED
    log_action(db, current_user, "AWARD", "RFQ", rfq.id, rfq.rfq_number,
               new={"awarded_to": quot.vendor_id, "quotation_id": quotation_id})
    db.commit()
    db.refresh(rfq)
    rfq.__dict__['quotation_count'] = len(rfq.quotations)
    return rfq

@router.get("/{rfq_id}/quotations", response_model=List[QuotationOut])
def list_quotations(rfq_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Quotation).filter(Quotation.rfq_id == rfq_id).all()

@router.post("/{rfq_id}/quotations", response_model=QuotationOut, status_code=201)
def submit_quotation(rfq_id: int, data: QuotationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    existing = db.query(Quotation).filter(Quotation.rfq_id == rfq_id, Quotation.vendor_id == data.vendor_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Quotation already submitted for this vendor")
    subtotal = sum(item.quantity * item.unit_price for item in data.line_items)
    tax_amount = sum(item.quantity * item.unit_price * item.tax_rate / 100 for item in data.line_items)
    total_amount = subtotal + tax_amount
    quot = Quotation(
        quotation_number=gen_quot_number(),
        rfq_id=rfq_id,
        vendor_id=data.vendor_id,
        validity_days=data.validity_days,
        payment_terms=data.payment_terms,
        delivery_days=data.delivery_days,
        notes=data.notes,
        currency=data.currency,
        subtotal=subtotal,
        tax_amount=tax_amount,
        total_amount=total_amount,
    )
    db.add(quot)
    db.flush()
    for item in data.line_items:
        total = item.quantity * item.unit_price * (1 + item.tax_rate / 100)
        db.add(QuotationLineItem(quotation_id=quot.id, total_price=total, **item.model_dump()))
    rfq.status = RFQStatus.QUOTES_RECEIVED
    vendor_rfq = db.query(RFQVendor).filter(RFQVendor.rfq_id == rfq_id, RFQVendor.vendor_id == data.vendor_id).first()
    if vendor_rfq:
        vendor_rfq.responded = True
    all_quots = db.query(Quotation).filter(Quotation.rfq_id == rfq_id).all()
    if all_quots:
        min_total = min(q.total_amount for q in all_quots)
        for q in all_quots:
            q.is_lowest = (q.total_amount == min_total)
    quot.is_lowest = (total_amount == min(q.total_amount for q in all_quots) if all_quots else True)
    log_action(db, current_user, "SUBMIT_QUOTATION", "Quotation", quot.id, quot.quotation_number)
    db.commit()
    db.refresh(quot)
    return quot

@router.get("/quotations/all", response_model=List[QuotationOut])
def list_all_quotations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Quotation).order_by(Quotation.created_at.desc()).limit(100).all()
