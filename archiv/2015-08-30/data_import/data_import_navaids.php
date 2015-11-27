<?php
	include "../config.php";

	$conn = new mysqli($db_host, $db_user, $db_pw, $db_name) or die ('Unable to connect');
	$conn->set_charset("utf8");
	
	// clear table
	$query = "DELETE FROM openaip_navaids";
	$result = $conn->query($query);

	if (!$result)
	{
		print "ERROR: " . $conn->error;
		exit;
	}
	

	// importing navaid data
	$data_dir = realpath("./openaip_navaids/");
	$dir_entries = scandir($data_dir);
	
	// iterate trough files
	foreach ($dir_entries as $filename)
	{
		$abs_filename = $data_dir . "/" . $filename;
	
		// skip directories
		if (is_dir($abs_filename))
			continue;
			
		$airport_file = simplexml_load_file($abs_filename);
		
		foreach ($airport_file->NAVAIDS->NAVAID as $navaid)
		{
			$query = "INSERT INTO openaip_navaids (type, country, name, kuerzel, latitude, longitude, elevation, frequency, declination, truenorth) VALUES (";
			$query .= " '" . $navaid['TYPE'] . "',";
			$query .= " '" . $navaid->COUNTRY . "',";
			$query .= " '" . mysqli_real_escape_string($conn, $navaid->NAME) . "',";
			$query .= " '" . $navaid->ID . "',";
			$query .= " '" . $navaid->GEOLOCATION->LAT . "',";
			$query .= " '" . $navaid->GEOLOCATION->LON . "',";
			$query .= " '" . $navaid->GEOLOCATION->ELEV . "',";
			$query .= " '" . $navaid->RADIO->FREQUENCY . "',";
			$query .= " '" . $navaid->PARAMS->DECLINATION . "',";
			$query .= " '" . $navaid->ALIGNEDTOTRUENORTH->ELEV . "'";
			$query .= ")";
			
			$result = $conn->query($query);

			if (!$result)
			{
				print "ERROR: " . $conn->error;
				exit;
			}
		}
	}
	
	print "done."
?> 