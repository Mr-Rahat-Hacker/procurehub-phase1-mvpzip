from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class InvoiceStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    MATCHED = "matched"
    EXCEPTION = "exception"
    APPROVED = "approved"
    REJECTED = "rejected"


class ApprovalRule(Base):
    __tablename__ = "approval_rules"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    min_amount = Column(Float, default=0.0)
    max_amount = Column(Float, nullable=True)
    department = Column(String, nullable=True)
    category = Column(String, nullable=True)
    approver_role = Column(String, nullable=False)
    level = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class BudgetLedger(Base):
    __tablename__ = "budget_ledger"
    id = Column(Integer, primary_key=True, index=True)
    department = Column(String, nullable=False, index=True)
    fiscal_year = Column(Integer, nullable=False, index=True)
    budget_allocated = Column(Float, default=0.0)
    budget_reserved = Column(Float, default=0.0)
    budget_spent = Column(Float, default=0.0)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, nullable=False, index=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    amount = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0.0)
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.DRAFT)
    exception_reason = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ApprovalTask(Base):
    __tablename__ = "approval_tasks"
    id = Column(Integer, primary_key=True, index=True)
    resource_type = Column(String, nullable=False)
    resource_id = Column(Integer, nullable=False, index=True)
    rule_id = Column(Integer, ForeignKey("approval_rules.id"), nullable=False)
    level = Column(Integer, default=1)
    status = Column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING)
    acted_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SODPolicy(Base):
    __tablename__ = "sod_policies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    maker_role = Column(String, nullable=False)
    checker_role = Column(String, nullable=False)
    resource_type = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)


class SODViolation(Base):
    __tablename__ = "sod_violations"
    id = Column(Integer, primary_key=True, index=True)
    policy_id = Column(Integer, ForeignKey("sod_policies.id"), nullable=False)
    resource_type = Column(String, nullable=False)
    resource_id = Column(Integer, nullable=False)
    maker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    checker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
