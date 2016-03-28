<?php
	include "config.php";
	include "helper.php";

	// open db connection
	$conn = new mysqli($db_host, $db_user, $db_pw, $db_name);
	$conn->set_charset("utf8");


    // get query string
	if (!isset($_GET["icaohex"]))
	    die("no icao address");

	$icaohex = mysqli_real_escape_string($conn, strtoupper($_GET["icaohex"]));

	if (strlen($icaohex) < 1 || strlen($icaohex) > 6)
	    die("invalid icao address");


    // exec query
	$query = "SELECT * FROM lfr_ch WHERE icaohex ='" . $icaohex . "'";
	$result = $conn->query($query);

	$aircrafts = [];

	while ($rs = $result->fetch_array(MYSQLI_ASSOC))
	{
	    $aircrafts[] = array(
	        id => $rs["id"],
	        icaohex => $rs["icaohex"],
	        registration => $rs["registration"],
	        aircraftModelType => $rs["aircraftModelType"],
	        manufacturer => $rs["manufacturer"],
	        aircraftCategoryId => $rs["aircraftCategoryId"],
	        ownerOperators => json_decode($rs["ownerOperators"])
	    );
    }

    // close db
    $conn->close();

    // output login result
    echo json_encode(array("aircrafts" => $aircrafts), JSON_NUMERIC_CHECK);
?>