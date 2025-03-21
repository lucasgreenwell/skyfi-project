# Database Architecture Document: Report Generation System

## Overview

This system is designed to support report generation based on user input—either by uploading images or by entering text queries. When a user submits a query, the system processes the request and generates a report that includes a structured text summary along with a set of associated images. The database, built on Supabase (PostgreSQL), tracks user queries, stores generated reports, and maintains metadata for images used in the reports.

## Key Entities and Relationships

### 1. Queries
- **Purpose:**  
  Stores the natural language queries submitted by users.
- **Key Fields:**
  - `id` (UUID): Primary key.
  - `query_text` (TEXT): The original natural language query.
  - `structured_query` (JSONB): Parsed/structured representation of the query (optional).
  - `created_at` (TIMESTAMP): Timestamp when the query was created.

### 2. Reports
- **Purpose:**  
  Stores the output report generated in response to a query. Each report includes a text summary and is linked to the query that initiated it.
- **Key Fields:**
  - `id` (UUID): Primary key.
  - `query_id` (UUID): Foreign key linking to the `queries` table.
  - `text_report` (TEXT): The narrative text of the report.
  - `report_data` (JSONB): Additional structured data or metadata (optional).
  - `created_at` (TIMESTAMP): Timestamp when the report was generated.

### 3. Images (Image Metadata Table)
- **Purpose:**  
  Stores metadata for satellite images that are either uploaded by users or retrieved from the existing database. This table holds essential details about each image.
- **Key Fields:**
  - `id` (UUID): Primary key.
  - `file_name` (TEXT): Name of the image file.
  - `file_url` (TEXT): URL or path to the stored image.
  - `file_format` (TEXT): Format of the image (e.g., GeoTIFF, JPEG/JPG, HDF, PNG).
  - `metadata` (JSONB): Additional metadata such as geolocation, resolution, sensor type, etc.
  - `created_at` (TIMESTAMP): Timestamp when the image record was created.

### 4. Report Images
- **Purpose:**  
  Links reports to the images that support the report text, representing a one-to-many relationship between reports and images.
- **Key Fields:**
  - `id` (UUID): Primary key.
  - `report_id` (UUID): Foreign key linking to the `reports` table.
  - `image_id` (UUID): Foreign key linking to the `images` table.
  - `created_at` (TIMESTAMP): Timestamp when the association was created.

## Relationships

- **One-to-One:**  
  Each query produces one report.
  
- **One-to-Many:**  
  Each report can have multiple associated images via the Report Images table.

## ER Diagram

```plaintext
+-----------+        +-----------+        +----------------+        +-----------+
|  queries  |        |  reports  |        | report_images  |        |  images   |
+-----------+        +-----------+        +----------------+        +-----------+
| id        |◄──────┐| id        |◄──────┐| id             |        | id        |
| query_text|       └| query_id  |       └| report_id      |        | file_name |
| structured|         | text_report       | image_id       |◄──────┐| file_url  |
| _query    |         | report_data       | created_at     |       | file_format|
| created_at|         | created_at        |                |       | metadata  |
+-----------+         +-----------+       +----------------+       | created_at|
                                                                  +-----------+



-- Create `queries` table
CREATE TABLE IF NOT EXISTS queries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  query_text text NOT NULL,
  structured_query jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create `reports` table
CREATE TABLE IF NOT EXISTS reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  query_id uuid REFERENCES queries(id) ON DELETE CASCADE,
  text_report text NOT NULL,
  report_data jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create `images` table (Image Metadata Table)
CREATE TABLE IF NOT EXISTS images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name text,
  file_url text NOT NULL,
  file_format text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create `report_images` table to link reports to images
CREATE TABLE IF NOT EXISTS report_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
  image_id uuid REFERENCES images(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);
