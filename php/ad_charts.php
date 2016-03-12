<?php
	include "config.php";
	include "helper.php";

	$raw_input = file_get_contents('php://input');
	$input = json_decode($raw_input, true);
	
	switch($input["action"])
	{
		case "read":
			read();
			break;
		default:
			die("missing or unknown action!");
	}
	
	
	function read()
	{
		global $input;

		$conn = openDb();
		
		$id = mysqli_real_escape_string($conn, $input["id"]);
		checkNumeric($id);
	
		$query = "SELECT ";
		$query .= " cha.id, ";
		$query .= " cha.airport_icao, ";
		$query .= " cha.type, ";
		$query .= " cha.filename, ";
		$query .= " cha.mercator_n, ";
		$query .= " cha.mercator_s, ";
		$query .= " cha.mercator_e, ";
		$query .= " cha.mercator_w ";
		/*$query .= " cha.width_pixel, ";
		$query .= " cha.height_pixel, ";
		$query .= " cha.width_mm, ";
		$query .= " cha.height_mm, ";
		$query .= " cha.scale, ";
		$query .= " cha.arp_pixeloffset_east, ";
		$query .= " cha.arp_pixeloffset_south, ";
		$query .= " ap.latitude, ";
		$query .= " ap.longitude ";*/
		$query .= "FROM ad_charts AS cha ";
		$query .= "  INNER JOIN openaip_airports AS ap ";
		$query .= "  ON ap.icao = cha.airport_icao ";
		$query .= "WHERE ";
		$query .= "  cha.id = '" . $id . "'";
		
		// execute query
		$result = $conn->query($query);
		
		if ($result === FALSE)
			die("error reading chart: " . $conn->error . " query:" . $query);
		
		$rs = $result->fetch_array(MYSQLI_ASSOC);
		
		$chart = array(
			id => $rs["id"],
			airport_icao => $rs["airport_icao"],
			type => $rs["type"],
			filename => $rs["filename"],
			mercator_n => $rs["mercator_n"],
			mercator_s => $rs["mercator_s"],
			mercator_e => $rs["mercator_e"],
			mercator_w => $rs["mercator_w"]
			/*width_pixel => $rs["width_pixel"],
			height_pixel => $rs["height_pixel"],
			width_mm => $rs["width_mm"],
			height_mm => $rs["height_mm"],
			scale => $rs["scale"],
			arp_pixeloffset_east => $rs["arp_pixeloffset_east"],
			arp_pixeloffset_south => $rs["arp_pixeloffset_south"],
			latitude => $rs["latitude"],
			longitude => $rs["longitude"]*/
		);

		$conn->close();
		
		echo json_encode(array("chart" => $chart), JSON_NUMERIC_CHECK);
	}
?>