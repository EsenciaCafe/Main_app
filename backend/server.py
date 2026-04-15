from fastapi import FastAPI, APIRouter, Depends, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import Body
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import random
import string
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = 'HS256'
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))
APP_ENV = os.getenv("APP_ENV", "development").lower()
SEED_DEFAULT_DATA = os.getenv(
    "SEED_DEFAULT_DATA",
    "true" if APP_ENV != "production" else "false",
).lower() == "true"
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",")
    if origin.strip()
]
ADMIN_EMAIL = os.getenv("DEMO_ADMIN_EMAIL", "admin@esencia.com").strip().lower()
ADMIN_PASSWORD = os.getenv("DEMO_ADMIN_PASSWORD", "admin123")
DEMO_CUSTOMER_EMAIL = os.getenv("DEMO_CUSTOMER_EMAIL", "cliente@test.com").strip().lower()
DEMO_CUSTOMER_PASSWORD = os.getenv("DEMO_CUSTOMER_PASSWORD", "test123")

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ── Models ──────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=2, max_length=120)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return value.strip()

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

class PromotionCreate(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    description: str = Field(min_length=8, max_length=500)
    points_required: int = Field(gt=0, le=1000)
    category: Literal["coffee", "food", "special"] = "coffee"
    icon: Literal["coffee", "gift", "star", "heart"] = "coffee"

    @field_validator("title", "description")
    @classmethod
    def strip_text_fields(cls, value: str) -> str:
        return value.strip()

class AddPointsRequest(BaseModel):
    user_id: str = Field(min_length=1, max_length=64)
    points: int = Field(gt=0, le=1000)
    reason: str = Field(min_length=3, max_length=160)

    @field_validator("reason")
    @classmethod
    def strip_reason(cls, value: str) -> str:
        return value.strip()

class PromotionUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=120)
    description: Optional[str] = Field(default=None, min_length=8, max_length=500)
    points_required: Optional[int] = Field(default=None, gt=0, le=1000)
    category: Optional[Literal["coffee", "food", "special"]] = None
    icon: Optional[Literal["coffee", "gift", "star", "heart"]] = None
    is_active: Optional[bool] = None

    @field_validator("title", "description")
    @classmethod
    def strip_optional_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        return value.strip()

class UserAdminUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(default=None, min_length=6, max_length=128)
    role: Optional[Literal["customer", "admin"]] = None
    club_member: Optional[bool] = None
    membership_tier: Optional[str] = Field(default=None, max_length=80)
    uid: Optional[str] = Field(default=None, max_length=120)

    @field_validator("name")
    @classmethod
    def normalize_optional_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        return value.strip()

    @field_validator("membership_tier")
    @classmethod
    def normalize_membership_tier(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip()
        return value or None

    @field_validator("uid")
    @classmethod
    def normalize_uid(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip().upper()
        return value or None

# ── Auth helpers ────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def serialize_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "points": user["points"],
        "created_at": user["created_at"],
        "uid": user.get("uid"),
        "club_member": bool(user.get("club_member", False)),
        "membership_tier": user.get("membership_tier"),
        "club_waitlist": bool(user.get("club_waitlist", False)),
        "club_waitlist_joined_at": user.get("club_waitlist_joined_at"),
    }

def create_token(user_id: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=JWT_EXPIRE_MINUTES)
    return jwt.encode(
        {
            "user_id": user_id,
            "role": role,
            "iat": now,
            "exp": expires_at,
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ── Auth routes ─────────────────────────────────────────

@api_router.post("/auth/register")
async def register(data: UserCreate):
    normalized_email = data.email.strip().lower()
    existing = await db.users.find_one({"email": normalized_email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = {
        "id": str(uuid.uuid4()),
        "email": normalized_email,
        "password_hash": hash_password(data.password),
        "name": data.name,
        "role": "customer",
        "points": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "uid": None,
        "club_member": False,
        "membership_tier": None,
        "club_waitlist": False,
        "club_waitlist_joined_at": None,
    }
    try:
        await db.users.insert_one(user)
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Email already registered")
    token = create_token(user["id"], user["role"])
    return {
        "token": token,
        "user": serialize_user(user),
    }

@api_router.post("/auth/login")
async def login(data: UserLogin):
    normalized_email = data.email.strip().lower()
    user = await db.users.find_one({"email": normalized_email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"], user["role"])
    return {
        "token": token,
        "user": serialize_user(user),
    }

@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    return serialize_user(user)

# ── Customer routes ─────────────────────────────────────

@api_router.get("/promotions")
async def get_promotions():
    promos = await db.promotions.find({"is_active": True}, {"_id": 0}).to_list(100)
    return promos

@api_router.post("/redeem/{promotion_id}")
async def redeem_promotion(promotion_id: str, user=Depends(get_current_user)):
    promo = await db.promotions.find_one({"id": promotion_id, "is_active": True}, {"_id": 0})
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found")

    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    redemption = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user["name"],
        "promotion_id": promo["id"],
        "promotion_title": promo["title"],
        "points_used": promo["points_required"],
        "code": code,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "validated_at": None
    }

    updated_user = await db.users.find_one_and_update(
        {
            "id": user["id"],
            "points": {"$gte": promo["points_required"]},
        },
        {"$inc": {"points": -promo["points_required"]}},
        projection={"_id": 0},
        return_document=ReturnDocument.AFTER,
    )
    if not updated_user:
        raise HTTPException(status_code=400, detail="Not enough points")
    await db.redemptions.insert_one(redemption)

    return {
        "id": redemption["id"],
        "user_id": redemption["user_id"],
        "user_name": redemption["user_name"],
        "promotion_id": redemption["promotion_id"],
        "promotion_title": redemption["promotion_title"],
        "points_used": redemption["points_used"],
        "code": redemption["code"],
        "status": redemption["status"],
        "created_at": redemption["created_at"],
        "validated_at": redemption["validated_at"]
    }

@api_router.get("/my-redemptions")
async def get_my_redemptions(user=Depends(get_current_user)):
    redemptions = await db.redemptions.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return redemptions

@api_router.post("/club/waitlist")
async def join_club_waitlist(user=Depends(get_current_user)):
    if user.get("club_member", False):
        return {
            "message": "Membership already active",
            "user": serialize_user(user),
        }

    if user.get("club_waitlist", False):
        return {
            "message": "Already on the club waitlist",
            "user": serialize_user(user),
        }

    updated_user = await db.users.find_one_and_update(
        {"id": user["id"]},
        {
            "$set": {
                "club_waitlist": True,
                "club_waitlist_joined_at": datetime.now(timezone.utc).isoformat(),
            }
        },
        projection={"_id": 0},
        return_document=ReturnDocument.AFTER,
    )
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "message": "Added to the club waitlist",
        "user": serialize_user(updated_user),
    }

@api_router.get("/history")
async def get_history(user=Depends(get_current_user)):
    transactions = await db.point_transactions.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    redemptions = await db.redemptions.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)

    history = []
    for t in transactions:
        history.append({
            "type": "points",
            "description": t["reason"],
            "points": t["points"],
            "date": t["created_at"]
        })
    for r in redemptions:
        history.append({
            "type": "redemption",
            "description": f"Canjeado: {r['promotion_title']}",
            "points": -r["points_used"],
            "date": r["created_at"],
            "status": r["status"],
            "code": r.get("code", "")
        })

    history.sort(key=lambda x: x["date"], reverse=True)
    return history

# ── Admin routes ────────────────────────────────────────

@api_router.get("/admin/customers")
async def search_customers(q: str = "", user=Depends(get_admin_user)):
    query = {"role": "customer"}
    if q:
        search_term = q.strip()
        query["$or"] = [
            {"name": {"$regex": search_term, "$options": "i"}},
            {"email": {"$regex": search_term, "$options": "i"}}
        ]
    customers = await db.users.find(query, {"_id": 0, "password_hash": 0}).to_list(100)
    return customers

@api_router.get("/admin/users")
async def search_users(q: str = "", user=Depends(get_admin_user)):
    query = {}
    if q:
        search_term = q.strip()
        query["$or"] = [
            {"name": {"$regex": search_term, "$options": "i"}},
            {"email": {"$regex": search_term, "$options": "i"}},
        ]
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).to_list(100)
    return users

@api_router.get("/admin/customer/{user_id}")
async def get_customer(user_id: str, user=Depends(get_admin_user)):
    customer = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@api_router.get("/admin/customer-by-uid/{uid}")
async def get_customer_by_uid(uid: str, user=Depends(get_admin_user)):
    normalized_uid = uid.strip().upper()
    customer = await db.users.find_one(
        {"uid": normalized_uid},
        {"_id": 0, "password_hash": 0},
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@api_router.put("/admin/user/{user_id}")
async def update_user(user_id: str, data: UserAdminUpdate, user=Depends(get_admin_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "email" in update_data:
        update_data["email"] = update_data["email"].strip().lower()

    if "uid" in update_data:
        update_data["uid"] = update_data["uid"].strip().upper() if update_data["uid"] else None

    if "password" in update_data:
        update_data["password_hash"] = hash_password(update_data.pop("password"))

    if update_data.get("club_member") is False and "membership_tier" not in update_data:
        update_data["membership_tier"] = None

    try:
        result = await db.users.update_one({"id": user_id}, {"$set": update_data})
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Email already registered")

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

@api_router.post("/admin/points")
async def add_points(data: AddPointsRequest, user=Depends(get_admin_user)):
    customer = await db.users.find_one({"id": data.user_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    await db.users.update_one({"id": data.user_id}, {"$inc": {"points": data.points}})

    transaction = {
        "id": str(uuid.uuid4()),
        "user_id": data.user_id,
        "user_name": customer["name"],
        "points": data.points,
        "reason": data.reason,
        "admin_id": user["id"],
        "admin_name": user["name"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.point_transactions.insert_one(transaction)

    updated = await db.users.find_one({"id": data.user_id}, {"_id": 0, "password_hash": 0})
    return {"message": "Points added", "customer": updated}

@api_router.post("/admin/promotions")
async def create_promotion(data: PromotionCreate, user=Depends(get_admin_user)):
    promo = {
        "id": str(uuid.uuid4()),
        "title": data.title,
        "description": data.description,
        "points_required": data.points_required,
        "category": data.category,
        "icon": data.icon,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.promotions.insert_one(promo)
    return {
        "id": promo["id"],
        "title": promo["title"],
        "description": promo["description"],
        "points_required": promo["points_required"],
        "category": promo["category"],
        "icon": promo["icon"],
        "is_active": promo["is_active"],
        "created_at": promo["created_at"]
    }

@api_router.put("/admin/promotions/{promo_id}")
async def update_promotion(promo_id: str, data: PromotionUpdate, user=Depends(get_admin_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.promotions.update_one({"id": promo_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Promotion not found")
    promo = await db.promotions.find_one({"id": promo_id}, {"_id": 0})
    return promo

@api_router.delete("/admin/promotions/{promo_id}")
async def delete_promotion(promo_id: str, user=Depends(get_admin_user)):
    result = await db.promotions.update_one({"id": promo_id}, {"$set": {"is_active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Promotion not found")
    return {"message": "Promotion deactivated"}

@api_router.get("/admin/pending-redemptions")
async def get_pending_redemptions(user=Depends(get_admin_user)):
    redemptions = await db.redemptions.find(
        {"status": "pending"}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return redemptions

@api_router.post("/admin/validate/{redemption_id}")
async def validate_redemption(redemption_id: str, user=Depends(get_admin_user)):
    redemption = await db.redemptions.find_one({"id": redemption_id}, {"_id": 0})
    if not redemption:
        raise HTTPException(status_code=404, detail="Redemption not found")
    if redemption["status"] != "pending":
        raise HTTPException(status_code=400, detail="Redemption already processed")
    await db.redemptions.update_one(
        {"id": redemption_id},
        {"$set": {"status": "validated", "validated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Redemption validated"}

@api_router.get("/admin/activity")
async def get_activity(user=Depends(get_admin_user)):
    transactions = await db.point_transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    redemptions = await db.redemptions.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"transactions": transactions, "redemptions": redemptions}

@api_router.get("/admin/stats")
async def get_stats(user=Depends(get_admin_user)):
    total_customers = await db.users.count_documents({"role": "customer"})
    total_points_given = 0
    async for t in db.point_transactions.find({}, {"_id": 0, "points": 1}):
        total_points_given += t.get("points", 0)
    total_redemptions = await db.redemptions.count_documents({})
    pending_redemptions = await db.redemptions.count_documents({"status": "pending"})
    active_promos = await db.promotions.count_documents({"is_active": True})
    return {
        "total_customers": total_customers,
        "total_points_given": total_points_given,
        "total_redemptions": total_redemptions,
        "pending_redemptions": pending_redemptions,
        "active_promos": active_promos
    }



# GUARDAR UID EN USUARIO (emparejar)
@app.post("/api/admin/rfid/assign")
async def assign_rfid(user_id: str = Body(...), uid: str = Body(...), user=Depends(get_admin_user)):
    normalized_uid = uid.strip().upper()

    await db.users.update_one(
        {"id": user_id},
        {"$set": {"uid": normalized_uid}}
    )

    return {"ok": True}


# IDENTIFICAR USUARIO POR UID
@app.post("/api/admin/rfid/identify")
async def identify_rfid(uid: str = Body(...)):
    normalized_uid = uid.strip().upper()

    found_user = await db.users.find_one(
        {"uid": normalized_uid},
        {"_id": 0, "password_hash": 0}
    )

    if not found_user:
        return {"user": None}

    return {
        "user": {
            "id": found_user["id"],
            "name": found_user["name"],
            "points": found_user.get("points", 0)
        }
    }


from fastapi import Body

@app.post("/api/rfid/identify")
async def identify_rfid(uid: str = Body(...)):
    normalized_uid = uid.strip().upper()

    user = await db.users.find_one(
        {"uid": normalized_uid},
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
# ── Seed data ───────────────────────────────────────────

@app.on_event("startup")
async def seed_data():
    await db.users.create_index("id", unique=True)
    await db.users.create_index("email", unique=True)
    await db.users.create_index("uid", unique=True, sparse=True)
    await db.promotions.create_index("id", unique=True)
    await db.redemptions.create_index("id", unique=True)
    await db.redemptions.create_index("user_id")
    await db.redemptions.create_index("status")
    await db.point_transactions.create_index("id", unique=True)
    await db.point_transactions.create_index("user_id")

    if not SEED_DEFAULT_DATA:
        logger.info("Default seed data disabled for APP_ENV=%s", APP_ENV)
        return

    admin = await db.users.find_one({"email": ADMIN_EMAIL})
    if not admin:
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "name": "Admin Esencia",
            "role": "admin",
            "points": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "club_member": False,
            "membership_tier": None,
            "club_waitlist": False,
            "club_waitlist_joined_at": None,
        }
        await db.users.insert_one(admin_user)
        logger.warning("Default admin user created for local/demo use: %s", ADMIN_EMAIL)

    count = await db.promotions.count_documents({})
    if count == 0:
        promos = [
            {
                "id": str(uuid.uuid4()),
                "title": "Café Gratis",
                "description": "Acumula 10 cafés y obtén uno completamente gratis",
                "points_required": 10,
                "category": "coffee",
                "icon": "coffee",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Topping Gratis",
                "description": "8 poffertjes = topping gratis en tu próximo pedido",
                "points_required": 8,
                "category": "food",
                "icon": "gift",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Bebida Especial",
                "description": "Bebida especial del mes con 50% de descuento",
                "points_required": 15,
                "category": "special",
                "icon": "star",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Mini Pancakes Dobles",
                "description": "Porción doble de mini pancakes por el precio de una",
                "points_required": 12,
                "category": "food",
                "icon": "heart",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.promotions.insert_many(promos)
        logger.info("Sample promotions created")

    # Create a demo customer for testing
    demo = await db.users.find_one({"email": DEMO_CUSTOMER_EMAIL})
    if not demo:
        demo_user = {
            "id": str(uuid.uuid4()),
            "email": DEMO_CUSTOMER_EMAIL,
            "password_hash": hash_password(DEMO_CUSTOMER_PASSWORD),
            "name": "María García",
            "role": "customer",
            "points": 15,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "club_member": False,
            "membership_tier": None,
            "club_waitlist": False,
            "club_waitlist_joined_at": None,
        }
        await db.users.insert_one(demo_user)
        logger.warning("Demo customer created for local/demo use: %s", DEMO_CUSTOMER_EMAIL)

# ── App setup ───────────────────────────────────────────

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
