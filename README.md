# College Parking Permit System

A staff-and-student parking-permit management system for a college. It grants
or rejects a parking permit based on whether the applicant's college email is
on a predefined, database-backed authorized-user list, and whether the
vehicle and status details they submit are valid and consistent with the
college's own record for them.

## Main features

- Login is restricted to college employees and students whose email appears
  on an authorized-user list stored in the database.
- Registration checks the submitted email against that list server-side; an
  unlisted or deactivated email is rejected with no account created.
- A user's college status (staff or student) is assigned from the
  authorized-user record at registration time — it is never taken from the
  client, so a request cannot self-upgrade its own access.
- Applicants submit vehicle details (plate number, make, model, color, year)
  and a declared college status; the server validates every field and
  cross-checks the declared status against the college's record before
  issuing a permit.
- Every application (approved or rejected) is persisted with a reason,
  giving an audit trail.
- A minimal admin view lists all permit requests and the authorized-user
  list, gated by a database-controlled `isAdmin` flag.
- A small static HTML/CSS/JS frontend exercises the full flow: register,
  log in, apply for a permit, view your permits.

## Application workflow

1. A person registers with their college email and a password.
2. The server looks up that email in the `authorized_users` table (the
   predefined list). If it is missing or has been deactivated, registration
   is rejected and no account is created.
3. If the email is authorized, an account is created with the college
   status (`student`/`staff`) copied from the authorized-user record.
4. The person logs in and receives a JWT.
5. The person submits a permit application: a declared college status plus
   vehicle details (plate number, make, model, color, year).
6. The server re-verifies the caller's authorization is still active,
   validates every field, and checks that the declared status matches the
   status the college actually has on file for that account.
7. If everything checks out, a permit is created with status `approved` and
   a generated permit number and expiry date. Otherwise a permit record is
   still created with status `rejected` and a reason, and no permit number
   is issued.
8. The applicant can view their own permit history; an admin can view all
   permit requests and the authorized-user list.

