<?php
	include "config.php";
	include "helper.php";

	$conn = openDb();

	switch($_GET["action"])
	{
		case "searchByName":
			searchByName(
			    checkEscapeString($conn, $_GET["search"], 1, 100),
			    $_COOKIE["email"] ? checkEscapeEmail($conn, $_COOKIE["email"]) : NULL,
                $_COOKIE["token"] ? checkEscapeToken($conn, $_COOKIE["token"]) : NULL
			);
			break;
		case "searchByPosition":
			searchByPosition(
			    checkNumeric($_GET["lat"]),
			    checkNumeric($_GET["lon"]),
			    checkNumeric($_GET["rad"]),
			    $_COOKIE["email"] ? checkEscapeEmail($conn, $_COOKIE["email"]) : NULL,
                $_COOKIE["token"] ? checkEscapeToken($conn, $_COOKIE["token"]) : NULL
            );
			break;
		default:
			die("unknown action!");
	}

	
	function searchByName($search, $email, $token)
	{
		global $conn;


		// cols: type, id, name, wpname, frequency, callsign, airport_icao, latitude, longitude, elevation
	
		$query = "(SELECT 'airport' AS type, id, CONCAT(icao, ' (', name ,')') AS name, icao AS wpname, NULL AS frequency, NULL AS callsign, icao AS airport_icao, latitude, longitude, elevation FROM openaip_airports WHERE";
		$query .= " icao LIKE '" . $search . "%'";
		$query .= " OR name LIKE '" . $search . "%'";
		$query .= " ORDER BY icao ASC";
		$query .= " LIMIT 10)";

		$query .= " UNION ";
		
		$query .= "(SELECT 'navaid' AS type, id, CONCAT(name, ' (', type, ')') AS name, CONCAT(kuerzel, ' ', type) AS wpname, frequency, kuerzel AS callsign, NULL AS airport_icao, latitude, longitude, elevation FROM openaip_navaids WHERE";
		$query .= " kuerzel LIKE '" . $search . "%'";
		$query .= " OR name LIKE '" . $search . "%'";
		$query .= " ORDER BY kuerzel ASC";
		$query .= " LIMIT 10)";

		$query .= " UNION ";
		
		$query .= "(SELECT 'report' AS type, id, CONCAT(name , ' (', airport_icao, ')') AS name, name AS wpname, NULL AS frequency, NULL AS callsign, airport_icao, latitude, longitude, NULL AS elevation FROM reporting_points WHERE";
		$query .= " airport_icao LIKE '" . $search . "%'";
		$query .= " ORDER BY airport_icao ASC, name ASC";
		$query .= " LIMIT 10)";

        if ($email && $token)
        {
            $query .= " UNION ";

            $query .= "(SELECT 'user' AS type, uwp.id, name, name AS wpname, NULL AS frequency, NULL AS callsign, NULL AS airport_icao, latitude, longitude, NULL AS elevation FROM user_waypoints AS uwp";
            $query .= " INNER JOIN users AS usr ON uwp.user_id = usr.id";
            $query .= " WHERE usr.email = '" . $email . "' AND usr.token = '" . $token . "'";
            $query .= " AND name LIKE '" . $search . "%'";
            $query .= " ORDER BY name ASC";
            $query .= " LIMIT 10)";
		}

		$query .= " UNION ";
		
		$query .= "(SELECT 'geoname' AS type, geonameid AS id, name, name AS wpname, NULL AS frequency, NULL AS callsign, NULL AS airport_icao, latitude, longitude, elevation FROM geonames WHERE";
		$query .= " MATCH (name, alternatenames) AGAINST ('" . $search . "*' IN BOOLEAN MODE)";
		$query .= " AND " . getGeonamesFilterQuery();
		$query .= " ORDER BY population DESC";
		$query .= " LIMIT 10)";
		
		// execute query
		$result = $conn->query($query);
		
		if ($result === FALSE)
			die("error searching geoname: " . $conn->error . " query:" . $query);
		
		echo buildReturnObject($result, $conn);

		$conn->close();
	}
	
	
	function searchByPosition($lat, $lon, $rad, $email, $token)
	{
		global $conn;


		// cols: sortorder, type, id, name, frequency, callsign, latitude, longitude, elevation

		$query .= "SELECT 1 AS sortOrder, 'airport' AS type, id, CONCAT(icao, ' (', name ,')') AS name, icao as wpname, NULL AS frequency, NULL AS callsign, icao AS airport_icao, latitude, longitude, elevation FROM openaip_airports WHERE";
		$query .= " latitude > " . ($lat - $rad);
		$query .= " AND latitude < " . ($lat + $rad);
		$query .= " AND longitude > " . ($lon - $rad);
		$query .= " AND longitude < " . ($lon + $rad);

		$query .= " UNION ";
		
		$query .= "SELECT 2 AS sortOrder, 'navaid' AS type, id, CONCAT(name, ' (', type, ')') AS name, CONCAT(kuerzel, ' ', type) AS wpname, frequency, kuerzel AS callsign, NULL AS airport_icao, latitude, longitude, elevation FROM openaip_navaids WHERE";
		$query .= " latitude > " . ($lat - $rad);
		$query .= " AND latitude < " . ($lat + $rad);
		$query .= " AND longitude > " . ($lon - $rad);
		$query .= " AND longitude < " . ($lon + $rad);
		
		$query .= " UNION ";
		
		$query .= "SELECT 3 AS sortOrder, 'report' AS type, id, CONCAT(name , ' (', airport_icao, ')') AS name, name AS wpname, NULL AS frequency, NULL AS callsign, airport_icao AS airport_icao, latitude, longitude, NULL AS elevation FROM reporting_points WHERE";
		$query .= " latitude > " . ($lat - $rad);
		$query .= " AND latitude < " . ($lat + $rad);
		$query .= " AND longitude > " . ($lon - $rad);
		$query .= " AND longitude < " . ($lon + $rad);

        if ($email && $token)
        {
            $query .= " UNION ";

            $query .= "SELECT 4 AS sortOrder, 'user' AS type, uwp.id, name, name AS wpname, NULL AS frequency, NULL AS callsign, NULL AS airport_icao, latitude, longitude, NULL AS elevation FROM user_waypoints AS uwp";
            $query .= " INNER JOIN users AS usr ON uwp.user_id = usr.id";
            $query .= " WHERE usr.email = '" . $email . "' AND usr.token = '" . $token . "'";
            $query .= " AND latitude > " . ($lat - $rad);
            $query .= " AND latitude < " . ($lat + $rad);
            $query .= " AND longitude > " . ($lon - $rad);
            $query .= " AND longitude < " . ($lon + $rad);
        }
		
		$query .= " UNION ";
		
		$query .= "SELECT 5 AS sortOrder, 'geoname' AS type, geonameid AS id, name, name AS wpname, NULL AS frequency, NULL AS callsign, NULL AS airport_icao, latitude, longitude, elevation FROM geonames WHERE";
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
		
		if ($result === FALSE)
			die("error searching geoname: " . $conn->error . " query:" . $query);
		
		echo buildReturnObject($result, $conn);

		$conn->close();
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
	
	
	function buildReturnObject($result, $conn)
	{
		$geonames = [];
	
		while ($rs = $result->fetch_array(MYSQLI_ASSOC))
		{
			$geoname = array(
				type => $rs["type"],
				id => $rs["id"],
				name => $rs["name"],
				wpname => $rs["wpname"],
				frequency => $rs["frequency"],
				callsign => $rs["callsign"],
				airport_icao => $rs["airport_icao"],
				latitude => $rs["latitude"],
				longitude => $rs["longitude"],
				elevation => $rs["elevation"]
			);

			$geonames[] = $geoname;
		}
		
		return json_encode(array("geonames" => $geonames), JSON_NUMERIC_CHECK);
	}
?>