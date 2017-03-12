<?php
	include "../php/config.php";

	$conn = new mysqli($db_host, $db_user, $db_pw, $db_name) or die ('Unable to connect');
	$conn->set_charset("utf8");
	
	// clear table
	$query = "DELETE FROM openaip_runways2";
	$result = $conn->query($query);

	$query = "DELETE FROM openaip_radios2";
	$result = $conn->query($query);

	$query = "DELETE FROM openaip_airports2";
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
		    /*if ($airport->COUNTRY != 'CH' && $airport->ICAO != 'LFSB')
		        continue;*/

			$query = "INSERT INTO openaip_airports2 (type, country, name, icao, latitude, longitude, elevation, lonlat) VALUES (";
			$query .= " '" . $airport['TYPE'] . "',";
			$query .= " '" . $airport->COUNTRY . "',";
			$query .= " '" . mysqli_real_escape_string($conn, $airport->NAME) . "',";
			$query .= " '" . $airport->ICAO . "',";
			$query .= " '" . $airport->GEOLOCATION->LAT . "',";
			$query .= " '" . $airport->GEOLOCATION->LON . "',";
			$query .= " '" . $airport->GEOLOCATION->ELEV . "',";
            $query .= " GeomFromText('POINT(" . $airport->GEOLOCATION->LON . " " . $airport->GEOLOCATION->LAT . ")')";
			$query .= ")";
			
			$result = $conn->query($query);

			if (!$result)
			{
				print "ERROR AP: " . $conn->error . "<br>\n";
				print "File: " . $abs_filename . "<br>\n";
				var_dump($airport);
				print "<br><br>\n\n";
				continue;
			}
			
			$airport_id = $conn->insert_id;

			// add runways
			foreach ($airport->RWY as $runway)
			{
			    $tora1 = ($runway->DIRECTION[0]->RUNS && $runway->DIRECTION[0]->RUNS->TORA) ? $runway->DIRECTION[0]->RUNS->TORA : "NULL";
			    $tora2 = ($runway->DIRECTION[1]->RUNS && $runway->DIRECTION[1]->RUNS->TORA) ? $runway->DIRECTION[1]->RUNS->TORA : "NULL";
			    $lda1 = ($runway->DIRECTION[0]->RUNS && $runway->DIRECTION[0]->RUNS->LDA) ? $runway->DIRECTION[0]->RUNS->LDA : "NULL";
			    $lda2 = ($runway->DIRECTION[1]->RUNS && $runway->DIRECTION[1]->RUNS->LDA) ? $runway->DIRECTION[1]->RUNS->LDA : "NULL";
			    $papi1 = ($runway->DIRECTION[0]->LANDINGAIDS && $runway->DIRECTION[0]->LANDINGAIDS->PAPI && $runway->DIRECTION[0]->LANDINGAIDS->PAPI == 'TRUE') ? '1' : "NULL";
			    $papi2 = ($runway->DIRECTION[1]->LANDINGAIDS && $runway->DIRECTION[1]->LANDINGAIDS->PAPI && $runway->DIRECTION[1]->LANDINGAIDS->PAPI == 'TRUE') ? '1' : "NULL";

				$query = "INSERT INTO openaip_runways2 (airport_id, operations, name, surface, length, width, direction1, direction2, tora1, tora2, lda1, lda2, papi1, papi2) VALUES (";
				$query .= " '" . $airport_id . "',";
				$query .= " '" . $runway['OPERATIONS'] . "',";
				$query .= " '" . mysqli_real_escape_string($conn, $runway->NAME) . "',";
				$query .= " '" . $runway->SFC . "',";
				$query .= " '" . $runway->LENGTH . "',";
				$query .= " '" . $runway->WIDTH . "',";
				$query .= " '" . $runway->DIRECTION[0]['TC'] . "',";
				$query .= " '" . $runway->DIRECTION[1]['TC'] . "',";
				$query .= " " . $tora1 . ",";
				$query .= " " . $tora2 . ",";
				$query .= " " . $lda1 . ",";
				$query .= " " . $lda2 . ",";
				$query .= " " . $papi1 . ",";
				$query .= " " . $papi2 . "";
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
				$query = "INSERT INTO openaip_radios2 (airport_id, category, frequency, type, typespec, description) VALUES (";
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