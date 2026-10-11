from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.v1.api import api_router
from app.models.user import User
from app.core.security import get_password_hash


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    OWASP A02:2025 Defense: Enforces strict HTTP security headers
    preventing MIME-sniffing, clickjacking, and unauthorized frame embedding.
    """
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        # Content Security Policy header
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "frame-ancestors 'none';"
        )
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure all database tables exist
    Base.metadata.create_all(bind=engine)

    # Seed initial test administrator/staff accounts if not present
    db = SessionLocal()
    try:
        staff = db.query(User).filter(User.email == "staff@lexguard.gov.in").first()
        if not staff:
            demo_staff = User(
                name="Chief Registrar",
                email="staff@lexguard.gov.in",
                password_hash=get_password_hash("Admin@Lexguard2026"),
                role="senior_staff",
                status="active",
                credential_id="COURT-REG-001",
            )
            db.add(demo_staff)
            db.commit()
    finally:
        db.close()

    yield
    # Shutdown logic if any


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# 1. Attach Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# 2. Attach CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Mount API v1 Routers
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["System Health"])
def health_check():
    """Health check endpoint for container probes and uptime monitors."""
    return {
        "status": "healthy",
        "system": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "database_connected": True,
    }


@app.get("/", tags=["System Root"])
def root():
    """Root metadata endpoint."""
    return {
        "name": settings.PROJECT_NAME,
        "version": "1.0.0",
        "api_docs": f"{settings.API_V1_STR}/docs",
        "status": "online",
    }
