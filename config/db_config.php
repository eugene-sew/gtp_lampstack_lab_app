<?php
// Database configuration
// Simple .env loader that stores values in a global array
$GLOBALS['env_vars'] = array();

function loadEnv($path = null) {
    if ($path === null) {
        $path = dirname(__FILE__) . '/../.env';
    }
    if (!file_exists($path)) return;
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        
        list($key, $value) = array_map('trim', explode('=', $line, 2));
        $GLOBALS['env_vars'][$key] = $value;
    }
}

// Function to get environment variable with fallback
function env($key, $default = null) {
    // Check in our loaded env vars first
    if (isset($GLOBALS['env_vars'][$key])) {
        return $GLOBALS['env_vars'][$key];
    }
    
    // Then check in $_ENV and $_SERVER
    if (isset($_ENV[$key])) {
        return $_ENV[$key];
    }
    
    if (isset($_SERVER[$key])) {
        return $_SERVER[$key];
    }
    
    // Finally try getenv but don't rely on it
    $value = getenv($key);
    if ($value !== false) {
        return $value;
    }
    
    return $default;
}

loadEnv();

define('DB_HOST', env('DB_HOST', 'localhost'));
define('DB_USER', env('DB_USER', 'root'));
define('DB_PASS', env('DB_PASS', ''));
define('DB_NAME', env('DB_NAME', 'notes_app'));

// Create connection
function getDbConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    // Check connection
    if ($conn->connect_error) {
        return null;
    }
    
    return $conn;
}

// Check if database connection is available
function isDatabaseAvailable() {
    $conn = getDbConnection();
    if ($conn === null) {
        return false;
    }
    $conn->close();
    return true;
}
?>
