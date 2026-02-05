from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def get_admin_stats():
    return {"message": "Admin endpoint"}
