<?php
include "config.php";
include "helper.php";

$minLat = checkNumeric($_GET["minlat"]);
$maxLat = checkNumeric($_GET["maxlat"]);
$minLon = checkNumeric($_GET["minlon"]);
$maxLon = checkNumeric($_GET["maxlon"]);
$sessionId = checkNumeric($_GET["sessionid"]);

// open db connection
$conn = openDb();

// load data
$extent = "GeomFromText('POLYGON((" . $minLon . " " . $minLat . "," . $maxLon . " " . $minLat . "," . $maxLon . " " . $maxLat . "," . $minLon . " " . $maxLat . "," . $minLon . " " . $minLat . "))')";

$navaids = getNavaids($extent);
$airports = getAirports($extent);
$airspaces = getAirspaces($extent);
$webcams = getWebcams($minLon, $minLat, $maxLon, $maxLat);
$reportingPoints = getReportingPoints($minLon, $minLat, $maxLon, $maxLat);

// close db
$conn->close();

// return output
$return_object = json_encode(
    array(
        "navaids" => $navaids,
        "airports" => $airports,
        "airspaces" => $airspaces,
        "reportingPoints" => $reportingPoints,
        "webcams" => $webcams),
    JSON_NUMERIC_CHECK);

header("Content-Type: application/json; charset=UTF-8");

echo($return_object);


function getNavaids($extent)
{
    global $conn;

    $query = "SELECT * FROM openaip_navaids2 WHERE MBRIntersects(lonlat, " . $extent . ")";

    $result = $conn->query($query);

    if ($result === FALSE)
        die("error reading navaids: " . $conn->error . " query:" . $query);

    $navaids = [];

    while ($rs = $result->fetch_array(MYSQLI_ASSOC))
    {
        $unit = "MHz";

        if ($rs["type"] == "NDB")
            $unit = "kHz";

        $navaids[] = array(
            id => $rs["id"],
            type => $rs["type"],
//				country => $rs["country"],
            kuerzel => $rs["kuerzel"],
            latitude => reduceDegAccuracy($rs["latitude"]),
            longitude => reduceDegAccuracy($rs["longitude"]),
            elevation => $rs["elevation"],
            frequency => $rs["frequency"],
            unit => $unit,
            declination => $rs["declination"],
            truenorth => $rs["truenorth"]
        );
    }

    return $navaids;
}


function getAirports($extent)
{
    global $conn;

    // load airports
    $query  = "SELECT * FROM openaip_airports2 WHERE MBRIntersects(lonlat, " . $extent . ")";

    $result = $conn->query($query);

    if ($result === FALSE)
        die("error reading airports: " . $conn->error . " query:" . $query);

    $airports = [];
    $apIds = [];

    while ($rs = $result->fetch_array(MYSQLI_ASSOC))
    {
        // build return object
        $airports[$rs["icao"]] = array(
            type => $rs["type"],
            name => $rs["name"],
            icao => $rs["icao"],
            latitude => reduceDegAccuracy($rs["latitude"]),
            longitude => reduceDegAccuracy($rs["longitude"]),
            elevation => $rs["elevation"],
            runways => [],
            radios => [],
            webcams => [],
            charts => [],
            mapfeatures => []
        );

        $apIds[] = $rs["id"];
    }

    if (count($airports) == 0)
        return $airports;

    $apIdList = join(",", $apIds);
    $apIcaoList = "'" . join("','", array_keys($airports)) . "'";


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
    $query .= " FROM openaip_runways2 AS rwy ";
    $query .= " INNER JOIN openaip_airports2 AS apt ";
    $query .= "   ON apt.id = rwy.airport_id";
    $query .= " WHERE rwy.operations = 'ACTIVE' AND airport_id IN (" . $apIdList . ")";
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


    // load radios frequencies
    $query  = "SELECT";
    $query .= "  apt.icao,";
    $query .= "  rad.category,";
    $query .= "  rad.frequency,";
    $query .= "  rad.type,";
    $query .= "  rad.typespec,";
    $query .= "  rad.description,";
    $query .= "  (CASE WHEN rad.category = 'COMMUNICATION' THEN 1 WHEN rad.category = 'OTHER' THEN 2 ELSE 3 END) AS sortorder1,";
    $query .= "  (CASE WHEN rad.type = 'TOWER' THEN 1 WHEN rad.type = 'CTAF' THEN 2 WHEN rad.type = 'OTHER' THEN 3 ELSE 4 END) AS sortorder2";
    $query .= " FROM openaip_radios2 AS rad ";
    $query .= " INNER JOIN openaip_airports2 AS apt ";
    $query .= "   ON apt.id = rad.airport_id";
    $query .= " WHERE airport_id IN (" . $apIdList . ")";
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
    $query .= " WHERE airport_icao IN (" .  $apIcaoList . ")";


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
    $query .= " WHERE airport_icao IN (" .  $apIcaoList . ")";
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
    $query .= " WHERE airport_icao IN (" .  $apIcaoList . ")";
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

    return $airports;
}


