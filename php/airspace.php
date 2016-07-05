<?php
	include "config.php";
	include "helper.php";

	// open db connection
	$conn = new mysqli($db_host, $db_user, $db_pw, $db_name);
	$conn->set_charset("utf8");

    // load airspaces
	$query  = "SELECT";
	$query .= "  air.id,";
	$query .= "  air.aip_id,";
	$query .= "  air.category,";
	$query .= "  air.country, ";
	$query .= "  air.name,";
	$query .= "  air.alt_top_reference,";
	$query .= "  air.alt_top_height,";
	$query .= "  air.alt_top_unit,";
	$query .= "  air.alt_bottom_reference,";
	$query .= "  air.alt_bottom_height,";
	$query .= "  air.alt_bottom_unit,";
	$query .= "  air.polygon,";
	$query .= "  cor.type AS corr_type,";
	$query .= "  cor.exclude_aip_id,";
	$query .= "  cor.alt_top_reference AS corr_alt_top_reference,";
	$query .= "  cor.alt_top_height AS corr_alt_top_height,";
	$query .= "  cor.alt_top_unit AS corr_alt_top_unit,";
	$query .= "  cor.alt_bottom_reference AS corr_alt_bottom_reference,";
	$query .= "  cor.alt_bottom_height AS corr_alt_bottom_height,";
	$query .= "  cor.alt_bottom_unit AS corr_alt_bottom_unit";
	$query .= " FROM openaip_airspace AS air";
	$query .= "   LEFT JOIN airspace_corr AS cor ON cor.aip_id = air.aip_id";
	$query .= " WHERE";
//	$query .= "  (air.country = 'CH' OR air.country = 'FR' OR air.country = 'DE' OR air.country = 'AT')";
//	$query .= "    AND";
	$query .= "  (cor.type IS NULL OR cor.type != 'HIDE')";


	$result = $conn->query($query);

	if ($result === FALSE)
		die("error reading airspaces: " . $conn->error . " query:" . $query);

    while ($rs = $result->fetch_array(MYSQLI_ASSOC))
    {
        // prepare coordinates
        $polygon = [];
        $coord_pairs = explode(",", $rs["polygon"]);

        foreach ($coord_pairs as $latlon)
            $polygon[] = explode(" ", trim($latlon));

        // build airspace object
        $airspace[$rs["aip_id"]] = array(
            id => (int)$rs["id"],
            aip_id => (int)$rs["aip_id"],
            category => $rs["category"],
            country => $rs["country"],
            name => $rs["name"],
            alt => array(
                top => array(
                    ref => $rs["corr_alt_top_reference"] ? $rs["corr_alt_top_reference"] : $rs["alt_top_reference"],
                    height => $rs["corr_alt_top_height"] ? $rs["corr_alt_top_height"] : $rs["alt_top_height"],
                    unit => $rs["corr_alt_top_unit"] ? $rs["corr_alt_top_unit"] : $rs["alt_top_unit"]
                ),
                bottom => array(
                    ref => $rs["corr_alt_bottom_reference"] ? $rs["corr_alt_bottom_reference"] : $rs["alt_bottom_reference"],
                    height => $rs["corr_alt_bottom_height"] ? $rs["corr_alt_bottom_height"] : $rs["alt_bottom_height"],
                    unit => $rs["corr_alt_bottom_unit"] ? $rs["corr_alt_bottom_unit"] : $rs["alt_bottom_unit"]
                )
            ),
            exclude_aip_id => $rs["exclude_aip_id"] ? $rs["exclude_aip_id"] : NULL,
            polygon => $polygon
        );
    }

	$conn->close();

	$return_object = json_encode(array("airspace" => $airspace), JSON_NUMERIC_CHECK);

	header("Content-Type: application/json; charset=UTF-8");
	echo $return_object;
?>