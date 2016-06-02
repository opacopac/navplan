<?php
	function openDb()
	{
		global $db_host, $db_user, $db_pw, $db_name;
	
		// open db connection
		$conn = new mysqli($db_host, $db_user, $db_pw, $db_name);
		$conn->set_charset("utf8");
		
		return $conn;
	}
	

	function checkNumeric($var)
	{
		if (!is_numeric($var))
			die("format error");
	}


	function checkString($conn, $string, $minlen, $maxlen)
	{
	    if (isset($maxlen) && strlen($string) > $maxlen)
			die("format error");

	    if (isset($minlen) && strlen($string) < $minlen)
			die("format error");

        return mysqli_real_escape_string($conn, $string);
	}


    function checkEmail($conn, $email)
    {
        if (!$email)
            die("email is null");

        // TODO: check email format
        return checkString($conn, $email, 1, 100);
    }


    function checkToken($conn, $token)
    {
        if (!$token)
            die("token is null");

        return checkString($conn, $token, 1, 100);
    }


    function checkId($conn, $id)
    {
        if (!is_numeric($id))
			die("format error");

        if ($id < 0 || $id > 4294967295)
			die("format error");

        return $id;
    }
?>