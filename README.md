# Scholarship Server

A comprehensive scholarship management server built with Express.js, TypeScript, and AWS RDS MySQL, featuring Auth0 integration and advanced scholarship search capabilities.

---

## Features

- **User Authentication**: Secure authentication using Auth0
- **Application Management**: Create, read, update, and delete scholarship applications
- **Recommender System**: Manage recommendation letters and references
- **Scholarship Search (via External Scraper Service)**: This server connects to a MySQL database populated by a separate service called `scholarship-scraper`, which searches for scholarships (using AI and scraping) and stores them in the database. This server uses Knex to query and serve those results.
- **RESTful API**: Clean, well-documented API endpoints
- **TypeScript**: Full type safety and better development experience
- **AWS RDS MySQL**: Scalable relational database for scholarships (via Knex)
- **AWS Secrets Manager**: Securely manages database credentials
- **Security**: Helmet, CORS

---

## AWS Integration

This project uses:

- **AWS RDS (MySQL)**: For storing all application and scholarship data
- **AWS Secrets Manager**: For securely managing database credentials

> **Note:** This server does NOT use AWS Bedrock, Comprehend, or DynamoDB. Scholarship data is provided by the external `scholarship-scraper` service.

### Environment Variables

Add the following to your `.env` file:

```bash
# AWS RDS/Secrets Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
# The secret should contain host, username, password, dbname, and optionally port/ssl
```

---

## How to Run Locally (with AWS RDS MySQL)

### 1. Clone and Install

```bash
git clone <repository-url>
cd scholarship-server
npm install
cp env.example .env
```

### 2. Configure Environment

Edit `.env` with your Auth0, AWS, and other credentials as needed.

### 3. Connect to AWS RDS MySQL via SSH Bastion Tunnel (Recommended)

For security, direct access to AWS RDS is not allowed. Use SSH tunneling through a bastion host:

#### **Recommended: Use Provided Script**

```bash
bash scripts/start-bastion.sh
```

This will open a tunnel from your local port 3307 to the remote RDS MySQL instance via the bastion host. The script uses:

```
ssh -i ~/.ssh/bastion-key.pem -L 3307:<rds-endpoint>:3306 ec2-user@<bastion-ip>
```

- Replace `~/.ssh/bastion-key.pem` with your SSH key path if needed.
- Keep this terminal open while developing locally.

#### **Configure Your Local .env**

Set your MySQL connection to use `localhost:3307` (the tunnel):

```
DB_HOST=127.0.0.1
DB_PORT=3307
```

> **Note:** All database traffic will be securely tunneled through the bastion host.


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

### Scholarship Search
- `POST /api/scholarships/find` - Search for scholarships (queries MySQL database populated by scholarship-scraper)
- `GET /api/scholarships/sources` - Get available scholarship sources
- `GET /api/scholarships/health` - Check service health

