# UniRide

**Turning student trips into sustainable rides.**

UniRide helps students find and share rides within their university - reducing costs, carbon, and the chaos of group chats. Create rides, browse listings, request rides, and coordinate in one place.

---

## Features

- **Rides** - Create rides with start/destination, date, time, price (or free), and seats. Browse and filter by destination, price, and date. Join or leave rides.
- **Ride requests** - Post when you need a ride; drivers can offer. Match and chat from the dashboard.
- **Map view** - See rides and requests on an interactive map (Leaflet). List and map toggle on the dashboard.
- **Chat** - Group chat per ride or ride request. Streamed messages via API.
- **Profile** - Update name, university, phone, bio. View your joined rides and offered requests.
- **Carbon impact** - CO₂ saved estimates when joining rides (distance-based).
- **Location search** - Address autocomplete (free fallback: Nominatim/Photon; optional Google Places API).
- **Voice create** - Optional voice input to create a ride (ElevenLabs + Google AI Studio).

---

## Tech stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router)
- **UI:** React 19, [Tailwind CSS 4](https://tailwindcss.com)
- **Maps:** [Leaflet](https://leafletjs.com) + [react-leaflet](https://react-leaflet.js.org)
- **Language:** TypeScript

---

## Prerequisites

- **Node.js** 18+ (recommend 20+)
- **npm**, **yarn**, **pnpm**, or **bun**

---

## Getting started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd uni-ride
npm install
```

### 2. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You’ll see the landing page; use **Log in** or **Sign up** to reach the dashboard.

### 3. Demo auth

Auth is **mock** (no real backend): users are stored in `localStorage`. You can sign up with any email; for quick testing, see `lib/mock-data.ts` for predefined demo users and log in with those emails.

---

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start dev server (Next.js) |
| `npm run build`| Production build         |
| `npm run start`| Start production server  |
| `npm run lint` | Run ESLint               |

---

## Optional: environment variables

The app works without any env vars. These enable extra features:

| Variable | Purpose |
|----------|--------|
| `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | Google Places autocomplete for location search (enable Places API + Maps JavaScript API). Without it, Nominatim/Photon is used. |
| `GOOGLE_STUDIO_API_KEY` | Used by `/api/rides/estimate-distance` and `/api/rides/voice` for distance/voice parsing. |
| `ELEVENLABS_API_KEY` | Used by `/api/rides/voice` for speech-to-text when creating a ride by voice. |

Create a `.env.local` in the project root (see `.env.example` if you add one). Do not commit secrets.

---

## Project structure (overview)

```
uni-ride/
├── app/
│   ├── (dashboard)/          # Dashboard routes (rides, requests, chat, profile)
│   │   ├── dashboard/
│   │   ├── rides/            # create, my-rides, request, [id]/edit
│   │   ├── chat/             # list + [roomId]
│   │   └── profile/
│   ├── api/                  # API routes (rides, places, chat)
│   ├── login/, signup/
│   ├── layout.tsx
│   ├── page.tsx              # Landing
│   └── globals.css
├── components/               # Map, RideCard, RequestCard, SideNav, etc.
├── context/                 # Auth, Rides, RideRequests, Chat
├── lib/                     # types, mock-data, map-utils, carbon-utils, google-places
└── package.json
```

---

## Learn more

- [Next.js documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Leaflet](https://react-leaflet.js.org/)

---

*UniRide - Rides for every situation: airport trips, grocery runs, downtown & events.*
