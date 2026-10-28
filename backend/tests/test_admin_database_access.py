"""
DataWise AI — Admin & Database Isolation Security Tests
Tests the mandatory requirement:
- Admin and database administrative access is strictly restricted to masumganvir2006@gmail.com.
- No other user, even if claiming 'admin' role in JWT or payload, can access administrative endpoints or bypass project isolation.
- Unauthenticated requests receive HTTP 401.
- Non-admin users attempting administrative actions receive HTTP 403.
"""

import pytest
from fastapi.security import HTTPAuthorizationCredentials
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import SUPER_ADMIN_EMAIL, get_current_user, require_admin
from app.auth.security import create_access_token
from app.db.models.entities import User, Project


@pytest.mark.asyncio
async def test_super_admin_email_constant():
    """Verify the non-negotiable super admin identity."""
    assert SUPER_ADMIN_EMAIL == "masumganvir2006@gmail.com"


@pytest.mark.asyncio
async def test_admin_settings_access_restricted_to_super_admin(client: AsyncClient, db_session: AsyncSession):
    """
    Test that GET and POST /api/settings:
    - Allows masumganvir2006@gmail.com
    - Rejects any other user with 403 Forbidden
    - Rejects unauthenticated requests with 401 Unauthorized
    """
    # 1. Unauthenticated request to POST /api/settings -> 401
    unauth_resp = await client.post("/api/settings", json={"openai_api_key": "sk-fake-key"})
    assert unauth_resp.status_code in (401, 403)

    # 2. Regular user (alice@gmail.com)
    alice_token = create_access_token({
        "sub": "usr_alice_123",
        "email": "alice@gmail.com",
        "role": "data_scientist"
    })
    alice_post = await client.post(
        "/api/settings",
        json={"openai_api_key": "sk-fake-key"},
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    assert alice_post.status_code == 403
    assert "masumganvir2006@gmail.com" in alice_post.json()["detail"] or "Forbidden" in alice_post.json()["detail"]

    # 3. Attacker trying to claim 'admin' role with non-admin email
    impostor_token = create_access_token({
        "sub": "usr_hacker_999",
        "email": "hacker_impostor@gmail.com",
        "role": "admin"
    })
    impostor_post = await client.post(
        "/api/settings",
        json={"openai_api_key": "sk-stolen-key"},
        headers={"Authorization": f"Bearer {impostor_token}"}
    )
    assert impostor_post.status_code == 403
    assert "masumganvir2006@gmail.com" in impostor_post.json()["detail"]

    # 4. Super Admin (masumganvir2006@gmail.com) succeeds
    admin_token = create_access_token({
        "sub": "usr_superadmin_001",
        "email": "masumganvir2006@gmail.com",
        "role": "admin"
    })
    admin_post = await client.post(
        "/api/settings",
        json={"active_llm_provider": "openai"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert admin_post.status_code == 200
    assert admin_post.json()["status"] == "success"

    # Admin GET settings returns full unredacted settings
    admin_get = await client.get(
        "/api/settings",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert admin_get.status_code == 200
    assert "tokens" in admin_get.json()


@pytest.mark.asyncio
async def test_rbac_downgrades_unauthorized_admin_role(db_session: AsyncSession):
    """Verify RBAC automatically downgrades unauthorized admin role in get_current_user."""
    impostor_payload = {
        "sub": "usr_fake_admin",
        "email": "somebody_else@gmail.com",
        "role": "admin"
    }
    impostor_token = create_access_token(impostor_payload)
    creds_impostor = HTTPAuthorizationCredentials(scheme="Bearer", credentials=impostor_token)
    user = await get_current_user(credentials=creds_impostor, db=db_session)
    assert user.role == "data_scientist"

    admin_payload = {
        "sub": "usr_masum",
        "email": "masumganvir2006@gmail.com",
        "role": "admin"
    }
    admin_token = create_access_token(admin_payload)
    creds_admin = HTTPAuthorizationCredentials(scheme="Bearer", credentials=admin_token)
    admin_user = await get_current_user(credentials=creds_admin, db=db_session)
    assert admin_user.role == "admin"


@pytest.mark.asyncio
async def test_admin_cross_tenant_project_oversight(client: AsyncClient, db_session: AsyncSession):
    """
    Verify that:
    - Normal user A cannot view Project B (403 Forbidden).
    - Database Super Admin (masumganvir2006@gmail.com) has authorized oversight.
    """
    # Register regular user A
    user_a = User(
        id="usr_tenant_a",
        email="tenant_a@gmail.com",
        name="Tenant A",
        role="data_scientist",
        password_hash="secure_hash",
        status="active",
        is_active=True
    )
    db_session.add(user_a)

    # User A's project
    proj_a = Project(
        id="proj_secret_a",
        name="Confidential Medical ML",
        user_id="usr_tenant_a",
        description="Private Research"
    )
    db_session.add(proj_a)
    await db_session.commit()

    # User B token (another tenant)
    user_b_token = create_access_token({
        "sub": "usr_tenant_b",
        "email": "tenant_b@gmail.com",
        "role": "data_scientist"
    })

    # User B attempts to access User A's project -> 403 Forbidden
    res_b = await client.get(
        "/api/projects/proj_secret_a",
        headers={"Authorization": f"Bearer {user_b_token}"}
    )
    assert res_b.status_code == 403

    # Super Admin accesses Project A -> 200 OK
    admin_token = create_access_token({
        "sub": "usr_admin_masum",
        "email": "masumganvir2006@gmail.com",
        "role": "admin"
    })
    res_admin = await client.get(
        "/api/projects/proj_secret_a",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_admin.status_code == 200
    assert res_admin.json()["id"] == "proj_secret_a"
