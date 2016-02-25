<?php
	include "config.php";
	include "helper.php";

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
		case "forgotpassword":
			forgotPassword();
			break;
		case "updatepassword":
			updatePassword();
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
		
		if (!checkEmailFormat($email) || !checkPwFormat($password))
		{
			$resultcode = -3;
			$message = "error: invalid format of email or password";
		}

		if (!$resultcode)
		{
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
				
				if ($result === FALSE)
					die("error creating user: " . $conn->error . " query:" . $query);
				
				$message = "";
				$resultcode = 0;
			}
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
		
		if (!checkEmailFormat($email) || !checkPwFormat($password))
		{
			$resultcode = -3;
			$message = "error: invalid format of email or password";
		}


		// get token
		$query = "SELECT id, token, pw_hash FROM users WHERE email='" . $email . "'";
		$result = $conn->query($query);
	
		if ($result->num_rows == 1)
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
			$resultcode = -2;
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
	
	
	function forgotPassword()
	{
		global $input;
	
		// open db
		$conn = openDb();

		// get credentials
		$email = mysqli_real_escape_string($conn, trim($input["email"]));
		
		if (!checkEmailFormat($email))
		{
			$resultcode = -3;
			$message = "error: invalid email format";
		}


		// check if email exists
		$query = "SELECT id FROM users WHERE email='" . $email . "'";
		$result = $conn->query($query);
	
		if ($result->num_rows == 1)
		{
			$row = $result->fetch_assoc();
			
			// generate random pw
			$password = generateRandomPw(8);

			// hash pw
			$pw_hash = crypt($password);
			
			// save hashed pw
			$query = "UPDATE users SET pw_hash='" . $pw_hash . "' WHERE email='" . $email . "'";
			$result = $conn->query($query);
							
			if ($result === FALSE)
				die("error updating password: " . $conn->error . " query:" . $query);

			// send email with pw
			$to = $email;
			$subject = "Navplan.ch - Password Reset";
			$message = '
				<html>
				<head>
				  <title>Bavplan.ch - Password Reset</title>
				</head>
				<body>
				  <p>Your new password is: ' . $password . '</p>
				  <p><a href="http://www.navplan.ch/#/login">Go Login Page</a></p>
				</body>
				</html>';
			$headers  = 'MIME-Version: 1.0' . "\r\n";
			$headers .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";
			$headers .= 'From: info@navplan.ch' . "\r\n";
			$headers .= 'Reply-To: info@navplan.ch' . "\r\n";

			mail($to, $subject, $message, $headers);			
			
			$message = "email sent successfully";
			$resultcode = 0;
		}
		else
		{
			$message = "error: invalid email";
			$resultcode = -2;
		}

		// output result
		echo json_encode(
			array(
				"resultcode" => $resultcode,
				"message" => $message
			)
		);
		
		// close db
		$conn->close();
	}
	
	
	function updatePassword()
	{
		global $input;
	
		// open db
		$conn = openDb();

		// get credentials
		$email = mysqli_real_escape_string($conn, trim($input["email"]));
		$oldpassword = mysqli_real_escape_string($conn, trim($input["oldpassword"]));
		$newpassword = mysqli_real_escape_string($conn, trim($input["newpassword"]));

		if (!checkEmailFormat($email) || !checkPwFormat($oldpassword) || !checkPwFormat($newpassword))
		{
			$resultcode = -3;
			$message = "error: invalid format of email or password";
		}
		
		// find user
		$query = "SELECT id, pw_hash FROM users WHERE email='" . $email . "'";
		$result = $conn->query($query);
	
		if ($result->num_rows == 1)
		{
			$row = $result->fetch_assoc();
			$pw_hash_db = $row["pw_hash"];
			
			// compare pw hashes
			if ($pw_hash_db === crypt($oldpassword, $pw_hash_db))
			{
				// hash new pw
				$newpw_hash = crypt($newpassword);

				// save new pw
				$query = "UPDATE users SET pw_hash='" . $newpw_hash . "' WHERE email='" . $email . "'";
				$result = $conn->query($query);
								
				if ($result === FALSE)
					die("error updating password: " . $conn->error . " query:" . $query);
			
				$message = "password successfully changed";
				$resultcode = 0;
			}
			else
			{
				$message = "error: invalid password";
				$resultcode = -1;
			}
		}
		else
		{
			$message = "error: invalid email";
			$resultcode = -2;
		}
		
		
		// output result
		echo json_encode(
			array(
				"resultcode" => $resultcode,
				"message" => $message
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
	
	
	function checkEmailFormat($email)
	{
		if (!filter_var($email, FILTER_VALIDATE_EMAIL)
			|| strlen($email > 100))
		{
			return false;
		}
		
		return true;
	}
	
	
	function checkPwFormat($password)
	{
		if (strlen($password) < 6
			|| strlen($password) > 50)
		{
			return false;
		}
		
		return true;
	}
	
	
	function generateRandomPw($length)
	{
		$chars =  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

		return substr(str_shuffle($chars), 0, $length);
	}
?>