from fastapi import APIRouter
from app.api.routes import auth_routes, admin_routes

api_router = APIRouter()
api_router.include_router(auth_routes.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(admin_routes.router, prefix="/admin", tags=["Admin"])
