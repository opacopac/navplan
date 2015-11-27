<?php
	include "config.php";

	header("Access-Control-Allow-Origin: *"); //TODO: remove
	header("Content-Type: application/json; charset=UTF-8");

	$conn = new mysqli($db_host, $db_user, $db_pw, $db_name);
	
	if (!isset($_GET["flightplan_id"]))
	{
		echo("ERROR: Missing Argument 'flightplan_id'!");
		return();
	}

	$flightplan_id = mysql_real_escape_string ($_GET["flightplan_id"]);
	
	$quey = "SELECT * FROM flightplan_waypoint WHERE flightplan_id=" . $flightplan_id . " ORDER BY sortorder ASC";

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