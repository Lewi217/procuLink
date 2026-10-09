import os
import redis
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Connection pool for Redis
redis_pool = redis.ConnectionPool.from_url(REDIS_URL, decode_responses=True)

def get_redis_client():
    return redis.Redis(connection_pool=redis_pool)
