from fastapi import APIRouter
from app.api.routes import auth_routes, admin_routes, catalog_routes, rfq_routes, pool_routes

api_router = APIRouter()
api_router.include_router(auth_routes.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(admin_routes.router, prefix="/admin", tags=["Admin"])
api_router.include_router(catalog_routes.router, prefix="/catalog", tags=["Catalog"])
api_router.include_router(rfq_routes.router)
api_router.include_router(pool_routes.router)
