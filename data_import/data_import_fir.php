<?php
include "../php/config.php";
include "../php/helper.php";

$baseUrlAnr = "https://v4p4sz5ijk.execute-api.us-east-1.amazonaws.com/anbdata/airspaces/zones/fir-name-list?api_key=2a9daa70-2604-11e7-a2b8-e55a51cc8ef0&format=json&ANRegion=";
$baseUrlFir = "https://v4p4sz5ijk.execute-api.us-east-1.amazonaws.com/anbdata/airspaces/zones/fir-list?api_key=2a9daa70-2604-11e7-a2b8-e55a51cc8ef0&format=json&firs=";
$anRegionList = ['AFI','EUR','NAT','CAR','NAM','ASIA','SAM','MID'];

$conn = openDb();
cleanFirsFromDB();

foreach ($anRegionList as $anRegion)
{
    $urlAnr = $baseUrlAnr . $anRegion;
    $responseAnr = file_get_contents($urlAnr);
    $firList = json_decode($responseAnr);

    foreach ($firList as $fir)
    {
        print $fir->FIRcode . "...";

        $urlFir = $baseUrlFir . $fir->FIRcode;
        $responseFir = file_get_contents($urlFir);
        $firDetails = json_decode($responseFir);
        saveFirToDB($firDetails[0]);

        printLine("done");
    }
}


function cleanFirsFromDB()
{
    global $conn;
    $query = "TRUNCATE TABLE icao_fir";

    $result = $conn->query($query);

    if (!$result)
    {
        print "ERROR: " . $conn->error . "<br>\n";
        print $query . "<br>\n";
        exit;
    }
}


function saveFirToDB($firDetails)
{
    global $conn;

    $query = "INSERT INTO icao_fir (region, icao, name, statecode, statename, centerlat, centerlon, polygon)";
    $query .= " VALUES (";
    $query .= " '" . checkEscapeString($conn, $firDetails->properties->REGION, 3, 4) . "',";
    $query .= " '" . checkEscapeString($conn, $firDetails->properties->ICAOCODE, 4, 4) . "',";
    $query .= " '" . checkEscapeString($conn, $firDetails->properties->FIRname, 1, 100) . "',";
    $query .= " '" . checkEscapeString($conn, $firDetails->properties->StateCode, 3, 3) . "',";
    $query .= " '" . checkEscapeString($conn, $firDetails->properties->StateName, 1, 100) . "',";
    $query .= " '" . checkNumeric($firDetails->properties->centlat) . "',";
    $query .= " '" . checkNumeric($firDetails->properties->centlong) . "',";
    $query .= " ST_GeomFromText('" . getMultiPolyString($firDetails->geometry) . "')";
    $query .= " )";

    $result = $conn->query($query);

    if (!$result)
    {
        print "ERROR: " . $conn->error . "<br>\n";
        print $query . "<br>\n";
        exit;
    }
}


function getMultiPolyString($geometry)
{
    $coordString = [];

    if ($geometry->type == "MultiPolygon")
    {
        foreach ($geometry->coordinates as $polygon)
            $coordString[] = getPolyCoordString($polygon);
    }
    else if ($geometry->type == "Polygon")
    {
        $coordString[] = getPolyCoordString($geometry->coordinates);
    }
    else
        die ("ERROR: unknown geometry" . $geometry->type);

    return "MultiPolygon(" . join(",", $coordString) . ")";
}


function getPolyCoordString($polyCords)
{
    $ringTexts = [];

    foreach ($polyCords as $ring)
        $ringTexts[] = getRingCoordString($ring);

    return "(" . join(",", $ringTexts) . ")";
}


function getRingCoordString($ringCoords)
{
    $coordPairs = [];

    foreach ($ringCoords as $coordPair)
        $coordPairs[] = checkNumeric($coordPair[0]) . " " . checkNumeric($coordPair[1]);

    return "(" . join(",", $coordPairs) . ")";
}
