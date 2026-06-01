from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime

# ==================== PRODUCT SCHEMAS ====================
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., ge=0.0, description="Price must be non-negative")
    quantity: int = Field(..., ge=0, description="Quantity in stock must be non-negative")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[float] = Field(None, ge=0.0)
    quantity: Optional[int] = Field(None, ge=0)

class ProductResponse(ProductBase):
    id: int
    sku: str
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== CUSTOMER SCHEMAS ====================
class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=5, max_length=20)

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== ORDER SCHEMAS ====================
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0, description="Ordered quantity must be greater than zero")

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    product: ProductResponse

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate] = Field(..., min_length=1, description="Order must contain at least one item")

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    total_amount: float
    created_at: datetime
    sold_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class OrderDetailResponse(OrderResponse):
    customer: CustomerResponse
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True


# ==================== DASHBOARD SCHEMAS ====================
class DashboardSummary(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: List[ProductResponse]


# ==================== AUTHENTICATION SCHEMAS ====================
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Verify2FARequest(BaseModel):
    email: EmailStr
    code: str

class TokenResponse(BaseModel):
    token: str
    email: str
    name: str

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
