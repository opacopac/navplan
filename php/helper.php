<?php
	function openDb()
	{
		global $db_host, $db_user, $db_pw, $db_name;
	
		// open db connection
		$conn = new mysqli($db_host, $db_user, $db_pw, $db_name);
		$conn->set_charset("utf8");
		
		return $conn;
	}
	

	function checkNumeric($num)
	{
		if (!is_numeric($num))
			die("format error: '" . $num . "' is not numeric");

		return $num;
	}


	function checkString($string, $minlen, $maxlen)
	{
	    if (isset($maxlen) && strlen($string) > $maxlen)
			die("format error: string '" . $string . "' too long");

	    if (isset($minlen) && strlen($string) < $minlen)
			die("format error: string '" . $string . "' too short");

        return $string;
	}


    function checkEmail($email)
    {
        if (!$email)
            die("email is null");

        // TODO: check email format with regexp
        return checkString($email, 1, 100);
    }


    function checkToken($token)
    {
        if (!$token)
            die("token is null");

        return checkString($token, 1, 100);
    }


    function checkId($id)
    {
        if (!is_numeric($id))
			die("format error");

        if ($id < 0 || $id > 4294967295)
			die("format error");

        return $id;
    }


	function checkEscapeString($conn, $string, $minlen, $maxlen)
	{
        return mysqli_real_escape_string($conn, checkString($string, $minlen, $maxlen));
	}


	function checkEscapeEmail($conn, $email)
	{
        return mysqli_real_escape_string($conn, checkEmail($email));
	}


	function checkEscapeToken($conn, $token)
	{
        return mysqli_real_escape_string($conn, checkToken($token));
	}
?>