<?php
	include "config.php";
	include "helper.php";

	// open db connection
	$conn = new mysqli($db_host, $db_user, $db_pw, $db_name);
	$conn->set_charset("utf8");

	
	$query  = "SELECT";
	$query .= "  apt.id,";
	$query .= "  apt.type,";
	$query .= "  apt.name,";
	$query .= "  apt.icao,";
	$query .= "  apt.latitude,";
	$query .= "  apt.longitude,";
	$query .= "  rwy.surface,";
	$query .= "  rwy.direction1,";
	$query .= "  rad.frequency,";
	$query .= "  (CASE WHEN rad.type = 'TOWER' THEN 'TWR' WHEN rad.frequency IS NOT NULL THEN 'AD' ELSE NULL END) AS callsign";
	$query .= " FROM openaip_airports AS apt";
	$query .= " INNER JOIN openaip_runways AS rwy ";
	$query .= "   ON rwy.id = (SELECT rwy2.id FROM openaip_runways AS rwy2 WHERE rwy2.airport_id = apt.id ORDER BY rwy2.length DESC LIMIT 1)";
	$query .= " LEFT JOIN openaip_radios AS rad ";
	$query .= "   ON rad.id = (SELECT rad2.id FROM openaip_radios AS rad2 WHERE rad2.airport_id = apt.id AND rad2.category = 'COMMUNICATION' AND (rad2.type = 'TOWER' OR rad2.type = 'INFO' OR (rad2.type = 'OTHER' && rad2.typespec LIKE 'AD%')) ORDER BY rad2.type DESC LIMIT 1)";
	$query .= " ORDER BY apt.id";
		
	$result = $conn->query($query);
	
	if ($result === FALSE)
		die("error reading airports: " . $conn->error . " query:" . $query);
	
	
	while ($rs = $result->fetch_array(MYSQLI_ASSOC))
	{
		// build return object
		$airports[] = array(
			id => $rs["id"],
			type => $rs["type"],
			name => $rs["name"],
			icao => $rs["icao"],
			latitude => $rs["latitude"],
			longitude => $rs["longitude"],
			rwy_surface => $rs["surface"],
			rwy_direction1 => $rs["direction1"],
			frequency => $rs["frequency"],
			callsign => $rs["callsign"]
		);
	}
	
	$conn->close();
	
	$return_object = json_encode(array("airports" => $airports), JSON_NUMERIC_CHECK);
	
	
	// return output
	header("Content-Type: application/json; charset=UTF-8");

	echo($return_object);
?>