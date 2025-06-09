// DOM Elements
const noteForm = document.getElementById('noteForm');
const notesList = document.getElementById('notesList');
const titleInput = document.getElementById('title');
const contentInput = document.getElementById('content');
const noteIdInput = document.getElementById('noteId');
const clearFormBtn = document.getElementById('clearForm');
const deleteModal = document.getElementById('deleteModal');
const cancelDeleteBtn = document.getElementById('cancelDelete');
const confirmDeleteBtn = document.getElementById('confirmDelete');

// Global variables
let isOnline = true;
let noteToDelete = null;
let syncQueue = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're online
    checkOnlineStatus();
    
    // Load notes
    loadNotes();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up periodic sync
    setInterval(syncWithServer, 30000); // Try to sync every 30 seconds
});

// Check if we're online
function checkOnlineStatus() {
    fetch('api/notes.php')
        .then(response => response.json())
        .then(data => {
            isOnline = data.online !== false;
            if (!isOnline) {
                showOfflineNotification();
            }
        })
        .catch(() => {
            isOnline = false;
            showOfflineNotification();
        });
}

// Show offline notification
function showOfflineNotification() {
    const notification = document.querySelector('.bg-yellow-100');
    if (notification) {
        notification.classList.remove('hidden');
    }
}

// Set up event listeners
function setupEventListeners() {
    // Form submission
    noteForm.addEventListener('submit', saveNote);
    
    // Clear form button
    clearFormBtn.addEventListener('click', clearForm);
    
    // Cancel delete button
    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.classList.add('hidden');
        noteToDelete = null;
    });
    
    // Confirm delete button
    confirmDeleteBtn.addEventListener('click', confirmDelete);
    
    // Online/offline detection
    window.addEventListener('online', () => {
        isOnline = true;
        syncWithServer();
    });
    
    window.addEventListener('offline', () => {
        isOnline = false;
        showOfflineNotification();
    });
}

// Load notes from server or localStorage
function loadNotes() {
    // Clear the notes list
    notesList.innerHTML = '';
    
    if (isOnline) {
        // Try to load from server
        fetch('api/notes.php')
            .then(response => response.json())
            .then(data => {
                if (data.online === false) {
                    isOnline = false;
                    showOfflineNotification();
                    loadNotesFromLocalStorage();
                } else {
                    // Save to localStorage for offline use
                    localStorage.setItem('notes', JSON.stringify(data.data));
                    renderNotes(data.data);
                }
            })
            .catch(() => {
                isOnline = false;
                showOfflineNotification();
                loadNotesFromLocalStorage();
            });
    } else {
        loadNotesFromLocalStorage();
    }
}

// Load notes from localStorage
function loadNotesFromLocalStorage() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    renderNotes(notes);
}

// Render notes to the DOM
function renderNotes(notes) {
    notesList.innerHTML = '';
    
    if (notes.length === 0) {
        notesList.innerHTML = '<p class="text-gray-500 text-center col-span-2">No notes found. Create one!</p>';
        return;
    }
    
    notes.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.className = 'bg-white p-4 rounded-lg shadow note-card';
        noteCard.innerHTML = `
            <h3 class="font-semibold text-lg mb-2">${escapeHtml(note.title)}</h3>
            <p class="text-gray-700 mb-4">${escapeHtml(note.content.substring(0, 100))}${note.content.length > 100 ? '...' : ''}</p>
            <div class="flex justify-between items-center text-sm text-gray-500">
                <span>Updated: ${formatDate(note.updated_at)}</span>
                <div class="space-x-2">
                    <button class="edit-note text-blue-600 hover:text-blue-800" data-id="${note.id}">Edit</button>
                    <button class="delete-note text-red-600 hover:text-red-800" data-id="${note.id}">Delete</button>
                </div>
            </div>
        `;
        
        notesList.appendChild(noteCard);
        
        // Add event listeners to the buttons
        noteCard.querySelector('.edit-note').addEventListener('click', () => editNote(note));
        noteCard.querySelector('.delete-note').addEventListener('click', () => showDeleteModal(note.id));
    });
}

// Save note (create or update)
function saveNote(e) {
    e.preventDefault();
    
    const noteId = noteIdInput.value;
    const title = titleInput.value;
    const content = contentInput.value;
    
    const note = {
        title,
        content,
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };
    
    if (noteId) {
        // Update existing note
        note.id = noteId;
        updateNoteInStorage(note);
    } else {
        // Create new note
        note.id = Date.now().toString(); // Temporary ID for localStorage
        note.created_at = note.updated_at;
        createNoteInStorage(note);
    }
    
    clearForm();
    loadNotes();
}

// Create note in storage
function createNoteInStorage(note) {
    if (isOnline) {
        // Send to server
        fetch('api/notes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(note)
        })
        .then(response => response.json())
        .then(data => {
            if (data.online === false) {
                isOnline = false;
                showOfflineNotification();
                saveNoteToLocalStorage(note);
                addToSyncQueue('create', note);
            } else {
                // Update localStorage with the server-generated ID
                const notes = JSON.parse(localStorage.getItem('notes') || '[]');
                const updatedNotes = notes.filter(n => n.id !== note.id);
                updatedNotes.unshift(data.data);
                localStorage.setItem('notes', JSON.stringify(updatedNotes));
                loadNotes();
            }
        })
        .catch(() => {
            isOnline = false;
            showOfflineNotification();
            saveNoteToLocalStorage(note);
            addToSyncQueue('create', note);
        });
    } else {
        saveNoteToLocalStorage(note);
        addToSyncQueue('create', note);
    }
}

