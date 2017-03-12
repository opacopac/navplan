<?php
include "config.php";
include "helper.php";

// open db connection
$conn = openDb();

// read/check input parameters
$minLat = checkNumeric($_GET["minlat"]);
$maxLat = checkNumeric($_GET["maxlat"]);
$minLon = checkNumeric($_GET["minlon"]);
$maxLon = checkNumeric($_GET["maxlon"]);
$email = $_COOKIE["email"] ? checkEscapeEmail($conn, $_COOKIE["email"]) : NULL;
$token = $_COOKIE["token"] ? checkEscapeToken($conn, $_COOKIE["token"]) : NULL;

// load data
$extent = "GeomFromText('POLYGON((" . $minLon . " " . $minLat . "," . $maxLon . " " . $minLat . "," . $maxLon . " " . $maxLat . "," . $minLon . " " . $maxLat . "," . $minLon . " " . $minLat . "))')";
$navaids = getNavaids($extent);
$airports = getAirports($extent);
$airspaces = getAirspaces($extent);
$webcams = getWebcams($minLon, $minLat, $maxLon, $maxLat);
$reportingPoints = getReportingPoints($extent);
$userPoints = getUserPoints($email, $token, $minLon, $minLat, $maxLon, $maxLat);

// close db
$conn->close();

// return output
$return_object = json_encode(
    array(
        "navaids" => $navaids,
        "airports" => $airports,
        "airspaces" => $airspaces,
        "reportingPoints" => $reportingPoints,
        "userPoints" => $userPoints,
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
            kuerzel => $rs["kuerzel"],
            latitude => reduceDegAccuracy($rs["latitude"], "NAVAID"),
            longitude => reduceDegAccuracy($rs["longitude"], "NAVAID"),
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
    $apIcaos = [];

    while ($rs = $result->fetch_array(MYSQLI_ASSOC))
    {
        // build return object
        $ap = array(
            id => $rs["id"],
            type => $rs["type"],
            name => $rs["name"],
            icao => $rs["icao"],
            latitude => reduceDegAccuracy($rs["latitude"], "AIRPORT"),
            longitude => reduceDegAccuracy($rs["longitude"], "AIRPORT"),
            elevation => $rs["elevation"],
            runways => [],
            radios => [],
            webcams => [],
            charts => [],
            mapfeatures => []
        );

        $ap["runways"] = [];
        $ap["radios"] = [];
        $ap["charts"] = [];
        $ap["webcams"] = [];
        $ap["mapfeatures"] = [];

        $airports[] = $ap;
        $apIds[] = $rs["id"];
        $apIcaos[] = $rs["icao"];
    }

    if (count($airports) == 0)
        return $airports;

    $apIdList = join(",", $apIds);
    $apIcaoList = "'" . join("','", $apIcaos) . "'";


    // load runways
    $query  = "SELECT";
    $query .= "  rwy.airport_id,";
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
    $query .= " WHERE rwy.operations = 'ACTIVE' AND airport_id IN (" . $apIdList . ")";
    $query .= " ORDER BY rwy.length DESC, rwy.surface ASC, rwy.id ASC";

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

        // add to airport object
        foreach ($airports as &$ap)
        {
            if ($ap["id"] == $rs["airport_id"])
            {
                $ap["runways"][] = $runway;
                break;
            }
        }
    }


    // load radios frequencies
    $query  = "SELECT";
    $query .= "  rad.airport_id,";
    $query .= "  rad.category,";
    $query .= "  rad.frequency,";
    $query .= "  rad.type,";
    $query .= "  rad.typespec,";
    $query .= "  rad.description,";
    $query .= "  (CASE WHEN rad.category = 'COMMUNICATION' THEN 1 WHEN rad.category = 'OTHER' THEN 2 ELSE 3 END) AS sortorder1,";
    $query .= "  (CASE WHEN rad.type = 'TOWER' THEN 1 WHEN rad.type = 'CTAF' THEN 2 WHEN rad.type = 'OTHER' THEN 3 ELSE 4 END) AS sortorder2";
    $query .= " FROM openaip_radios2 AS rad ";
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

        // add to airport object
        foreach ($airports as &$ap)
        {
            if ($ap["id"] == $rs["airport_id"])
            {
                $ap["radios"][] = $radio;
                break;
            }
        }
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

        // add to airport object
        foreach ($airports as &$ap)
        {
            if ($ap["icao"] == $rs["airport_icao"])
            {
                $ap["charts"][] = $chart;
                break;
            }
        }
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

        // add to airport object
        foreach ($airports as &$ap)
        {
            if ($ap["icao"] == $rs["airport_icao"])
            {
                $ap["webcams"][] = $webcam;
                break;
            }
        }
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


        // add to airport object
        foreach ($airports as &$ap)
        {
            if ($ap["icao"] == $rs["airport_icao"])
            {
                $ap["mapfeatures"][] = $mapfeature;
                break;
            }
        }
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
    $query .= "  cor.corr_cat AS corr_cat,";
    $query .= "  cor.corr_alt_top_reference AS corr_alt_top_reference,";
    $query .= "  cor.corr_alt_top_height AS corr_alt_top_height,";
    $query .= "  cor.corr_alt_top_unit AS corr_alt_top_unit,";
    $query .= "  cor.corr_alt_bottom_reference AS corr_alt_bottom_reference,";
    $query .= "  cor.corr_alt_bottom_height AS corr_alt_bottom_height,";
    $query .= "  cor.corr_alt_bottom_unit AS corr_alt_bottom_unit";
    $query .= " FROM openaip_airspace2 AS air";
    $query .= "   LEFT JOIN airspace_corr2 AS cor ON cor.aip_id = air.aip_id";
    $query .= " WHERE";
    $query .= "  (cor.type IS NULL OR cor.type != 'HIDE')";
    $query .= "    AND";
    $query .= "  MBRIntersects(extent, " . $extent . ")";


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
            $coords[0] = reduceDegAccuracy($coords[0], "AIRSPACE");
            $coords[1] = reduceDegAccuracy($coords[1], "AIRSPACE");
            $polygon[] = $coords;
        }

        // build airspace object
        $airspaces[$rs["aip_id"]] = array(
            id => (int)$rs["id"],
            aip_id => (int)$rs["aip_id"],
            category => $rs["corr_cat"] ? $rs["corr_cat"] : $rs["category"],
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
            latitude => reduceDegAccuracy($rs["latitude"], "WEBCAM"),
            longitude => reduceDegAccuracy($rs["longitude"], "WEBCAM")
        );
    }

    return $webcams;
}


