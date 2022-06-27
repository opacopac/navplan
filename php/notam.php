<?php
include_once "config.php";
include_once "helper.php";

const NOTAM_MAX_BOTTOM_FL = 195;


// open db connection
$conn = openDb();

$startTimestamp = checkNumeric($_GET["starttimestamp"]);
$endTimestamp = checkNumeric($_GET["endtimestamp"]);
$areaNotamList = NULL;
$locationNotamList = NULL;


// handle area notam request
if (isset($_GET["minlat"]))
{
    $minLat = checkNumeric($_GET["minlat"]);
    $maxLat = checkNumeric($_GET["maxlat"]);
    $minLon = checkNumeric($_GET["minlon"]);
    $maxLon = checkNumeric($_GET["maxlon"]);

    $extentSql = "ST_GEOMFROMTEXT('POLYGON((" . $minLon . " " . $minLat . "," . $maxLon . " " . $minLat . "," . $maxLon . " " . $maxLat . "," . $minLon . " " . $maxLat . "," . $minLon . " " . $minLat . "))')";

    // get firs & ads within extent
    $icaoList = getIcaoListByExtent($extentSql);

    // load notams
    $areaNotamList = loadNotamList($icaoList, $startTimestamp, $endTimestamp);
    $areaNotamList = filterAreaNotams($areaNotamList);
}


// process location notam request
if (isset($_GET["icaolist"]))
{
    $icaoList = [];

    foreach (explode(",", $_GET["icaolist"]) as $icao)
        $icaoList[] = checkEscapeAlphaNumeric($conn, $icao, 4, 4);

    // load notams
    $locationNotamList = loadNotamList($icaoList, $startTimestamp, $endTimestamp);
}


// return notams
header("Content-Type: application/json; charset=UTF-8");
$return_object = buildReturnObject($locationNotamList, $areaNotamList);
echo($return_object);


// close db
$conn->close();


function buildReturnObject($locationNotamList, $areaNotamList)
{
    // remove extents
    if ($areaNotamList)
    {
        foreach ($areaNotamList as &$notam)
        {
            unset($notam["extent"]);
            unset($notam["dbExtent"]);
        }
    }

    if ($locationNotamList)
    {
        foreach ($locationNotamList as &$notam)
        {
            unset($notam["extent"]);
            unset($notam["dbExtent"]);
        }
    }

    return json_encode(array("locationnotamlist" => $locationNotamList, "areanotamlist" => $areaNotamList), JSON_NUMERIC_CHECK);
}


function getIcaoListByExtent($extentSql) // TODO: return only ICAOs
{
    global $conn;

    $query = "SELECT DISTINCT icao FROM icao_fir WHERE ST_INTERSECTS(polygon, " . $extentSql . ") AND icao <> ''";
    $query .= " UNION ";
    $query .= "SELECT DISTINCT icao FROM openaip_airports WHERE ST_INTERSECTS(lonlat, " . $extentSql . ") AND icao <> ''";

    $result = $conn->query($query);

    if ($result === FALSE)
        die("error reading firs/ads: " . $conn->error . " query:" . $query);

    $icaoList = [];

    while ($rs = $result->fetch_array(MYSQLI_ASSOC))
        $icaoList[] = $rs["icao"];

    return $icaoList;
}


function loadNotamList($icaoList, $startTimestamp, $endTimestamp)
{
    global $conn;

    $query = "SELECT ntm.notam AS notam, geo.geometry AS geometry, ST_AsText(geo.extent) AS extent FROM icao_notam AS ntm"
        . " INNER JOIN icao_notam_geometry AS geo ON geo.icao_notam_id = ntm.id"
        . " WHERE icao IN ('" .  join("','", $icaoList) . "')"
        . " AND startdate <= '" . getDbTimeString($endTimestamp) . "'"
        . " AND enddate >= '" . getDbTimeString($startTimestamp) . "'";
    $result = $conn->query($query);

    if ($result === FALSE)
        die("error reading notams: " . $conn->error . " query:" . $query);

    $notamList = [];

    while ($rs = $result->fetch_array(MYSQLI_ASSOC))
    {
        $notam = json_decode($rs["notam"], JSON_NUMERIC_CHECK);
        $notam["geometry"] = json_decode($rs["geometry"], JSON_NUMERIC_CHECK);
        $notam["extent"] = $rs["extent"];

        // TODO: use same filters in geopoint.php
        // filter by max FL195
        if (isset($notam["geometry"]) && isset($notam["geometry"]["bottom"]) >= NOTAM_MAX_BOTTOM_FL)
            continue;

        // filter by notam type (no KKKK)
        if (isset($notam["Qcode"]) && $notam["Qcode"] == "KKKK")
            continue;

        $notamList[] = $notam;
    }

    return $notamList;
}


function filterAreaNotams($notamList)
{
    $areaNotamList = [];

    foreach ($notamList as $notam)
    {
        if (isAreaNotam($notam))
            $areaNotamList[] = $notam;
    }

    return $areaNotamList;
}


function isAreaNotam($notam)
{
    if ($notam["isICAO"])
    {
        $qtype = strtoupper(substr($notam["Qcode"], 0, 1));

        if ($qtype == "W" || $qtype == "R") // || $qtype == "X")
            return true;
    }
    else
    {
        if ($notam["type"] == "airspace")
            return true;
    }

    return false;
}
