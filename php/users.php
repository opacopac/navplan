<?php
	include "config.php";

	$input = json_decode(file_get_contents('php://input'), true);
	
	switch($input["action"])
	{
		case "login":
			loginUser();
			break;
		case "logout":
			logoutUser();
			break;
		case "register":
			registerUser();
			break;
		default:
			die("no action defined!");
	}
	
	
	function registerUser()
	{
		global $input;

		// open db
		$conn = openDb();

		// get credentials
		$email = mysqli_real_escape_string($conn, trim($input["email"]));
		$password = mysqli_real_escape_string($conn, trim($input["password"]));
		
		// TODO: validate user input (length, format etc.)

		// check duplicate email
		$query = "SELECT id FROM users WHERE email='" . $email . "'";
		$result = $conn->query($query);

		if ($result->num_rows > 0)
		{
			$token = "";
			
			$message = "error: user already exists";
			$resultcode = -1;
		}
		else
		{
			// hash pw
			$pw_hash = crypt($password);
			
			// create token
			$token = createToken();
		
			// add user
			$query = "INSERT INTO users (token, email, pw_hash) VALUES ('" . $token . "','" . $email . "','" . $pw_hash . "')";
			$result = $conn->query($query);

			// TODO: error handling
			
			$message = "";
			$resultcode = 0;
		}
		
		// output signup result
		echo json_encode(
			array(
				"resultcode" => $resultcode,
				"message" => $message,
				"token" => $token
			)
		);

		$conn->close();
	}


	function loginUser()
	{
		global $input;
	
		// open db
		$conn = openDb();

		// get credentials
		$email = mysqli_real_escape_string($conn, trim($input["email"]));
		$password = mysqli_real_escape_string($conn, trim($input["password"]));

		// get token
		$query = "SELECT id, token, pw_hash FROM users WHERE email='" . $email . "'";
		$result = $conn->query($query);
	
		if ($result->num_rows > 0)
		{
			$row = $result->fetch_assoc();
			$pw_hash_db = $row["pw_hash"];
			
			// compare pw hashes
			if ($pw_hash_db === crypt($password, $pw_hash_db))
			{
				$token = $row["token"];
				
				$message = "login successful";
				$resultcode = 0;
			}
			else
			{
				$token = "";
				
				$message = "error: invalid password";
				$resultcode = -1;
			}
		}
		else
		{
			$token = "";
			
			$message = "error: invalid email";
			$resultcode = -1;
		}

		// output login result
		echo json_encode(
			array(
				"resultcode" => $resultcode,
				"message" => $message,
				"token" => $token
			)
		);
		
		// close db
		$conn->close();
	}
	
	
	function logoutUser()
	{
		die("not yet implemented");
	}

	
	function createToken()
	{
		return md5(uniqid(rand(), true));
	}
	
	
    function hash_equals($a, $b)
	{
        $ret = strlen($a) ^ strlen($b);
        $ret |= array_sum(unpack("C*", $a^$b));
        return !$ret;
    }
?>