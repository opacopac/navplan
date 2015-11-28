<?php
	include "config.php";

	// open db connection
	$conn = new mysqli($db_host, $db_user, $db_pw, $db_name);
	$conn->set_charset("utf8");
	
	if (!isset($_GET["action"]))
		die ("Error: Argument 'action' missing");

	
	if ($_GET["action"] == "save")
	{
		$data = json_decode(file_get_contents("php://input"), true); 
		$result = saveWaypoint($data);
	}
	else if ($_GET["action"] == "getall")
	{
		$result = getAllWaypoints();
	}
	else
		die ("Error: Unknown value for argument 'action'");
		
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
		echo "</body></html>\n";
	}
	else
	{
		header("Access-Control-Allow-Origin: *"); //TODO: remove
		header("Content-Type: application/json; charset=UTF-8");
	
		echo($result);
	}


	function getAllWaypoints()
	{
		global $conn;
		$query = "SELECT * FROM user_waypoint";
		$result = $conn->query($query);

		while ($rs = $result->fetch_array(MYSQLI_ASSOC))
		{
			$userWps[] = array(
				id => $rs["id"],
				type => $rs["type"],
				name => $rs["name"],
				latitude => $rs["latitude"],
				longitude => $rs["longitude"],
				remark => $rs["remark"]
			);
		}
		
		return json_encode(array("userWaypoints" => $userWps), JSON_NUMERIC_CHECK);
	}
		
		
	function saveWaypoint($data)
	{
		global $conn;

		$id = mysqli_real_escape_string($conn, $data["id"]);
		$type = mysqli_real_escape_string($conn, $data["type"]);
		$name = mysqli_real_escape_string($conn, $data["checkpoint"]);
		$latitude = mysqli_real_escape_string($conn, $data["latitude"]);
		$longitude = mysqli_real_escape_string($conn, $data["longitude"]);
		$remark = mysqli_real_escape_string($conn, $data["remark"]);

		if ($id > 0)
		{
			$query =  "UPDATE user_waypoint";
			$query .= " SET type = '" . $type . "'";
			$query .= " SET name = '" . $name . "'";
			$query .= " SET latitude = '" . $latitude . "'";
			$query .= " SET longitude = '" . $longitude . "'";
			$query .= " SET remark = '" . $remark . "'";
			$query .= " WHERE id = " . $id . "";
		}
		else
		{
			$query =  "INSERT INTO user_waypoint";
			$query .= " (type, name, latitude, longitude, remark)";
			$query .= " VALUES ('" . $type . "', '" . $name . "', '" . $latitude . "', '" . $longitude . "', '" . $remark . "')";
		}

		$result = $conn->query($query);
		
		return $result;
	}

?> 