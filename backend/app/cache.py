import json
from typing import Any, Optional

from redis import Redis
from redis.exceptions import RedisError

from .config import settings

_client: Optional[Redis] = None
_redis_unavailable = False


def get_client() -> Optional[Redis]:
    global _client, _redis_unavailable

    if _redis_unavailable or not settings.REDIS_URL:
        return None

    if _client is None:
        try:
            _client = Redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=1,
                socket_timeout=1,
            )
            _client.ping()
        except RedisError:
            _redis_unavailable = True
            _client = None

    return _client


def get_json(key: str) -> Optional[Any]:
    client = get_client()
    if not client:
        return None

    try:
        value = client.get(key)
        return json.loads(value) if value else None
    except (RedisError, json.JSONDecodeError):
        return None


def set_json(key: str, value: Any, ttl: Optional[int] = None) -> None:
    client = get_client()
    if not client:
        return

    try:
        client.setex(key, ttl or settings.CACHE_TTL_SECONDS, json.dumps(value, default=str))
    except RedisError:
        return


def delete_pattern(pattern: str) -> None:
    client = get_client()
    if not client:
        return

    try:
        keys = list(client.scan_iter(match=pattern))
        if keys:
            client.delete(*keys)
    except RedisError:
        return


def set_otp(email: str, code: str, ttl_seconds: int) -> bool:
    client = get_client()
    if not client:
        return False

    try:
        client.setex(f"auth:otp:{email}", ttl_seconds, code)
        return True
    except RedisError:
        return False


def get_otp(email: str) -> Optional[str]:
    client = get_client()
    if not client:
        return None

    try:
        return client.get(f"auth:otp:{email}")
    except RedisError:
        return None


def delete_otp(email: str) -> None:
    client = get_client()
    if not client:
        return

    try:
        client.delete(f"auth:otp:{email}")
    except RedisError:
        return
