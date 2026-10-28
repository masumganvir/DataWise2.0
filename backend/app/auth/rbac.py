"""DataWise AI — Role-Based Access Control (RBAC) & Dependencies

Roles:
  - owner: full administrative access
  - admin: project and user management
  - developer: workflow execution, code and model access
  - data_scientist: dataset exploration, training, tuning, evaluation
  - viewer: read-only access to datasets, reports, metrics

Permissions:
  - dataset.read, dataset.write
  - experiment.run
  - model.read, model.train, model.promote
  - deployment.create, deployment.manage
  - audit.read
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.security import decode_access_token
from app.db.models.entities import User
from app.db.session import get_db

security_scheme = HTTPBearer(auto_error=False)

ROLE_PERMISSIONS: dict[str, set[str]] = {
    "owner": {
        "dataset.read", "dataset.write", "experiment.run",
        "model.read", "model.train", "model.promote",
        "deployment.create", "deployment.manage", "audit.read", "admin.manage",
    },
    "admin": {
        "dataset.read", "dataset.write", "experiment.run",
        "model.read", "model.train", "model.promote",
        "deployment.create", "deployment.manage", "audit.read",
    },
    "developer": {
        "dataset.read", "dataset.write", "experiment.run",
        "model.read", "model.train", "deployment.create",
    },
    "data_scientist": {
        "dataset.read", "dataset.write", "experiment.run",
        "model.read", "model.train", "model.promote",
    },
    "viewer": {
        "dataset.read", "model.read",
    },
}


SUPER_ADMIN_EMAIL = "masumganvir2006@gmail.com"


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Retrieve authenticated user from JWT bearer token."""
    if not credentials:
        return None

    token = credentials.credentials
    if token in ("demo-token", "test-token", "dev-token", "demo-token-no-real-auth"):
        from app.config.settings import get_settings
        _current_settings = get_settings()
        if _current_settings.is_production or _current_settings.app_env == "production":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Development demo tokens are strictly disabled in production environments.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return User(
            id="usr_demo_workspace",
            email="demo@datawise.ai",
            name="Data Science Engineer",
            password_hash="demo_hash",
            role="data_scientist",
            status="active",
            is_active=True,
        )

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing subject identifier.",
        )

    try:
        stmt = select(User).where(User.id == user_id, User.is_active.is_(True))
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
    except Exception as db_err:
        user = None

    if not user:
        email = payload.get("email") or f"{user_id}@datalab.ai"
        user = User(
            id=user_id,
            email=email,
            name=payload.get("name") or email.split("@")[0],
            password_hash="jwt_authenticated",
            role=payload.get("role") or "data_scientist",
            status="active",
            is_active=True,
        )

    # Security rule: Only masumganvir2006@gmail.com can possess administrative authority
    if user and user.role in ("admin", "owner"):
        if not user.email or user.email.strip().lower() != SUPER_ADMIN_EMAIL.lower():
            user.role = "data_scientist"

    return user


async def require_authenticated_user(
    user: Optional[User] = Depends(get_current_user),
) -> User:
    """Enforce strict authentication: raises HTTP 401 Unauthorized if no valid credentials provided."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def require_admin(
    user: User = Depends(require_authenticated_user),
) -> User:
    """
    Enforce super-admin database and platform administration access.
    Strictly verifies that the requester is the authorized administrator: masumganvir2006@gmail.com.
    """
    if not user.email or user.email.strip().lower() != SUPER_ADMIN_EMAIL.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Database administration and system management is strictly restricted to masumganvir2006@gmail.com.",
        )
    return user


def require_permission(required_perm: str):
    """Dependency factory enforcing granular RBAC permissions."""
    async def permission_checker(user: Optional[User] = Depends(get_current_user)) -> User:
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required for this operation.",
            )

        # Non-super-admins cannot exercise admin.manage
        if required_perm == "admin.manage" and (not user.email or user.email.strip().lower() != SUPER_ADMIN_EMAIL.lower()):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Administrative privileges reserved for masumganvir2006@gmail.com.",
            )

        user_role = user.role or "viewer"
        granted_perms = ROLE_PERMISSIONS.get(user_role, set())

        is_super_admin = bool(user.email and user.email.strip().lower() == SUPER_ADMIN_EMAIL.lower())
        if required_perm not in granted_perms and not (is_super_admin and "admin.manage" in granted_perms):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Missing required permission: '{required_perm}'.",
            )

        return user

    return permission_checker

