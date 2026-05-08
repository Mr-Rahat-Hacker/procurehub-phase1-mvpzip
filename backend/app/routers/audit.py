from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.audit import AuditLog
from app.models.user import User, UserRole
from app.schemas.audit import AuditLogOut
import csv, io

router = APIRouter()

@router.get("", response_model=List[AuditLogOut])
def list_audit_logs(
    resource_type: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.PROCUREMENT_MANAGER]))
):
    q = db.query(AuditLog)
    if resource_type:
        q = q.filter(AuditLog.resource_type == resource_type)
    if action:
        q = q.filter(AuditLog.action == action)
    if user_id:
        q = q.filter(AuditLog.user_id == user_id)
    return q.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/export")
def export_audit_logs(
    resource_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    q = db.query(AuditLog)
    if resource_type:
        q = q.filter(AuditLog.resource_type == resource_type)
    logs = q.order_by(AuditLog.created_at.desc()).limit(5000).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Timestamp", "User Email", "Action", "Resource Type", "Resource ID", "Resource Number"])
    for log in logs:
        writer.writerow([log.id, log.created_at, log.user_email, log.action, log.resource_type, log.resource_id, log.resource_number])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit_log.csv"}
    )
