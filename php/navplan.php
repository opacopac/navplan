<?php
	include "config.php";
	include "helper.php";

    $conn = openDb();

    switch ($_SERVER['REQUEST_METHOD'])
    {
        case 'GET':
            if ($_GET["id"])
            {
                readNavplan(
                    checkId(intval($_GET["id"])),
                    checkEscapeEmail($conn, $_COOKIE["email"]),
                    checkEscapeToken($conn, $_COOKIE["token"])
                );
            }
            else
            {
                readNavplanList(
                    checkEscapeEmail($conn, $_COOKIE["email"]),
                    checkEscapeToken($conn, $_COOKIE["token"])
                );
            }
            break;
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            createNavplan(
                escapeNavplanData($conn, $input["globalData"]),
                checkEscapeEmail($conn, $_COOKIE["email"]),
                checkEscapeToken($conn, $_COOKIE["token"])
            );
            break;
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            updateNavplan(
                escapeNavplanData($conn, $input["globalData"]),
                checkEscapeEmail($conn, $_COOKIE["email"]),
                checkEscapeToken($conn, $_COOKIE["token"])
            );
            break;
        case 'DELETE':
            deleteNavplan(
                checkId(intval($_GET["id"])),
                checkEscapeEmail($conn, $_COOKIE["email"]),
                checkEscapeToken($conn, $_COOKIE["token"])
            );
            break;
        default:
            die("unknown request");
    }

	$conn->close();

	
	function readNavplanList($email, $token)
	{
		global $conn;

		// get navplan list
		$query = "SELECT nav.id AS nav_id, nav.title AS nav_title FROM navplan AS nav";
		$query .= " INNER JOIN users AS usr ON nav.user_id = usr.id";
		$query .= " WHERE usr.email = '" . $email . "' AND usr.token = '" . $token . "'";
		$query .= " ORDER BY nav.title ASC";

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

		echo json_encode(array("navplanList" => $navplans), JSON_NUMERIC_CHECK);
	}
	
	
	function readNavplan($navplan_id, $email, $token)
	{
		global $conn;

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
		$query = "SELECT wp.type, wp.freq, wp.callsign, wp.checkpoint, wp.alt, wp.isminalt, wp.ismaxalt, wp.remark, wp.latitude, wp.longitude, wp.airport_icao, wp.is_alternate FROM navplan_waypoints AS wp";
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
				airport_icao => $row["airport_icao"],
				latitude => $row["latitude"],
				longitude => $row["longitude"],
				alt => $row["alt"],
				isminalt => $row["isminalt"],
				ismaxalt => $row["ismaxalt"],
				remark => $row["remark"]
			);
			
			if ($row["is_alternate"] == 1)
				$alternate = $wp;
			else
				$waypoints[] = $wp;
		}
		
		$navplan["waypoints"] = $waypoints;
		$navplan["alternate"] = $alternate;


		echo json_encode(array("navplan" => $navplan), JSON_NUMERIC_CHECK);
	}
	
	
	function updateNavplan($navplan, $email, $token)
	{
		global $conn;

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
		

		echo json_encode(array("success" => 1), JSON_NUMERIC_CHECK);
	}

	
	function createNavplan($navplan, $email, $token)
	{
		global $conn;

		// check if user exists
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


		echo json_encode(array("navplan_id" => $navplan_id), JSON_NUMERIC_CHECK);
	}
	
	
	function deleteNavplan($navplan_id, $email, $token)
	{
		global $conn;


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
		$wp["airport_icao"] = $waypoint["airport_icao"] ? mysqli_real_escape_string($conn, $waypoint["airport_icao"]) : NULL;
		$wp["latitude"] = mysqli_real_escape_string($conn, $waypoint["latitude"]);
		$wp["longitude"] = mysqli_real_escape_string($conn, $waypoint["longitude"]);
		$wp["alt"] = mysqli_real_escape_string($conn, $waypoint["alt"]);
		$wp["isminalt"] = $waypoint["isminalt"] ? '1' : '0';
		$wp["ismaxalt"] = $waypoint["ismaxalt"] ? '1' : '0';
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
		$query = "INSERT INTO navplan_waypoints (navplan_id, sortorder, type, freq, callsign, checkpoint, airport_icao, latitude, longitude, alt, isminalt, ismaxalt, remark, is_alternate) VALUES (";
		$query .= "'" . $navplan_id . "',";
		$query .= "'" . $sortorder . "',";
		$query .= "'" . $waypoint["type"] . "',";
		$query .= "'" . $waypoint["freq"] . "',";
		$query .= "'" . $waypoint["callsign"] . "',";
		$query .= "'" . $waypoint["checkpoint"] . "',";
		$query .= $waypoint["airport_icao"] ? "'" . $waypoint["airport_icao"] . "'," : "NULL, ";
		$query .= "'" . $waypoint["latitude"] . "',";
		$query .= "'" . $waypoint["longitude"] . "',";
		$query .= "'" . $waypoint["alt"] . "',";
		$query .= "'" . $waypoint["isminalt"] . "',";
		$query .= "'" . $waypoint["ismaxalt"] . "',";
		$query .= "'" . $waypoint["remark"] . "',";
		$query .= "'" . $is_alternate . "')";
		
		return $query;
	}
?>