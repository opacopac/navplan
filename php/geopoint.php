<?php
require_once "config.php";
require_once "helper.php";
require_once "terrainHelper.php";

$conn = openDb();

switch($_GET["action"])
{
    case "searchByName":
        searchByName(
            checkEscapeString($conn, $_GET["search"], 1, 100),
            $_COOKIE["email"] ? checkEscapeEmail($conn, $_COOKIE["email"]) : NULL,
            $_COOKIE["token"] ? checkEscapeToken($conn, $_COOKIE["token"]) : NULL
        );
        break;
    case "searchByPosition":
        searchByPosition(
            checkNumeric($_GET["lat"]),
            checkNumeric($_GET["lon"]),
            checkNumeric($_GET["rad"]),
            checkNumeric($_GET["minnotamtime"]),
            checkNumeric($_GET["maxnotamtime"]),
            $_COOKIE["email"] ? checkEscapeEmail($conn, $_COOKIE["email"]) : NULL,
            $_COOKIE["token"] ? checkEscapeToken($conn, $_COOKIE["token"]) : NULL
        );
        break;
    default:
        die("unknown action!");
}


function searchByName($search, $email, $token)
{
    global $conn;


    // cols: type, id, name, wpname, country, admin1, frequency, callsign, airport_icao, latitude, longitude, elevation

    $query = "(SELECT";
    $query .= "   'airport' AS type,";
    $query .= "   id,";
    $query .= "   CASE WHEN (icao IS NOT NULL AND icao<>'') THEN CONCAT(name, ' (', icao ,')') ELSE name END AS name,";
    $query .= "   icao AS wpname,";
    $query .= "   NULL AS country,";
    $query .= "   NULL AS admin1,";
    $query .= "   NULL AS admin2,";
    $query .= "   (" . getFrequencySubquery("openaip_airports.id") . ") AS frequency,";
    $query .= "   (" . getCallsignSubquery("openaip_airports.id", "openaip_airports.country") . ") AS callsign,";
    $query .= "   icao AS airport_icao,";
    $query .= "   latitude,";
    $query .= "   longitude,";
    $query .= "   elevation";
    $query .= " FROM openaip_airports";
    $query .= " WHERE";
    $query .= "   icao LIKE '" . $search . "%'";
    $query .= "   OR name LIKE '" . $search . "%'";
    $query .= " ORDER BY";
    $query .= "   CASE WHEN country = 'CH' THEN 1 ELSE 2 END ASC,";
    $query .= "   CASE WHEN ISNULL(icao) OR icao = '' THEN 2 ELSE 1 END ASC,";
    $query .= "   icao ASC";
    $query .= " LIMIT 10)";

    $query .= " UNION ";

    $query .= "(SELECT";
    $query .= "   'navaid' AS type,";
    $query .= "   id,";
    $query .= "   CONCAT(name, ' (', type, ')') AS name,";
    $query .= "   CONCAT(kuerzel, ' ', type) AS wpname,";
    $query .= "   NULL AS country,";
    $query .= "   NULL AS admin1,";
    $query .= "   NULL AS admin2,";
    $query .= "   frequency,";
    $query .= "   kuerzel AS callsign,";
    $query .= "   NULL AS airport_icao,";
    $query .= "   latitude,";
    $query .= "   longitude,";
    $query .= "   elevation";
    $query .= " FROM openaip_navaids";
    $query .= " WHERE";
    $query .= "   kuerzel LIKE '" . $search . "%'";
    $query .= "   OR name LIKE '" . $search . "%'";
    $query .= " ORDER BY CASE WHEN country = 'CH' THEN 1 ELSE 2 END ASC, kuerzel ASC";
    $query .= " LIMIT 10)";

    $query .= " UNION ";

    $query .= "(SELECT";
    $query .= "   'report' AS type,";
    $query .= "   id,";
    $query .= "   CONCAT(name , ' (', airport_icao, ')') AS name,";
    $query .= "   name AS wpname,";
    $query .= "   NULL AS country,";
    $query .= "   NULL AS admin1,";
    $query .= "   NULL AS admin2,";
    $query .= "   NULL AS frequency,";
    $query .= "   NULL AS callsign,";
    $query .= "   airport_icao,";
    $query .= "   latitude,";
    $query .= "   longitude,";
    $query .= "   NULL AS elevation";
    $query .= " FROM reporting_points";
    $query .= " WHERE";
    $query .= "   airport_icao LIKE '" . $search . "%'";
    $query .= " ORDER BY airport_icao ASC, name ASC";
    $query .= " LIMIT 10)";

    if ($email && $token)
    {
        $query .= " UNION ";

        $query .= "(SELECT";
        $query .= "   'user' AS type,";
        $query .= "   uwp.id, name,";
        $query .= "   name AS wpname,";
        $query .= "   NULL AS country,";
        $query .= "   NULL AS admin1,";
        $query .= "   NULL AS admin2,";
        $query .= "   NULL AS frequency,";
        $query .= "   NULL AS callsign,";
        $query .= "   NULL AS airport_icao,";
        $query .= "   latitude,";
        $query .= "   longitude,";
        $query .= "   NULL AS elevation";
        $query .= " FROM user_waypoints AS uwp";
        $query .= "   INNER JOIN users AS usr ON uwp.user_id = usr.id";
        $query .= " WHERE";
        $query .= "   usr.email = '" . $email . "' AND usr.token = '" . $token . "'";
        $query .= "   AND name LIKE '" . $search . "%'";
        $query .= " ORDER BY name ASC";
        $query .= " LIMIT 10)";
    }

    $query .= " UNION ";

    $query .= "(SELECT ";
    $query .= "  'geoname' AS type,";
    $query .= "  geo.geonameid AS id,";
    $query .= "  geo.name AS name,";
    $query .= "  geo.asciiname AS wpname,";
    $query .= "  geo.country_code AS country,";
    $query .= "  cod1.name AS admin1,";
    $query .= "  cod2.name AS admin2,";
    $query .= "  NULL AS frequency,";
    $query .= "  NULL AS callsign,";
    $query .= "  NULL AS airport_icao,";
    $query .= "  geo.latitude,";
    $query .= "  geo.longitude,";
    $query .= "  geo.elevation";
    $query .= " FROM geonames AS geo";
    $query .= "  LEFT JOIN geonames_admin1codes AS cod1";
    $query .= "    ON cod1.geonames_key = CONCAT(geo.country_code, '.', geo.admin1_code)";
    $query .= "  LEFT JOIN geonames_admin2codes AS cod2";
    $query .= "    ON cod2.geonames_key = CONCAT(geo.country_code, '.', geo.admin1_code, '.' , geo.admin2_code)";
    $query .= " WHERE";
    $query .= "   MATCH (geo.name, geo.alternatenames) AGAINST ('" . $search . "*' IN BOOLEAN MODE)";
    $query .= "   AND " . getGeonamesFilterQuery();
    $query .= " ORDER BY CASE WHEN geo.country_code = 'CH' THEN 1 ELSE 2 END ASC, geo.population DESC";
    $query .= " LIMIT 10)";

    // execute query
    $result = $conn->query($query);

    if ($result === FALSE)
        die("error searching geoname: " . $conn->error . " query:" . $query);

    $geonamesList = buildGeonamesList($result, true, null);

    // build return object
    print json_encode(array("geonames" => $geonamesList, "notams" => []));


    $conn->close();
}


