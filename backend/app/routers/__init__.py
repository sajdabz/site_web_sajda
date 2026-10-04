from app.routers.auth import router as auth_router
from app.routers.subjects import router as subjects_router
from app.routers.resources import router as resources_router
from app.routers.quizzes import router as quizzes_router
from app.routers.admin import router as admin_router

__all__ = [
    "auth_router",
    "subjects_router",
    "resources_router",
    "quizzes_router",
    "admin_router"
]
