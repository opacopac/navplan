<?php
// Allow your frontend to call this endpoint
header("Access-Control-Allow-Origin: https://www.navplan.ch");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

// Get the bbox parameter from the frontend request
if (!isset($_GET['bbox'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing bbox parameter"]);
    exit;
}

$bbox = urlencode($_GET['bbox']);

// Build the AviationWeather API URL
$apiUrl = "https://aviationweather.gov/api/data/metar?format=json&taf=true&bbox=" . $bbox;

// Use cURL to fetch the data server-side
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Forward the response
if ($httpcode === 200 && $response !== false) {
    header("Content-Type: application/json");
    echo $response;
} elseif ($httpcode === 204) { // No Content
    header("Content-Type: application/json");
    echo json_encode([]); // return empty array
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to fetch METAR data"]);
}
