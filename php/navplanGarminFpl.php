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
    $routeTitle = getTitle($data["navplan"]["title"] ?? "");
    $waypoints = getWaypoints($data["navplan"]);


    // header
    $xml = '' .
        '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>' . "\n" .
        '<flight-plan xmlns="http://www8.garmin.com/xmlschemas/FlightPlan/v1">' . "\n" .
        '<created>' . getTimeString() . '</created>' . "\n";


    // waypoints
    if ($waypoints && count($waypoints) > 0)
    {
        $countryCode = substr($waypoints[0]["checkpoint"], 0, 2); // TODO: hack

        $xml .= '' .
            '  <waypoint-table>' . "\n";

        $uniqueWaypoints = getUniqueWaypoints($waypoints);
        foreach ($uniqueWaypoints as $wp) {
            $xml .= '' .
                '    <waypoint>' . "\n" .
                '      <identifier>' . getNormalizedName($wp) . '</identifier>' . "\n" .
                '      <type>' . getWpType($wp) . '</type>' . "\n" .
                '      <country-code>' . $countryCode . '</country-code>' . "\n" .
                '      <lat>' . $wp["latitude"] . '</lat>' . "\n" .
                '      <lon>' . $wp["longitude"] . '</lon>' . "\n" .
                '      <comment></comment>' . "\n" .
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

        foreach ($waypoints as $wp) {
            $xml .= '' .
                '    <route-point>' . "\n" .
                '      <waypoint-identifier>' . getNormalizedName($wp) . '</waypoint-identifier>' . "\n" .
                '      <waypoint-type>' . getWpType($wp) . '</waypoint-type>' . "\n" .
                '      <waypoint-country-code>' . $countryCode . '</waypoint-country-code>' . "\n" .
                '    </route-point>' . "\n";
        }

        $xml .= '  </route>' . "\n";
    }


    // footer
    $xml .= '' .
        '</flight-plan>';

    return $xml;
}


// <xsd:pattern value="([A-Z0-9 /]{1,25})|" />
function getTitle($title = "") {
    // only upper case
    $normTitle = mb_strtoupper($title, 'UTF-8');

    // replace umplaute
    $normTitle = replaceUmlaute($normTitle);

    // remove all not allowed chars
    $normTitle = preg_replace('/[^A-Z0-9 \/]/', "", $normTitle);

    // max 25 characters
    if (strlen($normTitle) > 25) {
        $normTitle = substr($normTitle, 0, 25);
    }

    return $normTitle;
}


//  Format: 2021-07-03T12:35:16Z
function getTimeString($timestamp = null)
{
    if (!$timestamp)
        $timestamp = time();

    return gmdate('Y-m-d\Th:i:s\Z', $timestamp);
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


function getUniqueWaypoints($waypoints) {
    return array_reduce(
        $waypoints,
        function($uniqueWps, $item) {
            if (count(array_filter(
                    $uniqueWps,
                    function ($wp) use ($item) { return $wp["checkpoint"] == $item["checkpoint"]; }
                )) == 0) {
                return array_merge($uniqueWps, [$item]);
            } else {
                return $uniqueWps;
            }
        },
        []
    );
}


function getWpType($waypoint)
{
    switch ($waypoint["type"])
    {
        case 'airport':
            return "AIRPORT";
        case 'navaid':
            $vorSuffixes = ['VOR-DME', 'DVOR-DME', 'VOR','DVOR', 'TACAN', 'VORTAC', 'DVORTAC'];
            foreach ($vorSuffixes as $vorSuffix) {
                if (endsWith($waypoint["checkpoint"], $vorSuffix)) {
                    return "VOR";
                }
            }

            $ndbSuffixes = ['NDB'];
            foreach ($ndbSuffixes as $ndbSuffix) {
                if (endsWith($waypoint["checkpoint"], $ndbSuffix)) {
                    return "NDB";
                }
            }

            return "USER WAYPOINT";
        default:
            return "USER WAYPOINT";
    }
}


// <xsd:pattern value="[A-Z0-9]{1,12}" />
function getNormalizedName($wp)
{
    $wpName = $wp["type"] == "navaid" ? $wp["callsign"] : $wp["checkpoint"];

    // only upper case
    $normName = mb_strtoupper($wpName, 'UTF-8');

    // replace umplaute
    $normName = replaceUmlaute($normName);

    // remove all not allowed chars
    $normName = preg_replace('/[^A-Z0-9]/', "", $normName);

    // max 12 characters
    if (strlen($normName) > 12) {
        $normName = substr($normName, 0, 12);
    }

    return $normName;
}


function replaceUmlaute($text) {
    $search =  array("Ä",  "Ö",  "Ü",  "ß",  "À", "Ê", "È", "É");
    $replace = array("AE", "OE", "UE", "SS", "A", "E", "E", "E");

    return str_replace($search, $replace, $text);
}


function endsWith($haystack, $needle) {
    $length = strlen($needle);
    return $length > 0 ? substr($haystack, -$length) === $needle : true;
}
