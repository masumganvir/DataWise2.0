# DataWise AI — Privacy & Multi-Tenant Data Isolation

## 1. Architectural Isolation Overview
DataWise AI enforces complete logical and physical data partitioning across independent tenants. No tenant can view, modify, deduce, or download another tenant's project configurations, dataset samples, training trials, reports, or serialized model artifacts.

---

## 2. Server-Side Enforcement Mechanisms

### 2.1 Identity Resolution
- The caller's identity is resolved solely from cryptographically signed JWT tokens via `get_current_user`.
- Client-supplied `user_id` query parameters or body payloads are completely disregarded when resolving authorization.

### 2.2 Project Authorization Helper (`_verify_project_access`)
Before executing any operation on a project or its downstream artifacts:
```python
async def _verify_project_access(project_id: str, user: Optional[User], db: AsyncSession):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required.")
    
    p = await db.get(Project, project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found.")
        
    is_admin = bool(user.email and user.email.strip().lower() == "masumganvir2006@gmail.com")
    is_owner = (p.user_id == user.id)
    
    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="Forbidden: You do not have access to this project.")
    return p
```

### 2.3 Storage Namespacing
All uploaded datasets and generated ML artifacts are stored under strict ownership-aware paths:
`users/{user_id}/projects/{project_id}/{artifact_type}/{filename}`
Direct downloads are gated behind authentication and ownership verification, ensuring no arbitrary file reads or directory traversal can escape the project workspace.

---

## 3. Database Row-Level Security (PostgreSQL)
In PostgreSQL / Supabase, Row-Level Security (RLS) policies enforce tenant segregation at the database engine level:
```sql
CREATE POLICY "Projects are isolated to owner"
ON public.projects FOR ALL
USING (
  auth.uid() = user_id 
  OR public.is_database_admin()
);
```
Where `public.is_database_admin()` checks that the authenticated JWT email strictly matches `masumganvir2006@gmail.com`.
