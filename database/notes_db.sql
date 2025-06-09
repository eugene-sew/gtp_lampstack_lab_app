-- Create database
CREATE DATABASE IF NOT EXISTS notes_app;
USE notes_app;

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert some sample data
INSERT INTO notes (title, content) VALUES
('Welcome to Notes App', 'This is a simple notes application built with the LAMP stack.'),
('Features', 'Create, read, update, and delete notes. Works offline with localStorage sync.');
