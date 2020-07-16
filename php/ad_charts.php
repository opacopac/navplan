<?php
	include "config.php";
	include "helper.php";

	$conn = openDb();

	if ($_GET["id"])
	    readById();
	else
    	die("ERROR: unknown action!");

	$conn->close();


	function readById()
	{
		global $conn;
		
		$id = checkId($_GET["id"]);

		$query = "SELECT ";
		$query .= "  id, ";
		$query .= "  airport_icao, ";
		$query .= "  source, ";
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
                "id" => $rs["id"],
                "airport_icao" => $rs["airport_icao"],
                "source" => $rs["source"],
                "type" => $rs["type"],
                "filename" => $rs["filename"],
                "mercator_n" => $rs["mercator_n"],
                "mercator_s" => $rs["mercator_s"],
                "mercator_e" => $rs["mercator_e"],
                "mercator_w" => $rs["mercator_w"]
            );

    		echo json_encode(array("chart" => $chart), JSON_NUMERIC_CHECK);
		}
		else
		    die("ERROR: unknown id!");
	}
?>
