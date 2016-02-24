<?php
	include "config.php";

	$raw_input = file_get_contents('php://input');
	$input = json_decode($raw_input, true);
	
	switch($input["action"])
	{
		case "readList":
			readNavplanList();
			break;
		case "read":
			readNavplan();
			break;
		case "update":
//			die(var_dump($raw_input));
			updateNavplan();
			break;
		case "create":
			createNavplan();
			break;
		case "delete":
			deleteNavplan();
			break;
		default:
			die("missing or unknown action!");
	}
	
	
	function readNavplanList()
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
		
		if ($result === FALSE)
			die("error reading navplan list: " . $conn->error . " query:" . $query);

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
	
	
	function readNavplan()
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

		if ($result === FALSE)
			die("error reading navplan: " . $conn->error . " query:" . $query);

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
		$query = "SELECT wp.type, wp.freq, wp.callsign, wp.checkpoint, wp.alt, wp.remark, wp.latitude, wp.longitude, wp.is_alternate FROM navplan_waypoints AS wp";
		$query .= " WHERE wp.navplan_id = '" . $navplan_id . "'";
		$query .= " ORDER BY wp.sortorder ASC";
		
		$result = $conn->query($query);

		if ($result === FALSE)
			die("error reading navplan waypoints: " . $conn->error . " query:" . $query);

		// create result array
		while ($row = $result->fetch_assoc())
		{
			$wp = array(
				type => $row["type"],
				freq => $row["freq"],
				callsign => $row["callsign"],
				checkpoint => $row["checkpoint"],
				latitude => $row["latitude"],
				longitude => $row["longitude"],
				alt => $row["alt"],
				remark => $row["remark"]
			);
			
			if ($row["is_alternate"] == 1)
				$alternate = $wp;
			else
				$waypoints[] = $wp;
		}
		
		$navplan["waypoints"] = $waypoints;
		$navplan["alternate"] = $alternate;
		
		$conn->close();
		
		echo json_encode(array("navplan" => $navplan), JSON_NUMERIC_CHECK);
	}
	
	
	function updateNavplan()
	{
		global $input;

		// open db
		$conn = openDb();

		$navplan = escapeNavplanData($conn, $input["globalData"]);
		$email = mysqli_real_escape_string($conn, $input["globalData"]["user"]["email"]);
		$token = mysqli_real_escape_string($conn, $input["globalData"]["user"]["token"]);

		// check if navplan exists
		$query = "SELECT nav.id FROM navplan AS nav";
		$query .= " INNER JOIN users AS usr ON nav.user_id = usr.id";
		$query .= " WHERE nav.id = '" . $navplan["id"] . "' AND usr.email = '" . $email . "' AND usr.token = '" . $token . "'";
		
		$result = $conn->query($query);

		if ($result === FALSE)
			die("error reading navplan/user: " . $conn->error . " query:" . $query);

		if ($result->num_rows <= 0)
			die("no navplan with id: '" . $navplan_id . "' of current user found");

		// update navplan
		$query = "UPDATE navplan SET";
		$query .= " title = '" . $navplan["title"] . "',";
		$query .= " aircraft_speed = '" . $navplan["aircraft_speed"] . "',";
		$query .= " aircraft_consumption = '" . $navplan["aircraft_consumption"] . "',";
		$query .= " extra_fuel = '" . $navplan["extra_fuel"] . "' ";
		$query .= " WHERE id = '" . $navplan["id"] . "'";
		
		$result = $conn->query($query);

		if ($result === FALSE)
			die("error updating navplan: " . $conn->error . " query:" . $query);

		
		// update waypoints
		$query = "DELETE FROM navplan_waypoints WHERE navplan_id = '" . $navplan["id"] . "'";
		$result = $conn->query($query);
		
		if ($result === FALSE)
			die("error deleting waypoints from navplan: " . $conn->error . " query:" . $query);

		createWaypoints($conn, $navplan["waypoints"], $navplan["alternate"], $navplan["id"]);
		
		$conn->close();
		
		echo json_encode(array("success" => 1), JSON_NUMERIC_CHECK);
	}

	
	function createNavplan()
	{
		global $input;

		// open db
		$conn = openDb();

		$navplan = escapeNavplanData($conn, $input["globalData"]);
		$email = mysqli_real_escape_string($conn, $input["globalData"]["user"]["email"]);
		$token = mysqli_real_escape_string($conn, $input["globalData"]["user"]["token"]);

		// check if user + navplan exists
		$query = "SELECT id FROM users WHERE email = '" . $email . "' AND token = '" . $token . "'";
		
		$result = $conn->query($query);

		if ($result === FALSE)
			die("error reading user id: " . $conn->error . " query:" . $query);

		if ($result->num_rows > 0)
		{
			$row = $result->fetch_assoc();
			$user_id = $row["id"];
		}
		else
			die("no valid user found");

		// create navplan
		$query = "INSERT INTO navplan (user_id, title, aircraft_speed, aircraft_consumption, extra_fuel) VALUES (";
		$query .= "'" . $user_id . "',";
		$query .= "'" . $navplan["title"] . "',";
		$query .= "'" . $navplan["aircraft_speed"] . "',";
		$query .= "'" . $navplan["aircraft_consumption"] . "',";
		$query .= "'" . $navplan["extra_fuel"] . "')";
		
		$result = $conn->query($query);

		if ($result === FALSE)
			die("error inserting navplan: " . $conn->error . " query:" . $query);
		else
			$navplan_id = $conn->insert_id;
	
		
		// update waypoints
		createWaypoints($conn, $navplan["waypoints"], $navplan["alternate"], $navplan_id);
		
		$conn->close();

		echo json_encode(array("navplan_id" => $navplan_id), JSON_NUMERIC_CHECK);
	}
	
	
	function deleteNavplan()
	{
		global $input;

		// open db
		$conn = openDb();

		$navplan_id = mysqli_real_escape_string($conn, $input["navplan_id"]);
		$email = mysqli_real_escape_string($conn, $input["email"]);
		$token = mysqli_real_escape_string($conn, $input["token"]);

		// check if navplan exists
		$query = "SELECT nav.id FROM navplan AS nav";
		$query .= " INNER JOIN users AS usr ON nav.user_id = usr.id";
		$query .= " WHERE nav.id = '" . $navplan_id . "' AND usr.email = '" . $email . "' AND usr.token = '" . $token . "'";
		
		$result = $conn->query($query);

		if ($result === FALSE)
			die("error searching navplan/user: " . $conn->error . " query:" . $query);

		if ($result->num_rows <= 0)
			die("no navplan with id: '" . $navplan_id . "' of current user found");

		// update navplan
		$query = "DELETE FROM navplan WHERE id = '" . $navplan_id . "'";
		
		$result = $conn->query($query);

		if ($result === FALSE)
			die("error deleting navplan: " . $conn->error . " query:" . $query);
		
		$conn->close();
		
		echo json_encode(array("success" => 1), JSON_NUMERIC_CHECK);
	}

	
	function escapeNavplanData($conn, $globalData)
	{
		$nav["id"] = mysqli_real_escape_string($conn, $globalData["navplan"]["id"]);
		$nav["title"] = mysqli_real_escape_string($conn, $globalData["navplan"]["title"]);
		$nav["aircraft_speed"] = mysqli_real_escape_string($conn, $globalData["aircraft"]["speed"]);
		$nav["aircraft_consumption"] = mysqli_real_escape_string($conn, $globalData["aircraft"]["consumption"]);
		$nav["extra_fuel"] = mysqli_real_escape_string($conn, $globalData["fuel"]["extraTime"]);
		
		foreach ($globalData["navplan"]["waypoints"] as $waypoint)
			$nav["waypoints"][] =  escapeWaypointData($conn, $waypoint);
			
		if ($globalData["navplan"]["alternate"])
			$nav["alternate"] = escapeWaypointData($conn, $globalData["navplan"]["alternate"]);
		
		return $nav;
	}
	
	
	function escapeWaypointData($conn, $waypoint)
	{
		$wp["type"] = mysqli_real_escape_string($conn, $waypoint["type"]);
		$wp["freq"] = mysqli_real_escape_string($conn, $waypoint["freq"]);
		$wp["callsign"] = mysqli_real_escape_string($conn, $waypoint["callsign"]);
		$wp["checkpoint"] = mysqli_real_escape_string($conn, $waypoint["checkpoint"]);
		$wp["latitude"] = mysqli_real_escape_string($conn, $waypoint["latitude"]);
		$wp["longitude"] = mysqli_real_escape_string($conn, $waypoint["longitude"]);
		$wp["alt"] = mysqli_real_escape_string($conn, $waypoint["alt"]);
		$wp["remark"] = mysqli_real_escape_string($conn, $waypoint["remark"]);
		
		return $wp;
	}
	
	
	function createWaypoints($conn, $waypoints, $alternate, $navplan_id)
	{
		for ($i = 0; $i < count($waypoints); $i++)
		{
			$query = createInsertWaypointQuery($waypoints[$i], $i, $navplan_id, 0);
			$result = $conn->query($query);

			if ($result === FALSE)
				die("error inserting waypoint: " . $conn->error . " query:" . $query);
		}
		
		if ($alternate)
		{
			$query = createInsertWaypointQuery($alternate, count($waypoints), $navplan_id, 1);
			$result = $conn->query($query);

			if ($result === FALSE)
				die("error inserting alternate: " . $conn->error . " query:" . $query);
		}
	}
	
	
	function createInsertWaypointQuery($waypoint, $sortorder, $navplan_id, $is_alternate)
	{
		$query = "INSERT INTO navplan_waypoints (navplan_id, sortorder, type, freq, callsign, checkpoint, latitude, longitude, alt, remark, is_alternate) VALUES (";
		$query .= "'" . $navplan_id . "',";
		$query .= "'" . $sortorder . "',";
		$query .= "'" . $waypoint["type"] . "',";
		$query .= "'" . $waypoint["freq"] . "',";
		$query .= "'" . $waypoint["callsign"] . "',";
		$query .= "'" . $waypoint["checkpoint"] . "',";
		$query .= "'" . $waypoint["latitude"] . "',";
		$query .= "'" . $waypoint["longitude"] . "',";
		$query .= "'" . $waypoint["alt"] . "',";
		$query .= "'" . $waypoint["remark"] . "',";
		$query .= "'" . $is_alternate . "')";
		
		return $query;
	}
?>