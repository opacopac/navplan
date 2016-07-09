<?php
	include "../php/config.php";
	include "../php/helper.php";
	include "wgs84_ch1903.php";

	$php_self = "data_import_vfrm_charts.php";
	$temp_image = "vftemp_chart_image.png";
	$temp_image_abspath = realpath("./");
	$data_dir = realpath("./vfrm_charts_pdf/");
	$output_dir = realpath("../charts/");
	$output_dir_web = "../charts/";
	$pattern = '/^LS_ADINFO_0000_(\w{4})_?(.*)\.pdf$/';
	$resolutionDpi = 200;
	$scaleVac = 100000;
	$scaleArea = 250000;
	$scaleAdInfo1 = 10000;
	$scaleAdInfo2 = 0;
	$mmPerInch = 25.4;
	$ptPerInch = 72;


	if ($_GET["mode"] == "import")
	{
		$conn = openDb();
		
		$filename = $_GET["filename"];
		$icao = mysqli_real_escape_string($conn, $_GET["icao"]);
		$scale = mysqli_real_escape_string($conn, $_GET["scale"]);
		$chartname = mysqli_real_escape_string($conn, $_GET["chartname"]);
		$pixeloffset_east = mysqli_real_escape_string($conn, $_GET["pixeloffset_east"]);
		$pixeloffset_south = mysqli_real_escape_string($conn, $_GET["pixeloffset_south"]);
		$ch1903_x = mysqli_real_escape_string($conn, $_GET["ch1903_x"]);
		$ch1903_y = mysqli_real_escape_string($conn, $_GET["ch1903_y"]);
		$page = mysqli_real_escape_string($conn, $_GET["page"]);
		$rotation = mysqli_real_escape_string($conn, $_GET["rotation"]);
		
		
		$abs_filename = $data_dir . "/" . $filename;
		if (!is_file($abs_filename))
			die("file not found: " . $filename);

		// load arp coordinates
		if (!$ch1903_x || !$ch1903_y)
		{
			$query = "SELECT ";
			$query .= "  latitude, ";
			$query .= "  longitude ";
			$query .= "FROM openaip_airports ";
			$query .= "WHERE ";
			$query .= "  icao = '" . $icao . "'";
			
			$result = $conn->query($query);
			
			if ($result === FALSE)
				die("error reading airport: " . $conn->error . " query:" . $query);

			if ($result->num_rows == 1)
			{
				$rs = $result->fetch_array(MYSQLI_ASSOC);
				$arp_lon = $rs["longitude"];
				$arp_lat = $rs["latitude"];
			}
			else
				die("airport not found or multiple airports found: " . $query);
		}

		$im = loadPdf($abs_filename, $resolutionDpi, $page, $rotation);
		
		$width_pixel = $im->getImageWidth();
		$height_pixel = $im->getImageHeight();
		$width_mm = $width_pixel / $resolutionDpi * $mmPerInch;
		$height_mm = $height_pixel / $resolutionDpi * $mmPerInch;
		$ew_MeterPerPixel = $width_mm / $width_pixel / 1000 * $scale;
		$ns_MeterPerPixel = $height_mm / $height_pixel / 1000 * $scale;
			
		// boundaries in ch coordinates
		if ($ch1903_x && $ch1903_y)
		{
			$rp_ch_x = $ch1903_x;
			$rp_ch_y = $ch1903_y;
		}
		else
		{
			$rp_ch_x = WGStoCHx($arp_lat, $arp_lon);
			$rp_ch_y = WGStoCHy($arp_lat, $arp_lon);
		}
		$west_ch_y = $rp_ch_y - ($pixeloffset_east * $ew_MeterPerPixel);
		$east_ch_y = $rp_ch_y + (($width_pixel - $pixeloffset_east) * $ew_MeterPerPixel);
		$south_ch_x = $rp_ch_x - (($height_pixel - $pixeloffset_south) * $ns_MeterPerPixel);
		$north_ch_x = $rp_ch_x + ($pixeloffset_south * $ns_MeterPerPixel);
		
		// web mercator coordinates
		$nw_mer_x = lon2x(CHtoWGSlong($west_ch_y, $north_ch_x));
		$nw_mer_y = lat2y(CHtoWGSlat($west_ch_y, $north_ch_x));
		$ne_mer_x = lon2x(CHtoWGSlong($east_ch_y, $north_ch_x));
		$ne_mer_y = lat2y(CHtoWGSlat($east_ch_y, $north_ch_x));
		$se_mer_x = lon2x(CHtoWGSlong($east_ch_y, $south_ch_x));
		$se_mer_y = lat2y(CHtoWGSlat($east_ch_y, $south_ch_x));
		$sw_mer_x = lon2x(CHtoWGSlong($west_ch_y, $south_ch_x));
		$sw_mer_y = lat2y(CHtoWGSlat($west_ch_y, $south_ch_x));
		
		// bounding box
		$mer_maxnorth = max($nw_mer_y, $ne_mer_y);
		$mer_minnorth = min($sw_mer_y, $se_mer_y);
		$mer_maxeast = max($ne_mer_x, $se_mer_x);
		$mer_mineast = min($nw_mer_x, $sw_mer_x);
		$mer_pixelPerMer_y = $height_pixel / ($mer_maxnorth - $mer_minnorth);
		$mer_pixelPerMer_x = $width_pixel / ($mer_maxeast - $mer_mineast);
		
		// pixel distortions
		$nw_pxdst_x = 0 + ($nw_mer_x - $mer_mineast) * $mer_pixelPerMer_x;
		$nw_pxdst_y = 0 + ($mer_maxnorth - $nw_mer_y) * $mer_pixelPerMer_y;
		$ne_pxdst_x = $width_pixel - ($mer_maxeast - $ne_mer_x) * $mer_pixelPerMer_x;
		$ne_pxdst_y = 0 + ($mer_maxnorth - $ne_mer_y) * $mer_pixelPerMer_y;
		$se_pxdst_x = $width_pixel - ($mer_maxeast - $se_mer_x) * $mer_pixelPerMer_x;
		$se_pxdst_y = $height_pixel - ($se_mer_y - $mer_minnorth) * $mer_pixelPerMer_y;
		$sw_pxdst_x = 0 + ($sw_mer_x - $mer_mineast) * $mer_pixelPerMer_x;
		$sw_pxdst_y = $height_pixel - ($sw_mer_y - $mer_minnorth) * $mer_pixelPerMer_y;
		
		
		/*print "scale<br>";
		print "height_mm: " . $height_mm . "<br>";
		print "width_mm: " . $width_mm . "<br>";
		print "height_pixel: " . $height_pixel . "<br>";
		print "width_pixel: " . $width_pixel . "<br>";
		print "scale: " . $scale . "<br>";
		print "mppx: " . $ew_MeterPerPixel . "<br>";
		print "mppy: " . $ns_MeterPerPixel . "<br>";
		
		print "arp<br>";
		print "lat/lon: " . $arp_lon . "," . $arp_lat . "<br>";
		print "chx/y: " . floor($ch1903_x) . ", " . floor($ch1903_y) . "<br>";
		print "px offset e/s: " . $arp_pixeloffset_east . ", " . $arp_pixeloffset_south . "<br>";

		print "ch1903<br>";
		print "N: " . floor($north_ch_x) . "<br>";
		print "E: " . floor($east_ch_y) . "<br>";
		print "S: " . floor($south_ch_x) . "<br>";
		print "W: " . floor($west_ch_y) . "<br>";
		
		print "mercator<br>";
		print "NW: " . floor($nw_mer_x) . ", " . floor($nw_mer_y) . "<br>";
		print "NE: " . floor($ne_mer_x) . ", " . floor($ne_mer_y) . "<br>";
		print "SE: " . floor($se_mer_x) . ", " . floor($se_mer_y) . "<br>";
		print "SW: " . floor($sw_mer_x) . ", " . floor($sw_mer_y) . "<br>";
		print "N: " . floor($mer_maxnorth) . "<br>";
		print "S: " . floor($mer_minnorth) . "<br>";
		print "E: " . floor($mer_maxeast) . "<br>";
		print "W: " . floor($mer_mineast) . "<br>";
		
		print "distortion<br>";
		print "NW: " . floor($nw_pxdst_x) . ", " . floor($nw_pxdst_y) . "<br>";
		print "NE: " . floor($ne_pxdst_x) . ", " . floor($ne_pxdst_y) . "<br>";
		print "SE: " . floor($se_pxdst_x) . ", " . floor($se_pxdst_y) . "<br>";
		print "SW: " . floor($sw_pxdst_x) . ", " . floor($sw_pxdst_y) . "<br>";*/
		
		//$im->writeImage("png8:" . $output_dir . "/" . $filename . "_orig.png");
		
/*		$im->setimagebackgroundcolor("#fad888"); // TODO: transparent
		$im->setImageVirtualPixelMethod(\Imagick::VIRTUALPIXELMETHOD_BACKGROUND);			*/
		
		$im->setImageVirtualPixelMethod(imagick::VIRTUALPIXELMETHOD_TRANSPARENT);
		$im->distortImage(
			imagick::DISTORTION_PERSPECTIVE,
			array(
				0, 0,
				$nw_pxdst_x, $nw_pxdst_y,
				$width_pixel, 0,
				$ne_pxdst_x, $ne_pxdst_y,
				$width_pixel, $height_pixel,
				$se_pxdst_x, $se_pxdst_y,
				0, $height_pixel,
				$sw_pxdst_x, $sw_pxdst_y),
			false);
			
		$im->quantizeImage(255, imagick::COLORSPACE_RGB, 0, false, false);
		
		$output_filename = getImageFilename($icao, $chartname);
		$im->writeImage("png8:" . $output_dir . "/" . $output_filename);

		
		// delete existing chart
		$query = "DELETE FROM ad_charts WHERE airport_icao = '" . $icao . "' AND source = 'VFRM' AND type = '" . $chartname . "'";

		$result = $conn->query($query);
		
		if ($result === FALSE)
			die("error deleting chart: " . $conn->error . " query:" . $query);
			

		// insert new chart
		$query = "INSERT INTO ad_charts (airport_icao, source, type, filename, mercator_e, mercator_w, mercator_n, mercator_s) VALUES (";
		$query .= " '" . $icao . "', ";
		$query .= " 'VFRM', ";
		$query .= " '" . $chartname . "', ";
		$query .= " '" . $output_filename . "', ";
		$query .= " '" . $mer_maxeast . "', ";
		$query .= " '" . $mer_mineast . "', ";
		$query .= " '" . $mer_maxnorth . "', ";
		$query .= " '" . $mer_minnorth . "'";
		$query .= ")";
		
		$result = $conn->query($query);
		
		if ($result === FALSE)
			die("error adding chart: " . $conn->error . " query:" . $query);

			
		print "<b>Adding chart successful!</b><br />\n";
		print "<a href='" . $php_self . "'>back to file list </a><br />\n";
		print "  <img src='" . $output_dir_web . $output_filename . "' style='background-color: #0000FF' />\n";
			
		$conn->close();
	}
	else if ($_GET["mode"] == "detail" || $_GET["mode"] == "update")
	{
		$filename = $_GET["filename"];
		$abs_filename = $data_dir . "/" . $filename;
		if (!is_file($abs_filename))
			die("file not found: " . $filename);
			
		if (!preg_match($pattern, $filename, $matches))
			die("file name pattern unknown: " . $filename);
			
		$icao = $matches[1];
		$chartsuffix = $matches[2];
		
		switch($chartsuffix)
		{
			case "" : $chartname = "AD INFO 1"; $scale = $scaleAdInfo1; break;
			//case "02" : $chartname = "AD INFO 2"; $scale = $scaleAdInfo2; break;
			case "VAC" : $chartname = "VAC"; $scale = $scaleVac; break;
			case "VAC_D" : $chartname = "VAC Departure"; $scale = $scaleVac; break;
			case "VAC_A" : $chartname = "VAC Arrival"; $scale = $scaleVac; break;
			case "AREA" : $chartname = "AREA"; $scale = $scaleArea; break;
			case "AREA_D" : $chartname = "AREA Departure"; $scale = $scaleArea; break;
			case "AREA_A" : $chartname = "AREA Arrival"; $scale = $scaleArea; break;
			case "HEL" : $chartname = "HEL"; $scale = $scaleVac; break;
			case "HEL_D" : $chartname = "HEL Departure"; $scale = $scaleVac; break;
			case "HEL_A" : $chartname = "HEL Arrival"; $scale = $scaleVac; break;
			default : $chartname = "TODO"; $scale = 0; // TODO
		}
		
		if ($_GET["scale"]) { $scale = $_GET["scale"]; }
		if ($_GET["icao"]) { $icao = $_GET["icao"]; }
		if ($_GET["chartname"]) { $chartname = $_GET["chartname"]; }
		if ($_GET["pixeloffset_east"]) { $pixeloffset_east = $_GET["pixeloffset_east"]; }
		if ($_GET["pixeloffset_south"]) { $pixeloffset_south = $_GET["pixeloffset_south"]; }
		if ($_GET["ch1903_x"]) { $ch1903_x = $_GET["ch1903_x"]; }
		if ($_GET["ch1903_y"]) { $ch1903_y = $_GET["ch1903_y"]; }
		if ($_GET["page"]) { $page = $_GET["page"]; } else { $page = 0; }
		if ($_GET["rotation"]) { $rotation = $_GET["rotation"]; } else { $rotation = 0; }
		
		$im = loadPdf($abs_filename, $resolutionDpi, $page, $rotation);
		$im->quantizeImage(255, imagick::COLORSPACE_RGB, 0, false, false);
		$im->writeImage("png8:" . $temp_image);
	
		print "<script>\n";
		print "function getRelativeCoords(event) {\n";
		print "  document.getElementById('pixeloffset_x').value = event.offsetX;\n";
		print "  document.getElementById('pixeloffset_y').value = event.offsetY;\n";
		print "}\n";
		print "</script>\n";
		
		print "<h1>" . $filename . "</h1>\n";
		print "<form action='" . $php_self . "' method='get'>\n";
		print "  <table>\n";
		print "    <tr><td>ICAO / Chart Name:</td><td><input type='text' name='icao' value='" . $icao . "' />&nbsp;<input type='text' name='chartname' value='" . $chartname . "' /></td></tr>\n";
		print "    <tr><td>PDF Page / Rotation [deg]:</td><td><input type='text' name='page' value='" . $page . "' />&nbsp;<input type='text' name='rotation' value='" . $rotation . "' />&nbsp;<input type='submit' name='mode' value='update' /></td></tr>\n";
		print "    <tr><td>CH1903 y/x:</td><td><input type='text' name='ch1903_y' />&nbsp;<input type='text' name='ch1903_x' /> (empty = use arp)</td></tr>\n";
		print "    <tr><td>Scale:</td><td><input type='text' name='scale' value='" . $scale . "' /></td></tr>\n";
		print "    <tr><td>Pixel Offset east/south:</td><td><input id='pixeloffset_x' type='text' name='pixeloffset_east' value='0' />&nbsp;<input id='pixeloffset_y' type='text' name='pixeloffset_south' value='0' /> (click on image)</td></tr>\n";
		print "    <tr><td><input type='hidden' name='filename' value='" . $filename . "' />\n";
		print "    <tr><td><input type='submit' name='mode' value='import' /><br />\n";
		print "  </table>\n";
		print "  <img src='" . $temp_image . "' style='cursor:crosshair' onclick='getRelativeCoords(event)' />\n";
		print "</form>\n";
	}
	else // display file list
	{
		print "<table>\n";
	
		$dir_entries = scandir($data_dir, SCANDIR_SORT_ASCENDING);
	
		foreach ($dir_entries as $filename)
		{
			// skip directories
			if (is_dir($abs_filename))
				continue;
				
			if (!preg_match($pattern, $filename, $matches))
				continue;
				
			print "<tr>\n";
			print '<td><a href="' . $php_self . '?mode=detail&filename=' . urlencode($filename) . '">detail</a></td>' . "\n";
			print "<td>" . $filename . "</td>\n";
			print "</tr>\n";
		}
		
		print "</table>\n";
	}
	
	
	function loadPdf($abs_filename, $resolutionDpi, $page, $rotation)
	{
		// load pdf
		$im = new Imagick();
		$im->setResolution($resolutionDpi, $resolutionDpi);
		$im->setColorspace(imagick::COLORSPACE_RGB);
		$im->setBackgroundColor(new ImagickPixel('transparent')); 
		$im->setBackgroundColor("#ffffff"); 
		$im->readImage($abs_filename . "[" . $page . "]");
		$im->setimagebackgroundcolor("#ffffff");
		$im = $im->mergeImageLayers(imagick::LAYERMETHOD_FLATTEN);
		$im->setImageFormat("png");
		$im->trimImage(0);
		
		if ($rotation <> 0)
			$im->rotateImage(new ImagickPixel('#00000000'), $rotation);
		
		return $im;
	}

	
	function getImageFilename($icao, $chartname)
	{
		$chartname = preg_replace('/\s/', '_', $chartname);
		$chartname = preg_replace('/[^\w]/', '', $chartname);
		return $icao . "_" . $chartname . ".png";
	}
	
	
	// mercator <-> wgs84
	function lon2x($lon) { return deg2rad($lon) * 6378137.0; }
	function lat2y($lat) { return log(tan(M_PI_4 + deg2rad($lat) / 2.0)) * 6378137.0; }
	function x2lon($x) { return rad2deg($x / 6378137.0); }
	function y2lat($y) { return rad2deg(2.0 * atan(exp($y / 6378137.0)) - M_PI_2); }
?>