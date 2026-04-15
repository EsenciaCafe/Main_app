from fastapi import FastAPI, APIRouter, Depends, HTTPException, Header, Body
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from datetime import datetime, timezone
import bcrypt
import jwt

# ── CONFIG ─────────────────────────

load_dotenv()

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ── HELPERS ────────────────────────

def hash_password(password: str):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str):
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str):
    return jwt.encode(
        {"user_id": user_id, "role": role},
        JWT_SECRET,
        algorithm="HS256"
    )

async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401)

    token = authorization.split(" ")[1]
    payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

    user = await db.users.find_one({"id": payload["user_id"]})
    if not user:
        raise HTTPException(status_code=401)

    return user

async def get_admin_user(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    return user

# ── AUTH ───────────────────────────

@api_router.post("/auth/register")
async def register(email: str = Body(...), password: str = Body(...), name: str = Body(...)):
    user = {
        "id": str(uuid.uuid4()),
        "email": email.lower(),
        "password_hash": hash_password(password),
        "name": name,
        "role": "customer",
        "points": 0,
        "uid": None
    }

    await db.users.insert_one(user)

    return {"token": create_token(user["id"], user["role"])}

@api_router.post("/auth/login")
async def login(email: str = Body(...), password: str = Body(...)):
    user = await db.users.find_one({"email": email.lower()})

    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401)

    return {"token": create_token(user["id"], user["role"])}

# ── ADMIN ──────────────────────────

@api_router.put("/admin/user/{user_id}")
async def update_user(user_id: str, data: dict = Body(...), user=Depends(get_admin_user)):

    if "password" in data:
        data["password_hash"] = hash_password(data.pop("password"))

    if "uid" in data and data["uid"]:
        data["uid"] = data["uid"].upper()

    await db.users.update_one({"id": user_id}, {"$set": data})

    return {"ok": True}

# ── RFID ───────────────────────────

@api_router.post("/rfid/identify")
async def identify_rfid(uid: str = Body(...)):
    uid = uid.strip().upper()

    user = await db.users.find_one(
        {"uid": uid},
        {"_id": 0, "password_hash": 0}
    )

    if not user:
        return {"user": None}

    return {
        "user": {
            "id": user["id"],
            "name": user["name"],
            "points": user.get("points", 0)
        }
    }

@api_router.post("/admin/rfid/assign")
async def assign_rfid(user_id: str = Body(...), uid: str = Body(...), user=Depends(get_admin_user)):
    uid = uid.strip().upper()

    await db.users.update_one(
        {"id": user_id},
        {"$set": {"uid": uid}}
    )

    return {"ok": True}

# ── IMPORTANTE ─────────────────────

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)