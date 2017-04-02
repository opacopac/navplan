<?php
	if (isset($_POST["data"]))
		$data = json_decode(urldecode($_POST["data"]), true);
	else
	    die("ERROR: data parameter missing!");


	// headers
    header("Content-Disposition: attachment; filename=track.kml");
	header('Content-type: application/vnd.google-earth.kml+xml');

    $xml = getHeaderXml();

    if (isset($data["wpPositions"]))
        $xml .= getWpTrackPlacemark($data["wpPositions"]);

    if (isset($data["flightPositions"]))
        $xml .= getFlightTrackPlacemark($data["flightPositions"]);

    $xml .= getFooterXml();

	// send xml
	echo($xml);


	function getHeaderXml()
	{
	    $xml = '' .
	    '<?xml version="1.0" encoding="UTF-8"?>' . "\n" .
		'<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:kml="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom">' . "\n" .
		'	<Document>' . "\n" .
		'		<name>track.kml</name>' . "\n" .
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

	    return $xml;
	}


	function getWpTrackPlacemark($positions)
	{
	    $alt = 1000;
	    $xml = '' .
		'		<Placemark>' . "\n" .
		'			<name>Waypoints</name>' . "\n" .
		'			<styleUrl>#wp_track_style</styleUrl>' . "\n" .
		'			<LineString>' . "\n" .
		'				<extrude>1</extrude>' . "\n" .
		'				<tessellate>1</tessellate>' . "\n" .
		'				<altitudeMode>relativeToGround</altitudeMode>' . "\n" .
		'				<coordinates>' . "\n";

        for ($i = 0; $i < count($positions); $i++)
            $xml .= $positions[$i]["lon"] . "," . $positions[$i]["lat"] . "," . $alt . " \n";

        $xml .= '' .
        '				</coordinates>' . "\n" .
		'			</LineString>' . "\n" .
		'		</Placemark>' . "\n";

	    return $xml;
	}


	function getFlightTrackPlacemark($positions)
	{
	    $xml = '' .
		'		<Placemark>' . "\n" .
		'			<name>Flight Track</name>' . "\n" .
		'			<styleUrl>#flight_track_style</styleUrl>' . "\n" .
		'			<LineString>' . "\n" .
		'				<extrude>1</extrude>' . "\n" .
		'				<tessellate>1</tessellate>' . "\n" .
		'				<altitudeMode>absolute</altitudeMode>' . "\n" .
		'				<coordinates>' . "\n";

        for ($i = 0; $i < count($positions); $i++)
            $xml .= $positions[$i]["lon"] . "," . $positions[$i]["lat"] . "," . $positions[$i]["alt"] . " \n";

        $xml .= '' .
        '				</coordinates>' . "\n" .
		'			</LineString>' . "\n" .
		'		</Placemark>' . "\n";

	    return $xml;
	}


	function getFooterXml()
	{
	    $xml = '' .
		'	</Document>' . "\n" .
		'</kml>';

        return $xml;
	}
?>