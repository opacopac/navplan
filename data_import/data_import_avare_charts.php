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
		$transformation = mysqli_real_escape_string($conn, $_GET["transformation"]);

		if ($transformation == "rotate") // rotate
		{
		    $center_pix_east = $img_width / 2;
		    $center_pix_south = $img_height / 2;
		    $angle_pix = atan2($pixel1_south - $pixel0_south, $pixel1_east - $pixel0_east) / pi() * 180.0 + 90.0;
		    $angle_latlon = getBearingDeg($lat1, $lon1, $lat2, $lon2);
		    $angle_rot = $angle_latlon - $angle_pix;

            // rotate image
		    $abs_filename = $snipoffstring . $filename;
		    if (!is_file($abs_filename))
			    die("file not found: " . $abs_filename);

			$rot_filename = getRotFilename($filename);
			$rot_abs_filename = $snipoffstring . $rot_filename;

            $im = new Imagick();
            $im->readImage($abs_filename);
		    $im->rotateImage(new ImagickPixel('#00000000'), $angle_rot);
		    $im->quantizeImage(255, imagick::COLORSPACE_RGB, 0, false, false);
		    $im->writeImage($rot_abs_filename);

            $filename = $rot_filename;

            // rotate points
            $img_rot_height = $im->getImageGeometry()['height'];
            $img_rot_width = $im->getImageGeometry()['width'];
            $rot_center_pix_east = $img_rot_width / 2;
            $rot_center_pix_south = $img_rot_height / 2;

            $rot_rad = $angle_rot / 180.0 * pi();
            $rot_pixel0_east = $rot_center_pix_east + cos($rot_rad) * ($pixel0_east - $center_pix_east) - sin($rot_rad) * ($pixel0_south - $center_pix_south);
            $rot_pixel0_south = $rot_center_pix_south + cos($rot_rad) * ($pixel0_south - $center_pix_south) + sin($rot_rad) * ($pixel0_east - $center_pix_east);
            $rot_pixel1_east = $rot_center_pix_east + cos($rot_rad) * ($pixel1_east - $center_pix_east) - sin($rot_rad) * ($pixel1_south - $center_pix_south);
            $rot_pixel1_south = $rot_center_pix_south + cos($rot_rad) * ($pixel1_south - $center_pix_south) + sin($rot_rad) * ($pixel1_east - $center_pix_east);

            print "center_pix_east: " . $center_pix_east . "<br>\n";
            print "center_pix_south: " . $center_pix_south . "<br>\n";
            print "rot_center_pix_east: " . $rot_center_pix_east . "<br>\n";
            print "rot_center_pix_south: " . $rot_center_pix_south . "<br>\n";

            print "pixel0_east: " . ($pixel0_east - $center_pix_east) . "<br>\n";
            print "pixel0_south: " . ($pixel0_south - $center_pix_south). "<br>\n";
            print "rot_pixel0_east: " . ($rot_pixel0_east - $rot_center_pix_east). "<br>\n";
            print "rot_pixel0_south: " . ($rot_pixel0_south - $rot_center_pix_south). "<br>\n";

            print "pixel1_east: " . ($pixel1_east - $center_pix_east) . "<br>\n";
            print "pixel1_south: " . ($pixel1_south - $center_pix_south). "<br>\n";
            print "rot_pixel1_east: " . ($rot_pixel1_east - $rot_center_pix_east) . "<br>\n";
            print "rot_pixel1_south: " . ($rot_pixel1_south - $rot_center_pix_south) . "<br>\n";

            $dpp_east = abs(($lon2 - $lon1) / ($rot_pixel1_east - $rot_pixel0_east));
            $dpp_south = abs(($lat2 - $lat1) / ($rot_pixel1_south - $rot_pixel0_south));

            $lat_sw = $lat1 - ($img_rot_height  - $rot_pixel0_south) * $dpp_south;
            $lon_sw = $lon1 - $rot_pixel0_east * $dpp_east;
            $lat_ne = $lat_sw + $img_rot_height * $dpp_south;
            $lon_ne = $lon_sw + $img_rot_width * $dpp_east;

		    echo "rotation pix: " . $angle_pix . "°<br>\n";
		    echo "rotation latlon: " . $angle_latlon . "°<br>\n";
		    echo "rotation: " . $angle_rot . "°<br>\n";
            echo "height: " . $img_rot_height . "<br>\n";
            echo "width: " . $img_rot_width . "<br>\n";
            print "lat_sw: " . $lat_sw . "<br>\n";
            print "lon_sw: " . $lon_sw . "<br>\n";
            print "lat_ne: " . $lat_ne . "<br>\n";
            print "lon_ne: " . $lon_ne . "<br>\n";
		}
		else // stretch vertically / horizontally
		{
            $dpp_east = abs(($lon2 - $lon1) / ($pixel1_east - $pixel0_east));
            $dpp_south = abs(($lat2 - $lat1) / ($pixel1_south - $pixel0_south));

            $lat_sw = $lat1 - ($img_height  - $pixel0_south) * $dpp_south;
            $lon_sw = $lon1 - $pixel0_east * $dpp_east;
            $lat_ne = $lat_sw + $img_height * $dpp_south;
            $lon_ne = $lon_sw + $img_width * $dpp_east;

            /*print "lat_sw: " . $lat_sw . "<br>\n";
            print "lon_sw: " . $lon_sw . "<br>\n";
            print "lat_ne: " . $lat_ne . "<br>\n";
            print "lon_ne: " . $lon_ne . "<br>\n";*/
		}

		// convert to web mercator coordinates
		$mer_s = lat2y($lat_sw);
		$mer_w = lon2x($lon_sw);
		$mer_n = lat2y($lat_ne);
		$mer_e = lon2x($lon_ne);

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


		print "<b>chart successfully added!</b><br />\n";
		print "<a href='" . $php_self . "'>back to file list </a><br />\n";
	    print "<img src='" . $snipoffstring . $filename . "' />\n";

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
		print "    <tr><td> - Pixel 1:</td><td><input id='pixel0_x' type='text' name='pixel0_east' value='" . ($_GET["pixel0_east"] ? $_GET["pixel0_east"] : "0") . "' />&nbsp;";
		print "      <input id='pixel0_y' type='text' name='pixel0_south' value='" . ($_GET["pixel0_south"] ? $_GET["pixel0_south"] : "0") . "' /> (select on image)</td></tr>\n";
		print "    <tr><td> - Lat/Lon 1:</td><td><input type='text' name='lat1' value='" . $_GET["lat1"] . "' />&nbsp;<input type='text' name='lon1' value='" . $_GET["lon1"] . "' /> (enter coordinates)</td></tr>\n";
		print "    <tr><td> - Pixel 2:</td><td><input id='pixel1_x' type='text' name='pixel1_east' value='" . ($_GET["pixel1_east"] ? $_GET["pixel1_east"] : "0") . "' />&nbsp;";
		print "      <input id='pixel1_y' type='text' name='pixel1_south' value='" . ($_GET["pixel1_south"] ? $_GET["pixel1_south"] : "0") . "' /> (select on image)</td></tr>\n";
		print "    <tr><td> - Lat/Lon 2:</td><td><input type='text' name='lat2' value='" . $_GET["lon2"] . "' />&nbsp;<input type='text' name='lon2' value='" . $_GET["lon2"] . "' /> (enter coordinates)</td></tr>\n";
		print "    <tr><td> - Transformation:</td><td><input type='radio' name='transformation' value='stretch' checked /> stretch&nbsp;<input type='radio' name='transformation' value='rotate'/> rotate</td></tr>\n";
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


    function getBearingDeg($lat1, $lon1, $lat2, $lon2)
    {
        $toRad = (pi() / 180.0);
        $toDeg = (180.0 / pi());

        $f1 = $lat1 * $toRad;
        $f2 = $lat2 * $toRad;
        $dl = ($lon2 - $lon1) * $toRad;
        $y = sin($dl) * cos($f2);
        $x = cos($f1) * sin($f2) - sin($f1) * cos($f2) * cos($dl);
        $t = atan2($y, $x);

        return $t * $toDeg;
    }


    function rotate($point, $angle, $origin, $neworigin)
    {
        $x = $point[0] - $origin[0];
        $y = $point[1] - $origin[1];
        $rot_x = $neworigin[0] + $x * cos($angle) - $y * sin($angle);
        $rot_y = $neworigin[1] + $x * cos($angle) + $y * sin($angle);

        return array($rot_x, $rot_y);
    }


	function getRotFilename($orig_filename)
	{
	    $dir = pathinfo($orig_filename, PATHINFO_DIRNAME);
	    $ext = pathinfo($orig_filename, PATHINFO_EXTENSION);
	    $base = basename($orig_filename, "." . $ext);

	    return $dir . "/" . $base . "_rot." . $ext;
	}
?>