<?php
	include "config.php";
	include "helper.php";

	// open db connection
	$conn = new mysqli($db_host, $db_user, $db_pw, $db_name);
	$conn->set_charset("utf8");

    // load airports
	$query  = "SELECT";
	$query .= "  apt.type,";
	$query .= "  apt.name,";
	$query .= "  apt.icao,";
	$query .= "  apt.latitude,";
	$query .= "  apt.longitude,";
	$query .= "  apt.elevation";
	$query .= " FROM openaip_airports AS apt";

	$result = $conn->query($query);
	
	if ($result === FALSE)
		die("error reading airports: " . $conn->error . " query:" . $query);
	
	
	while ($rs = $result->fetch_array(MYSQLI_ASSOC))
	{
		// build return object
		$airports[$rs["icao"]] = array(
			type => $rs["type"],
			name => $rs["name"],
			icao => $rs["icao"],
			latitude => $rs["latitude"],
			longitude => $rs["longitude"],
			elevation => $rs["elevation"],
			runways => [],
			radios => [],
			webcams => [],
			charts => [],
			mapfeatures => []
		);
	}

    // load runways
	$query  = "SELECT";
	$query .= "  apt.icao,";
	$query .= "  rwy.name,";
	$query .= "  rwy.surface,";
	$query .= "  rwy.length,";
	$query .= "  rwy.width,";
	$query .= "  rwy.direction1,";
	$query .= "  rwy.direction2,";
	$query .= "  rwy.tora1,";
	$query .= "  rwy.tora2,";
	$query .= "  rwy.lda1,";
	$query .= "  rwy.lda2,";
	$query .= "  rwy.papi1,";
	$query .= "  rwy.papi2";
	$query .= " FROM openaip_runways AS rwy ";
	$query .= " INNER JOIN openaip_airports AS apt ";
	$query .= "   ON apt.id = rwy.airport_id";
	$query .= " WHERE rwy.operations = 'ACTIVE'";
	$query .= " ORDER BY rwy.length DESC";

	$result = $conn->query($query);

	if ($result === FALSE)
		die("error reading runways: " . $conn->error . " query:" . $query);

	while ($rs = $result->fetch_array(MYSQLI_ASSOC))
	{
	    $runway = array(
	        name => $rs["name"],
	        surface => $rs["surface"],
	        length => $rs["length"],
	        width => $rs["width"],
	        direction1 => $rs["direction1"],
	        direction2 => $rs["direction2"],
	        tora1 => $rs["tora1"],
	        tora2 => $rs["tora2"],
	        lda1 => $rs["lda1"],
	        lda2 => $rs["lda2"],
	        papi1 => $rs["papi1"],
	        papi2 => $rs["papi2"]
	    );

	    $airports[$rs["icao"]]["runways"][] = $runway;
    }


    // load radios
	$query  = "SELECT";
	$query .= "  apt.icao,";
	$query .= "  rad.category,";
	$query .= "  rad.frequency,";
	$query .= "  rad.type,";
	$query .= "  rad.typespec,";
	$query .= "  rad.description,";
	$query .= "  (CASE WHEN rad.category = 'COMMUNICATION' THEN 1 WHEN rad.category = 'OTHER' THEN 2 ELSE 3 END) AS sortorder1,";
	$query .= "  (CASE WHEN rad.type = 'TOWER' THEN 1 WHEN rad.type = 'CTAF' THEN 2 WHEN rad.type = 'OTHER' THEN 3 ELSE 4 END) AS sortorder2";
	$query .= " FROM openaip_radios AS rad ";
	$query .= " INNER JOIN openaip_airports AS apt ";
	$query .= "   ON apt.id = rad.airport_id";
	$query .= " ORDER BY";
	$query .= "   sortorder1 ASC,";
	$query .= "   sortorder2 ASC,";
	$query .= "   frequency ASC";

	$result = $conn->query($query);

	if ($result === FALSE)
		die("error reading radios: " . $conn->error . " radios:" . $query);

	while ($rs = $result->fetch_array(MYSQLI_ASSOC))
	{
	    $radio = array(
	        category => $rs["category"],
	        frequency => $rs["frequency"],
	        type => $rs["type"],
	        typespec => $rs["typespec"],
	        description => $rs["description"]
	    );

	    $airports[$rs["icao"]]["radios"][] = $radio;
    }


    // load charts
    $query = "SELECT ";
    $query .= "  id,";
    $query .= "  airport_icao,";
    $query .= "  source,";
    $query .= "  type,";
    $query .= "  filename,";
    $query .= "  mercator_n,";
    $query .= "  mercator_s,";
    $query .= "  mercator_e,";
    $query .= "  mercator_w,";
	$query .= "  (CASE WHEN type LIKE 'AREA%' THEN 1 WHEN type LIKE 'VAC%' THEN 2 WHEN type LIKE 'AD INFO%' THEN 3 ELSE 4 END) AS sortorder1";
    $query .= " FROM ad_charts ";

    // hack: show VFRM charts only in branch
    if (strpos($_SERVER['REQUEST_URI'], "branch") === false)
        $query .= " WHERE source != 'VFRM' ";

	$query .= " ORDER BY";
	$query .= "   source ASC,";
	$query .= "   sortorder1 ASC,";
	$query .= "   type ASC";

    $result = $conn->query($query);

    if ($result === FALSE)
        die("error reading charts: " . $conn->error . " query:" . $query);

	while ($rs = $result->fetch_array(MYSQLI_ASSOC))
	{
	    $chart = array(
	        id => $rs["id"],
	        source => $rs["source"],
	        type => $rs["type"],
	        filename => $rs["filename"],
	        mercator_n => $rs["mercator_n"],
	        mercator_s => $rs["mercator_s"],
	        mercator_e => $rs["mercator_e"],
	        mercator_w => $rs["mercator_w"]
	    );

	    $airports[$rs["airport_icao"]]["charts"][] = $chart;
    }


    // load webcams
    $query  = "SELECT";
    $query .= "  name,";
    $query .= "  url,";
    $query .= "  airport_icao";
    $query .= " FROM webcams";
    $query .= " WHERE airport_icao IS NOT NULL";
	$query .= " ORDER BY";
	$query .= "   name ASC";

    $result = $conn->query($query);

    if ($result === FALSE)
        die("error reading webcams: " . $conn->error . " query:" . $query);

	while ($rs = $result->fetch_array(MYSQLI_ASSOC))
	{
	    $webcam = array(
	        name => $rs["name"],
	        url => $rs["url"]
	    );

	    $airports[$rs["airport_icao"]]["webcams"][] = $webcam;
    }


    // load map features
    $query  = "SELECT";
    $query .= "  type,";
    $query .= "  name,";
    $query .= "  airport_icao";
    $query .= " FROM map_features";
    $query .= " WHERE airport_icao IS NOT NULL";
	$query .= " ORDER BY";
	$query .= "   type ASC,";
	$query .= "   name ASC";

    $result = $conn->query($query);

    if ($result === FALSE)
        die("error reading map features: " . $conn->error . " query:" . $query);

	while ($rs = $result->fetch_array(MYSQLI_ASSOC))
	{
	    $mapfeature = array(
	        type => $rs["type"],
	        name => $rs["name"]
	    );

	    $airports[$rs["airport_icao"]]["mapfeatures"][] = $mapfeature;
    }


	$conn->close();

	$return_object = json_encode(array("airports" => $airports), JSON_NUMERIC_CHECK);
	
	
	// return output
	header("Content-Type: application/json; charset=UTF-8");

	echo($return_object);
?>