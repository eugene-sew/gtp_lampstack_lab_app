<?php
require_once 'config/db_config.php';
$dbAvailable = isDatabaseAvailable();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notes App</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .note-card {
            transition: all 0.3s ease;
        }
        .note-card:hover {
            transform: translateY(-5px);
        }
    </style>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <header class="mb-8">
            <h1 class="text-3xl font-bold text-center text-blue-600">Notes App</h1>
            <p class="text-center text-gray-600">A simple LAMP stack notes application</p>
            <?php if (!$dbAvailable): ?>
                <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mt-4" role="alert">
                    <p class="font-bold">Offline Mode</p>
                    <p>Database connection not available. Your notes are being saved locally and will sync when connection is restored.</p>
                </div>
            <?php endif; ?>
        </header>

        <div class="flex flex-col md:flex-row gap-6">
            <!-- Note Form -->
            <div class="w-full md:w-1/3 bg-white rounded-lg shadow-md p-6">
                <h2 class="text-xl font-semibold mb-4">Add/Edit Note</h2>
                <form id="noteForm" class="space-y-4">
                    <input type="hidden" id="noteId" value="">
                    <div>
                        <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
                        <input type="text" id="title" name="title" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required>
                    </div>
                    <div>
                        <label for="content" class="block text-sm font-medium text-gray-700">Content</label>
                        <textarea id="content" name="content" rows="5" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required></textarea>
                    </div>
                    <div class="flex justify-between">
                        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Save Note</button>
                        <button type="button" id="clearForm" class="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400">Clear</button>
                    </div>
                </form>
            </div>

            <!-- Notes List -->
            <div class="w-full md:w-2/3">
                <h2 class="text-xl font-semibold mb-4">Your Notes</h2>
                <div id="notesList" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Notes will be populated here via JavaScript -->
                    <div class="animate-pulse">
                        <div class="bg-white p-4 rounded-lg shadow">
                            <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div class="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal for Delete Confirmation -->
    <div id="deleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden">
        <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 class="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p>Are you sure you want to delete this note? This action cannot be undone.</p>
            <div class="mt-6 flex justify-end space-x-4">
                <button id="cancelDelete" class="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400">Cancel</button>
                <button id="confirmDelete" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Delete</button>
            </div>
        </div>
    </div>

    <script src="assets/js/app.js"></script>
</body>
</html>
