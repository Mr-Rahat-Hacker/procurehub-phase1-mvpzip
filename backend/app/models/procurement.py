from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class PRStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    PO_CREATED = "po_created"

class POStatus(str, enum.Enum):
    DRAFT = "draft"
    SENT = "sent"
    ACKNOWLEDGED = "acknowledged"
    PARTIALLY_RECEIVED = "partially_received"
    FULLY_RECEIVED = "fully_received"
    CANCELLED = "cancelled"
    CLOSED = "closed"

class Priority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class PurchaseRequisition(Base):
    __tablename__ = "purchase_requisitions"
    id = Column(Integer, primary_key=True, index=True)
    pr_number = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    department = Column(String, nullable=False)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(PRStatus), default=PRStatus.DRAFT)
    priority = Column(Enum(Priority), default=Priority.MEDIUM)
    required_by = Column(DateTime(timezone=True), nullable=True)
    estimated_value = Column(Float, default=0.0)
    approved_by = Column(String, nullable=True)
    approval_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    requester = relationship("User", back_populates="requisitions")
    line_items = relationship("PRLineItem", back_populates="requisition", cascade="all, delete-orphan")
    purchase_order = relationship("PurchaseOrder", back_populates="requisition", uselist=False)

class PRLineItem(Base):
    __tablename__ = "pr_line_items"
    id = Column(Integer, primary_key=True, index=True)
    requisition_id = Column(Integer, ForeignKey("purchase_requisitions.id"), nullable=False)
    item_code = Column(String, nullable=True)
    item_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    quantity = Column(Float, nullable=False)
    unit_of_measure = Column(String, default="EA")
    estimated_unit_price = Column(Float, default=0.0)
    total_price = Column(Float, default=0.0)
    category = Column(String, nullable=True)

    requisition = relationship("PurchaseRequisition", back_populates="line_items")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String, unique=True, index=True, nullable=False)
    requisition_id = Column(Integer, ForeignKey("purchase_requisitions.id"), nullable=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    status = Column(Enum(POStatus), default=POStatus.DRAFT)
    payment_terms = Column(String, default="NET30")
    delivery_address = Column(Text, nullable=True)
    expected_delivery = Column(DateTime(timezone=True), nullable=True)
    subtotal = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    currency = Column(String, default="INR")
    notes = Column(Text, nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    vendor = relationship("Vendor", back_populates="purchase_orders")
    requisition = relationship("PurchaseRequisition", back_populates="purchase_order")
    line_items = relationship("POLineItem", back_populates="purchase_order", cascade="all, delete-orphan")

class POLineItem(Base):
    __tablename__ = "po_line_items"
    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    item_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    quantity = Column(Float, nullable=False)
    unit_of_measure = Column(String, default="EA")
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    hsn_code = Column(String, nullable=True)
    tax_rate = Column(Float, default=18.0)

    purchase_order = relationship("PurchaseOrder", back_populates="line_items")
