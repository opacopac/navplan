<?php
	include "config.php";

	header("Access-Control-Allow-Origin: *"); //TODO: remove
	header("Content-Type: application/json; charset=UTF-8");

	$conn = new mysqli($db_host, $db_user, $db_pw, $db_name);
	
	if (!isset($_GET["search"]))
		$search = "";
	else
		$search = mysqli_real_escape_string($conn, $_GET["search"]);

	
	$query = "SELECT * FROM flightplan WHERE title LIKE '" . $search . "%'";

	$result = $conn->query($query);

	$outp = "";
	while($rs = $result->fetch_array(MYSQLI_ASSOC)) {
		if ($outp != "") {$outp .= ",";}
		$outp .= '{"id":"' . $rs["id"] . '",';
		$outp .= '"title":"' . $rs["title"] . '",';
		$outp .= '"aircraft_speed":"' . $rs["aircraft_speed"] . '",';
		$outp .= '"wind_direction":"' . $rs["wind_direction"] . '",';
		$outp .= '"wind_speed":"' . $rs["wind_speed"] . '"}';
	}
	$outp ='{"records":['.$outp.']}';
	$conn->close();

	echo($outp);
?> 