# Scholarship Server

A TypeScript-based REST API server for managing scholarships, built with Express and MongoDB.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or a MongoDB Atlas account)
- npm or yarn package manager

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd scholarship-server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/scholarship-db
NODE_ENV=development
```

4. Build the project:
```bash
npm run build
```

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Scholarships

- `GET /api/scholarships` - Get all scholarships
- `GET /api/scholarships/:id` - Get a specific scholarship
- `POST /api/scholarships` - Create a new scholarship
- `PUT /api/scholarships/:id` - Update a scholarship
- `DELETE /api/scholarships/:id` - Delete a scholarship

## Project Structure

```
scholarship-server/
├── src/
│   ├── controllers/
│   │   └── scholarshipController.ts
│   ├── models/
│   │   └── Scholarship.ts
│   ├── routes/
│   │   └── scholarshipRoutes.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Technologies Used

- TypeScript
- Express.js
- MongoDB with Mongoose
- Node.js
- CORS
- Helmet (for security) 