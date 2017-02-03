<?php
	include "config.php";
	include "helper.php";

    $conn = openDb();

    $query = "SELECT * FROM reporting_points";
    $result = $conn->query($query);

    while ($rs = $result->fetch_array(MYSQLI_ASSOC))
    {
        if ($rs["polygon"])
        {
            // prepare coordinates
            $polygon = [];
            $coord_pairs = explode(",", $rs["polygon"]);

            foreach ($coord_pairs as $latlon)
                $polygon[] = explode(" ", trim($latlon));
        }
        else
            $polygon = NULL;


        $reportingpoints[] = array(
            id => $rs["id"],
            type => $rs["type"],
            airport_icao => $rs["airport_icao"],
            name => $rs["name"],
            heli => $rs["heli"],
            inbd_comp => $rs["inbd_comp"],
            outbd_comp => $rs["outbd_comp"],
            min_ft => $rs["min_ft"],
            max_ft => $rs["max_ft"],
            latitude => $rs["latitude"],
            longitude => $rs["longitude"],
            polygon => $polygon
        );
    }

    echo json_encode(array("reportingpoints" => $reportingpoints), JSON_NUMERIC_CHECK);

	$conn->close();
?>