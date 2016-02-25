<?php
	include "config.php";
	include "helper.php";

	// open db connection
	$conn = new mysqli($db_host, $db_user, $db_pw, $db_name);
	$conn->set_charset("utf8");

	
	$query = "SELECT * FROM openaip_navaids";
	$result = $conn->query($query);

	// build return object
	$return_object = buildReturnObject($result);
	$conn->close();
	
	
	// return output
	if (isset($_GET["debug"]))
	{
		echo "<html><body>\n";
		echo "<h1>DEBUG MODE</h1>\n";
		echo "<h2>QUERY</h2>";
		echo "<p style='font-family: courier'>" . $query . "</p>\n";
		echo "<h2>DB RESULT</h2>\n";
		echo "<p>" . $result . "</p>\n";
		echo "<h2>RETURN OBJECT</h2>\n";
		echo "<p>" . $return_object . "</p>\n";
		echo "</body></html>\n";
	}
	else
	{
		header("Access-Control-Allow-Origin: *"); //TODO: remove
		header("Content-Type: application/json; charset=UTF-8");
	
		echo($return_object);
	}
	
	
	function buildReturnObject($result)
	{
		while ($rs = $result->fetch_array(MYSQLI_ASSOC))
		{
			$navaids[] = array(
				id => $rs["id"],
				type => $rs["type"],
//				country => $rs["country"],
				kuerzel => $rs["kuerzel"],
				latitude => $rs["latitude"],
				longitude => $rs["longitude"],
//				elevation => $rs["elevation"],
				frequency => $rs["frequency"]
//				declination => $rs["declination"],
//				truenorth => $rs["truenorth"]
			);
		}
		
		return json_encode(array("navaids" => $navaids), JSON_NUMERIC_CHECK);
	}
?> 