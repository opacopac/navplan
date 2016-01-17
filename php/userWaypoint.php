<?php
	include "config.php";

	$input = json_decode(file_get_contents('php://input'), true);
	
	switch($input["action"])
	{
		case "save":
			saveUserWaypoint();
			break;
		case "readUserWaypoints":
			readUserWaypointList();
			break;
		case "readGlobalWaypoints":
			readGlobalWaypointList();
			break;
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
		
		
	function saveUserWaypoint($data)
	{
		global $input;

		// open db
		$conn = openDb();
		
		$email = mysqli_real_escape_string($conn, $input["email"]);
		$token = mysqli_real_escape_string($conn, $input["token"]);

		
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