function getReportingPoints($extent)
{
    global $conn;

    $query = "SELECT * FROM reporting_points2 WHERE MBRIntersects(extent, " . $extent . ")";

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
            latitude => reduceDegAccuracy($rs["latitude"], "REPORTINGPOINT"),
            longitude => reduceDegAccuracy($rs["longitude"], "REPORTINGPOINT"),
            polygon => $polygon
        );
    }

    return $reportingpoints;
}


function getUserPoints($email, $token, $minLon, $minLat, $maxLon, $maxLat)
{
    global $conn;

    $userPoints = [];

    if ($email && $token)
    {
        $query = "SELECT uwp.* FROM user_waypoints AS uwp";
        $query .= " INNER JOIN users AS usr ON uwp.user_id = usr.id";
        $query .= " WHERE usr.email = '" . $email . "' AND usr.token = '" . $token . "'";
        $query .= " AND (uwp.longitude >= " . $minLon . " AND uwp.longitude <= " . $maxLon . " AND uwp.latitude >= " . $minLat . " AND uwp.latitude <= " . $maxLat . ")";

        $result = $conn->query($query);

        if ($result === FALSE)
            die("error reading user waypoint list: " . $conn->error . " query:" . $query);

        while ($rs = $result->fetch_array(MYSQLI_ASSOC))
        {
            $userPoints[] = array(
                id => $rs["id"],
                type => $rs["type"],
                name => $rs["name"],
                latitude => $rs["latitude"],
                longitude => $rs["longitude"],
                remark => $rs["remark"]
            );
        }
    }


    return $userPoints;
}

/* copy-convert point / polygon rows:
 * UPDATE reporting_points2 AS repA, (SELECT id, polygon FROM reporting_points2) AS repB
 * SET repA.polygon2 = GeomFromText(CONCAT('POLYGON((', repB.polygon , '))'))
 * WHERE repA.id = repB.id AND repA.type = 'SECTOR'
 *
 * UPDATE reporting_points2 AS repA, (SELECT id, latitude, longitude FROM reporting_points2) AS repB
 * SET repA.polygon2 = GeomFromText(CONCAT('POLYGON((', repB.longitude, ' ', repB.latitude, '))'))
 * WHERE repA.id = repB.id AND repA.type = 'POINT'
 *
 */