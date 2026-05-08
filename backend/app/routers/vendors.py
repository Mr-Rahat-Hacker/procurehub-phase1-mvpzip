from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.vendor import Vendor, VendorStatus
from app.models.user import User, UserRole
from app.schemas.vendor import VendorCreate, VendorOut, VendorUpdate, VendorStatusUpdate
import random, string

router = APIRouter()

def generate_vendor_code():
    return "VEN-" + "".join(random.choices(string.digits, k=6))

@router.get("", response_model=List[VendorOut])
def list_vendors(
    search: Optional[str] = Query(None),
    status: Optional[VendorStatus] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Vendor).filter(Vendor.is_active == True)
    if search:
        q = q.filter(or_(Vendor.company_name.ilike(f"%{search}%"), Vendor.vendor_code.ilike(f"%{search}%")))
    if status:
        q = q.filter(Vendor.status == status)
    return q.offset(skip).limit(limit).all()

@router.post("", response_model=VendorOut, status_code=201)
def create_vendor(data: VendorCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    vendor = Vendor(**data.model_dump(), vendor_code=generate_vendor_code())
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor

@router.get("/{vendor_id}", response_model=VendorOut)
def get_vendor(vendor_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor

@router.patch("/{vendor_id}", response_model=VendorOut)
def update_vendor(vendor_id: int, updates: VendorUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(vendor, field, value)
    db.commit()
    db.refresh(vendor)
    return vendor

@router.post("/{vendor_id}/status", response_model=VendorOut)
def update_vendor_status(
    vendor_id: int,
    body: VendorStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.PROCUREMENT_MANAGER])),
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    vendor.status = body.status
    if body.status == VendorStatus.APPROVED:
        vendor.approved_at = datetime.now(timezone.utc)
    if body.notes:
        vendor.notes = (vendor.notes or "") + f"\n[{body.status}] {body.notes}"
    db.commit()
    db.refresh(vendor)
    return vendor

@router.delete("/{vendor_id}", status_code=204)
def deactivate_vendor(vendor_id: int, db: Session = Depends(get_db), _: User = Depends(require_role([UserRole.ADMIN]))):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    vendor.is_active = False
    db.commit()
