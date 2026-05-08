from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class GRNStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"

class GoodsReceiptNote(Base):
    __tablename__ = "goods_receipt_notes"
    id = Column(Integer, primary_key=True, index=True)
    grn_number = Column(String, unique=True, index=True, nullable=False)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    received_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(GRNStatus), default=GRNStatus.DRAFT)
    delivery_note_number = Column(String, nullable=True)
    vehicle_number = Column(String, nullable=True)
    received_date = Column(DateTime(timezone=True), nullable=True)
    warehouse_location = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    purchase_order = relationship("PurchaseOrder")
    vendor = relationship("Vendor")
    received_by = relationship("User", foreign_keys=[received_by_id])
    line_items = relationship("GRNLineItem", back_populates="grn", cascade="all, delete-orphan")

class GRNLineItem(Base):
    __tablename__ = "grn_line_items"
    id = Column(Integer, primary_key=True, index=True)
    grn_id = Column(Integer, ForeignKey("goods_receipt_notes.id"), nullable=False)
    po_line_item_id = Column(Integer, ForeignKey("po_line_items.id"), nullable=True)
    item_name = Column(String, nullable=False)
    ordered_quantity = Column(Float, nullable=False)
    received_quantity = Column(Float, nullable=False)
    rejected_quantity = Column(Float, default=0.0)
    unit_of_measure = Column(String, default="EA")
    batch_number = Column(String, nullable=True)
    expiry_date = Column(DateTime(timezone=True), nullable=True)
    remarks = Column(Text, nullable=True)
    grn = relationship("GoodsReceiptNote", back_populates="line_items")
