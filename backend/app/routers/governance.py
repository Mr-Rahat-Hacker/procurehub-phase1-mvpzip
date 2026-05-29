from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.audit import AuditLog
from app.models.procurement import PurchaseRequisition, PurchaseOrder
from app.models.grn import GoodsReceiptNote, GRNLineItem
from app.models.governance import (
    ApprovalRule, BudgetLedger, Invoice, ApprovalTask, SODPolicy, SODViolation,
    InvoiceStatus, ApprovalStatus
)
from app.schemas.governance import (
    ApprovalRuleCreate, ApprovalRuleOut, BudgetLedgerCreate, BudgetCheckRequest, BudgetCommitRequest,
    InvoiceCreate, InvoiceOut, ApprovalAction, SODPolicyCreate, ThreeWayMatchOut
)

router = APIRouter()


def normalize_resource_type(resource_type: str) -> str:
    return resource_type.strip().upper()


def get_resource_context(db: Session, resource_type: str, resource_id: int):
    if resource_type == "PR":
        resource = db.query(PurchaseRequisition).filter(PurchaseRequisition.id == resource_id).first()
        if not resource:
            raise HTTPException(status_code=404, detail="PR not found")
        maker = db.query(User).filter(User.id == resource.requester_id).first()
        categories = {item.category for item in resource.line_items if item.category}
        return resource.estimated_value, resource.department, categories, maker

    if resource_type == "PO":
        resource = db.query(PurchaseOrder).filter(PurchaseOrder.id == resource_id).first()
        if not resource:
            raise HTTPException(status_code=404, detail="PO not found")
        categories = {item.hsn_code for item in resource.line_items if item.hsn_code}
        return resource.total_amount, None, categories, None

    raise HTTPException(status_code=400, detail="Unsupported resource type")


def audit(db: Session, user: User, action: str, resource_type: str, resource_id: str, old=None, new=None):
    db.add(AuditLog(
        user_id=user.id,
        user_email=user.email,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        old_value=old,
        new_value=new,
        created_at=datetime.utcnow(),
    ))


@router.post("/approval-rules", response_model=ApprovalRuleOut)
def create_approval_rule(data: ApprovalRuleCreate, db: Session = Depends(get_db), user: User = Depends(require_role([UserRole.ADMIN, UserRole.PROCUREMENT_MANAGER]))):
    rule = ApprovalRule(**data.model_dump())
    db.add(rule)
    audit(db, user, "CREATE", "ApprovalRule", "new", new=data.model_dump())
    db.commit()
    db.refresh(rule)
    return rule


