from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.procurement import PurchaseRequisition, PRLineItem, PRStatus
from app.models.user import User, UserRole
from app.schemas.procurement import PRCreate, PROut, PRUpdate
import random, string

router = APIRouter()

APPROVER_ROLES = {UserRole.ADMIN, UserRole.PROCUREMENT_MANAGER, UserRole.APPROVER}

VALID_TRANSITIONS = {
    PRStatus.DRAFT: {PRStatus.SUBMITTED},
    PRStatus.SUBMITTED: {PRStatus.UNDER_REVIEW, PRStatus.APPROVED, PRStatus.REJECTED},
    PRStatus.UNDER_REVIEW: {PRStatus.APPROVED, PRStatus.REJECTED},
    PRStatus.APPROVED: {PRStatus.PO_CREATED},
    PRStatus.REJECTED: {PRStatus.DRAFT},
    PRStatus.PO_CREATED: set(),
}

def generate_pr_number():
    for _ in range(10):
        candidate = "PR-" + "".join(random.choices(string.digits, k=8))
        return candidate

@router.get("", response_model=List[PROut])
def list_prs(
    status: Optional[PRStatus] = Query(None),
    department: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(PurchaseRequisition)
    if current_user.role == UserRole.BUYER:
        q = q.filter(PurchaseRequisition.requester_id == current_user.id)
    if status:
        q = q.filter(PurchaseRequisition.status == status)
    if department:
        q = q.filter(PurchaseRequisition.department == department)
    return q.order_by(PurchaseRequisition.created_at.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=PROut, status_code=201)
def create_pr(data: PRCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not data.line_items:
        raise HTTPException(status_code=400, detail="At least one line item is required")
    pr = PurchaseRequisition(
        pr_number=generate_pr_number(),
        title=data.title,
        description=data.description,
        department=data.department,
        requester_id=current_user.id,
        priority=data.priority,
        required_by=data.required_by,
        status=PRStatus.DRAFT,
    )
    total = 0.0
    for item_data in data.line_items:
        if item_data.quantity <= 0:
            raise HTTPException(status_code=400, detail=f"Quantity must be greater than 0 for item '{item_data.item_name}'")
        total_price = item_data.quantity * item_data.estimated_unit_price
        total += total_price
        item = PRLineItem(**item_data.model_dump(), total_price=total_price)
        pr.line_items.append(item)
    pr.estimated_value = total
    db.add(pr)
    db.commit()
    db.refresh(pr)
    return pr

@router.get("/{pr_id}", response_model=PROut)
def get_pr(pr_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pr = db.query(PurchaseRequisition).filter(PurchaseRequisition.id == pr_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")
    if current_user.role == UserRole.BUYER and pr.requester_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return pr

@router.patch("/{pr_id}", response_model=PROut)
def update_pr(pr_id: int, updates: PRUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pr = db.query(PurchaseRequisition).filter(PurchaseRequisition.id == pr_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")

    if updates.status is not None:
        new_status = updates.status
        if new_status not in VALID_TRANSITIONS.get(pr.status, set()):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot transition from '{pr.status}' to '{new_status}'"
            )
        if new_status in (PRStatus.APPROVED, PRStatus.REJECTED, PRStatus.UNDER_REVIEW):
            if current_user.role not in APPROVER_ROLES:
                raise HTTPException(status_code=403, detail="Only approvers/managers/admins can approve or reject PRs")
        if new_status == PRStatus.APPROVED:
            pr.approved_by = current_user.full_name

    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(pr, field, value)

    db.commit()
    db.refresh(pr)
    return pr

@router.post("/{pr_id}/submit", response_model=PROut)
def submit_pr(pr_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pr = db.query(PurchaseRequisition).filter(
        PurchaseRequisition.id == pr_id,
        PurchaseRequisition.requester_id == current_user.id
    ).first()
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")
    if pr.status != PRStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only draft PRs can be submitted")
    pr.status = PRStatus.SUBMITTED
    db.commit()
    db.refresh(pr)
    return pr
