# Real-Time Chat Application

A real-time chat application with a Go backend and React/TypeScript/Tailwind CSS frontend.

## Project Structure

```
real_time_chat/
├── backend/          # Go backend
│   ├── main.go      # Main server file
│   └── go.mod       # Go module file
└── frontend/        # React frontend
    ├── src/
    │   ├── App.tsx  # Main App component
    │   └── ...
    ├── tailwind.config.js
    ├── postcss.config.js
    └── package.json
```

## Tech Stack

### Backend
- **Go** - Backend server with HTTP handlers
- Port: `8080`

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- Port: `3000` (default for React dev server)

## Getting Started

### Prerequisites
- Go 1.x or higher
- Node.js and npm

### Running the Backend

```bash
cd backend
go run main.go
```

The backend will start on `http://localhost:8080`

### Running the Frontend

```bash
cd frontend
npm start
```

The frontend will start on `http://localhost:3000`

## API Endpoints

### Backend
- `GET /api/health` - Health check endpoint that returns a simple message

## Features

### Current
- ✅ Go backend with CORS enabled
- ✅ React frontend with TypeScript
- ✅ Tailwind CSS configured and styled
- ✅ Frontend-Backend connection established
- ✅ Health check endpoint

### Next Steps (for you to implement)
- WebSocket integration for real-time messaging
- Message persistence (database)
- User authentication
- Chat rooms
- Message history
- User presence indicators
- Typing indicators

## Development Notes

The current setup includes:
1. A simple Go HTTP server with CORS enabled for development
2. A React app that fetches data from the backend on load
3. Tailwind CSS configured with custom utility classes
4. TypeScript for type safety in the frontend

Start building your real-time chat features from here!
