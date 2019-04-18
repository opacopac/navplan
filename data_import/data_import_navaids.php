<?php
	include "../php/config.php";

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
			
		$navaid_file = simplexml_load_file($abs_filename);
		
		foreach ($navaid_file->NAVAIDS->NAVAID as $navaid)
		{
		    /*if ($navaid->COUNTRY != 'CH' && $navaid->ID != 'BLM' && $navaid->ID != 'BN' && $navaid->ID != 'BS')
		        continue;*/

			$query = "INSERT INTO openaip_navaids (type, country, name, kuerzel, latitude, longitude, elevation, frequency, declination, truenorth, lonlat) VALUES (";
			$query .= " '" . $navaid['TYPE'] . "',";
			$query .= " '" . $navaid->COUNTRY . "',";
			$query .= " '" . mysqli_real_escape_string($conn, $navaid->NAME) . "',";
			$query .= " '" . $navaid->ID . "',";
			$query .= " '" . $navaid->GEOLOCATION->LAT . "',";
			$query .= " '" . $navaid->GEOLOCATION->LON . "',";
			$query .= " '" . $navaid->GEOLOCATION->ELEV . "',";
			$query .= " '" . $navaid->RADIO->FREQUENCY . "',";
			$query .= " '" . $navaid->PARAMS->DECLINATION . "',";
			$query .= " '" . $navaid->ALIGNEDTOTRUENORTH->ELEV . "',";
            $query .= " GeomFromText('POINT(" . $navaid->GEOLOCATION->LON . " " . $navaid->GEOLOCATION->LAT . ")')";
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