function searchByPosition($lat, $lon, $rad, $minNotamTime, $maxNotamTime, $email, $token)
{
    global $conn;


    // cols: sortorder, type, id, name, frequency, callsign, latitude, longitude, elevation

    //$query .= "SELECT 1 AS sortOrder, 'airport' AS type, id, CONCAT(name, ' (', icao ,')') AS name, icao as wpname, NULL AS frequency, NULL AS callsign, icao AS airport_icao, latitude, longitude, elevation FROM openaip_airports WHERE";

    $query =  "SELECT";
    $query .= "   1 AS sortOrder,";
    $query .= "   'airport' AS type,";
    $query .= "   id,";
    $query .= "   CASE WHEN (icao IS NOT NULL AND icao<>'') THEN CONCAT(name, ' (', icao ,')') ELSE name END AS name,";
    $query .= "   icao AS wpname,";
    $query .= "   NULL AS frequency,";
    $query .= "   NULL AS callsign,";
    $query .= "   icao AS airport_icao,";
    $query .= "   latitude,";
    $query .= "   longitude,";
    $query .= "   elevation";
    $query .= " FROM openaip_airports WHERE";
    $query .= "   latitude > " . ($lat - $rad);
    $query .= "   AND latitude < " . ($lat + $rad);
    $query .= "   AND longitude > " . ($lon - $rad);
    $query .= "   AND longitude < " . ($lon + $rad);

    $query .= " UNION ";

    $query .= "SELECT 2 AS sortOrder, 'navaid' AS type, id, CONCAT(name, ' (', type, ')') AS name, CONCAT(kuerzel, ' ', type) AS wpname, frequency, kuerzel AS callsign, NULL AS airport_icao, latitude, longitude, elevation FROM openaip_navaids WHERE";
    $query .= " latitude > " . ($lat - $rad);
    $query .= " AND latitude < " . ($lat + $rad);
    $query .= " AND longitude > " . ($lon - $rad);
    $query .= " AND longitude < " . ($lon + $rad);

    $query .= " UNION ";

    $query .= "SELECT 3 AS sortOrder, 'report' AS type, id, CONCAT(name , ' (', airport_icao, ')') AS name, name AS wpname, NULL AS frequency, NULL AS callsign, airport_icao AS airport_icao, latitude, longitude, NULL AS elevation FROM reporting_points WHERE";
    $query .= " latitude > " . ($lat - $rad);
    $query .= " AND latitude < " . ($lat + $rad);
    $query .= " AND longitude > " . ($lon - $rad);
    $query .= " AND longitude < " . ($lon + $rad);

    if ($email && $token)
    {
        $query .= " UNION ";

        $query .= "SELECT 4 AS sortOrder, 'user' AS type, uwp.id, name, name AS wpname, NULL AS frequency, NULL AS callsign, NULL AS airport_icao, latitude, longitude, NULL AS elevation FROM user_waypoints AS uwp";
        $query .= " INNER JOIN users AS usr ON uwp.user_id = usr.id";
        $query .= " WHERE usr.email = '" . $email . "' AND usr.token = '" . $token . "'";
        $query .= " AND latitude > " . ($lat - $rad);
        $query .= " AND latitude < " . ($lat + $rad);
        $query .= " AND longitude > " . ($lon - $rad);
        $query .= " AND longitude < " . ($lon + $rad);
    }

    $query .= " UNION ";

    $query .= "SELECT 5 AS sortOrder, 'geoname' AS type, geonameid AS id, name, name AS wpname, NULL AS frequency, NULL AS callsign, NULL AS airport_icao, latitude, longitude, elevation FROM geonames WHERE";
    $query .= " latitude > " . ($lat - $rad);
    $query .= " AND latitude < " . ($lat + $rad);
    $query .= " AND longitude > " . ($lon - $rad);
    $query .= " AND longitude < " . ($lon + $rad);
    $query .= " AND " . getGeonamesFilterQuery();

    $query .= " ORDER BY";
    $query .= " sortOrder ASC,";
    $query .= "  ((latitude - " . $lat . ") * (latitude - " . $lat . ") + (longitude - " . $lon . ") * (longitude - " . $lon . ")) ASC";
    $query .= " LIMIT 8";

    // execute query
    $result = $conn->query($query);

    if ($result === FALSE)
        die("error searching geoname: " . $conn->error . " query:" . $query);

    $geonamesList = buildGeonamesList($result, false, [$lon, $lat]);


    // get notams
    $notamList = loadNotamList($lon, $lat, $minNotamTime, $maxNotamTime);


    // build return object
    print json_encode(array("geonames" => $geonamesList, "notams" => $notamList));


    $conn->close();
}


