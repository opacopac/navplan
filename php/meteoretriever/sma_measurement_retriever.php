<?php
include_once "../config.php";
include_once "../helper.php";
include_once "../logger.php";

//$smaMeasurementsUrl = "http://data.geo.admin.ch/ch.meteoschweiz.swissmetnet/VQHA69.csv";
$smaMeasurementsUrl = "https://data.geo.admin.ch/ch.meteoschweiz.messwerte-aktuell/VQHA80.csv";

// open log file & db connection
$logger = new Logger(NULL);
$conn = openDb();


// load csv from SMA
$logger->writelog("INFO", "reading measurements from SMA");
$smaMeasurements = file_get_contents($smaMeasurementsUrl);

if ($smaMeasurements === FALSE)
{
    $logger->writelog("ERROR", "error reading measurements");
    die;
}


// split csv data into lines
$measurementList = explode("\n", $smaMeasurements);

if (count($measurementList) <= 3)
{
    $logger->writelog("ERROR", "measurement data is empty/invalid");
    die;
}


// delete old data from db
$logger->writelog("INFO", "clear old data from db");

$query = "TRUNCATE TABLE meteo_sma_measurements";
$result = $conn->query($query);

if ($result === FALSE)
    die("error truncating meteo measurements: " . $this->conn->error . " query:" . $query);


// process measurement lines
$logger->writelog("INFO", "processing measurement lines");

for ($lineNum = 3; $lineNum < count($measurementList); $lineNum++)
{
    // https://data.geo.admin.ch/ch.meteoschweiz.messwerte-aktuell/info/VQHA80_de.txt
    $values = explode(";", $measurementList[$lineNum]);

    if (count($values) != 22)
        continue;

    $station_id = getStationId($conn, $values);
    $measurement_time = getDbTimeString(strtotime($values[1])); // time
    $temp_c = getTempC($values);
    $precip_mm = getPrecipMm($values);
    $sun_min = getSunMin($values);
    $wind_dir = getWindDir($values);
    $wind_speed_kmh = getWindSpeedKmh($values);
    $qnh_hpa = getQnhHpa($values);
    $wind_gusts_kmh = getWindGustsKmh($values);
    $humidity_pc = getHumidityPerc($values);
    $qfe_hpa = getQfeHpa($values);
    $qff_hpa = getQffHpa($values);

    // write measurements to db
    $query = "INSERT INTO meteo_sma_measurements";
    $query .= " (station_id, measurement_time, temp_c, sun_min, precip_mm, wind_dir, wind_speed_kmh, qnh_hpa, wind_gusts_kmh, humidity_pc, qfe_hpa, qff_hpa)";
    $query .= " VALUES (";
    $query .= " '" . $station_id . "',";
    $query .= " '" . $measurement_time . "',";
    $query .= " " . $temp_c . ",";
    $query .= " " . $sun_min . ",";
    $query .= " " . $precip_mm . ",";
    $query .= " " . $wind_dir . ",";
    $query .= " " . $wind_speed_kmh . ",";
    $query .= " " . $qnh_hpa . ",";
    $query .= " " . $wind_gusts_kmh . ",";
    $query .= " " . $humidity_pc . ",";
    $query .= " " . $qfe_hpa . ",";
    $query .= " " . $qff_hpa;
    $query .= ")";

    $result = $conn->query($query);

    if ($result === FALSE)
    {
        $logger->writelog("ERROR", "error writing measurement:" . $conn->error . " query:" . $query);
        die;
    }
}


// close db
$conn->close();

$logger->writelog("INFO", "finished successfully.");


function getStationId($conn, $values) {
    return checkEscapeString($conn, $values[0], 3, 3); // stn
}


function getTempC($values) {
    return getFirstAvailableValueOrNullString([$values[2], $values[19]]); // tre200s0, ta1tows0
}


function getPrecipMm($values) {
    return getNumericOrNullString($values[3]); // rre150z0
}


function getSunMin($values) {
    return getNumericOrNullString($values[4]); // sre000z0
}


function getQnhHpa($values) {
    return getNumericOrNullString($values[13]); // pp0qnhs0
}


function getQfeHpa($values) {
    return getNumericOrNullString($values[11]); // prestas0
}


function getQffHpa($values) {
    return getNumericOrNullString($values[12]); // pp0qffs0
}


function getHumidityPerc($values) {
    return getFirstAvailableValueOrNullString([$values[6], $values[20]]); // ure200s0, uretows0
}


function getWindDir($values) {
    return getFirstAvailableValueOrNullString([$values[8], $values[16]]); // dkl010z0, dv1towz0
}


function getWindSpeedKmh($values) {
    return getFirstAvailableValueOrNullString([$values[9], $values[17]]); // fu3010z0, fu3towz0
}


function getWindGustsKmh($values) {
    return getFirstAvailableValueOrNullString([$values[10], $values[18]]); // fu3010z1, fu3towz1
}


function getFirstAvailableValueOrNullString($valueList) {
    foreach ($valueList as $value) {
        $valueOrNullString = getNumericOrNullString($value);

        if ($valueOrNullString !== "NULL") {
            return $valueOrNullString;
        }
    }

    return "NULL";
}


function getNumericOrNullString($value) {
    if (is_numeric($value)) {
        return $value;
    } else {
        return "NULL";
    }
}
