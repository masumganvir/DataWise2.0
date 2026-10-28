# DataWise AI — Engineering Improvement Backlog

This backlog tracks architectural enhancements, future optimization opportunities, and operational hardening recommendations.

---

## 1. High Priority (P1)
- [x] **Exclusive Database Admin Constraint**: Bound super-admin privileges and database bypass strictly to `masumganvir2006@gmail.com`.
- [x] **BOLA Elimination**: Implemented strict tenant checks on project and artifact retrieval routes.
- [x] **Production Demo Token Ban**: Hardened authentication so demo tokens cannot be abused in production.
- [ ] **Automated Daily DB Backup Scheduler**: Implement a standing pg_dump cron job targeting private S3 buckets with AES-256 encryption.

---

## 2. Medium Priority (P2)
- [x] **SSRF Protection on LLM Endpoints**: Whitelisted loopback addresses for Ollama.
- [x] **Thread-Safe Event Streaming**: Dispatched trial events using `asyncio.run_coroutine_threadsafe`.
- [ ] **WebSocket Heartbeat Reconnection**: Add exponential backoff reconnection logic in `useWebSocket.ts` if proxy terminates idle connections.

---

## 3. Low Priority (P3)
- [x] **TypeScript Interface Resiliency**: Expanded model comparison types to handle descriptive speed and overfit metrics.
- [ ] **Dark Mode Contrast Polish**: Audit WCAG AAA contrast ratio on high-density telemetry data tables.
