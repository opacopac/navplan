<?php
include_once "../config.php";
include_once "../helper.php";
include_once "../logger.php";

const NOTAM_BASE_URL = "https://v4p4sz5ijk.execute-api.us-east-1.amazonaws.com/anbdata/states/notams/notams-list?api_key=2a9daa70-2604-11e7-a2b8-e55a51cc8ef0&format=json&states=";
const NOTAM_COUNTRIES = [
    "CHE", "DEU", "FRA", "ITA", "AUT", "ESP", "PRT", "GBR", "IRL", "BEL",
    "NDL", "DNK", "SWE", "NOR", "FIN", "EST", "LVA", "LTU", "POL", "CZE",
    "SVK", "HUN", "SVN", "HRV", "BIH", "SRB", "ALB", "MDK", "BGR", "ROU",
    "GRC", "MLT", "CYP", "TUR", "UKR", "RUS", "MDA", "BLR", "GEO", "ARM",
    "CAN", "USA", "ISL", "GRL", "MEX", "BHS", "CUB", "HND", "HTI", "DOM"]; // TODO: remove

// open log file & db connection
$logger = new Logger(NULL);
$conn = openDb();


// load all countries
$query = "SELECT DISTINCT statecode FROM icao_fir";
$result = $conn->query($query);

if ($result === FALSE)
    die("error reading state codes: " . $conn->error . " query:" . $query);

$countryList = [];
while ($rs = $result->fetch_array(MYSQLI_ASSOC))
    $countryList[] = $rs["statecode"];


// load from icao in 10-chunks
$chunkedCountryList = array_chunk($countryList, 10);

foreach ($chunkedCountryList as $countryChunk)
{
    // load notams from icao
    $url = NOTAM_BASE_URL . join(",", $countryChunk);
    $logger->writelog("INFO", "fetching NOTAMs for " . join(",", $countryChunk));
    $time1 = microtime(true);

    try
    {
        $response = file_get_contents($url);
    }
    catch (Exception $e)
    {
        $logger->writelog("ERROR", "error while fetching notams after " . round(1000 * (microtime(true) - $time1)) . "ms:" . $e->getMessage());
        continue;  // ignore errors / timeouts from icao
    }

    if ($response === FALSE)
    {
        $logger->writelog("ERROR", "error while fetching notams after " . round(1000 * (microtime(true) - $time1)) . "ms");
        continue;  // ignore errors / timeouts from icao
    }

    $logger->writelog("INFO", "successful (" . round(1000 * (microtime(true) - $time1)) . "ms)");
    $notamList = json_decode($response, JSON_NUMERIC_CHECK);
    $logger->writelog("INFO", count($notamList) . " NOTAMs fetched.");
	

    // delete existing notams from db
    $query = "DELETE FROM icao_notam WHERE country in ('" . join("','", $countryChunk) . "')";
    $result = $conn->query($query);

    if ($result === FALSE)
        die("error deleting notams: " . $conn->error . " query:" . $query);

    // add updated notams to db
    if (count($notamList) > 0) {
        $queryParts = [];
        foreach ($notamList as $notam)
        {
            $dbExtent = $notam["dbExtent"];
            unset($notam["dbExtent"]);

            $queryParts[] = "('"
                . checkEscapeString($conn, $notam["id"], 0, 20) . "','"
                . checkEscapeString($conn, $notam["StateCode"], 0, 10) . "','"
                . checkEscapeString($conn, $notam["type"], 0, 10) . "','"
                . checkEscapeString($conn, $notam["location"], 4, 4) . "','"
                . getDbTimeString(strtotime($notam["startdate"])) . "','"
                . getDbTimeString(strtotime($notam["enddate"])) . "','"
                . checkEscapeString($conn, json_encode($notam, JSON_NUMERIC_CHECK), 0, 999999) . "')";
        }

        if (count($queryParts) > 0)
        {
            $query = "INSERT INTO icao_notam (notam_id, country, type, icao, startdate, enddate, notam) VALUES " . join(",", $queryParts);
            $result = $conn->query($query);

            if ($result === FALSE)
                die("error adding notams: " . $conn->error . " query:" . $query);
        }

    }
}


// close db
$conn->close();