## Technology stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (>= 18) |
| Web framework | Express 4 |
| ORM / migrations / seeds | Sequelize + sequelize-cli |
| Database | SQLite (file-based; no separate DB server to install). The config also supports pointing Sequelize at Postgres/MySQL for production — see [Database setup](#database-setup-migrations-and-seed-data). |
| Auth | JSON Web Tokens (`jsonwebtoken`) + `bcryptjs` password hashing |
| Validation | `express-validator` |
| Security middleware | `helmet`, `cors`, `express-rate-limit` |
| Frontend | Static HTML/CSS/vanilla JS (no build step), served by Express |
| Tests | Jest + Supertest, against an in-memory SQLite database |
| Package manager | npm |

## Prerequisites

- Node.js 18 or later and npm (bundled with Node).
- No external database server is required for local development or tests —
  SQLite runs as a local file / in-memory.

## Installation

```bash
git clone <your-fork-or-repo-url>
cd college-parking-permit-system
npm install
```

## Environment configuration

Copy the example file and fill in real values for your machine:

```bash
cp .env.example .env
```

`.env` is git-ignored and must never be committed. See `.env.example` for
every variable the app reads, with placeholder values and comments. At a
minimum you must set `JWT_SECRET` to a long random value, for example:

```bash
openssl rand -hex 32
```

## Database setup, migrations, and seed data

The app ships with Sequelize migrations (schema) and a seeder (demo data)
under `database/`.

```bash
# Create/update the schema
npm run db:migrate

# Load demo authorized users (fictional @example.edu accounts) — optional,
# useful for trying the app locally
npm run db:seed

# Roll everything back and reapply from scratch
npm run db:reset
```

By default this creates a local SQLite file at `database/development.sqlite`
(configurable via `DB_STORAGE` in `.env`). Tests never touch this file — they
run against a fresh in-memory SQLite database every run.

**Important — real deployments:** the demo seeder
(`database/seeders/20260101000010-demo-authorized-users.js`) inserts a
handful of fictional people at a fictional `@example.edu` domain purely so
the app is runnable out of the box. Before using this system for real
students/employees, do not seed or keep that demo data — instead populate
`authorized_users` from the college's real registrar/HR export through a
proper, access-controlled admin process (see
[Known limitations](#known-limitations)).

## How to run the application

```bash
# development (auto-restart on change)
npm run dev

# production-style start
npm start
```

By default the server listens on `http://localhost:3000`. The static
frontend is served at `/`, and the API is under `/api`.

## How to run tests

```bash
npm test
```

This runs the Jest + Supertest suite (22 tests) against an isolated,
in-memory SQLite database seeded with a small, fixed set of authorized
users — no `.env` or real database is required to run tests.

Also available:

```bash
npm run lint   # ESLint over src/ and tests/
```

## Example usage

Registering and applying for a permit via the API:

```bash
# 1. Register (only succeeds if the email is on the authorized list)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"carla.student@example.edu","password":"Passw0rd1"}'
# -> { "token": "...", "user": { "email": "...", "role": "student", ... } }

# 2. Apply for a permit using the returned token
curl -X POST http://localhost:3000/api/permits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
        "collegeStatus": "student",
        "vehicle": { "plateNumber": "XYZ-999", "make": "Honda", "model": "Civic", "color": "Red", "year": 2019 }
      }'
# -> { "permit": { "status": "approved", "permitNumber": "STU-2026-XXXXXXXX", ... } }
```

Or open `http://localhost:3000` in a browser and use the login/register/
apply/dashboard forms.

## Project structure

```
.
├── src/
│   ├── app.js                # Express app: middleware, routes, static files
│   ├── server.js              # Entry point: env checks, DB connect, listen
│   ├── config/config.js       # Sequelize-CLI + runtime DB config (env-driven)
│   ├── models/                 # Sequelize models (AuthorizedUser, User, Vehicle, Permit)
│   ├── middleware/             # auth (JWT + re-authorization), validation, error handling
│   ├── controllers/            # Route handlers (business logic)
│   ├── routes/                 # Express routers
│   └── validators/             # express-validator rule sets
├── database/
│   ├── migrations/             # Schema migrations (sequelize-cli)
│   └── seeders/                # Demo authorized-user seed data
├── public/                     # Static frontend (HTML/CSS/vanilla JS)
├── tests/                      # Jest + Supertest test suite
├── .env.example                # Documented environment variables (no secrets)
├── .sequelizerc                # Points sequelize-cli at src/database paths above
└── jest.config.js
```

## Security and privacy notes

- **Authorization is enforced server-side.** Whether an email is authorized,
  what a user's college status is, and whether a permit is approved are all
  decided in `src/controllers` and `src/middleware/auth.js` from database
  state, never from client-submitted fields. The frontend's own validation
  (`public/js/app.js`) is a UX convenience only; every rule it mirrors is
  re-checked by the API.
- **Authorization is re-checked on every authenticated request**, not just
  at login: `requireAuth` reloads the user and their `AuthorizedUser` record
  on each call, so revoking someone's access takes effect immediately even
  if they still hold a valid JWT.
- **Role/status cannot be self-assigned.** `role` and `isAdmin` are set from
  the `AuthorizedUser` record at registration and are ignored if present in
  the request body (see the test `ignores a client-supplied role/isAdmin...`
  in `tests/auth.test.js`).
- **Passwords** are hashed with bcrypt (`BCRYPT_SALT_ROUNDS`, default 12)
  and never stored or logged in plaintext.
- **Generic error messages** are used for login failures and for an
  unauthorized/duplicate registration attempt where useful, to avoid
  confirming which emails exist in the system.
- **Rate limiting** (`express-rate-limit`) is applied to `/api/auth/*` to
  slow down credential-guessing and registration spam.
- **Security headers** (`helmet`) and a configurable **CORS** origin are
  applied to every response.
- **No secrets are committed.** `.env` is git-ignored; `.env.example`
  contains only placeholders. The seeded "authorized users" are fictional
  people at a fictional `@example.edu` domain — replace this data before any
  real use (see below).
- **If you deploy this for real students/employees**, treat
  `authorized_users`, `users`, and `vehicles` as personal data: restrict
  database access, use TLS in front of the API, rotate `JWT_SECRET`,
  set a real `CORS_ORIGIN`, and put the real authorized-user import behind
  an access-controlled admin process rather than the demo seeder.

## Known limitations

- There is no self-service or admin-facing UI to add/remove
  `authorized_users` entries — the list is currently managed only through
  migrations/seeders or direct database access. A real deployment should
  add an access-controlled admin workflow for this.
- There is no built-in way to promote a user to admin (`isAdmin`) other than
  a direct database update. This is intentional (it must not be
  self-service) but currently has no admin UI either.
- Permit applications are not rate-limited or de-duplicated — a user can
  submit multiple applications and accumulate multiple approved permits.
  A real deployment would likely want a "one active permit per vehicle/
  user" rule.
- Password reset / email verification / MFA are not implemented.
- The frontend is intentionally minimal (no framework, no build step) to
  keep the reference implementation easy to audit; production styling and
  UX would need more work.
- SQLite is used for simplicity; for concurrent production workloads,
  point `config/config.js`'s `production` block at Postgres/MySQL via the
  `DB_*` environment variables (already wired up, just unused by default).

## License

No license has been added yet — the repository owner has not selected one.
Until a license is added, all rights are reserved by default and this code
should not be reused without asking the owner.
