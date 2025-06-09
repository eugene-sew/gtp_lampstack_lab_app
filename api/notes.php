<?php
header('Content-Type: application/json');
require_once '../config/db_config.php';

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Get note ID if provided
$noteId = isset($_GET['id']) ? $_GET['id'] : null;

// Handle different HTTP methods
switch ($method) {
    case 'GET':
        if ($noteId) {
            getNote($noteId);
        } else {
            getAllNotes();
        }
        break;
    case 'POST':
        createNote();
        break;
    case 'PUT':
        updateNote($noteId);
        break;
    case 'DELETE':
        deleteNote($noteId);
        break;
    default:
        http_response_code(405); // Method Not Allowed
        echo json_encode(['error' => 'Method not allowed']);
}

// Get all notes
function getAllNotes() {
    $conn = getDbConnection();
    
    if (!$conn) {
        http_response_code(503); // Service Unavailable
        echo json_encode(['error' => 'Database connection failed', 'online' => false]);
        return;
    }
    
    $sql = "SELECT * FROM notes ORDER BY updated_at DESC";
    $result = $conn->query($sql);
    
    $notes = [];
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $notes[] = $row;
        }
    }
    
    $conn->close();
    echo json_encode(['data' => $notes, 'online' => true]);
}

// Get a specific note
function getNote($id) {
    $conn = getDbConnection();
    
    if (!$conn) {
        http_response_code(503); // Service Unavailable
        echo json_encode(['error' => 'Database connection failed', 'online' => false]);
        return;
    }
    
    $id = $conn->real_escape_string($id);
    $sql = "SELECT * FROM notes WHERE id = '$id'";
    $result = $conn->query($sql);
    
    if ($result->num_rows > 0) {
        $note = $result->fetch_assoc();
        echo json_encode(['data' => $note, 'online' => true]);
    } else {
        http_response_code(404); // Not Found
        echo json_encode(['error' => 'Note not found', 'online' => true]);
    }
    
    $conn->close();
}

// Create a new note
function createNote() {
    $conn = getDbConnection();
    
    if (!$conn) {
        http_response_code(503); // Service Unavailable
        echo json_encode(['error' => 'Database connection failed', 'online' => false]);
        return;
    }
    
    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['title']) || !isset($data['content'])) {
        http_response_code(400); // Bad Request
        echo json_encode(['error' => 'Title and content are required', 'online' => true]);
        return;
    }
    
    $title = $conn->real_escape_string($data['title']);
    $content = $conn->real_escape_string($data['content']);
    
    $sql = "INSERT INTO notes (title, content) VALUES ('$title', '$content')";
    
    if ($conn->query($sql) === TRUE) {
        $newId = $conn->insert_id;
        $note = [
            'id' => $newId,
            'title' => $data['title'],
            'content' => $data['content'],
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        echo json_encode(['message' => 'Note created successfully', 'data' => $note, 'online' => true]);
    } else {
        http_response_code(500); // Internal Server Error
        echo json_encode(['error' => 'Error creating note: ' . $conn->error, 'online' => true]);
    }
    
    $conn->close();
}

// Update an existing note
function updateNote($id) {
    $conn = getDbConnection();
    
    if (!$conn) {
        http_response_code(503); // Service Unavailable
        echo json_encode(['error' => 'Database connection failed', 'online' => false]);
        return;
    }
    
    // Get PUT data
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['title']) || !isset($data['content'])) {
        http_response_code(400); // Bad Request
        echo json_encode(['error' => 'Title and content are required', 'online' => true]);
        return;
    }
    
    $id = $conn->real_escape_string($id);
    $title = $conn->real_escape_string($data['title']);
    $content = $conn->real_escape_string($data['content']);
    
    $sql = "UPDATE notes SET title = '$title', content = '$content' WHERE id = '$id'";
    
    if ($conn->query($sql) === TRUE) {
        if ($conn->affected_rows > 0) {
            $note = [
                'id' => $id,
                'title' => $data['title'],
                'content' => $data['content'],
                'updated_at' => date('Y-m-d H:i:s')
            ];
            echo json_encode(['message' => 'Note updated successfully', 'data' => $note, 'online' => true]);
        } else {
            http_response_code(404); // Not Found
            echo json_encode(['error' => 'Note not found', 'online' => true]);
        }
    } else {
        http_response_code(500); // Internal Server Error
        echo json_encode(['error' => 'Error updating note: ' . $conn->error, 'online' => true]);
    }
    
    $conn->close();
}

// Delete a note
function deleteNote($id) {
    $conn = getDbConnection();
    
    if (!$conn) {
        http_response_code(503); // Service Unavailable
        echo json_encode(['error' => 'Database connection failed', 'online' => false]);
        return;
    }
    
    $id = $conn->real_escape_string($id);
    $sql = "DELETE FROM notes WHERE id = '$id'";
    
    if ($conn->query($sql) === TRUE) {
        if ($conn->affected_rows > 0) {
            echo json_encode(['message' => 'Note deleted successfully', 'online' => true]);
        } else {
            http_response_code(404); // Not Found
            echo json_encode(['error' => 'Note not found', 'online' => true]);
        }
    } else {
        http_response_code(500); // Internal Server Error
        echo json_encode(['error' => 'Error deleting note: ' . $conn->error, 'online' => true]);
    }
    
    $conn->close();
}
?>
