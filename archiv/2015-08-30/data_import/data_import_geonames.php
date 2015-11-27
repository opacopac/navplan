<?php
	include "../config.php";

	header("Access-Control-Allow-Origin: *"); //TODO: remove

	$mysqli = mysqli_init();
	mysqli_options($mysqli, MYSQLI_OPT_LOCAL_INFILE, true);
	mysqli_real_connect($mysqli, $db_host, $db_user, $db_pw, $db_name) or die ('Unable to connect');

	// importing geonames
	$geonames_dir = realpath("./geonames/");
	$dir_entries = scandir($geonames_dir);

	// iterate trough files
	foreach ($dir_entries as $filename)
	{
		$abs_filename = $geonames_dir . "/" . $filename;
	
		// skip directories
		if (is_dir($abs_filename))
			continue;
			
		$query = "LOAD DATA LOCAL INFILE '" . $abs_filename . "' INTO TABLE geonames";
		$result = $mysqli->query($query);

		if (!$result)
			print $mysqli->error;
	}
?> 