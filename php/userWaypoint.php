<?php
	include "config.php";
	include "helper.php";

    $conn = openDb();

    switch ($_SERVER['REQUEST_METHOD'])
    {
        case 'GET':
            readUserWaypointList(
                $_COOKIE["email"] ? checkEscapeEmail($conn, $_COOKIE["email"]) : NULL,
                $_COOKIE["token"] ? checkEscapeToken($conn, $_COOKIE["token"]) : NULL
            );
            break;
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            createUserWaypoint(
                checkEscapeEmail($conn, $_COOKIE["email"]),
                checkEscapeToken($conn, $_COOKIE["token"]),
                checkEscapeString($conn, $input["wp"]["checkpoint"], 1, 100),
		        checkNumeric($input["wp"]["latitude"]),
		        checkNumeric($input["wp"]["longitude"]),
		        checkEscapeString($conn, $input["wp"]["remark"], 0, 100),
		        checkEscapeString($conn, $input["wp"]["supp_info"], 0, 255)
            );
            break;
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            updateUserWaypoint(
                checkEscapeEmail($conn, $_COOKIE["email"]),
                checkEscapeToken($conn, $_COOKIE["token"]),
		        checkId($input["id"]),
                checkEscapeString($conn, $input["wp"]["checkpoint"], 1, 100),
		        checkNumeric($input["wp"]["latitude"]),
		        checkNumeric($input["wp"]["longitude"]),
		        checkEscapeString($conn, $input["wp"]["remark"], 0, 100),
		        checkEscapeString($conn, $input["wp"]["supp_info"], 0, 255)
            );
            break;
        case 'DELETE':
            deleteUserWaypoint(
                checkId(intval($_GET["id"])),
                checkEscapeEmail($conn, $_COOKIE["email"]),
                checkEscapeToken($conn, $_COOKIE["token"])
            );
            break;
        default:
            die("unknown request");
    }

	$conn->close();


	function readUserWaypointList($email, $token)
	{
		global $conn;

		$userWps = [];

		if ($email && $token)
		{
            $query = "SELECT uwp.* FROM user_waypoints AS uwp";
            $query .= " INNER JOIN users AS usr ON uwp.user_id = usr.id";
            $query .= " WHERE usr.email = '" . $email . "' AND usr.token = '" . $token . "'";

            $result = $conn->query($query);

            if ($result === FALSE)
                die("error reading user waypoint list: " . $conn->error . " query:" . $query);

            while ($rs = $result->fetch_array(MYSQLI_ASSOC))
            {
                $userWps[] = array(
                    id => intval($rs["id"]),
                    type => $rs["type"],
                    name => $rs["name"],
                    latitude => floatval($rs["latitude"]),
                    longitude => floatval($rs["longitude"]),
                    remark => $rs["remark"],
                    supp_info => $rs["supp_info"]
                );
            }
        }

		echo json_encode(array("userWaypoints" => $userWps));
	}
		
		
	function createUserWaypoint($email, $token, $name, $latitude, $longitude, $remark, $supp_info)
	{
		global $conn;

		// get user id
		$query = "SELECT id FROM users AS usr WHERE email = '" . $email . "' AND token = '" . $token . "'";

		$result = $conn->query($query);

		if ($result === FALSE)
			die("error reading user id: " . $conn->error . " query:" . $query);

		if ($result->num_rows == 1)
		{
			$row = $result->fetch_assoc();
			$user_id = $row["id"];
		}
		else
			die("user not found");

		// create wp
		$query =  "INSERT INTO user_waypoints";
		$query .= " (user_id, type, name, latitude, longitude, remark, supp_info)";
		$query .= " VALUES ('" . $user_id . "', 'user', '" . $name . "', '" . $latitude . "', '" . $longitude . "', '" . $remark . "', '" . $supp_info . "')";

		$result = $conn->query($query);

		if ($result === FALSE)
			die("error creating user waypoint: " . $conn->error . " query:" . $query);

		echo json_encode(array("success" => 1));
	}


	function updateUserWaypoint($email, $token, $wp_id, $name, $latitude, $longitude, $remark, $supp_info)
	{
		global $conn;

		// get user id
		$query = "SELECT usr.id FROM users AS usr";
		$query .= " INNER JOIN user_waypoints AS uwp ON uwp.user_id = usr.id";
		$query .= " WHERE uwp.id = '" . $wp_id . "' AND usr.email = '" . $email . "' AND usr.token = '" . $token . "'";

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
		$query =  "UPDATE user_waypoints SET";
		$query .= " user_id = '" . $user_id . "',";
		$query .= " name = '" . $name . "',";
		$query .= " latitude = '" . $latitude . "',";
		$query .= " longitude = '" . $longitude . "',";
		$query .= " remark = '" . $remark . "',";
        $query .= " supp_info = '" . $supp_info . "'";
		$query .= " WHERE id = " . $wp_id . "";

		$result = $conn->query($query);
		
		if ($result === FALSE)
			die("error updating user waypoint: " . $conn->error . " query:" . $query);

		echo json_encode(array("success" => 1));
	}
	
	
	function deleteUserWaypoint($wp_id, $email, $token)
	{
		global $conn;

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

		echo json_encode(array("success" => 1));
	}	
?>
