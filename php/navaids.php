<?php
	include "config.php";
	include "helper.php";

	// open db connection
	$conn = openDb();

	
	$query = "SELECT * FROM openaip_navaids";
	$result = $conn->query($query);

	// build return object
	$return_object = buildGeonamesList($result);

	$conn->close();
	
	
	// return output
	header("Content-Type: application/json; charset=UTF-8");

    echo($return_object);

	
	function buildReturnObject($result)
	{
		while ($rs = $result->fetch_array(MYSQLI_ASSOC))
		{
		    $unit = "MHz";

		    if ($rs["type"] == "NDB")
		        $unit = "kHz";

			$navaids[] = array(
				id => $rs["id"],
				type => $rs["type"],
//				country => $rs["country"],
				kuerzel => $rs["kuerzel"],
				latitude => $rs["latitude"],
				longitude => $rs["longitude"],
				elevation => $rs["elevation"],
				frequency => $rs["frequency"],
				unit => $unit,
				declination => $rs["declination"],
				truenorth => $rs["truenorth"]
			);
		}
		
		return json_encode(array("navaids" => $navaids), JSON_NUMERIC_CHECK);
	}
?>