// Update note in storage
function updateNoteInStorage(note) {
    if (isOnline) {
        // Send to server
        fetch(`api/notes.php?id=${note.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(note)
        })
        .then(response => response.json())
        .then(data => {
            if (data.online === false) {
                isOnline = false;
                showOfflineNotification();
                updateNoteInLocalStorage(note);
                addToSyncQueue('update', note);
            } else {
                updateNoteInLocalStorage(data.data);
            }
        })
        .catch(() => {
            isOnline = false;
            showOfflineNotification();
            updateNoteInLocalStorage(note);
            addToSyncQueue('update', note);
        });
    } else {
        updateNoteInLocalStorage(note);
        addToSyncQueue('update', note);
    }
}

// Delete note
function deleteNote(noteId) {
    if (isOnline) {
        // Send to server
        fetch(`api/notes.php?id=${noteId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.online === false) {
                isOnline = false;
                showOfflineNotification();
                deleteNoteFromLocalStorage(noteId);
                addToSyncQueue('delete', { id: noteId });
            } else {
                deleteNoteFromLocalStorage(noteId);
            }
        })
        .catch(() => {
            isOnline = false;
            showOfflineNotification();
            deleteNoteFromLocalStorage(noteId);
            addToSyncQueue('delete', { id: noteId });
        });
    } else {
        deleteNoteFromLocalStorage(noteId);
        addToSyncQueue('delete', { id: noteId });
    }
}

// Save note to localStorage
function saveNoteToLocalStorage(note) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.unshift(note);
    localStorage.setItem('notes', JSON.stringify(notes));
}

// Update note in localStorage
function updateNoteInLocalStorage(note) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const updatedNotes = notes.map(n => n.id === note.id ? note : n);
    localStorage.setItem('notes', JSON.stringify(updatedNotes));
}

// Delete note from localStorage
function deleteNoteFromLocalStorage(noteId) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const updatedNotes = notes.filter(n => n.id !== noteId);
    localStorage.setItem('notes', JSON.stringify(updatedNotes));
    loadNotes();
}

// Edit note
function editNote(note) {
    noteIdInput.value = note.id;
    titleInput.value = note.title;
    contentInput.value = note.content;
    titleInput.focus();
}

// Show delete modal
function showDeleteModal(noteId) {
    noteToDelete = noteId;
    deleteModal.classList.remove('hidden');
}

// Confirm delete
function confirmDelete() {
    if (noteToDelete) {
        deleteNote(noteToDelete);
        deleteModal.classList.add('hidden');
        noteToDelete = null;
    }
}

// Clear form
function clearForm() {
    noteForm.reset();
    noteIdInput.value = '';
}

// Add to sync queue
function addToSyncQueue(action, note) {
    // Get the current sync queue
    const queue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
    
    // Add the action to the queue
    queue.push({
        action,
        note,
        timestamp: Date.now()
    });
    
    // Save the updated queue
    localStorage.setItem('syncQueue', JSON.stringify(queue));
}

// Sync with server
function syncWithServer() {
    if (!isOnline) {
        checkOnlineStatus();
        return;
    }
    
    const queue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
    
    if (queue.length === 0) {
        return;
    }
    
    // Process each item in the queue
    const processQueue = async () => {
        const newQueue = [...queue];
        
        for (let i = 0; i < queue.length; i++) {
            const item = queue[i];
            let success = false;
            
            try {
                switch (item.action) {
                    case 'create':
                        success = await syncCreate(item.note);
                        break;
                    case 'update':
                        success = await syncUpdate(item.note);
                        break;
                    case 'delete':
                        success = await syncDelete(item.note.id);
                        break;
                }
                
                if (success) {
                    // Remove the item from the queue
                    newQueue.splice(newQueue.findIndex(q => 
                        q.action === item.action && 
                        q.note.id === item.note.id && 
                        q.timestamp === item.timestamp
                    ), 1);
                }
            } catch (error) {
                console.error('Sync error:', error);
            }
        }
        
        // Save the updated queue
        localStorage.setItem('syncQueue', JSON.stringify(newQueue));
        
        // Reload notes if any sync was successful
        if (newQueue.length < queue.length) {
            loadNotes();
        }
    };
    
    processQueue();
}

// Sync create
async function syncCreate(note) {
    const response = await fetch('api/notes.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(note)
    });
    
    const data = await response.json();
    
    if (data.online === false) {
        isOnline = false;
        showOfflineNotification();
        return false;
    }
    
    // Update the note in localStorage with the server-generated ID
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const updatedNotes = notes.map(n => {
        if (n.id === note.id) {
            return data.data;
        }
        return n;
    });
    
    localStorage.setItem('notes', JSON.stringify(updatedNotes));
    return true;
}

// Sync update
async function syncUpdate(note) {
    const response = await fetch(`api/notes.php?id=${note.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(note)
    });
    
    const data = await response.json();
    
    if (data.online === false) {
        isOnline = false;
        showOfflineNotification();
        return false;
    }
    
    return true;
}

// Sync delete
async function syncDelete(noteId) {
    const response = await fetch(`api/notes.php?id=${noteId}`, {
        method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.online === false) {
        isOnline = false;
        showOfflineNotification();
        return false;
    }
    
    return true;
}

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return 'Just now';
    
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
