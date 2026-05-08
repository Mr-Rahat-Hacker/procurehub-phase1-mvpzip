from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.procurement import PurchaseOrder, PurchaseRequisition, PRStatus, POStatus, POLineItem
from app.models.vendor import Vendor
from app.models.user import User

router = APIRouter()

@router.get("/dashboard")
def dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_prs = db.query(func.count(PurchaseRequisition.id)).scalar()
    pending_approval = db.query(func.count(PurchaseRequisition.id)).filter(
        PurchaseRequisition.status == PRStatus.SUBMITTED).scalar()
    total_pos = db.query(func.count(PurchaseOrder.id)).scalar()
    active_pos = db.query(func.count(PurchaseOrder.id)).filter(
        PurchaseOrder.status.in_([POStatus.SENT, POStatus.ACKNOWLEDGED, POStatus.PARTIALLY_RECEIVED])).scalar()
    total_po_value = db.query(func.sum(PurchaseOrder.total_amount)).scalar() or 0
    approved_vendors = db.query(func.count(Vendor.id)).filter(Vendor.status == "approved").scalar()
    return {
        "total_prs": total_prs,
        "pending_approval": pending_approval,
        "total_pos": total_pos,
        "active_pos": active_pos,
        "total_po_value": total_po_value,
        "approved_vendors": approved_vendors,
    }

@router.get("/spend-by-vendor")
def spend_by_vendor(
    limit: int = Query(10),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rows = db.query(
        Vendor.company_name,
        func.sum(PurchaseOrder.total_amount).label("total_spend"),
        func.count(PurchaseOrder.id).label("po_count")
    ).join(PurchaseOrder, PurchaseOrder.vendor_id == Vendor.id)\
     .group_by(Vendor.id, Vendor.company_name)\
     .order_by(func.sum(PurchaseOrder.total_amount).desc())\
     .limit(limit).all()
    return [{"vendor": r.company_name, "total_spend": r.total_spend or 0, "po_count": r.po_count} for r in rows]

@router.get("/spend-by-department")
def spend_by_department(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(
        PurchaseRequisition.department,
        func.sum(PurchaseRequisition.estimated_value).label("total_value"),
        func.count(PurchaseRequisition.id).label("pr_count")
    ).group_by(PurchaseRequisition.department)\
     .order_by(func.sum(PurchaseRequisition.estimated_value).desc()).all()
    return [{"department": r.department, "total_value": r.total_value or 0, "pr_count": r.pr_count} for r in rows]

@router.get("/monthly-spend")
def monthly_spend(
    months: int = Query(6),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from_date = datetime.now() - timedelta(days=months * 30)
    rows = db.query(
        extract('year', PurchaseOrder.created_at).label("year"),
        extract('month', PurchaseOrder.created_at).label("month"),
        func.sum(PurchaseOrder.total_amount).label("total")
    ).filter(PurchaseOrder.created_at >= from_date)\
     .group_by("year", "month")\
     .order_by("year", "month").all()
    return [{"year": int(r.year), "month": int(r.month), "total": r.total or 0} for r in rows]

@router.get("/pr-status-breakdown")
def pr_status_breakdown(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(
        PurchaseRequisition.status,
        func.count(PurchaseRequisition.id).label("count")
    ).group_by(PurchaseRequisition.status).all()
    return [{"status": r.status, "count": r.count} for r in rows]

@router.get("/top-items")
def top_items(limit: int = Query(10), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(
        POLineItem.item_name,
        func.sum(POLineItem.total_price).label("total_spend"),
        func.sum(POLineItem.quantity).label("total_qty")
    ).group_by(POLineItem.item_name)\
     .order_by(func.sum(POLineItem.total_price).desc())\
     .limit(limit).all()
    return [{"item": r.item_name, "total_spend": r.total_spend or 0, "total_qty": r.total_qty or 0} for r in rows]
