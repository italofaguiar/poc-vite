from datetime import datetime, timedelta

from fastapi import APIRouter, Cookie, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_user_from_session
from app.database import get_db
from app.models import User

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

COOKIE_NAME = "session_id"


def get_current_user_dependency(
    db: Session = Depends(get_db),
    session_id: str | None = Cookie(None, alias=COOKIE_NAME)
) -> User:
    """
    Dependency to get current authenticated user.
    Raises HTTPException if not authenticated.
    """
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_id = get_user_from_session(session_id)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


@router.get("/data")
def get_dashboard_data(current_user: User = Depends(get_current_user_dependency)):
    """
    Get dashboard data (protected endpoint).

    Returns dummy data for charts and tables.

    Args:
        current_user: Current authenticated user (from dependency)

    Returns:
        Dashboard data with chart and table information
    """
    # Generate dummy chart data (last 7 days)
    chart_data = []
    today = datetime.now()
    for i in range(7):
        date = today - timedelta(days=6-i)
        chart_data.append({
            "date": date.strftime("%Y-%m-%d"),
            "value": 100 + (i * 50) + ((i % 2) * 30)  # Dummy values
        })

    # Generate dummy table data
    table_data = [
        {
            "id": 1,
            "nome": "Produto A",
            "status": "Ativo",
            "valor": 1250.00
        },
        {
            "id": 2,
            "nome": "Produto B",
            "status": "Pendente",
            "valor": 890.50
        },
        {
            "id": 3,
            "nome": "Produto C",
            "status": "Ativo",
            "valor": 2100.75
        },
        {
            "id": 4,
            "nome": "Produto D",
            "status": "Inativo",
            "valor": 450.00
        },
        {
            "id": 5,
            "nome": "Produto E",
            "status": "Ativo",
            "valor": 3200.00
        }
    ]

    return {
        "user_email": current_user.email,
        "chart_data": chart_data,
        "table_data": table_data
    }
