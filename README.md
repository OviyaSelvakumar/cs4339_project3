# Project 4: Deployment, DevOps, and Production Integration

## Prerequisites
- Node.js LTS (>= 18), npm (>= 9)

## Overview
- Backend migrated to MongoDB Atlas
- Photo upload with Cloudinary
- Like and unlike photos when user is logged in
- Containerization with Docker
- CI/CD with GitHub Actions
- Deployed system
- Git/GitHub workflow per course spec (feature branches, PRs)

## Deployed Links
| Type | URL |
|--------|------|
| Frontend | [lorem.com](lorem.com) |
| Backend | [lorem.com](lorem.com) |

### Setup
```bash
npm install
cd test && npm install && cd ..
```

```bash
node loadDatabase.js
```

### Run
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
| POST | `/photos` | yes |
| POST | `/photos/:photoId/like` | yes |

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
