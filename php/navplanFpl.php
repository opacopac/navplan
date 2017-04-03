<?php
include("helper.php");

$postData = json_decode(file_get_contents('php://input'), true);

if (!$postData || !$postData["userFileName"] || !$postData["data"] || !$postData["data"]["navplan"])
    die("ERROR: data parameters missing!");


// create xml
$xml = createFplXml($postData["data"]);


// create temp file
$userFileName = checkFilename($postData["userFileName"]);
$tmpDir = createTempDir();
$tmpFile = $tmpDir . "/" . $userFileName;
file_put_contents(TMP_DIR_BASE . $tmpFile, $xml);


// return tempfile
echo json_encode(array("tmpFile" => $tmpFile), JSON_NUMERIC_CHECK);
exit;


function createFplXml($data)
{
    $routeTitle = $data["navplan"]["title"] ? $data["navplan"]["title"] : "";
    $waypoints = getWaypoints($data["navplan"]);


    // header
    $xml = '' .
        '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>' . "\n" .
        '<flight-plan xmlns="http://www8.garmin.com/xmlschemas/FlightPlan/v1">' . "\n" .
        '<created>' . getIsoTimeString() . '</created>' . "\n"; //  Format: 20170402T15:31:54Z


    // waypoints
    if ($waypoints && count($waypoints) > 0)
    {
        $xml .= '' .
            '  <waypoint-table>' . "\n" .
            '    <flight-plan-index>1</flight-plan-index>' . "\n"; // TODO: nötig?

        for ($i = 0; $i < count($waypoints); $i++)
        {
            $xml .= '' .
                '    <waypoint>' . "\n" .
                '      <identifier>' . getNormalizedName($waypoints[$i]["checkpoint"]) . '</identifier>' . "\n" .
                '      <type>' . getWpType($waypoints[$i]) . '</type>' . "\n" .
                '      <lat>' . $waypoints[$i]["latitude"] . '</lat>' . "\n" .
                '      <lon>' . $waypoints[$i]["longitude"] . '</lon>' . "\n" .
                '    </waypoint>' . "\n";
        }

        $xml .= '  </waypoint-table>' . "\n";
    }


    // route
    if ($waypoints && count($waypoints) > 0)
    {
        $xml .= '' .
            '  <route>' . "\n" .
            '    <route-name>' . $routeTitle . '</route-name>' . "\n" .
            '    <flight-plan-index>1</flight-plan-index>' . "\n"; // TODO: nötig?

        for ($i = 0; $i < count($waypoints); $i++)
        {
            $xml .= '' .
                '    <route-point lat="' . $waypoints[$i]["latitude"] . '" lon="' . $waypoints[$i]["longitude"] . '">' . "\n" .
                '      <waypoint-identifier>' . getNormalizedName($waypoints[$i]["checkpoint"]) . '</waypoint-identifier>' . "\n" .
                '      <waypoint-type>' . getWpType($waypoints[$i]) . '</waypoint-type>' . "\n" .
                '    </route-point>' . "\n";
        }

        $xml .= '  </route>' . "\n";
    }


    // footer
    $xml .= '' .
        '</flight-plan>';

    return $xml;
}


function getWaypoints($navplan)
{
    if (!$navplan["waypoints"])
        return [];

    $wpList = [];

    // regular waypoints
    for ($i = 0; $i < count($navplan["waypoints"]); $i++)
        $wpList[] = $navplan["waypoints"][$i];

    // alternate
    if ($navplan["alternate"])
        $wpList[] = $navplan["alternate"];


    return $wpList;
}


function getWpType($waypoint)
{
    switch ($waypoint["type"])
    {
        case 'airport':
            return "AIRPORT";
        case 'navaid':
            switch ($waypoint["navaid"]["type"])
            {
                case 'VOR-DME':
                case 'DVOR-DME':
                case 'VOR':
                case 'DVOR':
                case 'TACAN':
                case 'VORTAC':
                case 'DVORTAC':
                    return "VOR";
                case 'NDB':
                    return "NDB";
                default:
                    return "";
            }
        default:
            return "";
    }
}


function getNormalizedName($wpName)
{
    // only upper case
    $normName = mb_strtoupper($wpName, 'UTF-8');

    // no spaces
    $normName = str_replace(" ", "_", $normName);

    // min 3 letters
    while (strlen($normName) < 3)
        $normName .= "_";

    return $normName;
}
