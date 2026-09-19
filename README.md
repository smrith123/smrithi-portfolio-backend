# Smrithi Portfolio · Backend

REST API, database, authentication and media handling for the Smrithi portfolio.
It serves the public website (`smrithi-portfolio-frontend`, port 3000) and the
admin panel (`smrithi-portfolio-admin`, port 3001).

## Running it

```bash
cp .env.example .env     # then fill in MONGODB_URL, the CLOUDINARY_* keys, JWT_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD
npm install
npm run seed             # creates the admin account and loads the current site content
npm run dev              # http://localhost:5000
```

`npm run seed` copies the client's images out of the frontend's `public/assets`
into the media library and fills every section with the content the site shipped
with, so the API returns exactly what the static frontend rendered. It is safe to
re-run: existing sections are left alone unless you pass `-- --force`.

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server with reload |
| `npm run build` / `npm start` | Compile to `dist/` and run it |
| `npm run seed` | Create the admin user and the initial content |
| `npm run migrate:media` | One-off: move any leftover `./uploads` files to Cloudinary and rewrite the stored URLs |
| `npm run migrate:platform-headings` | One-off: give each platform its own small label and heading, copied from the old shared pair. Add `-- --dry-run` to preview. Already applied to the Atlas database; run it once on any other database restored from before 2026-09-18 |
| `npm test` | Content schema and filename tests |
| `npm run typecheck` | Types only |

## Environment

| Variable | Notes |
| --- | --- |
| `PORT` | Defaults to 5000 |
| `NODE_ENV` | `development`, `test` or `production`. `production` on Render: internal error messages are hidden and `CORS_ORIGIN` becomes required |
| `MONGODB_URL` | MongoDB Atlas connection string, **including the database name** in the path — without it Mongoose connects to `test`. Required |
| `JWT_SECRET` | At least 32 characters; the `.env.example` placeholder is refused. Required. Changing it signs everyone out. Generate with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `JWT_EXPIRES_IN` | Session length, default `7d` |
| `FROM_NAME` | Name shown on password-reset messages |
| `CORS_ORIGIN` | The public site's and the admin's origins, exact, comma-separated (a trailing slash is tolerated). Required in production. Other origins get no CORS headers, so browsers block them |
| `FRONTEND_URL`, `ADMIN_URL` | Informational only, not read by the API |
| `OTP_CONSOLE_FALLBACK` | While `true`, password-reset codes print to the server log instead of being emailed |
| `PUBLIC_API_URL` | Absolute URL the API is reachable at |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Media host. All three required — the server refuses to boot without them |
| `MAX_UPLOAD_MB` | Largest upload request (all files together), default 100. Larger requests are refused before they are read. Cloudinary's free plan also caps images and PDFs at 10MB and video at 100MB |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Used once, by `npm run seed`, which refuses to run without a password of 8+ characters. Not needed on Render |

## Structure

```
src/
  config/      environment validation, database connection
  content/     the section schemas and the site's initial content
  models/      Section, Media, ContactSubmission, AdminUser
  services/    content, media and auth logic
  controllers/ request handling
  routes/      public, auth and admin routers
  middleware/  auth, uploads, rate limiting, errors
  lib/         storage and error helpers
```

### Why one `Section` model

Every editable block of the site is one document in `sections`, keyed by name
(`home.hero`, `works.self-content`, ...). Its shape is guaranteed by that key's
zod schema in `src/content/schemas.ts`, which mirrors the frontend's
`src/types/content.ts` exactly. Adding an editable field means adding it to that
schema and to the admin form, and nothing else. Media, contact submissions and
the admin account have their own collections because they have their own
lifecycles.

## API

Public, no authentication:

| Method | Path | Returns |
| --- | --- | --- |
| `GET` | `/api/health` | `200` with `db: "connected"`, or `503` while the database is unreachable. Render's health check |
| `GET` | `/api/public/home` | The whole home page, shaped like the frontend's `HomeContent` |
| `GET` | `/api/public/content-page` | The `/content` split page |
| `GET` | `/api/public/works/:slug` | `professional-work` or `self-content` |
| `POST` | `/api/public/contact` | Stores a contact form submission. Five per hour per IP |

Authentication:

| Method | Path | |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Returns a JWT |
| `POST` | `/api/auth/forgot-password` | Sends a six digit code |
| `POST` | `/api/auth/reset-password` | Sets a new password with that code |
| `GET` | `/api/auth/me` | The signed-in admin |
| `POST` | `/api/auth/change-password` | Change a known password. Returns a fresh token; every other session is signed out |

Admin, bearer token required on all of them:

| Method | Path | |
| --- | --- | --- |
| `GET` | `/api/admin/overview` | Dashboard counts and recent messages |
| `GET` | `/api/admin/sections` | Every section and when it was last edited |
| `GET` `PUT` | `/api/admin/sections/:key` | Read and replace one section |
| `GET` `POST` | `/api/admin/media` | List and upload files |
| `PATCH` `DELETE` | `/api/admin/media/:id` | Alt text, delete |
| `GET` | `/api/admin/submissions` | Filter by `status`, search with `q` |
| `PATCH` `DELETE` | `/api/admin/submissions/:id` | Change status, delete |

Uploaded files are served by Cloudinary, not by this API.

## Media storage

Uploads go straight to Cloudinary from memory and the absolute `secure_url` is
what gets stored on the media document and inside the section content. Everything
that talks to Cloudinary is in `src/lib/storage.ts` — two signed REST calls, no
SDK — so moving to S3 means reimplementing `saveFile` and `deleteFile` and
nothing else.

Uploads go to the upload endpoint for the file's type (`image`, `video` or `raw`), so a file whose content does not match its declared type is refused by Cloudinary.

`deleteFile` needs the file's mime type as well as its key: Cloudinary keeps
PDFs under the `image` resource type and only video under `video`, and a destroy
with the wrong resource type silently does nothing.

Nothing is written to the API server's disk any more, so the API is free to run
on a host with an ephemeral filesystem.

## Deploying to Render

`render.yaml` is a Render Blueprint for this API (Dashboard → Blueprints → New
Blueprint Instance). To set the service up by hand instead, use the same values:

| Setting | Value |
| --- | --- |
| Runtime | Node, version from `engines` (24.x) |
| Build command | `npm ci --include=dev && npm run build`. TypeScript is a dev dependency and `NODE_ENV=production` would otherwise skip it |
| Start command | `npm start` |
| Health check path | `/api/health` |
| Instance | Free sleeps after 15 idle minutes and takes about a minute to wake. Starter stays awake |

Environment: `NODE_ENV=production`, `MONGODB_URL`, `JWT_SECRET`, `CORS_ORIGIN`,
`PUBLIC_API_URL` and the three `CLOUDINARY_*` keys. The Blueprint generates
`JWT_SECRET` and asks for the rest.

Before the first deploy:

- MongoDB Atlas → Network Access must allow the service's outbound IP ranges
  (Render dashboard → the service → Connect → Outbound), or `0.0.0.0/0`, which
  leaves the database user's password as the only protection.
- Cloudinary → Settings → Security → "Allow delivery of PDF and ZIP files" must
  be on, or the CV link returns 401.
- The Atlas database is already seeded. Only run `npm run seed` against a new,
  empty database.

Password-reset codes are written to the Render log while
`OTP_CONSOLE_FALLBACK=true`. Failed sign-ins are logged as
`[auth] failed sign-in for <email> from <ip>`.
