import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, Optional
from fastapi import HTTPException, status
from . import cache

# ==================== PASSWORD HASHING ====================
def hash_password(password: str) -> str:
    """Hash password using SHA-256 with standard utf-8 encoding."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password by comparing hashes."""
    return hash_password(plain_password) == hashed_password


# ==================== BRUTE-FORCE LOCKOUT MONITORING ====================
# Structure: { email: { "failed_count": int, "lockout_until": Optional[datetime] } }
failed_login_attempts: Dict[str, Dict] = {}
LOCKOUT_LIMIT = 5
LOCKOUT_DURATION_SECONDS = 60

def track_failed_attempt(email: str):
    """Tracks failed login attempts and applies lockout if limit exceeded."""
    email = email.strip().lower()
    now = datetime.utcnow()
    
    if email not in failed_login_attempts:
        failed_login_attempts[email] = {"failed_count": 1, "lockout_until": None}
    else:
        record = failed_login_attempts[email]
        # Reset count if the lockout has expired
        if record["lockout_until"] and now > record["lockout_until"]:
            record["failed_count"] = 1
            record["lockout_until"] = None
        else:
            record["failed_count"] += 1
            
        if record["failed_count"] >= LOCKOUT_LIMIT:
            record["lockout_until"] = now + timedelta(seconds=LOCKOUT_DURATION_SECONDS)

def check_lockout(email: str):
    """Verifies if an email account is currently locked out."""
    email = email.strip().lower()
    if email in failed_login_attempts:
        record = failed_login_attempts[email]
        if record["lockout_until"]:
            now = datetime.utcnow()
            if now < record["lockout_until"]:
                remaining = int((record["lockout_until"] - now).total_seconds())
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Account locked due to multiple failed login attempts. Please try again in {remaining} seconds."
                )
            else:
                # Lockout expired, reset status
                record["failed_count"] = 0
                record["lockout_until"] = None

def reset_failed_attempts(email: str):
    """Clears failed login attempt counters upon successful credential validation."""
    email = email.strip().lower()
    if email in failed_login_attempts:
        failed_login_attempts[email] = {"failed_count": 0, "lockout_until": None}


# ==================== TWO-FACTOR AUTHENTICATION (2FA) ====================
# Structure: { email: { "code": str, "expires_at": datetime } }
active_2fa_codes: Dict[str, Dict] = {}
TWO_FACTOR_TTL_MINUTES = 5
DEV_2FA_CODE = "000000"

def generate_2fa_code(email: str, code: Optional[str] = None) -> str:
    """Generates a secure 6-digit 2FA code and stores it with an expiration timestamp."""
    email = email.strip().lower()
    code = code or f"{secrets.randbelow(900000) + 100000}"
    expires_at = datetime.utcnow() + timedelta(minutes=TWO_FACTOR_TTL_MINUTES)
    active_2fa_codes[email] = {"code": code, "expires_at": expires_at}
    cache.set_otp(email, code, TWO_FACTOR_TTL_MINUTES * 60)
    return code

def verify_2fa_code(email: str, code: str) -> bool:
    """Verifies the 2FA code is correct and not expired."""
    email = email.strip().lower()
    code = code.strip()
    
    cached_code = cache.get_otp(email)
    if cached_code:
        is_valid = cached_code == code
        if is_valid:
            cache.delete_otp(email)
            active_2fa_codes.pop(email, None)
        return is_valid

    if email not in active_2fa_codes:
        return False
        
    record = active_2fa_codes[email]
    now = datetime.utcnow()
    
    if now > record["expires_at"]:
        # Delete expired code
        active_2fa_codes.pop(email, None)
        return False
        
    is_valid = record["code"] == code
    if is_valid:
        # Clear code after successful verification to prevent reuse
        active_2fa_codes.pop(email, None)
        cache.delete_otp(email)
        
    return is_valid
