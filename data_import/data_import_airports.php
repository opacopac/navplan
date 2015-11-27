<?php
	include "../config.php";

	$conn = new mysqli($db_host, $db_user, $db_pw, $db_name) or die ('Unable to connect');
	$conn->set_charset("utf8");
	
	// clear table
	$query = "DELETE FROM openaip_runways";
	$result = $conn->query($query);

	$query = "DELETE FROM openaip_radios";
	$result = $conn->query($query);

	$query = "DELETE FROM openaip_airports";
	$result = $conn->query($query);

	if (!$result)
	{
		print "ERROR: " . $conn->error;
		exit;
	}
	

	// importing airport data
	$airport_dir = realpath("./openaip_airports/");
	$dir_entries = scandir($airport_dir);
	
	// iterate trough files
	foreach ($dir_entries as $filename)
	{
		$abs_filename = $airport_dir . "/" . $filename;
	
		// skip directories
		if (is_dir($abs_filename))
			continue;
			
		$airport_file = simplexml_load_file($abs_filename);
		
		foreach ($airport_file->WAYPOINTS->AIRPORT as $airport)
		{
			$query = "INSERT INTO openaip_airports (type, country, name, icao, latitude, longitude, elevation) VALUES (";
			$query .= " '" . $airport['TYPE'] . "',";
			$query .= " '" . $airport->COUNTRY . "',";
			$query .= " '" . mysqli_real_escape_string($conn, $airport->NAME) . "',";
			$query .= " '" . $airport->ICAO . "',";
			$query .= " '" . $airport->GEOLOCATION->LAT . "',";
			$query .= " '" . $airport->GEOLOCATION->LON . "',";
			$query .= " '" . $airport->GEOLOCATION->ELEV . "'";
			$query .= ")";
			
			$result = $conn->query($query);

			if (!$result)
			{
				print "ERROR AP: " . $conn->error;
				exit;
			}
			
			$airport_id = $conn->insert_id;

			// add runways
			foreach ($airport->RWY as $runway)
			{
				$query = "INSERT INTO openaip_runways (airport_id, operations, name, surface, length, width, direction1, direction2) VALUES (";
				$query .= " '" . $airport_id . "',";
				$query .= " '" . $runway['OPERATIONS'] . "',";
				$query .= " '" . mysqli_real_escape_string($conn, $runway->NAME) . "',";
				$query .= " '" . $runway->SFC . "',";
				$query .= " '" . $runway->LENGTH . "',";
				$query .= " '" . $runway->WIDTH . "',";
				$query .= " '" . $runway->DIRECTION[0]['TC'] . "',";
				$query .= " '" . $runway->DIRECTION[1]['TC'] . "'";
				$query .= ")";
				
				$result = $conn->query($query);

				if (!$result)
				{
					print "ERROR RWY: " . $conn->error;
					exit;
				}
			}

			// add radios
			foreach ($airport->RADIO as $radio)
			{
				$query = "INSERT INTO openaip_radios (airport_id, category, frequency, type, typespec, description) VALUES (";
				$query .= " '" . $airport_id . "',";
				$query .= " '" . $radio['CATEGORY'] . "',";
				$query .= " '" . $radio->FREQUENCY . "',";
				$query .= " '" . $radio->TYPE . "',";
				$query .= " '" . $radio->TYPESPEC . "',";
				$query .= " '" . mysqli_real_escape_string($conn, $radio->DESCRIPTION) . "'";
				$query .= ")";
				
				$result = $conn->query($query);

				if (!$result)
				{
					print "ERROR RADIO: " . $conn->error;
					exit;
				}
			}
		}
	}
	
	print "done."
?> 