function getFrequencySubquery($airportIdFieldName)
{
    $query  = "SELECT frequency FROM openaip_radios AS rad";
    $query .= " WHERE rad.airport_id = " . $airportIdFieldName . "";
    $query .= " ORDER BY";
    $query .= "  CASE WHEN rad.category = 'COMMUNICATION' THEN 1 WHEN rad.category = 'OTHER' THEN 2 ELSE 3 END,";
    $query .= "  CASE WHEN rad.type = 'TOWER' THEN 1 WHEN rad.type = 'CTAF' THEN 2 WHEN rad.type = 'OTHER' THEN 3 ELSE 4 END";
    $query .= " LIMIT 1";

    return $query;
}


function getCallsignSubquery($airportIdFieldName, $airportCountryFieldName)
{
    $query  = "SELECT ";
    $query .= " (CASE rad.type";
    $query .= "   WHEN 'TOWER' THEN 'TWR'";
    $query .= "   WHEN 'APPROACH' THEN 'APP'";
    $query .= "   WHEN 'DEPARTURE' THEN 'DEP'";
    $query .= "   WHEN 'GLIDING' THEN 'GLD'";
    $query .= "   WHEN 'GROUND' THEN 'GND'";
    $query .= "   WHEN 'AFIS' THEN 'AFIS'";
    $query .= "   WHEN 'CTAF' THEN CASE WHEN " . $airportCountryFieldName . " = 'CH' THEN 'AD' ELSE 'CTAF' END";
    $query .= "   WHEN 'OTHER' THEN CASE WHEN rad.description LIKE 'AD%' THEN 'AD' ELSE rad.typespec END";
    $query .= "   ELSE ''";
    $query .= " END) AS callsign";
    $query .= " FROM openaip_radios AS rad";
    $query .= " WHERE rad.airport_id = " . $airportIdFieldName . "";
    $query .= " ORDER BY";
    $query .= "  CASE WHEN rad.category = 'COMMUNICATION' THEN 1 WHEN rad.category = 'OTHER' THEN 2 ELSE 3 END,";
    $query .= "  CASE WHEN rad.type = 'TOWER' THEN 1 WHEN rad.type = 'CTAF' THEN 2 WHEN rad.type = 'OTHER' THEN 3 ELSE 4 END";
    $query .= " LIMIT 1";

    return $query;
}