function getAirspaces($extent)
{
    global $conn;

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
    $query .= " FROM openaip_airspace2 AS air";
    $query .= "   LEFT JOIN airspace_corr AS cor ON cor.aip_id = air.aip_id";
    $query .= " WHERE";
    $query .= "  (cor.type IS NULL OR cor.type != 'HIDE')";
    $query .= "  AND MBRIntersects(polygon2, " . $extent . ")";


    $result = $conn->query($query);

    if ($result === FALSE)
        die("error reading airspaces: " . $conn->error . " query:" . $query);

    $airspaces = [];

    while ($rs = $result->fetch_array(MYSQLI_ASSOC))
    {
        // prepare coordinates
        $polygon = [];
        $coord_pairs = explode(",", $rs["polygon"]);

        foreach ($coord_pairs as $latlon)
        {
            $coords = explode(" ", trim($latlon));
            $coords[0] = reduceDegAccuracy($coords[0]);
            $coords[1] = reduceDegAccuracy($coords[1]);
            $polygon[] = $coords;
        }

        // build airspace object
        $airspaces[$rs["aip_id"]] = array(
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

    return $airspaces;
}


function getWebcams($minLon, $minLat, $maxLon, $maxLat)
{
    global $conn;

    $query  = "SELECT";
    $query .= "  id,";
    $query .= "  name,";
    $query .= "  url,";
    $query .= "  latitude,";
    $query .= "  longitude";
    $query .= " FROM webcams";
    $query .= " WHERE airport_icao IS NULL";
    $query .= "   AND (longitude >= " . $minLon . " AND longitude <= " . $maxLon . " AND latitude >= " . $minLat . " AND latitude <= " . $maxLat . ")";

    $result = $conn->query($query);
    if ($result === FALSE)
        die("error reading webcams: " . $conn->error . " query:" . $query);

    $webcams = [];

    while ($rs = $result->fetch_array(MYSQLI_ASSOC))
    {
        $webcams[] = array(
            id => $rs["id"],
            name => $rs["name"],
            url => $rs["url"],
            latitude => reduceDegAccuracy($rs["latitude"]),
            longitude => reduceDegAccuracy($rs["longitude"])
        );
    }

    return $webcams;
}


function getReportingPoints($minLon, $minLat, $maxLon, $maxLat)
{
    global $conn;

    $query = "SELECT * FROM reporting_points WHERE longitude >= " . $minLon . " AND longitude <= " . $maxLon . " AND latitude >= " . $minLat . " AND latitude <= " . $maxLat;

    $result = $conn->query($query);
    if ($result === FALSE)
        die("error reading reporting points: " . $conn->error . " query:" . $query);

    $reportingpoints = [];

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
            latitude => reduceDegAccuracy($rs["latitude"]),
            longitude => reduceDegAccuracy($rs["longitude"]),
            polygon => $polygon
        );
    }

    return $reportingpoints;
}