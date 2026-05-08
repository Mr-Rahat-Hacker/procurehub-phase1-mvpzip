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

def generate_pr_number():
    return "PR-" + "".join(random.choices(string.digits, k=8))

@router.get("/", response_model=List[PROut])
def list_prs(
    status: Optional[PRStatus] = Query(None),
    department: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
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

@router.post("/", response_model=PROut, status_code=201)
def create_pr(data: PRCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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
def get_pr(pr_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    pr = db.query(PurchaseRequisition).filter(PurchaseRequisition.id == pr_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")
    return pr

@router.patch("/{pr_id}", response_model=PROut)
def update_pr(pr_id: int, updates: PRUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pr = db.query(PurchaseRequisition).filter(PurchaseRequisition.id == pr_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(pr, field, value)
    if updates.status == PRStatus.APPROVED:
        pr.approved_by = current_user.full_name
    db.commit()
    db.refresh(pr)
    return pr

@router.post("/{pr_id}/submit", response_model=PROut)
def submit_pr(pr_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pr = db.query(PurchaseRequisition).filter(PurchaseRequisition.id == pr_id, PurchaseRequisition.requester_id == current_user.id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")
    if pr.status != PRStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only draft PRs can be submitted")
    pr.status = PRStatus.SUBMITTED
    db.commit()
    db.refresh(pr)
    return pr
