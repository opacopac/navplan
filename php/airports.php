<?php
	include "config.php";

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
	
	// build return object
	$return_object = buildReturnObject($result);
	$conn->close();
	
	
	// return output
	if (isset($_GET["debug"]))
	{
		echo "<html><body>\n";
		echo "<h1>DEBUG MODE</h1>\n";
		echo "<h2>QUERY</h2>";
		echo "<p style='font-family: courier'>" . $query . "</p>\n";
		echo "<h2>DB RESULT</h2>\n";
		echo "<p>" . $result . "</p>\n";
		echo "<h2>RETURN OBJECT</h2>\n";
		echo "<p>" . $return_object . "</p>\n";
		echo "</body></html>\n";
	}
	else
	{
		header("Access-Control-Allow-Origin: *"); //TODO: remove
		header("Content-Type: application/json; charset=UTF-8");
	
		echo($return_object);
	}
	
	
	function buildReturnObject($result)
	{
		while ($rs = $result->fetch_array(MYSQLI_ASSOC))
		{
			$airports[] = array(
				id => $rs["id"],
				type => $rs["type"],
//				country => $rs["country"],
				name => $rs["name"],
				icao => $rs["icao"],
				latitude => $rs["latitude"],
				longitude => $rs["longitude"],
//				elevation => $rs["elevation"],
				rwy_surface => $rs["surface"],
				rwy_direction1 => $rs["direction1"],
				frequency => $rs["frequency"],
				callsign => $rs["callsign"]
			);
		}
		
		return json_encode(array("airports" => $airports), JSON_NUMERIC_CHECK);
	}
?> 