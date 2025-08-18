# Attendance Management System

A modern web application built with Next.js for managing staff attendance and records. This system provides an intuitive interface for tracking staff members, their status, and managing staff data.

## Features

- Staff Management
  - Add new staff members
  - Edit existing staff information
  - View staff status (Active/Inactive)
  - Staff list display with pagination
- Attendance Management
  - View attendance records by month/year
  - Print-friendly attendance tables
  - CSV import for new attendance records
  - Automatic duplicate detection and skipping
- Modern UI with Tailwind CSS
- Responsive design
- Real-time data updates

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: MySQL
- **Development Tools**: ESLint, TypeScript

## Prerequisites

- Node.js (v18 or higher)
- MySQL database
- npm or yarn package manager

## Getting Started

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up your environment variables:
   Create a `.env` file in the root directory with the following variables:

   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=attendance_db
   ```

4. Set up your MySQL database:
   Create the required tables in your own environment. The app expects a table named `attendance_logs` with at least:

   ```sql
   CREATE TABLE `attendance_logs` (
     `id` int NOT NULL AUTO_INCREMENT,
     `staffId` int NOT NULL,
     `timestamp` datetime NOT NULL,
     PRIMARY KEY (`id`)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
   ```

5. Run the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## CSV Upload Feature

The system supports importing attendance records from CSV files. Here's how to use it:

### CSV Format Requirements

Your CSV file must contain the following columns:

- **User ID**: Staff member identifier (must match existing staff IDs)
- **Timestamp**: Date and time in format `YYYY-MM-DD HH:MM:SS`
- **Verify Mode**: Additional verification information (stored but not processed)

### Example CSV Content

A sample CSV file (`sample-attendance.csv`) is provided in the project root for reference:

```csv
User ID,Timestamp,Verify Mode
EMP001,2024-01-15 09:00:00,Fingerprint
EMP002,2024-01-15 09:15:00,Card
EMP001,2024-01-15 17:30:00,Fingerprint
```

### How It Works

1. **Upload**: Click the "Upload New Records" button on the attendance page
2. **Validation**: The system validates the CSV format and shows a preview
3. **Duplicate Handling**:
   - Client-side dedupe removes exact duplicates in the uploaded file (same User ID + Timestamp)
   - Database dedupe uses `INSERT IGNORE` with a recommended unique index on `(staffId, timestamp)` so existing rows are skipped efficiently
4. **Import**: New, unique records are imported into the database in batches
5. **Feedback**: Shows import results including total, new, and skipped records

### Recommended Indexes (run in your DB)

To make uploads and reporting fast with high duplicate rates:

```sql
-- Ensure fast dedupe on import
ALTER TABLE `attendance_logs`
  ADD UNIQUE KEY `uniq_staff_ts` (`staffId`,`timestamp`);

-- Useful for range queries by month/year and staff
CREATE INDEX `idx_ts` ON `attendance_logs` (`timestamp`);
CREATE INDEX `idx_staff_ts_lookup` ON `attendance_logs` (`staffId`,`timestamp`);
```

If your table is already large and you prefer an online operation, use your preferred online DDL tool.

### Features

- **Smart Duplicate Detection**: Prevents duplicate attendance records
- **Preview**: See the first 5 records before importing
- **Error Handling**: Clear error messages for invalid data
- **Real-time Updates**: Attendance data refreshes automatically after import

## Available Scripts

- `npm run dev` - Start the development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check for code issues

## Project Structure

```
app/
├── src/
│   ├── app/          # Next.js app router pages
│   ├── components/   # React components
│   ├── types/        # TypeScript type definitions
│   └── api/          # API routes
├── public/           # Static assets
├── sample-attendance.csv # Sample CSV file for testing
└── package.json      # Project dependencies and scripts
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
