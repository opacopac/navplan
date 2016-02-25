<?php
	include "config.php";
	include "helper.php";

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
			deleteUserWaypoint();
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

		$conn = openDb();

		$email = mysqli_real_escape_string($conn, $input["email"]);
		$token = mysqli_real_escape_string($conn, $input["token"]);
		
		$query = "SELECT uwp.* FROM user_waypoints AS uwp";
		$query .= " INNER JOIN users AS usr ON uwp.user_id = usr.id";
		$query .= " WHERE usr.email = '" . $email . "' AND usr.token = '" . $token . "'";

		$result = $conn->query($query);
		
		if ($result === FALSE)
			die("error reading user waypoint list: " . $conn->error . " query:" . $query);

		$userWps = [];
		
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

		$conn->close();
		
		echo json_encode(array("userWaypoints" => $userWps), JSON_NUMERIC_CHECK);
	}
		
		
	function saveUserWaypoint()
	{
		global $input;

		$conn = openDb();
		
		$email = mysqli_real_escape_string($conn, $input["email"]);
		$token = mysqli_real_escape_string($conn, $input["token"]);
		$wp_id = mysqli_real_escape_string($conn, $input["wp"]["id"]);

		// get user id
		if ($wp_id > 0)
		{
			$query = "SELECT usr.id FROM users AS usr";
			$query .= " INNER JOIN user_waypoints AS uwp ON uwp.user_id = usr.id";
			$query .= " WHERE uwp.id = '" . $wp_id . "' AND usr.email = '" . $email . "' AND usr.token = '" . $token . "'";
		}
		else
		{
			$query = "SELECT id FROM users AS usr WHERE email = '" . $email . "' AND token = '" . $token . "'";
		}
		
		$result = $conn->query($query);

		if ($result === FALSE)
			die("error reading user id: " . $conn->error . " query:" . $query);

		if ($result->num_rows == 1)
		{
			$row = $result->fetch_assoc();
			$user_id = $row["id"];
		}
		else
			die("no valid user / waypoint found");

		// create wp
		$name = mysqli_real_escape_string($conn, $input["wp"]["checkpoint"]);
		$latitude = mysqli_real_escape_string($conn, $input["wp"]["latitude"]);
		$longitude = mysqli_real_escape_string($conn, $input["wp"]["longitude"]);
		$remark = mysqli_real_escape_string($conn, $input["wp"]["remark"]);

		if ($wp_id > 0)
		{
			$query =  "UPDATE user_waypoints SET";
			$query .= " user_id = '" . $user_id . "',";
			$query .= " name = '" . $name . "',";
			$query .= " latitude = '" . $latitude . "',";
			$query .= " longitude = '" . $longitude . "',";
			$query .= " remark = '" . $remark . "'";
			$query .= " WHERE id = " . $wp_id . "";
		}
		else
		{
			$query =  "INSERT INTO user_waypoints";
			$query .= " (user_id, type, name, latitude, longitude, remark)";
			$query .= " VALUES ('" . $user_id . "', 'user', '" . $name . "', '" . $latitude . "', '" . $longitude . "', '" . $remark . "')";
		}

		$result = $conn->query($query);
		
		if ($result === FALSE)
			die("error saving user waypoint: " . $conn->error . " query:" . $query);

		
		echo json_encode(array("success" => 1), JSON_NUMERIC_CHECK);
	}
	
	
	function deleteUserWaypoint()
	{
		global $input;

		$conn = openDb();
		
		$email = mysqli_real_escape_string($conn, $input["email"]);
		$token = mysqli_real_escape_string($conn, $input["token"]);
		$wp_id = mysqli_real_escape_string($conn, $input["wp_id"]);

		// check if user & wp exists
		$query = "SELECT usr.id FROM users AS usr";
		$query .= " INNER JOIN user_waypoints AS uwp ON uwp.user_id = usr.id";
		$query .= " WHERE uwp.id = '" . $wp_id . "' AND usr.email = '" . $email . "' AND usr.token = '" . $token . "'";
		
		$result = $conn->query($query);

		if ($result === FALSE)
			die("error reading user id: " . $conn->error . " query:" . $query);

		if ($result->num_rows == 1)
		{
			$query = "DELETE FROM user_waypoints WHERE id = '" . $wp_id . "'";
			
			$result = $conn->query($query);

			if ($result === FALSE)
				die("error deleting user waypoint: " . $conn->error . " query:" . $query);
		}
		else
			die("no valid user / waypoint found");
		
		echo json_encode(array("success" => 1), JSON_NUMERIC_CHECK);
	}	
?> 