function getGeonamesFilterQuery()
{
    $query  = "((feature_class = 'P')"; // populated place
    $query .= " OR (feature_class = 'T')"; // any terrain
    $query .= " OR (feature_class = 'H'))"; // any waterbody

/*	$query .= " OR (feature_class = 'S')"; // any spot
    $query .= " OR (feature_class = 'T' AND feature_code = 'MT')"; // mountain
    $query .= " OR (feature_class = 'T' AND feature_code = 'MTS')"; // mountains
    $query .= " OR (feature_class = 'T' AND feature_code = 'PK')"; // peak
    $query .= " OR (feature_class = 'T' AND feature_code = 'PK')"; // peaks
    $query .= " OR (feature_class = 'T' AND feature_code = 'PASS')"; // pass
    $query .= " OR (feature_class = 'H' AND feature_code = 'LK'))"; // see*/

    return $query;
}


function buildGeonamesList($result, $renameDuplicates, $lonLat)
{
    $terrainHelper = new TerrainHelper();

    $geonames = [];

    while ($rs = $result->fetch_array(MYSQLI_ASSOC))
    {
        $geoname = array(
            "type" => $rs["type"],
            "id" => intval($rs["id"]),
            "name" => $rs["name"],
            "wpname" => $rs["wpname"],
            "country" => $rs["country"] ? $rs["country"] : "",
            "admin1" => $rs["admin1"] ? $rs["admin1"] : "",
            "admin2" => $rs["admin2"] ? $rs["admin2"] : "",
            "frequency" => $rs["frequency"],
            "callsign" => $rs["callsign"],
            "airport_icao" => $rs["airport_icao"],
            "latitude" => floatval($rs["latitude"]),
            "longitude" => floatval($rs["longitude"]),
            "elevation" => $rs["elevation"] ? floatval($rs["elevation"]) : $terrainHelper->getElevationMeters([$rs["longitude"], $rs["latitude"]])
        );

        $geonames[] = $geoname;
    }

    if ($renameDuplicates)
    {
        $duplicateIdx = findDuplicates($geonames);

        for ($i = 0; $i < count($geonames); $i++) {
            if ($geonames[$i]["type"] != "geoname")
                continue;

            if (in_array($i, $duplicateIdx["admin1idx"]) && $geonames[$i]["admin2"])
                $geonames[$i]["name"] .= " (" . $geonames[$i]["country"] . ", " . $geonames[$i]["admin1"] . ", " . $geonames[$i]["admin2"] . ")";
            elseif (in_array($i, $duplicateIdx["nameidx"]) && $geonames[$i]["admin1"])
                $geonames[$i]["name"] .= " (" . $geonames[$i]["country"] . ", " . $geonames[$i]["admin1"] . ")";
            else
                $geonames[$i]["name"] .= " (" . $geonames[$i]["country"] . ")";
        }
    }

    if ($lonLat) // add click coordinates as last point
    {
        $clickPoint = array(
            "type" => "coordinates",
            "id" => null,
            "name" => round($lonLat[1], 4) . " " . round($lonLat[0], 4),
            "wpname" => round($lonLat[1], 4) . " " . round($lonLat[0], 4),
            "country" => "",
            "admin1" => "",
            "admin2" => "",
            "frequency" => "",
            "callsign" => "",
            "airport_icao" => "",
            "latitude" => floatval($lonLat[1]),
            "longitude" => floatval($lonLat[0]),
            "elevation" => $terrainHelper->getElevationMeters($lonLat)
        );

        $geonames[] = $clickPoint;
    }

    return $geonames;
}


