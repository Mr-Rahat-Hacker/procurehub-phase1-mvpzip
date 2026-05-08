from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime

class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int]
    user_email: Optional[str]
    action: str
    resource_type: str
    resource_id: Optional[str]
    resource_number: Optional[str]
    old_value: Optional[Dict]
    new_value: Optional[Dict]
    ip_address: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True
