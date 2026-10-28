# DataWise AI — Rollback & Disaster Recovery Procedures

## 1. Rollback Procedure (Zero Downtime)
If a release causes critical functional regression or database connection failures:

### 1.1 Application Layer Rollback
1. Re-point load balancer / reverse proxy to previous stable container tag or green environment.
2. In Docker Swarm / Kubernetes:
   ```bash
   kubectl rollout undo deployment/datawise-backend
   ```
3. In local/virtual machine:
   ```bash
   git checkout <last-stable-commit-tag>
   pip install -r requirements.txt
   systemctl restart datawise-backend
   ```

### 1.2 Frontend Rollback
1. Re-deploy the previously built `dist/` directory or promote previous deployment in Vercel / CloudFront.

### 1.3 Database Schema Recovery
1. Database migrations in DataWise AI are non-destructive (adding tables, indexes, or security definer functions).
2. If RLS policies need reversion, re-apply the snapshot backup created prior to deployment.
3. Supabase daily point-in-time recovery (PITR) allows restoration to any second within the retention window.

---

## 2. Disaster Recovery Protocol
1. **RTO (Recovery Time Objective)**: < 15 minutes.
2. **RPO (Recovery Point Objective)**: < 1 hour (backed by write-ahead logs and hourly database dumps).
3. **Storage Failover**: Artifacts in object storage utilize versioning and cross-region replication.
