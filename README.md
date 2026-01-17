# Cat99

Cat99 is a Next.js app for CAT exam prep. It combines a chat coach, practice games, and structured notes in one workspace.

## Highlights

- Chat coaching with tool-driven responses and structured JSON output
- Practice games with hints, scoring, and session stats
- Notes and rich editor for revision material
- Firebase-backed auth and storage with in-memory fallback
- Cloudinary uploads with optional OCR for images

## Tech stack

- Next.js App Router, React 19, TypeScript
- Tailwind CSS, Radix UI, framer-motion
- Lexical editor
- Firebase Admin SDK, Cloudinary

## Local development

1. Install deps: `npm install`
2. Create `.env.local` with the variables below
3. Run: `npm run dev`

## Environment variables

Required for full functionality:

- `FIREBASE_SERVICE_ACCOUNT_BASE64` - Base64-encoded Firebase service account JSON
- `NEXT_PUBLIC_FIREBASE_WEB_API_KEY` - Firebase Web API key for auth endpoints
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

Optional:

- `CLOUDINARY_OCR_ENABLED` - Set to `true` to enable OCR on uploads
- `NEXT_PUBLIC_ENABLE_GAME_CLOUD_SYNC` - Set to `0` to force local-only game storage

## Scripts

- `npm run dev` - Start local dev server
- `npm run build` - Build for production
- `npm run start` - Run the production build
- `npm run lint` - Lint
- `npm run format` - Prettier check

## Project structure

- `src/app` - Routes, layouts, API handlers
- `src/components` - App and UI components
- `src/constants` - Static maps and labels
- `src/games` - Game engines, generators, evaluators, UI
- `src/hooks` - React hooks
- `src/lib` - Service clients and domain integrations
- `src/types` - Shared TypeScript types
- `src/utils` - Pure helpers and parsers
- `public` - Static assets

## Notes

- OpenRouter API keys are stored per user in Firestore (see Settings UI).
- Game cloud sync is enabled by default and falls back to local storage.
