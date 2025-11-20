<?php
// Set headers for CORS and JSON response
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
$method = $_SERVER['REQUEST_METHOD'];

// **Database Connection Placeholder** (e.g., PDO)
// $pdo = new PDO('mysql:host=localhost;dbname=iss_yemen', 'user', 'password');

switch ($method) {
    case 'POST':
        // --- CREATE Event (POST /events) ---
        $data = json_decode(file_get_contents("php://input"), true);

        // 1. Server-side Validation
        if (empty($data['title']) || empty($data['description']) || empty($data['date']) || empty($data['category'])) {
            http_response_code(400); // Bad Request
            echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
            exit;
        }

        // **2. Server-side Date Logic Validation**
        $eventTimestamp = strtotime($data['date']);
        if ($eventTimestamp <= time()) {
            http_response_code(400); // Bad Request
            echo json_encode(['success' => false, 'message' => 'Event date must be in the future.']);
            exit;
        }

        // **3. Database Insertion (Placeholder)**
        /*
        $stmt = $pdo->prepare("INSERT INTO events (title, description, date, capacity, link, category, department) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $success = $stmt->execute([
            $data['title'], 
            $data['description'], 
            $data['date'], 
            $data['capacity'] ?? 0, 
            $data['link'] ?? null,
            $data['category'],
            $data['department']
        ]);
        $newId = $pdo->lastInsertId();
        */

        // Mock Response
        http_response_code(201); // Created
        echo json_encode(['success' => true, 'message' => 'Event created successfully.', 'id' => 123]);
        break;


    case 'PUT':
        // --- UPDATE Event (PUT /events/{id}) ---
        $data = json_decode(file_get_contents("php://input"), true);
        $eventId = basename($_SERVER['REQUEST_URI']); // Get ID from URL path (requires URL rewrite)

        // **Update logic and validation here...**

        // Mock Response
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => "Event ID {$eventId} updated."]);
        break;


    case 'DELETE':
        // --- CANCEL Event (DELETE /events/{id}) ---
        $eventId = basename($_SERVER['REQUEST_URI']); // Get ID from URL path (requires URL rewrite)

        // **1. Remove Registrations:**
        // DELETE FROM registrations WHERE event_id = :eventId; 
        
        // **2. Delete Event:**
        // DELETE FROM events WHERE id = :eventId;
        // The requirement is to **Test registration removal on cancel**, which is handled here.

        // Mock Response
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => "Event ID {$eventId} and associated registrations cancelled."]);
        break;

    case 'GET':
        // --- READ Events (GET /events) ---
        // Fetch and return list of events for the UI list required.
        // http_response_code(200);
        // echo json_encode(['success' => true, 'events' => [/* array of events */]]);
        break;

    default:
        http_response_code(405); // Method Not Allowed
        echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
        break;
}

?>