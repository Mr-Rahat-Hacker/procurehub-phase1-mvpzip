from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class RFQStatus(str, enum.Enum):
    DRAFT = "draft"
    SENT = "sent"
    QUOTES_RECEIVED = "quotes_received"
    UNDER_EVALUATION = "under_evaluation"
    AWARDED = "awarded"
    CANCELLED = "cancelled"

class QuotationStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class RFQ(Base):
    __tablename__ = "rfqs"
    id = Column(Integer, primary_key=True, index=True)
    rfq_number = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    requisition_id = Column(Integer, ForeignKey("purchase_requisitions.id"), nullable=True)
    department = Column(String, nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(RFQStatus), default=RFQStatus.DRAFT)
    submission_deadline = Column(DateTime(timezone=True), nullable=True)
    delivery_terms = Column(String, nullable=True)
    payment_terms = Column(String, default="NET30")
    special_instructions = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    created_by = relationship("User", foreign_keys=[created_by_id])
    requisition = relationship("PurchaseRequisition", foreign_keys=[requisition_id])
    line_items = relationship("RFQLineItem", back_populates="rfq", cascade="all, delete-orphan")
    vendors = relationship("RFQVendor", back_populates="rfq", cascade="all, delete-orphan")
    quotations = relationship("Quotation", back_populates="rfq", cascade="all, delete-orphan")

class RFQLineItem(Base):
    __tablename__ = "rfq_line_items"
    id = Column(Integer, primary_key=True, index=True)
    rfq_id = Column(Integer, ForeignKey("rfqs.id"), nullable=False)
    item_code = Column(String, nullable=True)
    item_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    quantity = Column(Float, nullable=False)
    unit_of_measure = Column(String, default="EA")
    category = Column(String, nullable=True)
    target_price = Column(Float, nullable=True)
    rfq = relationship("RFQ", back_populates="line_items")

class RFQVendor(Base):
    __tablename__ = "rfq_vendors"
    id = Column(Integer, primary_key=True, index=True)
    rfq_id = Column(Integer, ForeignKey("rfqs.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    invited_at = Column(DateTime(timezone=True), server_default=func.now())
    responded = Column(Boolean, default=False)
    rfq = relationship("RFQ", back_populates="vendors")
    vendor = relationship("Vendor")

class Quotation(Base):
    __tablename__ = "quotations"
    id = Column(Integer, primary_key=True, index=True)
    quotation_number = Column(String, unique=True, index=True, nullable=False)
    rfq_id = Column(Integer, ForeignKey("rfqs.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    status = Column(Enum(QuotationStatus), default=QuotationStatus.SUBMITTED)
    validity_days = Column(Integer, default=30)
    payment_terms = Column(String, nullable=True)
    delivery_days = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    subtotal = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    currency = Column(String, default="INR")
    is_lowest = Column(Boolean, default=False)
    is_selected = Column(Boolean, default=False)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    rfq = relationship("RFQ", back_populates="quotations")
    vendor = relationship("Vendor")
    line_items = relationship("QuotationLineItem", back_populates="quotation", cascade="all, delete-orphan")

class QuotationLineItem(Base):
    __tablename__ = "quotation_line_items"
    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=False)
    rfq_line_item_id = Column(Integer, ForeignKey("rfq_line_items.id"), nullable=True)
    item_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    quantity = Column(Float, nullable=False)
    unit_of_measure = Column(String, default="EA")
    unit_price = Column(Float, nullable=False)
    tax_rate = Column(Float, default=18.0)
    total_price = Column(Float, nullable=False)
    hsn_code = Column(String, nullable=True)
    quotation = relationship("Quotation", back_populates="line_items")
