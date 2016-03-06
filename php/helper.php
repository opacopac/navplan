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
			die;
	}
?> 