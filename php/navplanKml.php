<?php
	if (isset($_GET["data"]))
	{
		$data = json_decode($_GET["data"], true);
		$waypoints = $data["waypoints"];
	}

	$xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n" .
		'<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:kml="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom">' . "\n" .
		'	<Document>' . "\n" .
		'		<name>track.kml</name>' . "\n" .
		'		<Style id="track_style">' . "\n" .
		'			<LineStyle>' . "\n" .
		'				<color>ffff00ff</color>' . "\n" .
		'				<width>3</width>' . "\n" .
		'			</LineStyle>' . "\n" .
		'			<PolyStyle>' . "\n" .
		'				<color>4cff00ff</color>' . "\n" .
		'			</PolyStyle>' . "\n" .
		'		</Style>' . "\n" .
		'		<Placemark>' . "\n" .
		'			<name>Track XY</name>' . "\n" .
		'			<styleUrl>#track_style</styleUrl>' . "\n" .
		'			<LineString>' . "\n" .
		'				<extrude>1</extrude>' . "\n" .
		'				<tessellate>1</tessellate>' . "\n" .
		//'				<altitudeMode>absolute</altitudeMode>' . "\n" .
		'				<altitudeMode>relativeToGround</altitudeMode>' . "\n" .
		'				<coordinates>' . "\n";

	for ($i = 0; $i < count($waypoints); $i++)
	{
		if ($i == 0 || $i == count($waypoints) - 1)
			$alt = 0;
		else
			$alt = 1000;
		
		$xml .= $waypoints[$i]["longitude"] . "," . $waypoints[$i]["latitude"] . "," . $alt . " \n";
	}
	
	$xml .= '				</coordinates>' . "\n" .
		'			</LineString>' . "\n" .
		'		</Placemark>' . "\n" .
		'	</Document>' . "\n" .
		'</kml>';


	// headers
    header("Content-Disposition: attachment; filename=track.kml");
	header('Content-type: application/vnd.google-earth.kml+xml');
		
	// send xml
	echo($xml);
?> 