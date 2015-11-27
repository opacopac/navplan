<?php
	include "config.php";

	// open db connection
	$conn = new mysqli($db_host, $db_user, $db_pw, $db_name);
	$conn->set_charset("utf8");

	
	if (isset($_GET["search"])) // text search
	{
		$search = mysqli_real_escape_string($conn, $_GET["search"]);
		$query = getTextSearchQuery($search);
	}
	elseif (isset($_GET["lat"]) && isset($_GET["lon"]) && isset($_GET["rad"])) // coordinate search
	{
		$lat = mysqli_real_escape_string($conn, $_GET["lat"]);
		$lon = mysqli_real_escape_string($conn, $_GET["lon"]);
		$rad = mysqli_real_escape_string($conn, $_GET["rad"]);
		$query = getCoordinateSearchQuery($lat, $lon, $rad);
	}
	else
		die ("Error: Argument missing");


		// execute query
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
		echo "<p>" . $rs . "</p>\n";
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
	
	
	function getTextSearchQuery($search)
	{
		// cols: type, name, wpname, frequency, callsign, latitude, longitude, elevation
	
		$query = "(SELECT 'airport' AS type, CONCAT(icao, ' (', name ,')') AS name, icao AS wpname, NULL AS frequency, NULL AS callsign, latitude, longitude, elevation FROM openaip_airports WHERE";
		$query .= " icao LIKE '" . $search . "%'";
		$query .= " OR name LIKE '" . $search . "%'";
		$query .= " ORDER BY icao ASC";
		$query .= " LIMIT 10)";

		$query .= " UNION ";
		
		$query .= "(SELECT 'navaid' AS type, CONCAT(name, ' (', type, ')') AS name, CONCAT(kuerzel, ' ', type) AS wpname, frequency, kuerzel AS callsign, latitude, longitude, elevation FROM openaip_navaids WHERE";
		$query .= " kuerzel LIKE '" . $search . "%'";
		$query .= " OR name LIKE '" . $search . "%'";
		$query .= " ORDER BY kuerzel ASC";
		$query .= " LIMIT 10)";

		$query .= " UNION ";
		
		$query .= "(SELECT 'user' AS type, name, name AS wpname, NULL AS frequency, NULL AS callsign, latitude, longitude, NULL AS elevation FROM user_waypoint WHERE";
		$query .= " name LIKE '" . $search . "%'";
		$query .= " ORDER BY name ASC";
		$query .= " LIMIT 10)";

		$query .= " UNION ";
		
		$query .= "(SELECT 'geoname' as type, name, name AS wpname, NULL AS frequency, NULL AS callsign, latitude, longitude, elevation FROM geonames WHERE";
		$query .= " MATCH (name, alternatenames) AGAINST ('" . $search . "*' IN BOOLEAN MODE)";
		$query .= " AND " . getGeonamesFilterQuery();
		$query .= " ORDER BY population DESC";
		$query .= " LIMIT 10)";
		
		return $query;
	}
	
	
	function getCoordinateSearchQuery($lat, $lon, $rad)
	{
		// cols: type, name, frequency, callsign, latitude, longitude, elevation

		$query .= "SELECT 1 AS sortOrder, 'airport' AS type, CONCAT(icao, ' (', name ,')') AS name, icao as wpname, NULL AS frequency, NULL AS callsign, latitude, longitude, elevation FROM openaip_airports WHERE";
		$query .= " latitude > " . ($lat - $rad);
		$query .= " AND latitude < " . ($lat + $rad);
		$query .= " AND longitude > " . ($lon - $rad);
		$query .= " AND longitude < " . ($lon + $rad);

		$query .= " UNION ";
		
		$query .= "SELECT 2 AS sortOrder, 'navaid' AS type, CONCAT(name, ' (', type, ')') AS name, CONCAT(kuerzel, ' ', type) AS wpname, frequency, kuerzel AS callsign, latitude, longitude, elevation FROM openaip_navaids WHERE";
		$query .= " latitude > " . ($lat - $rad);
		$query .= " AND latitude < " . ($lat + $rad);
		$query .= " AND longitude > " . ($lon - $rad);
		$query .= " AND longitude < " . ($lon + $rad);
		
		$query .= " UNION ";
		
		$query .= "SELECT 3 AS sortOrder, 'user' AS type, name, name AS wpname, NULL AS frequency, NULL AS callsign, latitude, longitude, NULL AS elevation FROM user_waypoint WHERE";
		$query .= " latitude > " . ($lat - $rad);
		$query .= " AND latitude < " . ($lat + $rad);
		$query .= " AND longitude > " . ($lon - $rad);
		$query .= " AND longitude < " . ($lon + $rad);
		
		$query .= " UNION ";
		
		$query .= "SELECT 4 AS sortOrder, 'geoname' as type, name, name AS wpname, NULL AS frequency, NULL AS callsign, latitude, longitude, elevation FROM geonames WHERE";
		$query .= " latitude > " . ($lat - $rad);
		$query .= " AND latitude < " . ($lat + $rad);
		$query .= " AND longitude > " . ($lon - $rad);
		$query .= " AND longitude < " . ($lon + $rad);
		$query .= " AND " . getGeonamesFilterQuery();

		$query .= " ORDER BY";
		$query .= " sortOrder ASC,";
		$query .= "  ((latitude - " . $lat . ") * (latitude - " . $lat . ") + (longitude - " . $lon . ") * (longitude - " . $lon . ")) ASC";
		$query .= " LIMIT 8";

		return $query;
	}
	
	
	function getGeonamesFilterQuery()
	{
		$query  = "((feature_class = 'P')"; // populated place
		$query .= " OR (feature_class = 'T')"; // any terrain
		$query .= " OR (feature_class = 'H'))"; // any waterbody
		
	/*	$query .= " OR (feature_class = 'S')"; // any spot
		$query .= " OR (feature_class = 'T' AND feature_code = 'MT')"; // mountain
		$query .= " OR (feature_class = 'T' AND feature_code = 'MTS')"; // mountains
		$query .= " OR (feature_class = 'T' AND feature_code = 'PK')"; // peak
		$query .= " OR (feature_class = 'T' AND feature_code = 'PK')"; // peaks
		$query .= " OR (feature_class = 'T' AND feature_code = 'PASS')"; // pass
		$query .= " OR (feature_class = 'H' AND feature_code = 'LK'))"; // see*/
		
		return $query;
	}
	
	
	function buildReturnObject($result)
	{
		while ($rs = $result->fetch_array(MYSQLI_ASSOC))
		{
			$geonames[] = array(
				type => $rs["type"],
				name => $rs["name"],
				wpname => $rs["wpname"],
				frequency => $rs["frequency"],
				callsign => $rs["callsign"],
				latitude => $rs["latitude"],
				longitude => $rs["longitude"],
				elevation => $rs["elevation"]
			);
		}
		
		return json_encode(array("geonames" => $geonames), JSON_NUMERIC_CHECK);
	}
?> 