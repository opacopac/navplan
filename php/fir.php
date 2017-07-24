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

// load data
$extent = "ST_GEOMFROMTEXT('POLYGON((" . $minLon . " " . $minLat . "," . $maxLon . " " . $minLat . "," . $maxLon . " " . $maxLat . "," . $minLon . " " . $maxLat . "," . $minLon . " " . $minLat . "))')";
$firList = getFirList($extent);

// close db
$conn->close();


// return output
$return_object = json_encode(array("firlist" => $firList), JSON_NUMERIC_CHECK);

header("Content-Type: application/json; charset=UTF-8");

echo($return_object);


function getFirList($extent)
{
    global $conn;

    $query = "SELECT * FROM icao_fir WHERE ST_INTERSECTS(polygon, " . $extent . ")";

    $result = $conn->query($query);

    if ($result === FALSE)
        die("error reading firs: " . $conn->error . " query:" . $query);

    $firList = [];

    while ($rs = $result->fetch_array(MYSQLI_ASSOC))
    {
        $firList[] = array(
            id => $rs["id"],
            region => $rs["region"],
            icao => $rs["icao"],
            name => $rs["name"],
            statecode => $rs["statecode"],
            statename => $rs["statename"],
            centerlat => $rs["centerlat"],
            centerlon => $rs["centerlon"]
        );
    }

    return $firList;
}