@router.post("/approval-tasks/{resource_type}/{resource_id}")
def create_approval_tasks(resource_type: str, resource_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    resource_type = normalize_resource_type(resource_type)
    amount, department, categories, _ = get_resource_context(db, resource_type, resource_id)

    existing_count = db.query(ApprovalTask).filter(
        ApprovalTask.resource_type == resource_type,
        ApprovalTask.resource_id == resource_id,
    ).count()
    if existing_count:
        return {"message": "Approval tasks already exist", "count": existing_count}

    rules = db.query(ApprovalRule).filter(
        ApprovalRule.is_active.is_(True),
        ApprovalRule.min_amount <= amount,
    ).all()
    rules = [
        r for r in rules
        if (r.max_amount is None or amount <= r.max_amount)
        and (r.department is None or r.department == department)
        and (r.category is None or r.category in categories)
    ]
    if not rules:
        return {"message": "No matching approval rules"}

    for r in sorted(rules, key=lambda x: x.level):
        db.add(ApprovalTask(resource_type=resource_type, resource_id=resource_id, rule_id=r.id, level=r.level))
    audit(db, user, "CREATE", "ApprovalTask", f"{resource_type}:{resource_id}", new={"count": len(rules)})
    db.commit()
    return {"message": f"Created {len(rules)} approval task(s)"}


@router.post("/approval-tasks/{task_id}/action")
def act_approval_task(task_id: int, data: ApprovalAction, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if data.action == ApprovalStatus.PENDING:
        raise HTTPException(status_code=400, detail="Approval action must be approved or rejected")

    task = db.query(ApprovalTask).filter(ApprovalTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status != ApprovalStatus.PENDING:
        raise HTTPException(status_code=400, detail="Approval task has already been actioned")

    rule = db.query(ApprovalRule).filter(ApprovalRule.id == task.rule_id).first()
    if not rule:
        raise HTTPException(status_code=500, detail="Approval rule missing for task")
    if str(user.role.value) != rule.approver_role and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="User role not allowed for this approval level")

    _, _, _, maker = get_resource_context(db, task.resource_type, task.resource_id)
    maker_role = str(maker.role.value) if maker else None
    policy = None
    if maker_role:
        policy = db.query(SODPolicy).filter(
            SODPolicy.is_active.is_(True),
            SODPolicy.resource_type == task.resource_type,
            SODPolicy.maker_role == maker_role,
            SODPolicy.checker_role == str(user.role.value),
        ).first()

    if data.action == ApprovalStatus.APPROVED and policy and maker:
        db.add(SODViolation(
            policy_id=policy.id,
            resource_type=task.resource_type,
            resource_id=task.resource_id,
            maker_id=maker.id,
            checker_id=user.id,
            reason="Approval blocked by segregation-of-duties policy",
        ))
        audit(db, user, "SOD_VIOLATION", task.resource_type, str(task.resource_id), new={"policy_id": policy.id})
        db.commit()
        raise HTTPException(status_code=409, detail="SoD policy violation")

    task.status = data.action
    task.acted_by_id = user.id
    task.remarks = data.remarks
    audit(db, user, "APPROVAL_ACTION", "ApprovalTask", str(task.id), new={"status": task.status.value})
    db.commit()
    return {"message": "Task updated", "status": task.status}


@router.post("/budgets")
def create_budget(data: BudgetLedgerCreate, db: Session = Depends(get_db), user: User = Depends(require_role([UserRole.ADMIN, UserRole.PROCUREMENT_MANAGER]))):
    row = db.query(BudgetLedger).filter(BudgetLedger.department == data.department, BudgetLedger.fiscal_year == data.fiscal_year).first()
    if row:
        raise HTTPException(status_code=400, detail="Budget already exists")
    row = BudgetLedger(**data.model_dump(), budget_reserved=0.0, budget_spent=0.0)
    db.add(row)
    audit(db, user, "CREATE", "Budget", f"{data.department}:{data.fiscal_year}", new=data.model_dump())
    db.commit()
    return {"message": "Budget created"}


@router.post("/budgets/check")
def check_budget(data: BudgetCheckRequest, reserve: bool = True, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = db.query(BudgetLedger).filter(BudgetLedger.department == data.department, BudgetLedger.fiscal_year == data.fiscal_year).first()
    if not row:
        raise HTTPException(status_code=404, detail="Budget not found")
    available = row.budget_allocated - row.budget_reserved - row.budget_spent
    ok = available >= data.amount
    if ok and reserve:
        row.budget_reserved += data.amount
        audit(db, user, "BUDGET_RESERVE", "Budget", f"{data.department}:{data.fiscal_year}", new={"amount": data.amount})
        db.commit()
    return {"allowed": ok, "available": available, "reserved": row.budget_reserved}


@router.post("/budgets/commit")
def commit_budget(data: BudgetCommitRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = db.query(BudgetLedger).filter(BudgetLedger.department == data.department, BudgetLedger.fiscal_year == data.fiscal_year).first()
    if not row:
        raise HTTPException(status_code=404, detail="Budget not found")
    if row.budget_reserved < data.amount:
        raise HTTPException(status_code=400, detail="Insufficient reserved budget to commit")
    row.budget_reserved -= data.amount
    row.budget_spent += data.amount
    audit(db, user, "BUDGET_COMMIT", "Budget", f"{data.department}:{data.fiscal_year}", new={"amount": data.amount})
    db.commit()
    return {"message": "Budget committed", "reserved": row.budget_reserved, "spent": row.budget_spent}


@router.post("/invoices", response_model=InvoiceOut, status_code=201)
def create_invoice(data: InvoiceCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    existing = db.query(Invoice).filter(Invoice.invoice_number == data.invoice_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Invoice already exists")
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == data.po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")

    inv = Invoice(**data.model_dump(), created_by_id=user.id, status=InvoiceStatus.SUBMITTED)
    total_invoice = data.amount + data.tax_amount
    po_total = po.total_amount
    tolerance_pct = 2.0
    diff_pct = abs(total_invoice - po_total) / po_total * 100 if po_total else 100
    if diff_pct <= tolerance_pct:
        inv.status = InvoiceStatus.MATCHED
    else:
        inv.status = InvoiceStatus.EXCEPTION
        inv.exception_reason = f"Amount mismatch {diff_pct:.2f}% exceeds tolerance {tolerance_pct}%"

    db.add(inv)
    audit(db, user, "CREATE", "Invoice", data.invoice_number, new={"status": inv.status.value})
    db.commit()
    db.refresh(inv)
    return inv


@router.get("/invoices/exceptions")
def invoice_exceptions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.query(Invoice).filter(Invoice.status == InvoiceStatus.EXCEPTION).order_by(Invoice.created_at.desc()).all()
    return rows


@router.get("/invoices/{invoice_id}/three-way-match", response_model=ThreeWayMatchOut)
def three_way_match(invoice_id: int, tolerance_pct: float = 2.0, min_grn_ratio: float = 0.95, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == inv.po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")

    grn_items = db.query(GRNLineItem).join(GoodsReceiptNote, GoodsReceiptNote.id == GRNLineItem.grn_id).filter(
        GoodsReceiptNote.purchase_order_id == po.id
    ).all()
    ordered_qty = sum(item.ordered_quantity for item in grn_items)
    received_qty = sum(item.received_quantity for item in grn_items)
    grn_ratio = (received_qty / ordered_qty) if ordered_qty > 0 else 0.0

    invoice_total = inv.amount + inv.tax_amount
    po_total = po.total_amount
    diff_pct = abs(invoice_total - po_total) / po_total * 100 if po_total else 100.0
    matched = diff_pct <= tolerance_pct and grn_ratio >= min_grn_ratio
    reason = None
    if not matched:
        reasons = []
        if diff_pct > tolerance_pct:
            reasons.append(f"amount diff {diff_pct:.2f}% > {tolerance_pct}%")
        if grn_ratio < min_grn_ratio:
            reasons.append(f"GRN ratio {grn_ratio:.2f} < {min_grn_ratio:.2f}")
        reason = "; ".join(reasons)
        inv.status = InvoiceStatus.EXCEPTION
        inv.exception_reason = reason
    else:
        inv.status = InvoiceStatus.MATCHED
        inv.exception_reason = None
    db.commit()

    return ThreeWayMatchOut(
        po_id=po.id,
        po_total=po_total,
        grn_received_ratio=grn_ratio,
        invoice_total=invoice_total,
        amount_diff_pct=diff_pct,
        matched=matched,
        reason=reason,
    )


@router.post("/sod-policies")
def create_sod_policy(data: SODPolicyCreate, db: Session = Depends(get_db), user: User = Depends(require_role([UserRole.ADMIN]))):
    row = SODPolicy(**data.model_dump(), is_active=True)
    db.add(row)
    audit(db, user, "CREATE", "SODPolicy", "new", new=data.model_dump())
    db.commit()
    return {"message": "SOD policy created"}
