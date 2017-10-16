<?php
include_once "../config.php";
include_once "../helper.php";
include_once "../logger.php";

$smaMeasurementsUrl = "http://data.geo.admin.ch/ch.meteoschweiz.swissmetnet/VQHA69.csv";


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
    $values = explode("|", $measurementList[$lineNum]);

    if (count($values) != 12)
        continue;

    $station_id = checkEscapeString($conn, $values[0], 3, 3);
    $measurement_time = getDbTimeString(strtotime($values[1]));
    $temp_c = $values[2] == "-" ? "NULL" : checkNumeric($values[2]);
    $sun_min = $values[3] == "-" ? "NULL" : checkNumeric($values[3]);
    $precip_mm = $values[4] == "-" ? "NULL" : checkNumeric($values[4]);
    $wind_dir = $values[5] == "-" ? "NULL" : checkNumeric($values[5]);
    $wind_speed_kmh = $values[6] == "-" ? "NULL" : checkNumeric($values[6]);
    $qnh_hpa = $values[7] == "-" ? "NULL" : checkNumeric($values[7]);
    $wind_gusts_kmh = $values[8] == "-" ? "NULL" : checkNumeric($values[8]);
    $humidity_pc = $values[9] == "-" ? "NULL" : checkNumeric($values[9]);
    $qfe_hpa = $values[10] == "-" ? "NULL" : checkNumeric($values[10]);
    $qff_hpa = $values[11] == "-" ? "NULL" : checkNumeric($values[11]);

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
