import os
import redis
import json

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))

# Initialize Redis client with error handling
try:
    redis_conn = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)
    # Ping to check connection
    redis_conn.ping()
    redis_active = True
    print(f"Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
except Exception as e:
    print(f"Warning: Redis connection failed. Falling back to local dictionary mock. Error: {e}")
    redis_conn = None
    redis_active = False

# Local mock database for development if Redis is down
class MockRedis:
    def __init__(self):
        self.data = {}

    def get(self, key):
        return self.data.get(key)

    def set(self, key, value, ex=None):
        self.data[key] = str(value)
        return True

    def incrby(self, key, amount=1):
        val = int(self.data.get(key, 0)) + amount
        self.data[key] = str(val)
        return val

    def publish(self, channel, message):
        # Console output simulator
        print(f"[MOCK REDIS PUB] Channel: {channel} | Msg: {message}")
        return 1

if not redis_active:
    redis_client = MockRedis()
else:
    redis_client = redis_conn

# Real-time event publisher wrapper
def publish_event(channel: str, event_type: str, payload: dict):
    """
    Publish an event to a Redis pub/sub channel.
    The message format is: {"event": event_type, "data": payload}
    """
    message = {
        "event": event_type,
        "data": payload
    }
    msg_str = json.dumps(message)
    
    # Always log system events to log channel
    if channel != "omnishield:log":
        log_payload = {
            "type": "info",
            "message": f"Event published to {channel}: {event_type}"
        }
        redis_client.publish("omnishield:log", json.dumps({"event": "SYSTEM_LOG", "data": log_payload}))
        
    redis_client.publish(channel, msg_str)

# Live Dashboard Counters Cache Helpers
def get_live_counter(key: str, default: int = 0) -> int:
    val = redis_client.get(f"counter:{key}")
    if val is None:
        return default
    return int(val)

def set_live_counter(key: str, value: int):
    redis_client.set(f"counter:{key}", value)

def increment_live_counter(key: str, amount: int = 1) -> int:
    new_val = redis_client.incrby(f"counter:{key}", amount)
    # Broadcast count update
    publish_event("omnishield:log", "COUNTER_UPDATE", {"counter": key, "value": new_val})
    return new_val
