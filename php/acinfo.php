<?php
	include "config.php";
	include "helper.php";

	// open db connection
	$conn = openDb();


    // get query string
	if (!isset($_GET["icaohex"]))
	    die("no icao address");

	$icaohex = checkEscapeString($conn, strtoupper($_GET["icaohex"]), 1, 6);


    // exec query
	$query = "SELECT * FROM lfr_ch WHERE icaohex ='" . $icaohex . "'";
	$result = $conn->query($query);

	$aircrafts = [];

	while ($rs = $result->fetch_array(MYSQLI_ASSOC))
	{
	    $aircrafts[] = array(
	        "id" => $rs["id"],
	        "address" => $rs["icaohex"],
	        "addresstype" => 'ICAO',
	        "registration" => $rs["registration"],
	        "aircraftModelType" => $rs["aircraftModelType"],
	        "manufacturer" => $rs["manufacturer"],
	        "aircraftCategoryId" => $rs["aircraftCategoryId"],
	        "ownerOperators" => json_decode($rs["ownerOperators"])
	    );
    }

    // close db
    $conn->close();

    // output login result
    echo json_encode(array("aircrafts" => $aircrafts), JSON_NUMERIC_CHECK);
?>
