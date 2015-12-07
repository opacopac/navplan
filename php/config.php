<?php
	// db parameters
	$db_host = "tschanz.mysql.db.internal";
	$db_name = "tschanz_navplan";
	$db_user = "tschanz_navfpl";
	$db_pw = "R5uobCjs";

	
	function openDb()
	{
		global $db_host, $db_user, $db_pw, $db_name;
	
		// open db connection
		$conn = new mysqli($db_host, $db_user, $db_pw, $db_name);
		$conn->set_charset("utf8");
		
		return $conn;
	}
?> 