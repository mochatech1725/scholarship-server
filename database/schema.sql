-- Scholarship Server Database Schema
-- Run this SQL file to create all necessary tables

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    auth_user_id VARCHAR(255) NOT NULL UNIQUE, -- Auth0 sub
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email_address VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_auth_user_id (auth_user_id),
    INDEX idx_email (email_address)
);


CREATE TABLE IF NOT EXISTS user_search_preferences (
    user_id INT PRIMARY KEY,
    target_type VARCHAR(100),
    subject_areas JSON, -- Store array as JSON
    gender VARCHAR(50),
    ethnicity VARCHAR(100),
    academic_gpa DECIMAL(3,2),
    essay_required BOOLEAN DEFAULT FALSE,
    recommendation_required BOOLEAN DEFAULT FALSE,
    academic_level VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_target_type (target_type),
    INDEX idx_gender (gender),
    INDEX idx_ethnicity (ethnicity),
    INDEX idx_academic_level (academic_level)
);

CREATE TABLE IF NOT EXISTS applications (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    scholarship_name VARCHAR(500) NOT NULL,
    target_type VARCHAR(100),
    organization VARCHAR(255) NOT NULL,
    org_website VARCHAR(500),
    platform VARCHAR(255),
    application_link VARCHAR(500),
    theme VARCHAR(255),
    amount DECIMAL(10,2),
    requirements TEXT,
    renewable BOOLEAN DEFAULT FALSE,
    renewable_terms TEXT,
    document_info_link VARCHAR(500),
    current_action VARCHAR(255),
    status ENUM('Not Started', 'In Progress', 'Submitted', 'Awarded', 'Not Awarded') DEFAULT 'Not Started',
    submission_date TIMESTAMP NULL,
    open_date DATE NOT NULL,
    due_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(auth_user_id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id),
    INDEX idx_scholarship_name (scholarship_name),
    INDEX idx_status (status),
    INDEX idx_organization (organization),
    INDEX idx_due_date (due_date),
    INDEX idx_applications_student_scholarship (student_id, scholarship_name)
);

CREATE TABLE IF NOT EXISTS essays (
    essay_id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    theme VARCHAR(255),
    units VARCHAR(100),
    essay_link TEXT,
    word_count INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE,
    INDEX idx_application_id (application_id)
);

CREATE TABLE IF NOT EXISTS recommenders (
    recommender_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    relationship VARCHAR(100),
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(auth_user_id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id),
    INDEX idx_email (email_address)
);

-- Recommendations table (replacing MongoDB Recommendation model)
CREATE TABLE IF NOT EXISTS recommendations (
    recommendation_id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    recommender_id INT NOT NULL,
    content TEXT,
    submitted_at TIMESTAMP NULL,
    status ENUM('pending', 'submitted', 'declined') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE,
    FOREIGN KEY (recommender_id) REFERENCES recommenders(recommender_id) ON DELETE CASCADE,
    INDEX idx_application_id (application_id),
    INDEX idx_recommender_id (recommender_id),
    INDEX idx_status (status),
    INDEX idx_application_status (application_id, status)
);

-- Scholarships table (already exists, but adding for completeness)
CREATE TABLE IF NOT EXISTS scholarships (
    scholarship_id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    organization VARCHAR(255),
    target_type VARCHAR(100),
    min_award DECIMAL(10,2),
    max_award DECIMAL(10,2),
    deadline DATE,
    eligibility TEXT,
    gender VARCHAR(50),
    ethnicity VARCHAR(100),
    academic_level VARCHAR(100),
    essay_required BOOLEAN DEFAULT FALSE,
    recommendation_required BOOLEAN DEFAULT FALSE,
    renewable BOOLEAN DEFAULT FALSE,
    geographic_restrictions VARCHAR(255),
    apply_url VARCHAR(500),
    url VARCHAR(500),
    source VARCHAR(100),
    country VARCHAR(100),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (active),
    INDEX idx_deadline (deadline),
    INDEX idx_academic_level (academic_level),
    INDEX idx_ethnicity (ethnicity),
    INDEX idx_gender (gender),
    INDEX idx_target_type (target_type),
    INDEX idx_organization (organization),
    INDEX idx_source (source)
); 