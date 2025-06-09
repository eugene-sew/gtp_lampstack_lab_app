# Notes App - LAMP Stack

A simple notes-taking application built with the LAMP stack (Linux, Apache, MySQL, PHP) that allows for offline functionality using localStorage.

## Features

- Create, Read, Update, and Delete notes
- Offline functionality with localStorage
- Sync with MySQL database when online
- Responsive design with Tailwind CSS

## Setup

1. Make sure you have a LAMP environment set up (Apache, MySQL, PHP)
2. Import the `database/notes_db.sql` file into your MySQL server
3. Update the database connection details in `config/db_config.php` if needed
4. Access the application through your web server

## Project Structure

- `index.php` - Main entry point
- `api/` - PHP API endpoints for CRUD operations
- `assets/` - CSS, JS, and other static files
- `config/` - Configuration files
- `database/` - Database schema
- `includes/` - Reusable PHP components
