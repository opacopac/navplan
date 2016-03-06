<?php
	include "../php/config.php";
	include "../php/helper.php";
	
	$data_dir = realpath("../charts/");
	$pattern = '/^LS_ADINFO_0000_(\w{4}).{1}(.*)\.png$/';
	$resolutionDpi = 200;
	$scaleVac = 100000;
	$scaleArea = 250000;
	$scaleAdInfo1 = 10000;
	$scaleAdInfo2 = 0;
	$mmPerInch = 25.4;
	
	// open db
	$conn = openDb();
	
	$dir_entries = scandir($data_dir);
	
	// iterate trough files
	foreach ($dir_entries as $filename)
	{
		$abs_filename = $data_dir . "/" . $filename;
	
		// skip directories
		if (is_dir($abs_filename))
			continue;
			
		if (!preg_match($pattern, $filename, $matches))
			continue;
			
		$icao = $matches[1];
		$chartsuffix = $matches[2];
		
		switch($chartsuffix)
		{
			case "01" : $charttype = "AD INFO 1"; $scale = $scaleAdInfo1; break;
			case "02" : $charttype = "AD INFO 2"; $scale = $scaleAdInfo2; break;
			case "VAC-1" : $charttype = "VAC"; $scale = $scaleVac; break;
			case "VAC_D-1" : $charttype = "VAC Departure"; $scale = $scaleVac; break;
			case "VAC_A-1" : $charttype = "VAC Arrival"; $scale = $scaleVac; break;
			case "AREA-1" : $charttype = "AREA"; $scale = $scaleArea; break;
			case "AREA_D-1" : $charttype = "AREA Departure"; $scale = $scaleArea; break;
			case "AREA_A-1" : $charttype = "AREA Arrival"; $scale = $scaleArea; break;
			case "HEL-1" : $charttype = "HEL"; $scale = $scaleVac; break;
			case "HEL_D-1" : $charttype = "HEL Departure"; $scale = $scaleVac; break;
			case "HEL_A-1" : $charttype = "HEL Arrival"; $scale = $scaleVac; break;
			default : $charttype = "TODO"; $scale = 0; // TODO
		}

		$image = new Imagick($abs_filename);
		$geometry = $image->getImageGeometry();

		
		// check if chart already exists
		$query = "SELECT id FROM ad_charts WHERE airport_icao = '" . $icao . "' AND type = '" . $charttype . "'";
		
		$result = $conn->query($query);
		
		if ($result === FALSE)
			die("error reading chart: " . $conn->error . " query:" . $query);

		if ($result->num_rows > 0)
		{
			print "skipping " . $icao . " " . $charttype . "<br>";
			continue;
		}
		
		print "adding " . $icao . " " . $charttype . "<br>";
		
		$query = "INSERT INTO ad_charts (airport_icao, type, filename, width_pixel, height_pixel, width_mm, height_mm, scale, arp_pixeloffset_east, arp_pixeloffset_south) VALUES (";
		$query .= " '" . $icao . "',";
		$query .= " '" . $charttype . "',";
		$query .= " '" . $filename . "',";
		$query .= " '" . $geometry['width'] . "',";
		$query .= " '" . $geometry['height'] . "',";
		$query .= " '" . floor($geometry['width'] / $resolutionDpi * $mmPerInch) . "',";
		$query .= " '" . floor($geometry['height'] / $resolutionDpi * $mmPerInch) . "',";
		$query .= " '" . $scale . "',";
		$query .= " '0',";
		$query .= " '0'";
		$query .= ")";
		
		$result = $conn->query($query);
		
		if ($result === FALSE)
			die("error inserting chart: " . $conn->error . " query:" . $query);
	}
	
	$conn->close();
?>