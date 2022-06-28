<?php
include("helper.php");

$postData = json_decode(file_get_contents('php://input'), true);

if (!$postData || !$postData["userFileName"] || !$postData["data"] || !$postData["data"]["navplan"] || !$postData["data"]["track"])
    die("ERROR: data parameters missing!");


// create xml
$xml = createKmlXml($postData["data"]);


// create temp file
$userFileName = checkFilename($postData["userFileName"]);
$tmpDir = createTempDir();
$tmpFile = $tmpDir . "/" . $userFileName;
file_put_contents(TMP_DIR_BASE . $tmpFile, $xml);


// return tempfile
echo json_encode(array("tmpFile" => $tmpFile), JSON_NUMERIC_CHECK);
exit;


function createKmlXml($data)
{
    $routeTitle = $data["navplan"]["title"] ?? "";
    $waypoints = getWaypoints($data["navplan"]);
    $trackTitle = $data["track"]["name"] ?? "";
    $trackpoints = $data["track"]["positions"] ?? [];
    $title = $routeTitle ? $routeTitle : $trackTitle;


    // header
    $xml = '' .
        '<?xml version="1.0" encoding="UTF-8"?>' . "\n" .
        '<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:kml="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom">' . "\n" .
        '	<Document>' . "\n" .
        '		<name>' . $title . '</name>' . "\n" .
        '		<Style id="wp_track_style">' . "\n" .
        '			<LineStyle>' . "\n" .
        '				<color>ffff00ff</color>' . "\n" .
        '				<width>3</width>' . "\n" .
        '			</LineStyle>' . "\n" .
        '			<PolyStyle>' . "\n" .
        '				<color>4cff00ff</color>' . "\n" .
        '			</PolyStyle>' . "\n" .
        '		</Style>' . "\n" .
        '		<Style id="flight_track_style">' . "\n" .
        '			<LineStyle>' . "\n" .
        '				<color>ffff0000</color>' . "\n" .
        '				<width>2</width>' . "\n" .
        '			</LineStyle>' . "\n" .
        '			<PolyStyle>' . "\n" .
        '				<color>4cff00ff</color>' . "\n" .
        '			</PolyStyle>' . "\n" .
        '		</Style>' . "\n";


    // route
    if ($waypoints && count($waypoints) > 0)
    {
        $alt = 1000;
        $xml .= '' .
            '		<Placemark>' . "\n" .
            '			<name>Waypoints</name>' . "\n" .
            '			<styleUrl>#wp_track_style</styleUrl>' . "\n" .
            '			<LineString>' . "\n" .
            '				<extrude>1</extrude>' . "\n" .
            '				<tessellate>1</tessellate>' . "\n" .
            '				<altitudeMode>relativeToGround</altitudeMode>' . "\n" .
            '				<coordinates>' . "\n";

        for ($i = 0; $i < count($waypoints); $i++)
            $xml .= $waypoints[$i]["longitude"] . "," . $waypoints[$i]["latitude"] . "," . $alt . " \n";

        $xml .= '' .
            '				</coordinates>' . "\n" .
            '			</LineString>' . "\n" .
            '		</Placemark>' . "\n";
    }


    // track
    if ($trackpoints && count($trackpoints) > 0)
    {
        $xml .= '' .
            '		<Placemark>' . "\n" .
            '			<name>Flight Track</name>' . "\n" .
            '			<styleUrl>#flight_track_style</styleUrl>' . "\n" .
            '			<LineString>' . "\n" .
            '				<extrude>1</extrude>' . "\n" .
            '				<tessellate>1</tessellate>' . "\n" .
            '				<altitudeMode>absolute</altitudeMode>' . "\n" .
            '				<coordinates>' . "\n";

        for ($i = 0; $i < count($trackpoints); $i++)
            $xml .= $trackpoints[$i]["longitude"] . "," . $trackpoints[$i]["latitude"] . "," . $trackpoints[$i]["altitude"] . " \n";

        $xml .= '' .
            '				</coordinates>' . "\n" .
            '			</LineString>' . "\n" .
            '		</Placemark>' . "\n";
    }


    // footer
    $xml .= '' .
    '	</Document>' . "\n" .
    '</kml>';


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
