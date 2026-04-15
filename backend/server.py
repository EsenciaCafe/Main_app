from fastapi import FastAPI, APIRouter, Depends, HTTPException, Header, Body
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from pymongo.errors import DuplicateKeyError

# ── CONFIG ─────────────────────────────────

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ── MODELOS ────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserAdminUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[Literal["customer", "admin"]] = None
    uid: Optional[str] = None

# ── HELPERS ────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str) -> str:
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
    return user

async def get_admin_user(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    return user

# ── AUTH ───────────────────────────────────

@api_router.post("/auth/register")
async def register(data: UserCreate):
    user = {
        "id": str(uuid.uuid4()),
        "email": data.email.lower(),
        "password_hash": hash_password(data.password),
        "name": data.name,
        "role": "customer",
        "points": 0,
        "uid": None
    }
    await db.users.insert_one(user)
    return {"token": create_token(user["id"], user["role"])}

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401)
    return {"token": create_token(user["id"], user["role"])}

# ── ADMIN ──────────────────────────────────

@api_router.put("/admin/user/{user_id}")
async def update_user(user_id: str, data: UserAdminUpdate, user=Depends(get_admin_user)):
    update_data = {k: v for k, v in data.dict().items() if v is not None}

    if "password" in update_data:
        update_data["password_hash"] = hash_password(update_data.pop("password"))

    if "uid" in update_data:
        update_data["uid"] = update_data["uid"].upper()

    await db.users.update_one({"id": user_id}, {"$set": update_data})
    return {"ok": True}

# ── RFID ───────────────────────────────────

@api_router.post("/rfid/identify")
async def identify_rfid(uid: str = Body(...)):
    uid = uid.strip().upper()

    user = await db.users.find_one({"uid": uid})

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

# ── APP ────────────────────────────────────

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)