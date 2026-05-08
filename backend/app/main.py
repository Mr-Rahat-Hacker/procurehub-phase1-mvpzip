from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, vendors, requisitions, purchase_orders
from app.core.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ProcureHub API",
    description="Enterprise e-Procurement Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(vendors.router, prefix="/api/vendors", tags=["vendors"])
app.include_router(requisitions.router, prefix="/api/requisitions", tags=["requisitions"])
app.include_router(purchase_orders.router, prefix="/api/purchase-orders", tags=["purchase-orders"])

@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
