<?php
	include "../php/config.php";

	$conn = new mysqli($db_host, $db_user, $db_pw, $db_name) or die ('Unable to connect');
	$conn->set_charset("utf8");
	
	// clear table
	$query = "DELETE FROM lfr_ch";
	$result = $conn->query($query);

	if (!$result)
	{
		print "ERROR: " . $conn->error;
		exit;
	}
	

	// importing airport data
	$lfr_ch_dir = realpath("./lfr_ch/");
	$dir_entries = scandir($lfr_ch_dir);
	
	// iterate trough files
	foreach ($dir_entries as $filename)
	{
		$abs_filename = $lfr_ch_dir . "/" . $filename;

		// skip directories
		if (is_dir($abs_filename))
			continue;

		$file = fopen($abs_filename, "r");

		while (!feof($file))
		{
		    $line = fgets($file);
            $entries = json_decode($line, true);

            foreach ($entries as $entry)
            {
                $query = "INSERT INTO lfr_ch (icaohex, registration, aircraftModelType, manufacturer, aircraftCategoryId, ownerOperators) VALUES (";
                $query .= " '" . mysqli_real_escape_string($conn, strtoupper($entry["details"]["aircraftAddresses"]["hex"])) . "',";
                $query .= " '" . mysqli_real_escape_string($conn, $entry["registration"]) . "',";
                $query .= " '" . mysqli_real_escape_string($conn, $entry["aircraftModelType"]) . "',";
                $query .= " '" . mysqli_real_escape_string($conn, $entry["manufacturer"]) . "',";
                $query .= " '" . mysqli_real_escape_string($conn, $entry["aircraftCategoryId"]) . "',";
                $query .= " '" . mysqli_real_escape_string($conn, json_encode($entry["ownerOperators"])) . "'";
                $query .= ")";

                $result = $conn->query($query);

                if (!$result)
                {
                    print "ERROR AP: " . $conn->error;
                    exit;
                }
            }
		}
	}
	
	print "done."
?> 