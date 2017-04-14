<?php
require_once "terrainHelper.php";

$positions = [];

switch($_SERVER['REQUEST_METHOD'])
{
    case 'GET':
        if (!$_GET["lon"] || !$_GET["lat"])
            die("ERROR: parameters missing!");
        $positions[] = [ floatval($_GET["lon"]), floatval($_GET["lat"]) ];
        if ($_GET["lon2"] && $_GET["lat2"])
            $positions[] = [ floatval($_GET["lon2"]), floatval($_GET["lat2"]) ];
        break;

    case 'POST':
        $postData = json_decode(file_get_contents('php://input'), true);
        if (!$postData || !$postData["positions"] || count($postData["positions"]) == 0)
            die("ERROR: parameters missing!");
        $positions = $postData["positions"];
        break;

    default :
        die("ERROR: invalid request method");
}


$terainHelper = new TerrainHelper();
$terrainInfo = $terainHelper->getTerrainInfo($positions);

echo json_encode(array("terrain" => $terrainInfo), JSON_NUMERIC_CHECK);
