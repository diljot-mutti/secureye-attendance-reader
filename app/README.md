# Attendance Management System

A modern web application built with Next.js for managing staff attendance and records. This system provides an intuitive interface for tracking staff members, their status, and managing staff data.

## Features

- Staff Management
  - Add new staff members
  - Edit existing staff information
  - View staff status (Active/Inactive)
  - Staff list display with pagination
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
   DATABASE_URL=your_mysql_connection_string
   ```

4. Run the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

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
