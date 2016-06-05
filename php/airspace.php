<?php
	include "config.php";
	include "helper.php";

	// open db connection
	$conn = new mysqli($db_host, $db_user, $db_pw, $db_name);
	$conn->set_charset("utf8");

	
	$query = "SELECT * FROM openaip_airspace WHERE country = 'CH' OR country = 'FR'";
	$result = $conn->query($query);

	// build return object
	$return_object = buildReturnObject($result);
	$conn->close();
	

	header("Access-Control-Allow-Origin: *"); //TODO: remove
	header("Content-Type: application/json; charset=UTF-8");

	echo($return_object);


	function buildReturnObject($result)
	{
		while ($rs = $result->fetch_array(MYSQLI_ASSOC))
		{
			// prepare coordinates
			$polygon = [];
			$coord_pairs = explode(",", $rs["polygon"]);
			
			foreach ($coord_pairs as $latlon)
				$polygon[] = explode(" ", trim($latlon));
			
		
			$airspace[] = array(
				id => (int)$rs["id"],
				category => $rs["category"],
				country => $rs["country"],
				name => $rs["name"],
				alt => array(
					top => array(
						ref => $rs["alt_top_reference"],
						height => $rs["alt_top_height"],
						unit => $rs["alt_top_unit"]
					),
					bottom => array(
						ref => $rs["alt_bottom_reference"],
						height => $rs["alt_bottom_height"],
						unit => $rs["alt_bottom_unit"]
					)
				),
				"polygon" => $polygon
			);
		}
		
		return json_encode(array("airspace" => $airspace), JSON_NUMERIC_CHECK);
	}
?>