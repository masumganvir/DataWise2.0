"""
DataWise AI — Clerk Authentication & Database Persistence Verification Tests
"""

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select

from main import app
from app.db.session import init_db, AsyncSessionLocal
from app.db.models.entities import User, UserSession, AuditLog
from app.auth.security import decode_access_token, create_access_token


@pytest.fixture(autouse=True)
async def prepare_database():
    await init_db()


@pytest.mark.asyncio
async def test_seed_users_persisted():
    """Verify default demo and workspace users exist in the database."""
    async with AsyncSessionLocal() as session:
        # Check usr_demo_workspace
        q1 = await session.execute(select(User).where(User.id == "usr_demo_workspace"))
        u1 = q1.scalar_one_or_none()
        assert u1 is not None
        assert u1.email == "demo@datawise.ai"
        assert u1.is_active is True

        # Check demo scientist
        q2 = await session.execute(select(User).where(User.email == "demo.scientist@gmail.com"))
        u2 = q2.scalar_one_or_none()
        assert u2 is not None
        assert u2.name == "Dr. Elena Vance"


@pytest.mark.asyncio
async def test_clerk_sync_creates_database_records():
    """Verify /api/auth/clerk/sync creates User, UserSession, and AuditLog records in database."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        clerk_id = "user_2clerk_test_suite_999"
        email = "clerk.researcher@example.com"
        avatar = "https://img.clerk.com/test_avatar.png"

        response = await client.post(
            "/api/auth/clerk/sync",
            json={
                "id": clerk_id,
                "email": email,
                "name": "Prof. Clerk Researcher",
                "avatar_url": avatar,
            },
            headers={"Authorization": "Bearer test-clerk-token"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["id"] == clerk_id
        assert data["user"]["email"] == email

        # Verify in DB directly
        async with AsyncSessionLocal() as session:
            # 1. User table
            uq = await session.execute(select(User).where(User.id == clerk_id))
            db_user = uq.scalar_one_or_none()
            assert db_user is not None
            assert db_user.email == email
            assert db_user.name == "Prof. Clerk Researcher"
            assert db_user.avatar_url == avatar

            # 2. UserSession table
            sq = await session.execute(select(UserSession).where(UserSession.user_id == clerk_id))
            db_session = sq.scalars().first()
            assert db_session is not None
            assert db_session.token_hash is not None

            # 3. AuditLog table
            aq = await session.execute(
                select(AuditLog).where(AuditLog.user_id == clerk_id, AuditLog.resource_type == "clerk_auth")
            )
            db_audit = aq.scalars().first()
            assert db_audit is not None
            assert db_audit.action == "login"


@pytest.mark.asyncio
async def test_decode_access_token_clerk():
    """Verify Clerk session token decoding."""
    from jose import jwt
    clerk_token = jwt.encode(
        {"sub": "user_2clerk_jwt_test", "email": "clerk_direct@test.ai", "name": "Direct Clerk User", "iss": "https://clerk.accounts.dev"},
        "dummy_key",
        algorithm="HS256"
    )
    payload = decode_access_token(clerk_token)
    assert payload is not None
    assert payload["sub"] == "user_2clerk_jwt_test"
    assert payload["clerk"] is True
