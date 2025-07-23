# Scholarship Server

A comprehensive scholarship management server built with Express.js, TypeScript, and AWS RDS MySQL, featuring Auth0 integration and AI-powered scholarship search capabilities.

## Features

- **User Authentication**: Secure authentication using Auth0
- **Application Management**: Create, read, update, and delete scholarship applications
- **Recommender System**: Manage recommendation letters and references
- **AI-Powered Scholarship Search**: Intelligent search using OpenAI and RAG (Retrieval-Augmented Generation)
- **RESTful API**: Clean, well-documented API endpoints
- **TypeScript**: Full type safety and better development experience
- **AWS RDS MySQL**: Scalable relational database for scholarships (via Knex)
- **Security**: Helmet, CORS

## Database & Secrets

- **Scholarship data is stored in AWS RDS MySQL.**
- **Knex** is used as the query builder for all scholarship-related queries.
- **Database credentials are securely managed via AWS Secrets Manager.**
  - See [`src/config/secrets.config.ts`](src/config/secrets.config.ts) for the utility to read secrets.
  - The secret should be a JSON object with at least: `host`, `username`, `password`, `dbname` (and optionally `port`, `ssl`).

## AI Scholarship Search Feature

The application includes an advanced AI-powered scholarship search system that uses:

- **OpenAI GPT-3.5-turbo** for intelligent analysis and ranking
- **RAG (Retrieval-Augmented Generation)** approach with predefined scholarship websites
- **Web scraping capabilities** (with rate limiting and respectful practices)
- **Semantic search** based on user keywords
- **Relevance scoring** for optimal results
- **MySQL/Knex** for fast, flexible scholarship filtering

### Scholarship Search Endpoints

#### POST `/api/scholarships/find`
Search for scholarships using AI-powered analysis and MySQL filtering.

**Request Body:**
```json
{
  "keywords": ["computer science", "undergraduate", "women"],
  "maxResults": 10,
  "includeDeadlines": true,
  "useRealScraping": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scholarships": [
      {
        "title": "Computer Science Excellence Scholarship",
        "description": "Scholarship for students demonstrating excellence in computer science...",
        "amount": "$5,000 - $10,000",
        "deadline": "March 15, 2024",
        "eligibility": "GPA 3.5+, Full-time student, Demonstrated leadership",
        "source": "Scholarships.com",
        "relevanceScore": 0.95
      }
    ],
    "totalFound": 6,
    "keywords": ["computer science", "undergraduate", "women"],
    "searchTimestamp": "2024-01-15T10:30:00.000Z"
  },
  "metadata": {
    "sourcesUsed": ["Scholarships.com", "Fastweb", "College Board", "Appily", "Niche"],
    "aiModel": "gpt-3.5-turbo",
    "processingTime": "2024-01-15T10:30:05.000Z",
    "realScrapingUsed": false
  }
}
```

#### GET `/api/scholarships/sources`
Get available scholarship sources used by the AI search.

#### GET `/api/scholarships/health`
Check the health status of the AI service.

### Supported Scholarship Sources

The AI search system integrates with the following scholarship websites:

1. **Scholarships.com** - Comprehensive scholarship database
2. **Fastweb** - Leading scholarship search platform
3. **College Board** - Official College Board scholarship search
4. **appily** - Scholarship matching platform
5. **Niche** - College and scholarship search platform

### How the AI Search Works

1. **Keyword Processing**: User keywords are analyzed for semantic meaning
2. **Data Retrieval**: Scholarship data is gathered from multiple sources
3. **AI Analysis**: OpenAI GPT-3.5-turbo analyzes and ranks scholarships by relevance
4. **Filtering**: Results are filtered based on amount, deadlines, and other criteria using MySQL/Knex
5. **Ranking**: Scholarships are ranked by relevance score (0.0 to 1.0)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd scholarship-server
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

4. Configure your environment variables in `.env`:
```env
# Server Configuration
NODE_ENV=development
PORT=3000
APP_DEBUG=true

# MySQL/AWS RDS Configuration (via AWS Secrets Manager)
# No direct DB credentials here; see AWS Secrets Manager section

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Auth0 Configuration
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com/
AUTH0_AUDIENCE=https://your-api-identifier

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# App Secret
APP_SECRET=your-super-secret-key-at-least-32-characters-long
```

5. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Applications
- `GET /api/applications` - Get all applications
- `GET /api/applications/:id` - Get application by ID
- `POST /api/applications` - Create new application
- `PUT /api/applications/:id` - Update application
- `DELETE /api/applications/:id` - Delete application

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Recommenders
- `GET /api/recommenders` - Get all recommenders
- `GET /api/recommenders/:id` - Get recommender by ID
- `GET /api/recommenders/getByUserId/:userId` - Get recommenders by user ID
- `POST /api/recommenders` - Create new recommender
- `PUT /api/recommenders/:id` - Update recommender
- `DELETE /api/recommenders/:id` - Delete recommender

### AI Scholarship Search
- `POST /api/scholarships/find` - Search for scholarships using AI
- `GET /api/scholarships/sources` - Get available scholarship sources
- `GET /api/scholarships/health` - Check AI service health

## Development

### Scripts
- `npm run dev` - Start development server with nodemon
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests

### Project Structure
```
src/
├── controllers/          # Route controllers
├── routes/              # API routes
├── models/              # MongoDB models (user/applications only)
├── middleware/          # Custom middleware
├── config/              # Configuration files (including secrets.config.ts)
├── services/            # Service logic (including aws.db.service.ts)
├── types/               # TypeScript type definitions
├── database/            # Database connection and setup
├── errors/              # Error handling
└── index.ts            # Main application file
```

## Security Features

- **Auth0 Integration**: Secure authentication and authorization
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Input Validation**: Request validation and sanitization
- **Rate Limiting**: API rate limiting (for web scraping)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 

## AI-Driven Scraping Approach

The system uses a sophisticated AI approach to handle the variability in website structures:

### AI Approach

**AI-Driven Scraping (Current):**
- Uses OpenAI to intelligently parse any HTML structure
- Recognizes semantic meaning regardless of field names
- Automatically adapts to different website layouts
- Handles variations like:
  - Deadline: `due date`, `application deadline`, `closing date`
  - Amount: `award amount`, `scholarship value`, `prize money`
  - Organization: `company`, `sponsor`, `provider`, `institution`
  - Ethnicity: `race`, `background`, `heritage`

### How It Works

1. **HTML Fetching**: Downloads the raw HTML from scholarship websites
2. **Content Cleaning**: Removes scripts, styles, and unnecessary elements
3. **AI Analysis**: Sends cleaned HTML to OpenAI with specialized prompts
4. **Intelligent Extraction**: AI identifies scholarship opportunities and extracts relevant fields
5. **Structured Output**: Returns standardized JSON with all scholarship details

## Environment Variables

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-3.5-turbo  # or gpt-4 for better accuracy
MAX_RESULTS=10
```

## API Endpoints

- `POST /api/search` - Search for scholarships with filters
- `GET /api/sources` - Get available scholarship sources

## Example Usage

```javascript
// Search for scholarships
const response = await fetch('/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filters: {
      keywords: "computer science",
      educationLevel: "undergraduate",
      subjectAreas: ["Computer Science", "Technology"],
    },
    maxResults: 10
  })
});
```

## Supported Websites

- Fastweb
- College Board
- Appily
- Niche
- Scholarship360
- Unigo
- Peterson's

The AI approach allows the system to work with any scholarship website without manual configuration. 