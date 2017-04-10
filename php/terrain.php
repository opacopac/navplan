<?php
include("helper.php");

const TERRAIN_TILE_BASE_DIR = '../terraintiles/';
const TERRAIN_TILE_SUFFIX = '.hgt';
const LINE_SIZE = 1201;
const MAX_LINES = 1201;
const RESOLUTION_M = 100;
const MAX_STEPS_PER_LEG = 500;

$fileList = array();
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

$terrain = array();
$terrain["legs"] = [];


if (count($positions) == 1) // single position
{
    $elevations = [];
    $elevations[] = getElevation($positions[0]);
    $legInfo = createLegInfo($positions[0], $positions[0], $elevations);
    $terrain["legs"][] = $legInfo;
    $terrain["totaldistance_m"] = $legInfo["distance_m"];
    $terrain["maxelevation_m"] = $legInfo["maxelevation_m"];
}
else // multiple positions
{
    $totaldistance = 0;
    $maxelevation_m = -10000;
    for ($i = 0; $i < count($positions) - 1; $i++)
    {
        $elevations = getLegElevations($positions[$i], $positions[$i + 1]);
        $legInfo = createLegInfo($positions[$i], $positions[$i + 1], $elevations);
        $totaldistance += $legInfo["distance_m"];
        $maxelevation_m = max($maxelevation_m, $legInfo["maxelevation_m"]);
        $terrain["legs"][] = $legInfo;
    }
    $terrain["totaldistance_m"] = $totaldistance;
    $terrain["maxelevation_m"] = $maxelevation_m;
}

closeFiles();

echo json_encode(array("terrain" => $terrain), JSON_NUMERIC_CHECK);
exit;


function getLegElevations($pos1, $pos2)
{
    $dist_m = calcDistanceMeters($pos1[1], $pos1[0], $pos2[1], $pos2[0]);
    $resolution = max(RESOLUTION_M, $dist_m / MAX_STEPS_PER_LEG);

    $elevations = [];
    for ($i = 0; $i < $dist_m; $i += $resolution)
    {
        $lat = $pos1[1] + ($pos2[1] - $pos1[1]) / $dist_m * $i;
        $lon = $pos1[0] + ($pos2[0] - $pos1[0]) / $dist_m * $i;
        $elevations[] = getElevation([ $lon, $lat ]);
    }

    return $elevations;
}


function getElevation($position)
{
    $filepath = getTerrainFilePath($position);
    $file = getFile($filepath);

    if ($file == null) // empty values => assume 0m
        return 0;

    $seekPos = getSeekPos($position);
    fseek($file, $seekPos);
    $value = fread($file, 2);
    $height = getHeightFromValue($value);

    return $height;
}


function getTerrainFilePath($position)
{
    $lon = $position[0];
    $lat = $position[1];

    $filename = $lat >= 0 ? "N" : "S";
    $filename .= zeroPad(abs(floor($lat)), 2);
    $filename .= $lon >= 0 ? "E" : "W";
    $filename .= zeroPad(abs(floor($lon)), 3);

    return TERRAIN_TILE_BASE_DIR . $filename . TERRAIN_TILE_SUFFIX;
}


function getFile($filepath)
{
    global $fileList;

    if ($fileList[$filepath])
        return $fileList[$filepath];

    if (!file_exists($filepath))
        return null;

    $file = fopen($filepath, "r");
    $fileList[$filepath] = $file;

    return $file;
}


function closeFiles()
{
    global $fileList;

    foreach ($fileList as $file)
        fclose($file);
}


function getSeekPos($position)
{
    $lonProc = $position[0] - floor($position[0]);
    $latProc = $position[1] - floor($position[1]);
    $latProc = 1.00 - $latProc;

    $line = floor($latProc * (MAX_LINES - 1));
    $col = floor($lonProc * (LINE_SIZE - 1));
    $seekPos = 2 * ($line * LINE_SIZE + $col);

    return $seekPos;
}


function getHeightFromValue($value)
{
    $tmpVal = unpack("n", $value);
    $height = $tmpVal[1];
    if($height >= pow(2, 15))
        $height -= pow(2, 16);

    return $height;
}


function createLegInfo($pos1, $pos2, $elevations)
{
    $leg = array();
    $leg["position1"] = array("longitude" => $pos1[0], "latitude" => $pos1[1]);
    $leg["position2"] = array("longitude" => $pos2[0], "latitude" => $pos2[1]);
    $leg["distance_m"] = calcDistanceMeters($pos1[1], $pos1[0], $pos2[1], $pos2[0]);
    $leg["maxelevation_m"] = max($elevations);
    $leg["elevations_m"] = $elevations;

    return $leg;
}
