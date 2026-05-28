# Migration Discipline (Alembic)

## Baseline
1. `cd backend`
2. `alembic init alembic` (one-time if not present)
3. Configure `sqlalchemy.url` in `alembic.ini` from env.

## Create migration
- `alembic revision --autogenerate -m "add governance tables"`

## Apply migration
- `alembic upgrade head`

## Rollback
- `alembic downgrade -1`

## Policy
- Disable `AUTO_CREATE_TABLES` in production.
- Every schema change must include migration script in PR.
- CI must run migration lint/check before deploy.
