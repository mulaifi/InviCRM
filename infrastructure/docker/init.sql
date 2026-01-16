-- InviCRM Database Initialization
-- This script runs on first container startup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable case-insensitive text extension
CREATE EXTENSION IF NOT EXISTS "citext";

-- Create schemas (optional, for organization)
-- CREATE SCHEMA IF NOT EXISTS invicrm;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE invicrm TO invicrm;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'InviCRM database initialized successfully';
END $$;
