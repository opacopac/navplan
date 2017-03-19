<?php
	include "../php/config.php";

	header("Access-Control-Allow-Origin: *"); //TODO: remove

	$mysqli = mysqli_init();
	mysqli_options($mysqli, MYSQLI_OPT_LOCAL_INFILE, true);
	mysqli_real_connect($mysqli, $db_host, $db_user, $db_pw, $db_name) or die ('Unable to connect');


// importing geonames
	$geonames_dir = realpath("./geonames/");
	$dir_entries = scandir($geonames_dir);

	// open temp file for filtering
    $filtered_filename = $geonames_dir . "/tmp/filtered_geonames.txt";

    print("creating filter file '" . $filtered_filename . "'<br>\n");

    $filtered_file = fopen($filtered_filename, "w");

    if (!$filtered_file)
        die("could not create filter file<br>\n");

	// iterate trough files
	foreach ($dir_entries as $filename)
	{
		$abs_filename = $geonames_dir . "/" . $filename;

		// skip directories
		if (is_dir($abs_filename))
			continue;

		print "filtering file '" . $abs_filename . "'<br>\n";

        $handle = fopen($abs_filename, "r");
        if ($handle)
        {
            while (($line = fgets($handle)) !== false)
            {
                $values = explode("\t", $line);
                $fc = $values[6];

                if ($fc == 'P' || $fc == 'T' || $fc == 'H')
                    fwrite($filtered_file, $line);
            }

            fclose($handle);
        }

	}

	fclose($filtered_file);

    $query = "LOAD DATA LOCAL INFILE '" . $filtered_filename . "' INTO TABLE geonames_ac";

    print "executing query: " . $query . "<br>\n";

    $result = $mysqli->query($query);

    if (!$result)
        print $mysqli->error . "<br>\n";


    print "done."
?>