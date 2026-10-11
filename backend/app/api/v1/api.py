from fastapi import APIRouter
from app.api.v1.endpoints import auth, cases, search, draft, admin

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & RBAC"])
api_router.include_router(cases.router, prefix="/cases", tags=["Case Repository & Cryptographic Verification"])
api_router.include_router(search.router, prefix="/search", tags=["Legal Search & Precedent Matching"])
api_router.include_router(draft.router, prefix="/draft", tags=["AI Draft Assistant"])
api_router.include_router(admin.router, prefix="/admin", tags=["Court Staff Administration & Audit"])
