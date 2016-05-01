<?php
	include "config.php";
	include "helper.php";


	if ($_GET["id"])
	    readById();
	else if ($_GET["icao"])
	    readByIcao();
	else if ($_GET["all"])
	    readAll();
	else
    	die("ERROR: unknown action!");


	function readById()
	{
		$conn = openDb();
		
		$id = mysqli_real_escape_string($conn, $_GET["id"]);
		checkNumeric($id);
	
		$query = "SELECT ";
		$query .= "  id, ";
		$query .= "  airport_icao, ";
		$query .= "  type, ";
		$query .= "  filename, ";
		$query .= "  mercator_n, ";
		$query .= "  mercator_s, ";
		$query .= "  mercator_e, ";
		$query .= "  mercator_w ";
		$query .= "FROM ad_charts ";
		$query .= "WHERE ";
		$query .= "  id = '" . $id . "'";
		
		// execute query
		$result = $conn->query($query);
		
		if ($result === FALSE)
			die("error reading chart: " . $conn->error . " query:" . $query);

		if ($result->num_rows == 1)
        {
            $rs = $result->fetch_array(MYSQLI_ASSOC);

            $chart = array(
                id => $rs["id"],
                airport_icao => $rs["airport_icao"],
                type => $rs["type"],
                filename => $rs["filename"],
                mercator_n => $rs["mercator_n"],
                mercator_s => $rs["mercator_s"],
                mercator_e => $rs["mercator_e"],
                mercator_w => $rs["mercator_w"]
            );

    		echo json_encode(array("chart" => $chart), JSON_NUMERIC_CHECK);
		}
		else
		    die("ERROR: unknown id!");

		$conn->close();
	}


	function readByIcao()
	{
		$conn = openDb();

		$icao = mysqli_real_escape_string($conn, $_GET["icao"]);

		$query = "SELECT ";
		$query .= "  id, ";
		$query .= "  airport_icao, ";
		$query .= "  type, ";
		$query .= "  filename, ";
		$query .= "  mercator_n, ";
		$query .= "  mercator_s, ";
		$query .= "  mercator_e, ";
		$query .= "  mercator_w ";
		$query .= "FROM ad_charts ";
		$query .= "WHERE ";
		$query .= "  airport_icao = '" . $icao . "'";

		// execute query
		$result = $conn->query($query);

		if ($result === FALSE)
			die("error reading charts: " . $conn->error . " query:" . $query);

		$chartlist = [];

        while ($rs = $result->fetch_array(MYSQLI_ASSOC))
        {
            $chartlist[] = array(
                id => $rs["id"],
                airport_icao => $rs["airport_icao"],
                type => $rs["type"],
                filename => $rs["filename"],
                mercator_n => $rs["mercator_n"],
                mercator_s => $rs["mercator_s"],
                mercator_e => $rs["mercator_e"],
                mercator_w => $rs["mercator_w"]
            );
		}

   		echo json_encode(array("chartlist" => $chartlist), JSON_NUMERIC_CHECK);

		$conn->close();
	}


	function readAll()
	{
		$conn = openDb();

		$query = "SELECT ";
		$query .= "  id, ";
		$query .= "  airport_icao, ";
		$query .= "  type, ";
		$query .= "  filename, ";
		$query .= "  mercator_n, ";
		$query .= "  mercator_s, ";
		$query .= "  mercator_e, ";
		$query .= "  mercator_w ";
		$query .= "FROM ad_charts ";

		// execute query
		$result = $conn->query($query);

		if ($result === FALSE)
			die("error reading charts: " . $conn->error . " query:" . $query);

		$chartlist = [];

        while ($rs = $result->fetch_array(MYSQLI_ASSOC))
        {
            $chartlist[] = array(
                id => $rs["id"],
                airport_icao => $rs["airport_icao"],
                type => $rs["type"],
                filename => $rs["filename"],
                mercator_n => $rs["mercator_n"],
                mercator_s => $rs["mercator_s"],
                mercator_e => $rs["mercator_e"],
                mercator_w => $rs["mercator_w"]
            );
		}

   		echo json_encode(array("chartlist" => $chartlist), JSON_NUMERIC_CHECK);

		$conn->close();
	}
?>