# ArtFolio

ArtFolio is a full-stack personal portfolio tracker built to record portfolio snapshots over time, monitor market ETF closes, manage a simple event calendar, and provide an educational investing reference page.

## Live demo

- Frontend: `Add your Vercel URL here`
- Backend API: `Add your Render URL here`

## What the app does

ArtFolio helps users:

- record dated portfolio snapshots
- upload an Excel sheet of company weights
- track total portfolio value over time
- compare how holdings weights change across snapshots
- edit or delete snapshots later
- monitor archived SPY and QQQ closing prices
- manage simple calendar events by date
- read a beginner-friendly “How to invest” guide

## Main features

### 1. Portfolio snapshot tracking
Users can create a snapshot by entering:
- a date
- total portfolio value
- an Excel file containing holdings and weight percentages

The app validates the uploaded data, stores the snapshot in MongoDB, and displays:
- portfolio value trend over time
- holdings weight trend over time
- snapshot history cards
- summary cards for latest value, overall change, snapshot count, and top holding

### 2. Snapshot editing and deletion
Snapshots are not permanent once created. Users can:
- edit a snapshot’s date, total value, and weights
- delete a single snapshot
- reset all snapshots

### 3. Markets page
The Markets tab tracks and archives the most recent closes for:
- **SPY**
- **QQQ**

The backend stores daily close history and the frontend shows:
- latest close
- day-on-day change
- recent archived history
- buttons to fetch the latest close for one symbol or both together

### 4. Calendar page
The Calendar tab provides a simple event planner.

Users can:
- select a date from a month view
- add an event with a title and body
- view all events for the selected day
- edit events
- delete events

### 5. How to invest page
This tab contains a short structured investing guide built around long-term investing principles such as:
- thinking like a business owner
- staying within a circle of competence
- looking for moats
- valuing financial strength
- having patience and discipline
- using index funds when appropriate

## Tech stack

### Frontend
- React
- Vite
- Recharts
- CSS

### Backend
- Node.js
- Express
- Mongoose

### Database
- MongoDB Atlas

### Deployment
- Vercel for frontend
- Render for backend

## Project structure

```text
ArtFolio/
├── backend/
│   ├── models/
│   ├── services/
│   ├── index.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── models/
│   │   ├── pictures/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── App.css
│   └── package.json
└── README.md
```

## Excel upload format

The upload expects a spreadsheet where:
- **Column A** = company name
- **Column B** = weight percentage

The app ignores total rows and sorts holdings by descending weight.

A downloadable template is included in the app.

## Local setup

### 1. Clone the repository

```bash
git clone https://github.com/archonward/ArtFolio.git
cd ArtFolio
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Create backend environment file

Create `backend/.env`:

```env
MONGO_URI=your_mongodb_connection_string
```

### 4. Run backend

```bash
npm start
```

### 5. Install frontend dependencies

In another terminal:

```bash
cd frontend
npm install
```

### 6. Create frontend environment file

Create `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

### 7. Run frontend

```bash
npm start
```

## Deployment notes

### Backend
Deploy the backend to Render and set:

```env
MONGO_URI=your_mongodb_atlas_connection_string
```

### Frontend
Deploy the frontend to Vercel and set:

```env
VITE_API_BASE_URL=https://your-render-backend-url
```

## API overview

### Snapshot routes
- `GET /api/snapshots`
- `POST /api/snapshots`
- `PUT /api/snapshots/:id`
- `DELETE /api/snapshots/:id`
- `DELETE /api/snapshots`

### Market routes
- `GET /api/market-closes?symbol=SPY`
- `GET /api/market-closes?symbol=QQQ`
- `POST /api/market-closes/fetch-latest`
- `POST /api/market-closes/fetch-all`

### Calendar routes
- `GET /api/calendar-events`
- `POST /api/calendar-events`
- `PUT /api/calendar-events/:id`
- `DELETE /api/calendar-events/:id`

## Why this project is useful

ArtFolio combines several practical ideas in one app:
- portfolio journaling
- visual tracking of portfolio evolution
- simple market monitoring
- basic productivity planning
- beginner-friendly investing education

Instead of being only a charting tool, it acts as a small investing workspace.

## Future improvements

Possible next steps include:
- better calendar styling and dedicated calendar icon
- notes/tags for snapshots
- user authentication
- improved market visualisations
- export functions for snapshot history
- more educational investing content

## Author

Built by **Arthur Teng**.