function findDuplicates($geonames)
{
    $duplicateNameIdx = array();
    $duplicateAdmin1Idx = array();

    // check for duplicate names
    for ($i = 0; $i < count($geonames) - 1; $i++)
    {
        if ($geonames[$i]["type"] != "geoname")
            continue;

        for ($j = $i + 1; $j < count($geonames); $j++)
        {
            if ($i == $j || $geonames[$j]["type"] != "geoname")
                continue;

            if ($geonames[$i]["name"] == $geonames[$j]["name"])
            {
                if ($geonames[$i]["admin1"] == $geonames[$j]["admin1"])
                {
                    array_push($duplicateAdmin1Idx, $i);
                    array_push($duplicateAdmin1Idx, $j);
                }
                else
                {
                    array_push($duplicateNameIdx, $i);
                    array_push($duplicateNameIdx, $j);
                }
            }
        }
    }

    return array("nameidx" => $duplicateNameIdx, "admin1idx" => $duplicateAdmin1Idx);
}


function loadNotamList($lon, $lat, $minNotamTime, $maxNotamTime)
{
    global $conn;


    $query = "SELECT ntm.notam AS notam FROM icao_notam AS ntm"
        . " INNER JOIN icao_notam_geometry geo ON geo.icao_notam_id = ntm.id "
        . " INNER JOIN icao_fir fir ON fir.statecode = ntm.country"
        . " LEFT JOIN icao_fir fir2 ON fir2.icao = ntm.icao"
        . " WHERE ST_INTERSECTS(geo.extent,". getDbPointStringFromLonLat([$lon, $lat]) . ")"
        . "  AND ntm.startdate <= '" . getDbTimeString($maxNotamTime) . "'"
        . "  AND ntm.enddate >= '" . getDbTimeString($minNotamTime) . "'"
        . "  AND (ST_INTERSECTS(fir.polygon,". getDbPointStringFromLonLat([$lon, $lat]) . "))" //" OR (fir2.icao IS NULL AND geo.geometry IS NOT NULL))"
        . " ORDER BY ntm.startdate DESC";

    $result = $conn->query($query);

    if ($result === FALSE)
        die("error searching notams: " . $conn->error . " query:" . $query);


    $notamList = [];

    while ($rs = $result->fetch_array(MYSQLI_ASSOC))
    {
        $notam = json_decode($rs["notam"], JSON_NUMERIC_CHECK);

        // TODO: use same filters in notam.php
        // filter by max FL195
        if ($notam["geometry"] && $notam["geometry"]["bottom"] >= NOTAM_MAX_BOTTOM_FL)
            continue;

        // filter by notam type (no KKKK)
        if ($notam["Qcode"] == "KKKK")
            continue;

        $notamList[] = $notam;
    }

    return $notamList;
}
