from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, vendors, requisitions, purchase_orders, rfq, audit, grn, users, reports
from app.core.database import engine, Base
from app.models import rfq as rfq_models, audit as audit_models, grn as grn_models

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ProcureHub API",
    description="Enterprise e-Procurement Platform",
    version="2.0.0",
    redirect_slashes=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(vendors.router, prefix="/api/vendors", tags=["vendors"])
app.include_router(requisitions.router, prefix="/api/requisitions", tags=["requisitions"])
app.include_router(purchase_orders.router, prefix="/api/purchase-orders", tags=["purchase-orders"])
app.include_router(rfq.router, prefix="/api/rfqs", tags=["rfq"])
app.include_router(grn.router, prefix="/api/grns", tags=["grn"])
app.include_router(audit.router, prefix="/api/audit-logs", tags=["audit"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])

@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.0.0"}
