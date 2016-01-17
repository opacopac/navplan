<?php
	include "config.php";

	$input = json_decode(file_get_contents('php://input'), true);
	
	switch($input["action"])
	{
		case "readGlobalWaypoints":
			readGlobalWaypointList();
			break;
		case "readUserWaypoints":
			readUserWaypointList();
			break;
		case "saveUserWaypoint":
			saveUserWaypoint();
			break;
		case "deleteUserWaypoint":
			die("no yet implemented!");
		default:
			die("no action defined!");
	}


	function readGlobalWaypointList()
	{
		global $input;

		// open db
		$conn = openDb();

		$query = "SELECT * FROM global_waypoints";
		$result = $conn->query($query);

		while ($rs = $result->fetch_array(MYSQLI_ASSOC))
		{
			$globalWps[] = array(
				id => $rs["id"],
				type => $rs["type"],
				name => $rs["name"],
				latitude => $rs["latitude"],
				longitude => $rs["longitude"],
				remark => $rs["remark"]
			);
		}

		// close db
		$conn->close();
		
		echo json_encode(array("globalWaypoints" => $globalWps), JSON_NUMERIC_CHECK);
	}
		
		
	function readUserWaypointList()
	{
		global $input;

		// open db
		$conn = openDb();

		$email = mysqli_real_escape_string($conn, $input["email"]);
		$token = mysqli_real_escape_string($conn, $input["token"]);
		
		$query = "SELECT * FROM user_waypoints AS uwp";
		$query .= " INNER JOIN users AS usr ON uwp.user_id = usr.id";
		$query .= " WHERE usr.email = '" . $email . "' AND usr.token = '" . $token . "'";

		$result = $conn->query($query);
		
		if ($result === FALSE)
			die("error reading user waypoint list: " . $conn->error . " query:" . $query);

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

		// close db
		$conn->close();
		
		echo json_encode(array("userWaypoints" => $userWps), JSON_NUMERIC_CHECK);
	}
		
		
	function saveUserWaypoint()
	{
		global $input;

		// open db
		$conn = openDb();
		
		$email = mysqli_real_escape_string($conn, $input["email"]);
		$token = mysqli_real_escape_string($conn, $input["token"]);
		$wp_id = mysqli_real_escape_string($conn, $data["id"]);

		// check if user / wp exists
		$query = "SELECT id FROM users AS usr WHERE email = '" . $email . "' AND token = '" . $token . "'";
		
		if ($wp_id)
		{
			$query .= " INNER JOIN user_waypoints AS uwp ON uwp.user_id = usr.id";
			$query .= " WHERE uwp.id = '" . $wp_id . "'";
		}
		
		$result = $conn->query($query);

		if ($result === FALSE)
			die("error reading user id: " . $conn->error . " query:" . $query);

		if ($result->num_rows > 0)
		{
			$row = $result->fetch_assoc();
			$user_id = $row["id"];
		}
		else
			die("no valid user / waypoint found");

		// create wp
		$type = mysqli_real_escape_string($conn, $data["type"]);
		$name = mysqli_real_escape_string($conn, $data["checkpoint"]);
		$latitude = mysqli_real_escape_string($conn, $data["latitude"]);
		$longitude = mysqli_real_escape_string($conn, $data["longitude"]);
		$remark = mysqli_real_escape_string($conn, $data["remark"]);

		if ($wp_id)
		{
			$query =  "UPDATE user_waypoint";
			$query .= " SET user_id = '" . $user_id . "'";
			$query .= " SET type = '" . $type . "'";
			$query .= " SET name = '" . $name . "'";
			$query .= " SET latitude = '" . $latitude . "'";
			$query .= " SET longitude = '" . $longitude . "'";
			$query .= " SET remark = '" . $remark . "'";
			$query .= " WHERE id = " . $wp_id . "";
		}
		else
		{
			$query =  "INSERT INTO user_waypoint";
			$query .= " (user_id, type, name, latitude, longitude, remark)";
			$query .= " VALUES ('" . $user_id . "', '" . $type . "', '" . $name . "', '" . $latitude . "', '" . $longitude . "', '" . $remark . "')";
		}

		$result = $conn->query($query);
		
		return $result;
	}

?> 