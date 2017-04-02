<?php
if (isset($_POST["data"]))
    $data = json_decode(urldecode($_POST["data"]), true);
else
    die("ERROR: data parameter missing!");


// headers
header("Content-Disposition: attachment; filename=waypoints.gpx");
header('Content-type: application/gpx+xml');


// create xml
$xml = getHeaderXml();
$xml .= getRouteXml($data["routeTitle"], $data["waypoints"]);
$xml .= getTrackXml($data["trackTitle"], $data["trackpoints"]);
$xml .= getFooterXml();


// return xml
echo($xml);


function getHeaderXml()
{
    $xml = '' .
        '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>' . "\n" .
        '<gpx creator="www.navplan.ch" version="1.1" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">' . "\n" .
        '  <metadata>' . "\n" .
        '  </metadata>' . "\n";

    return $xml;
}


function getRouteXml($title, $waypoints)
{
    if (!$waypoints || count($waypoints) == 0)
        return '';

    $xml = '' .
        '  <rte>' . "\n" .
        '    <name>' . $title . '</name>' . "\n";

    for ($i = 0; $i < count($waypoints); $i++)
    {
        $xml .= '    <rtept lat="' . $waypoints[$i]["lat"] . '" lon="' . $waypoints[$i]["lon"] . '">' . "\n";
        $xml .= '      <name>' . $waypoints[$i]["name"] . '</name>' . "\n";
        $xml .= '      <type>Waypoint</type>' . "\n";
        $xml .= '    </rtept>' . "\n";
    }

    $xml .= '  </rte>' . "\n";

    return $xml;
}


function getTrackXml($title, $trackpoints)
{
    if (!$trackpoints || count($trackpoints) == 0)
        return '';

    $xml = '' .
        '  <trk>' . "\n" .
        '    <name>' . $title . '</name>' . "\n" .
        '    <trkseg>' . "\n";

    for ($i = 0; $i < count($trackpoints); $i++)
    {
        $xml .= '' .
            '      <trkpt lat="' . $trackpoints[$i]["lat"] . '" lon="' . $trackpoints[$i]["lon"] . '">' .
            '<ele>' . $trackpoints[$i]["alt"] . '</ele>' .
            '<time>' . $trackpoints[$i]["time"] . '</time>' .
            '</trkpt>' . "\n";
    }

    $xml .= '' .
        '    </trkseg>' . "\n" .
        '  </trk>' . "\n";

    return $xml;
}


function getFooterXml()
{
    $xml = '' .
        '</gpx>';

    return $xml;
}
