# Career Pivot Coach

A production-oriented web application that helps professionals navigate career transitions using AI-powered guidance, skill gap analysis, and personalized roadmaps.

## Project Structure

```
career-pivot-coach/
├── frontend/       # React client application
├── backend/        # Node.js + Express API server
└── README.md
```

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React, Vite                       |
| Backend   | Node.js, Express                  |
| Database  | MongoDB (via Mongoose)            |
| Auth      | JWT                               |

## Getting Started

### Prerequisites

- Node.js >= 18.x
- MongoDB >= 6.x
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd career-pivot-coach

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install
```

### Running the App

```bash
# Start the backend (from /backend)
npm run dev

# Start the frontend (from /frontend)
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` in both `frontend/` and `backend/` and fill in your values.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Open a Pull Request

## License

MIT

