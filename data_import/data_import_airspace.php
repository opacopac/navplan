<?php
	include "../php/config.php";

	$conn = new mysqli($db_host, $db_user, $db_pw, $db_name) or die ('Unable to connect');
	$conn->set_charset("utf8");
	
	// clear table
	$query = "DELETE FROM openaip_airspace";
	$result = $conn->query($query);

	if (!$result)
	{
		print "ERROR: " . $conn->error;
		exit;
	}
	

	// importing airport data
	$data_dir = realpath("./openaip_airspace/");
	$dir_entries = scandir($data_dir);
	
	// iterate trough files
	foreach ($dir_entries as $filename)
	{
		$abs_filename = $data_dir . "/" . $filename;
	
		// skip directories
		if (is_dir($abs_filename))
			continue;
			
		$data_file = simplexml_load_file($abs_filename);
		
		foreach ($data_file->AIRSPACES->ASP as $airspace)
		{
			$query = "INSERT INTO openaip_airspace (category, aip_id, country, name, alt_top_reference, alt_top_height, alt_top_unit, alt_bottom_reference, alt_bottom_height, alt_bottom_unit, polygon) VALUES (";
			$query .= " '" . $airspace['CATEGORY'] . "',";
			$query .= " '" . $airspace->ID . "',";
			$query .= " '" . $airspace->COUNTRY . "',";
			$query .= " '" . mysqli_real_escape_string($conn, $airspace->NAME) . "',";
			$query .= " '" . $airspace->ALTLIMIT_TOP['REFERENCE'] . "',";
			$query .= " '" . $airspace->ALTLIMIT_TOP->ALT . "',";
			$query .= " '" . $airspace->ALTLIMIT_TOP->ALT['UNIT'] . "',";
			$query .= " '" . $airspace->ALTLIMIT_BOTTOM['REFERENCE'] . "',";
			$query .= " '" . $airspace->ALTLIMIT_BOTTOM->ALT . "',";
			$query .= " '" . $airspace->ALTLIMIT_BOTTOM->ALT['UNIT'] . "',";
			$query .= " '" . $airspace->GEOMETRY->POLYGON . "'";
			$query .= ")";
			
			$result = $conn->query($query);

			if (!$result)
			{
				print "ERROR: " . $conn->error . "<br><br>\n\n";
				print $query;
				exit;
			}
		}
	}
	
	print "done."
?> 