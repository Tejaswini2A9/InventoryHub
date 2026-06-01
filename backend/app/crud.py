from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from uuid import uuid4
from datetime import datetime, timezone
from . import models, schemas

# ==================== PRODUCT CRUD ====================
def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).order_by(models.Product.id.desc()).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    new_product = models.Product(
        name=product.name,
        sku=f"PENDING-{uuid4().hex}",
        price=product.price,
        quantity=product.quantity
    )
    db.add(new_product)
    db.flush()
    new_product.sku = f"SKU-{new_product.id:05d}"
    db.commit()
    db.refresh(new_product)
    return new_product

def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate):
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    update_data = product_update.model_dump(exclude_unset=True)
            
    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Restrict deletion if product is referenced in orders to maintain DB integrity
    has_orders = db.query(models.OrderItem).filter(models.OrderItem.product_id == product_id).first()
    if has_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete product as it is referenced in existing orders. Consider updating stock to 0 instead."
        )
        
    db.delete(db_product)
    db.commit()
    return True


# ==================== CUSTOMER CRUD ====================
def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).order_by(models.Customer.id.desc()).offset(skip).limit(limit).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    # Check duplicate email
    db_customer = get_customer_by_email(db, customer.email)
    if db_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer with email '{customer.email}' already registered."
        )
        
    new_customer = models.Customer(
        name=customer.name,
        email=customer.email,
        phone=customer.phone
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
        
    # Restrict deletion if customer has active orders
    has_orders = db.query(models.Order).filter(models.Order.customer_id == customer_id).first()
    if has_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete customer as they have active orders in the system."
        )
        
    db.delete(db_customer)
    db.commit()
    return True


# ==================== ORDER CRUD ====================
def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Order).filter(
        models.Order.sold_at.is_(None)
    ).order_by(models.Order.id.desc()).offset(skip).limit(limit).all()

def get_sold_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Order).filter(
        models.Order.sold_at.is_not(None)
    ).order_by(models.Order.sold_at.desc()).offset(skip).limit(limit).all()

def create_order(db: Session, order_create: schemas.OrderCreate):
    # 1. Verify Customer exists
    customer = get_customer(db, order_create.customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {order_create.customer_id} does not exist."
        )
        
    total_amount = 0.0
    items_to_create = []
    
    # We will perform the stock verification first to prevent partial state changes
    for item in order_create.items:
        product = get_product(db, item.product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item.product_id} does not exist."
            )
            
        # Verify sufficient stock
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient inventory for product '{product.name}'. Requested: {item.quantity}, Available: {product.quantity}."
            )
            
        # Decrement product stock
        product.quantity -= item.quantity
        
        # Calculate item cost
        item_cost = product.price * item.quantity
        total_amount += item_cost
        
        # Keep track of OrderItem data to create later
        items_to_create.append({
            "product_id": product.id,
            "quantity": item.quantity,
            "unit_price": product.price
        })
        
    # 2. Create the main Order
    db_order = models.Order(
        customer_id=order_create.customer_id,
        total_amount=round(total_amount, 2)
    )
    db.add(db_order)
    db.flush() # Yields the DB-generated order.id without committing
    
    # 3. Create individual OrderItems
    for item_data in items_to_create:
        db_item = models.OrderItem(
            order_id=db_order.id,
            product_id=item_data["product_id"],
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"]
        )
        db.add(db_item)
        
    db.commit()
    db.refresh(db_order)
    return db_order

def delete_order(db: Session, order_id: int):
    # Cancelling / Deleting an order should restock products
    db_order = get_order(db, order_id)
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    if db_order.sold_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sold orders are preserved in history and cannot be cancelled."
        )
        
    # Restock products
    for item in db_order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if product:
            product.quantity += item.quantity
            
    db.delete(db_order)
    db.commit()
    return True

def mark_order_sold(db: Session, order_id: int):
    db_order = get_order(db, order_id)
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    if db_order.sold_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order has already been marked as sold."
        )

    db_order.sold_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_order)
    return db_order


# ==================== DASHBOARD SUMMARY CRUD ====================
def get_dashboard_summary(db: Session, low_stock_threshold: int = 10):
    total_products = db.query(func.count(models.Product.id)).scalar()
    total_customers = db.query(func.count(models.Customer.id)).scalar()
    total_orders = db.query(func.count(models.Order.id)).scalar()
    
    low_stock_products = db.query(models.Product).filter(
        models.Product.quantity <= low_stock_threshold
    ).order_by(models.Product.quantity.asc()).all()
    
    return {
        "total_products": total_products or 0,
        "total_customers": total_customers or 0,
        "total_orders": total_orders or 0,
        "low_stock_products": low_stock_products
    }
