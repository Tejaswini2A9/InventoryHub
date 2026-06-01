from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
from typing import List

from .database import engine, Base, get_db, SessionLocal
from . import cache, crud, email_service, schemas, auth, models
from .config import settings

# Initialize database tables on application startup
Base.metadata.create_all(bind=engine)

# Keep existing installations compatible when new optional order fields are added.
if "sold_at" not in {column["name"] for column in inspect(engine).get_columns("orders")}:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE orders ADD COLUMN sold_at TIMESTAMP"))

app = FastAPI(
    title="Inventory & Order Management API",
    description="Backend API for managing products, customers, orders, and stock levels.",
    version="1.0.0"
)

# Seed default admin user on application startup
@app.on_event("startup")
def seed_admin_user():
    if not settings.ADMIN_EMAIL or not settings.ADMIN_PASSWORD:
        return

    db = SessionLocal()
    try:
        admin = db.query(models.User).filter(models.User.email == settings.ADMIN_EMAIL).first()
        if not admin:
            hashed_pw = auth.hash_password(settings.ADMIN_PASSWORD)
            new_admin = models.User(
                name="Administrator",
                email=settings.ADMIN_EMAIL,
                hashed_password=hashed_pw
            )
            db.add(new_admin)
            db.commit()
            print("==================================================")
            print("Default administrator seeded successfully.")
            print(f"Email: {settings.ADMIN_EMAIL}")
            print("==================================================")
    finally:
        db.close()

# Configure CORS so the React frontend (running on Vite or static server) can communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev/deployment flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== AUTHENTICATION ENDPOINTS ====================

@app.post("/auth/login")
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    # 1. Check brute force lockout
    auth.check_lockout(payload.email)
    
    # 2. Check credentials
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not auth.verify_password(payload.password, user.hashed_password):
        auth.track_failed_attempt(payload.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
        
    # 3. Reset failed attempts count
    auth.reset_failed_attempts(payload.email)
    
    # 4. Generate 2FA code
    smtp_configured = email_service.smtp_is_configured()
    code = auth.generate_2fa_code(
        payload.email,
        code=auth.DEV_2FA_CODE if not smtp_configured else None,
    )
    delivered = email_service.send_otp_email(payload.email, code)
    
    return {
        "message": "Verification code sent successfully. Please check your inbox." if delivered else f"Development testing code: {auth.DEV_2FA_CODE}. SMTP is not configured.",
        "email": payload.email,
    }

@app.post("/auth/verify-2fa", response_model=schemas.TokenResponse)
def verify_2fa(payload: schemas.Verify2FARequest, db: Session = Depends(get_db)):
    # 1. Verify 2FA code
    is_valid = auth.verify_2fa_code(payload.email, payload.code)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code."
        )
        
    # 2. Fetch User and return session token
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    return {
        "token": f"mock-jwt-session-token-for-{user.email}",
        "email": user.email,
        "name": user.name
    }

@app.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register(payload: schemas.RegisterRequest, db: Session = Depends(get_db)):
    # 1. Check if email is already registered
    existing_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already registered."
        )
    
    # 2. Hash password and save new user
    hashed_pw = auth.hash_password(payload.password)
    new_user = models.User(
        name=payload.name,
        email=payload.email,
        hashed_password=hashed_pw
    )
    db.add(new_user)
    db.commit()
    return {"message": "Account created successfully. You can now sign in."}


@app.get("/")
def read_root():
    return {"message": "Welcome to the Inventory & Order Management API. Visit /docs for documentation."}


# ==================== PRODUCT ENDPOINTS ====================

