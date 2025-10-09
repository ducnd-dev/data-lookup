-- Database initialization script
-- This script runs when the database container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Create initial database if it doesn't exist (usually handled by POSTGRES_DB)
-- The main database creation is handled by Docker environment variables

-- You can add any initial data or configuration here
-- For example, creating indexes, initial users, etc.

-- Example: Create a function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';