<?php
	include "config.php";

	$raw_input = file_get_contents('php://input');
	$input = json_decode($raw_input, true);
	
	switch($input["action"])
	{
		case "searchByName":
			searchByName();
			break;
		case "searchByPosition":
			searchByPosition();
			break;
		default:
			die("missing or unknown action!");
	}
	
	
	function searchByName()
	{
		global $input;

		$conn = openDb();

		$search = mysqli_real_escape_string($conn, $input["search"]);
		$email = mysqli_real_escape_string($conn, $input["email"]);
		$token = mysqli_real_escape_string($conn, $input["token"]);
	
	
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
		
		$query .= "(SELECT 'global' AS type, name, name AS wpname, NULL AS frequency, NULL AS callsign, latitude, longitude, NULL AS elevation FROM global_waypoints WHERE";
		$query .= " name LIKE '" . $search . "%'";
		$query .= " ORDER BY name ASC";
		$query .= " LIMIT 10)";

		$query .= " UNION ";
		
		$query .= "(SELECT 'user' AS type, name, name AS wpname, NULL AS frequency, NULL AS callsign, latitude, longitude, NULL AS elevation FROM user_waypoints AS uwp";
		$query .= " INNER JOIN users AS usr ON uwp.user_id = usr.id";
		$query .= " WHERE usr.email = '" . $email . "' AND usr.token = '" . $token . "'";
		$query .= " AND name LIKE '" . $search . "%'";
		$query .= " ORDER BY name ASC";
		$query .= " LIMIT 10)";

		$query .= " UNION ";
		
		$query .= "(SELECT 'geoname' as type, name, name AS wpname, NULL AS frequency, NULL AS callsign, latitude, longitude, elevation FROM geonames WHERE";
		$query .= " MATCH (name, alternatenames) AGAINST ('" . $search . "*' IN BOOLEAN MODE)";
		$query .= " AND " . getGeonamesFilterQuery();
		$query .= " ORDER BY population DESC";
		$query .= " LIMIT 10)";
		
		// execute query
		$result = $conn->query($query);
		
		$conn->close();
		
		echo buildReturnObject($result);
	}
	
	
	function searchByPosition()
	{
		global $input;

		$conn = openDb();

		$lat = mysqli_real_escape_string($conn, $input["lat"]);
		$lon = mysqli_real_escape_string($conn, $input["lon"]);
		$rad = mysqli_real_escape_string($conn, $input["rad"]);
		$email = mysqli_real_escape_string($conn, $input["email"]);
		$token = mysqli_real_escape_string($conn, $input["token"]);

	
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
		
		$query .= "SELECT 3 AS sortOrder, 'global' AS type, name, name AS wpname, NULL AS frequency, NULL AS callsign, latitude, longitude, NULL AS elevation FROM global_waypoints WHERE";
		$query .= " latitude > " . ($lat - $rad);
		$query .= " AND latitude < " . ($lat + $rad);
		$query .= " AND longitude > " . ($lon - $rad);
		$query .= " AND longitude < " . ($lon + $rad);
		
		$query .= " UNION ";
		
		$query .= "SELECT 4 AS sortOrder, 'user' AS type, name, name AS wpname, NULL AS frequency, NULL AS callsign, latitude, longitude, NULL AS elevation FROM user_waypoints AS uwp";
		$query .= " INNER JOIN users AS usr ON uwp.user_id = usr.id";
		$query .= " WHERE usr.email = '" . $email . "' AND usr.token = '" . $token . "'";
		$query .= " AND latitude > " . ($lat - $rad);
		$query .= " AND latitude < " . ($lat + $rad);
		$query .= " AND longitude > " . ($lon - $rad);
		$query .= " AND longitude < " . ($lon + $rad);
		
		$query .= " UNION ";
		
		$query .= "SELECT 5 AS sortOrder, 'geoname' as type, name, name AS wpname, NULL AS frequency, NULL AS callsign, latitude, longitude, elevation FROM geonames WHERE";
		$query .= " latitude > " . ($lat - $rad);
		$query .= " AND latitude < " . ($lat + $rad);
		$query .= " AND longitude > " . ($lon - $rad);
		$query .= " AND longitude < " . ($lon + $rad);
		$query .= " AND " . getGeonamesFilterQuery();

		$query .= " ORDER BY";
		$query .= " sortOrder ASC,";
		$query .= "  ((latitude - " . $lat . ") * (latitude - " . $lat . ") + (longitude - " . $lon . ") * (longitude - " . $lon . ")) ASC";
		$query .= " LIMIT 8";
		
		// execute query
		$result = $conn->query($query);
		
		$conn->close();
		
		echo buildReturnObject($result);
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
		$geonames = [];
	
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