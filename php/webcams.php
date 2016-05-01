<?php
	include "config.php";
	include "helper.php";

	$input = json_decode(file_get_contents('php://input'), true);

	switch($input["action"])
	{
		case "readNonAdWebcams":
			readNonAdWebcams();
			break;
		case "readAdWebcams":
			readAdWebcams();
			break;
		default:
			die("no or unknown action!");
	}


	function readNonAdWebcams()
	{
		// open db
		$conn = openDb();

        $query  = "SELECT";
        $query .= "  id,";
        $query .= "  name,";
        $query .= "  url,";
        $query .= "  latitude,";
        $query .= "  longitude";
        $query .= " FROM webcams";
        $query .= " WHERE airport_icao IS NULL";

        $result = $conn->query($query);

        if ($result === FALSE)
            die("error reading webcams: " . $conn->error . " query:" . $query);


        while ($rs = $result->fetch_array(MYSQLI_ASSOC))
        {
            $webcams[] = array(
                id => $rs["id"],
                name => $rs["name"],
                url => $rs["url"],
                latitude => $rs["latitude"],
                longitude => $rs["longitude"]
            );
        }

        echo json_encode(array("webcams" => $webcams), JSON_NUMERIC_CHECK);

        $conn->close();
    }


	function readAdWebcams()
	{
		// open db
		$conn = openDb();

        $query  = "SELECT";
        $query .= "  id,";
        $query .= "  name,";
        $query .= "  url,";
        $query .= "  airport_icao";
        $query .= " FROM webcams";
        $query .= " WHERE airport_icao IS NOT NULL";

        $result = $conn->query($query);

        if ($result === FALSE)
            die("error reading webcams: " . $conn->error . " query:" . $query);


        while ($rs = $result->fetch_array(MYSQLI_ASSOC))
        {
            $webcams[] = array(
                id => $rs["id"],
                name => $rs["name"],
                url => $rs["url"],
                airport_icao => $rs["airport_icao"]
            );
        }

        echo json_encode(array("webcams" => $webcams), JSON_NUMERIC_CHECK);

        $conn->close();
    }
?>