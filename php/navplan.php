<?php
	include "config.php";
	
	$input = json_decode(file_get_contents('php://input'), true);
	
	switch($input["action"])
	{
		case "getList":
			getNavplanList();
			break;
		case "getDetails":
			getNavplanDetails();
			break;
		default:
			die("missing or unknown action!");
	}
	
	
	function getNavplanList()
	{
		global $input;

		$conn = openDb();

		$email = mysqli_real_escape_string($conn, $input["email"]);
		$token = mysqli_real_escape_string($conn, $input["token"]);

		// get navplan list
		$query = "SELECT nav.id AS nav_id, nav.title AS nav_title FROM navplan AS nav";
		$query .= " INNER JOIN users AS usr ON nav.user_id = usr.id";
		$query .= " WHERE usr.email = '" . $email . "' AND usr.token = '" . $token . "'";
		$query .= " ORDER BY nav.id ASC";

		$result = $conn->query($query);
		
		// create result array
		while ($row = $result->fetch_array(MYSQLI_ASSOC))
		{
			$navplans[] = array(
				id => $row["nav_id"],
				title => $row["nav_title"]
			);
		}
		
		$conn->close();

		echo json_encode(array("navplanList" => $navplans), JSON_NUMERIC_CHECK);
	}
	
	
	function getNavplanDetails()
	{
		global $input;

		// open db
		$conn = openDb();

		$navplan_id = mysqli_real_escape_string($conn, $input["navplan_id"]);
		$email = mysqli_real_escape_string($conn, $input["email"]);
		$token = mysqli_real_escape_string($conn, $input["token"]);

		// get navplan details
		$query = "SELECT nav.id AS id, nav.title AS title, nav.aircraft_speed AS aircraft_speed, nav.aircraft_consumption AS aircraft_consumption, nav.extra_fuel AS extra_fuel FROM navplan AS nav";
		$query .= " INNER JOIN users AS usr ON nav.user_id = usr.id";
		$query .= " WHERE nav.id = '" . $navplan_id . "' AND usr.email = '" . $email . "' AND usr.token = '" . $token . "'";
		
		$result = $conn->query($query);

		if ($result->num_rows > 0)
		{
			$row = $result->fetch_assoc();
			$navplan["id"] = $row["id"];
			$navplan["title"] = $row["title"];
			$navplan["aircraft_speed"] = $row["aircraft_speed"];
			$navplan["aircraft_consumption"] = $row["aircraft_consumption"];
			$navplan["extra_fuel"] = $row["extra_fuel"];
		}
		else
			die("no navplan with id: '" . $navplan_id . "' of current user found");
		
		// get navplan waypoints
		$query = "SELECT wp.freq, wp.callsign, wp.checkpoint, wp.alt, wp.remarks, wp.latitude, wp.longitude FROM navplan_waypoints AS wp";
		$query .= " WHERE wp.navplan_id = '" . $navplan_id . "'";
		$query .= " ORDER BY wp.sortorder ASC";
		
		$result = $conn->query($query);

		// create result array
		while ($row = $result->fetch_assoc())
		{
			$waypoints[] = array(
				id => $row["nav.id"],
				title => $row["nav.title"]
			);
		}
		
		$navplan["waypoints"] = $waypoints;
		
		$conn->close();
		
		echo json_encode(array("navplan" => $navplan), JSON_NUMERIC_CHECK);
	}
?>