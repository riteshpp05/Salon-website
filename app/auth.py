"""
app/auth.py
-----------
Shared authentication dependency used by all admin-only API routes.

Usage:
    from app.auth import require_admin_api

    @router.delete("/api/services/{id}")
    def remove_service(service_id: int, _=Depends(require_admin_api)):
        ...
"""
from fastapi import Depends, HTTPException, Request, status


def require_admin_api(request: Request) -> None:
    """
    FastAPI dependency that protects admin-only API endpoints.

    - Checks the signed session cookie set by SessionMiddleware.
    - Raises HTTP 401 if the admin has not authenticated.
    - Does NOT redirect (returns JSON so it works cleanly with fetch/XHR).
    """
    if not request.session.get("admin_logged_in"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "Authentication required. "
                "Please log in at /admin/login to perform this action."
            ),
        )
