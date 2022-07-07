<?php
include("helper.php");

$postData = json_decode(file_get_contents('php://input'), true);

if (!$postData || !$postData["userFileName"] || !$postData["data"] || !$postData["data"]["navplan"] || !$postData["data"]["track"])
    die("ERROR: data parameters missing!");


// create xml
$xml = createGpxXml($postData["data"]);


// create temp file
$userFileName = checkFilename($postData["userFileName"]);
$tmpDir = createTempDir();
$tmpFile = $tmpDir . "/" . $userFileName;
file_put_contents(TMP_DIR_BASE . $tmpFile, $xml);


// return tempfile
echo json_encode(array("tmpFile" => $tmpFile), JSON_NUMERIC_CHECK);
exit;


function createGpxXml($data)
{
    $routeTitle = $data["navplan"]["title"] ?? "";
    $waypoints = getWaypoints($data["navplan"]);
    $trackTitle = $data["track"]["name"] ?? "";
    $trackpoints = $data["track"]["positions"] ?? [];


    // header
    $xml = '' .
        '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>' . "\n" .
        '<gpx creator="www.navplan.ch" version="1.1" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">' . "\n" .
        '  <metadata>' . "\n" .
        '  </metadata>' . "\n";


    // waypoints
    if ($waypoints && count($waypoints) > 0)
    {
        for ($i = 0; $i < count($waypoints); $i++)
        {
            $xml .= '' .
                '  <wpt lat="' . $waypoints[$i]["latitude"] . '" lon="' . $waypoints[$i]["longitude"] . '">' . "\n" .
                '    <name>' . $waypoints[$i]["checkpoint"] . '</name>' . "\n" .
                '    <type>' . getWpType($waypoints[$i]) . '</type>' . "\n" .
                '  </wpt>' . "\n";
        }
    }


    // route
    if ($waypoints && count($waypoints) > 0)
    {
        $xml .= '' .
            '  <rte>' . "\n" .
            '    <name>' . $routeTitle . '</name>' . "\n";

        for ($i = 0; $i < count($waypoints); $i++)
        {
            $xml .= '    <rtept lat="' . $waypoints[$i]["latitude"] . '" lon="' . $waypoints[$i]["longitude"] . '">' . "\n";
            $xml .= '      <name>' . $waypoints[$i]["checkpoint"] . '</name>' . "\n";
            $xml .= '      <type>' . getWpType($waypoints[$i]) . '</type>' . "\n";
            $xml .= '    </rtept>' . "\n";
        }

        $xml .= '  </rte>' . "\n";
    }


    // track
    if ($trackpoints && count($trackpoints) > 0)
    {
        $xml .= '' .
            '  <trk>' . "\n" .
            '    <name>' . $trackTitle . '</name>' . "\n" .
            '    <trkseg>' . "\n";

        for ($i = 0; $i < count($trackpoints); $i++)
        {
            $unixTimeStamp = floor($trackpoints[$i]["timestamp"] / 1000); // convert from ms to s
            $xml .= '' .
                '    <trkpt lat="' . $trackpoints[$i]["latitude"] . '" lon="' . $trackpoints[$i]["longitude"] . '">' .
                '<ele>' . $trackpoints[$i]["altitude"] . '</ele>' .
                '<time>' . getIsoTimeString($unixTimeStamp) . '</time>' .
                '</trkpt>' . "\n";
        }

        $xml .= '' .
            '    </trkseg>' . "\n" .
            '  </trk>' . "\n";
    }


    // footer
    $xml .= '' .
        '</gpx>';


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
            return "Airport";
        case 'report':
            return "Fix";
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

            return "Waypoint";
        default:
            return "Waypoint";
    }
}


function endsWith($haystack, $needle) {
    $length = strlen($needle);
    return $length > 0 ? substr($haystack, -$length) === $needle : true;
}
