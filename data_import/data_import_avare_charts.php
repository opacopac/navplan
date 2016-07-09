<?php
	include "../php/config.php";
	include "../php/helper.php";

	$php_self = "data_import_avare_charts.php";
	$data_dir_rel = "../charts/avare";
	$snipoffstring = "../charts/";

	if ($_GET["mode"] == "import")
	{
		$conn = openDb();
		
		$filename = str_replace($snipoffstring, "", $_GET["filename"]);
		$icao = mysqli_real_escape_string($conn, $_GET["icao"]);
		$chartname = mysqli_real_escape_string($conn, $_GET["chartname"]);
		$img_height = mysqli_real_escape_string($conn, $_GET["img_height"]);
		$img_width = mysqli_real_escape_string($conn, $_GET["img_width"]);
		$pixel0_east = mysqli_real_escape_string($conn, $_GET["pixel0_east"]);
		$pixel0_south = mysqli_real_escape_string($conn, $_GET["pixel0_south"]);
		$pixel1_east = mysqli_real_escape_string($conn, $_GET["pixel1_east"]);
		$pixel1_south = mysqli_real_escape_string($conn, $_GET["pixel1_south"]);
		$lat1 = mysqli_real_escape_string($conn, $_GET["lat1"]);
		$lon1 = mysqli_real_escape_string($conn, $_GET["lon1"]);
		$lat2 = mysqli_real_escape_string($conn, $_GET["lat2"]);
		$lon2 = mysqli_real_escape_string($conn, $_GET["lon2"]);

        // calculate lat/lon bounding box
        $dpp_east = ($lon2 - $lon1) / ($pixel1_east - $pixel0_east);
        $dpp_south = ($lat2 - $lat1) / ($pixel1_south - $pixel0_south);
        $lat_nw = $lat1 - $pixel0_south * $dpp_south;
        $lon_nw = $lon1 - $pixel0_east * $dpp_east;
        $lat_se = $lat_nw + $img_height * $dpp_south;
        $lon_se = $lon_nw + $img_width * $dpp_east;

		// web mercator coordinates
		$mer_n = lat2y($lat_nw);
		$mer_w = lon2x($lon_nw);
		$mer_s = lat2y($lat_se);
		$mer_e = lon2x($lon_se);

		// delete existing chart
		$query = "DELETE FROM ad_charts WHERE airport_icao = '" . $icao . "' AND source = 'AVARE' AND type = '" . $chartname . "'";

		$result = $conn->query($query);
		
		if ($result === FALSE)
			die("error deleting chart: " . $conn->error . " query:" . $query);
			

		// insert new chart
		$query = "INSERT INTO ad_charts (airport_icao, source, type, filename, mercator_e, mercator_w, mercator_n, mercator_s) VALUES (";
		$query .= " '" . $icao . "', ";
		$query .= " 'AVARE', ";
		$query .= " '" . $chartname . "', ";
		$query .= " '" . $filename . "', ";
		$query .= " '" . $mer_e . "', ";
		$query .= " '" . $mer_w . "', ";
		$query .= " '" . $mer_n . "', ";
		$query .= " '" . $mer_s . "'";
		$query .= ")";


		$result = $conn->query($query);
		
		if ($result === FALSE)
			die("error adding chart: " . $conn->error . " query:" . $query);

			
		print "<b>Adding chart successful!</b><br />\n";
		print "<a href='" . $php_self . "'>back to file list </a><br />\n";

		$conn->close();
	}
	else if ($_GET["mode"] == "detail")
	{
		$filename = $_GET["filename"];
		$abs_filename  = realpath($filename);

		if (!is_file($abs_filename))
			die("file not found: " . $filename);

    	$pattern = '/^.*\/(.+)\/(.+)_.+$/';
		if (!preg_match($pattern, $filename, $matches))
			die("file name pattern unknown: " . $filename);

		$icao = strtoupper($matches[1]);
		$chartname = strtoupper($matches[2]);

		print "<script>\n";
		print "var curIdx = 0\n";
		print "function getRelativeCoords(event) {\n";
		print "  document.getElementById('pixel' + curIdx + '_x').value = event.offsetX;\n";
		print "  document.getElementById('pixel' + curIdx + '_y').value = event.offsetY;\n";
		print "  curIdx = (curIdx + 1) % 2\n";
		print "}\n";
		print "function getImageSize(event) {\n";
		print "  document.getElementById('img_height').value = event.target.height;\n";
		print "  document.getElementById('img_width').value = event.target.width;\n";
		print "}\n";
		print "</script>\n";
		
		print "<h1>" . $filename . "</h1>\n";
		print "<form action='" . $php_self . "' method='get'>\n";
		print "  <table>\n";
		print "    <tr><td>ICAO / Chart Name:</td><td><input type='text' name='icao' value='" . $icao . "' />&nbsp;<input type='text' name='chartname' value='" . $chartname . "' /></td></tr>\n";
		print "    <tr><td>Image height / width:</td><td><input id='img_height' type='text' name='img_height' />&nbsp;<input id='img_width' type='text' name='img_width' /></td></tr>\n";
		print "    <tr><td colspan='2'>Reference Points:</td></tr>\n";
		print "    <tr><td> - Pixel 1:</td><td><input id='pixel0_x' type='text' name='pixel0_east' value='0' />&nbsp;<input id='pixel0_y' type='text' name='pixel0_south' value='0' /> (select on image)</td></tr>\n";
		print "    <tr><td> - Lat/Lon 1:</td><td><input type='text' name='lat1' />&nbsp;<input type='text' name='lon1'/> (enter coordinates)</td></tr>\n";
		print "    <tr><td> - Pixel 2:</td><td><input id='pixel1_x' type='text' name='pixel1_east' value='0' />&nbsp;<input id='pixel1_y' type='text' name='pixel1_south' value='0' /> (select on image)</td></tr>\n";
		print "    <tr><td> - Lat/Lon 2:</td><td><input type='text' name='lat2' />&nbsp;<input type='text' name='lon2'/> (enter coordinates)</td></tr>\n";
		print "    <tr><td><input type='hidden' name='filename' value='" . $filename . "' />\n";
		print "    <tr><td><input type='submit' name='mode' value='import' /><br />\n";
		print "  </table>\n";
		print "  <img src='" . $filename . "' style='cursor:crosshair' onclick='getRelativeCoords(event)' onload='getImageSize(event)' />\n";
		print "</form>\n";
	}
	else // display file list
	{
		print "<table>\n";
	
		$chart_files = getChartFileList($data_dir_rel);
	
		foreach ($chart_files as $filename)
		{
			print "<tr>\n";
			print '<td><a href="' . $php_self . '?mode=detail&filename=' . urlencode($filename) . '">detail</a></td>' . "\n";
			print "<td>" . $filename . "</td>\n";
			print "</tr>\n";
		}
		
		print "</table>\n";
	}


    function getChartFileList($data_dir_rel)
    {
        $chart_files = [];
       	$data_dir_abs = realpath($data_dir_rel);
		$dir_entries = scandir($data_dir_abs, SCANDIR_SORT_ASCENDING);

		foreach ($dir_entries as $entry)
		{
		    if ($entry == "." || $entry == "..")
		        continue;

		    $path = $data_dir_rel . "/" . $entry;

			if (is_dir($path))
                $chart_files = array_merge($chart_files, getChartFileList($path));
			else
			    $chart_files[] = $path;
		}

		return $chart_files;
    }

	// mercator <-> wgs84
	function lon2x($lon) { return deg2rad($lon) * 6378137.0; }
	function lat2y($lat) { return log(tan(M_PI_4 + deg2rad($lat) / 2.0)) * 6378137.0; }
?>