@app.post("/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    created_product = crud.create_product(db=db, product=product)
    cache.delete_pattern("api:*")
    return created_product


@app.get("/products", response_model=List[schemas.ProductResponse])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    key = f"api:products:{skip}:{limit}"
    cached = cache.get_json(key)
    if cached is not None:
        return cached
    products = crud.get_products(db=db, skip=skip, limit=limit)
    cache.set_json(key, jsonable_encoder(products))
    return products


@app.get("/products/{product_id}", response_model=schemas.ProductResponse)
def read_product(product_id: int, db: Session = Depends(get_db)):
    db_product = crud.get_product(db=db, product_id=product_id)
    if not db_product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return db_product


@app.put("/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, product_update: schemas.ProductUpdate, db: Session = Depends(get_db)):
    updated_product = crud.update_product(db=db, product_id=product_id, product_update=product_update)
    cache.delete_pattern("api:*")
    return updated_product


@app.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    crud.delete_product(db=db, product_id=product_id)
    cache.delete_pattern("api:*")
    return {"message": "Product deleted successfully", "id": product_id}


# ==================== CUSTOMER ENDPOINTS ====================

@app.post("/customers", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    created_customer = crud.create_customer(db=db, customer=customer)
    cache.delete_pattern("api:*")
    return created_customer


@app.get("/customers", response_model=List[schemas.CustomerResponse])
def read_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    key = f"api:customers:{skip}:{limit}"
    cached = cache.get_json(key)
    if cached is not None:
        return cached
    customers = crud.get_customers(db=db, skip=skip, limit=limit)
    cache.set_json(key, jsonable_encoder(customers))
    return customers


@app.get("/customers/{customer_id}", response_model=schemas.CustomerResponse)
def read_customer(customer_id: int, db: Session = Depends(get_db)):
    db_customer = crud.get_customer(db=db, customer_id=customer_id)
    if not db_customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return db_customer


@app.delete("/customers/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    crud.delete_customer(db=db, customer_id=customer_id)
    cache.delete_pattern("api:*")
    return {"message": "Customer deleted successfully", "id": customer_id}


# ==================== ORDER ENDPOINTS ====================

@app.post("/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    created_order = crud.create_order(db=db, order_create=order)
    cache.delete_pattern("api:*")
    return created_order


@app.get("/orders", response_model=List[schemas.OrderResponse])
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    key = f"api:orders:active:{skip}:{limit}"
    cached = cache.get_json(key)
    if cached is not None:
        return cached
    orders = crud.get_orders(db=db, skip=skip, limit=limit)
    cache.set_json(key, jsonable_encoder(orders))
    return orders


@app.get("/orders/history", response_model=List[schemas.OrderResponse])
def read_sold_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    key = f"api:orders:sold:{skip}:{limit}"
    cached = cache.get_json(key)
    if cached is not None:
        return cached
    orders = crud.get_sold_orders(db=db, skip=skip, limit=limit)
    cache.set_json(key, jsonable_encoder(orders))
    return orders


@app.patch("/orders/{order_id}/sold", response_model=schemas.OrderResponse)
def mark_order_sold(order_id: int, db: Session = Depends(get_db)):
    sold_order = crud.mark_order_sold(db=db, order_id=order_id)
    cache.delete_pattern("api:*")
    return sold_order


@app.post("/orders/{order_id}/email")
def email_order_details(order_id: int, db: Session = Depends(get_db)):
    db_order = crud.get_order(db=db, order_id=order_id)
    if not db_order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    email_service.send_order_email(db_order)
    return {"message": f"Order details sent to {db_order.customer.email}."}


@app.get("/orders/{order_id}", response_model=schemas.OrderDetailResponse)
def read_order(order_id: int, db: Session = Depends(get_db)):
    db_order = crud.get_order(db=db, order_id=order_id)
    if not db_order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return db_order


@app.delete("/orders/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    crud.delete_order(db=db, order_id=order_id)
    cache.delete_pattern("api:*")
    return {"message": "Order cancelled and deleted successfully. Stock has been restocked.", "id": order_id}


# ==================== DASHBOARD SUMMARY ENDPOINT ====================

@app.get("/dashboard", response_model=schemas.DashboardSummary)
def read_dashboard_summary(low_stock_threshold: int = 10, db: Session = Depends(get_db)):
    key = f"api:dashboard:{low_stock_threshold}"
    cached = cache.get_json(key)
    if cached is not None:
        return cached
    summary = crud.get_dashboard_summary(db=db, low_stock_threshold=low_stock_threshold)
    cache.set_json(key, jsonable_encoder(summary))
    return summary
