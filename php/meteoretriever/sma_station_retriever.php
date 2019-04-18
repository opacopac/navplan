<?php
include_once "../config.php";
include_once "../helper.php";
include_once "../logger.php";
include_once "../wgs84_ch1903.php";


$smaMeasurementsUrl = "http://data.geo.admin.ch/ch.meteoschweiz.swissmetnet/info/VQHA69_DE.txt";


// open log file & db connection
$logger = new Logger(NULL);
$conn = openDb();


// delete old data
$logger->writelog("INFO", "clear old data...");

$query = "TRUNCATE TABLE meteo_sma_stations";
$result = $conn->query($query);

if ($result === FALSE)
    die("error truncating meteo stations: " . $this->conn->error . " query:" . $query);


// load csv from SMA
$logger->writelog("INFO", "reading station file from SMA...");
$smaStations = file_get_contents($smaMeasurementsUrl);
$logger->writelog("INFO", "done");


// parse line by line
$stationList = explode("\n", $smaStations);

if (count($stationList) <= 34)
{
    $logger->writelog("ERROR", "invalid station file");
    die;
}

for ($lineNum = 17; $lineNum < count($stationList); $lineNum++)
{
    $line = $stationList[$lineNum];
    if (strlen($line) < 99)
        break;

    $station_id = checkEscapeString($conn, trim(substr($line, 0, 25)), 3, 3);
    $name = checkEscapeString($conn, utf8_encode(trim(substr($line, 25, 25))), 2, 25);
    $ch_coords = explode("/", trim(substr($line, 75, 25)));
    $lon = checkNumeric(CHtoWGSlong(intval($ch_coords[0]), intval($ch_coords[1])));
    $lat = checkNumeric(CHtoWGSlat(intval($ch_coords[0]), intval($ch_coords[1])));
    $alt_m = checkNumeric(intval(trim(substr($line, 100))));


    // write stations to db
    $query = "INSERT INTO meteo_sma_stations";
    $query .= " (station_id, name, latitude, longitude, altitude_m)";
    $query .= " VALUES (";
    $query .= " '" . $station_id . "',";
    $query .= " '" . $name . "',";
    $query .= " " . $lat . ",";
    $query .= " " . $lon . ",";
    $query .= " " . $alt_m;
    $query .= ")";

    $result = $conn->query($query);

    if ($result === FALSE)
    {
        $logger->writelog("ERROR", "error writing stations:" . $conn->error . " query:" . $query);
        die;
    }
}


// close db
$conn->close();

$logger->writelog("INFO", "finished successfully.");
