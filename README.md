# Project 3: Authentication, Server State, and Mutations

## Prerequisites
- Node.js LTS (>= 18), npm (>= 9)
- MongoDB on `127.0.0.1`

## Overview
- TanStack Query for server state (`useQuery` / `useMutation`)
- Express sessions + **bcrypt** (`password_digest` on `User`; never store plain passwords)
- Login, logout, registration, and commenting on photos
- Git/GitHub workflow per course spec (feature branches, PRs)

## Setup
```bash
npm install
cd test && npm install && cd ..
```

Copy your working Project 2 app into this tree if you are merging starter files from the course zip.

**Database name:** `mongodb://127.0.0.1/project3` in `webServer.js` and `loadDatabase.js`.

```bash
node loadDatabase.js
```

### Seeded passwords
`loadDatabase.js` stores a fixed bcrypt digest for every demo user. That digest is the common test vector that verifies against the plaintext **`password`** (not the string `weak`). Use **`password`** when logging in as seeded users (e.g. `login_name` `took`, password `password`). Your own registrations still choose any password; those are hashed with bcrypt on the server.

## Run
```bash
npm run server   # Express, port 3001
npm run client   # Vite, port 3000
# or
npm run dev
```

## API (course contract)
| Method | Path | Auth |
|--------|------|------|
| POST | `/admin/login` | no |
| POST | `/admin/logout` | yes (400 if not logged in) |
| POST | `/user` | no (registration) |
| GET | `/user/list` | yes |
| GET | `/user/:id` | yes |
| GET | `/photosOfUser/:id` | yes |
| POST | `/commentsOfPhoto/:photoId` | yes |

Optional for the UI: `GET /admin/me` returning the session user (not required by the bundled tests).

## Testing
Reset DB, start the server on port 3001, then:
```bash
cd test
npm install
npm test
```

Tests assume **only** data from `loadDatabase.js`. No `/test/info` or `/test/count` routes are required or tested.

## Lint
```bash
npm run lint
```

## Style (course)
- MVC-style split (routes/controllers/models), thin `webServer.js`
- Central frontend API module (e.g. `api.js`)
- ESLint clean; remove or disable React Query Devtools before submit
