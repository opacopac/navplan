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
$measurementList = getMeasurementList($minLat, $minLon, $maxLat, $maxLon);

// close db
$conn->close();


// return output
$return_object = json_encode(array("smameasurements" => $measurementList), JSON_NUMERIC_CHECK);

header("Content-Type: application/json; charset=UTF-8");

echo($return_object);


function getMeasurementList($minLat, $minLon, $maxLat, $maxLon)
{
    global $conn;

    $query = "SELECT DISTINCT";
    $query .= " sta.station_id AS station_id,";
    $query .= " sta.name AS station_name,";
    $query .= " sta.latitude AS station_lat,";
    $query .= " sta.longitude AS station_lon,";
    $query .= " sta.altitude_m AS station_alt_m,";
    $query .= " mea.measurement_time AS measurement_time,";
    $query .= " mea.temp_c AS temp_c,";
    $query .= " mea.sun_min AS sun_min,";
    $query .= " mea.precip_mm AS precip_mm,";
    $query .= " mea.wind_dir AS wind_dir,";
    $query .= " mea.wind_speed_kmh AS wind_speed_kmh,";
    $query .= " mea.wind_gusts_kmh AS wind_gusts_kmh,";
    $query .= " mea.qnh_hpa AS qnh_hpa,";
    $query .= " mea.humidity_pc AS humidity_pc";
    $query .= " FROM meteo_sma_measurements mea";
    $query .= " INNER JOIN meteo_sma_stations sta ON sta.station_id = mea.station_id";
    $query .= " WHERE latitude >= " . $minLat . " AND latitude <= " . $maxLat . " AND longitude >= " . $minLon . " AND longitude <= " . $maxLon;

    $result = $conn->query($query);

    if ($result === FALSE)
        die("error reading sma measurements: " . $conn->error . " query:" . $query);

    $firList = [];

    while ($rs = $result->fetch_array(MYSQLI_ASSOC))
    {
        $firList[] = array(
            "station_id" => $rs["station_id"],
            "station_name" => $rs["station_name"],
            "station_lat" => $rs["station_lat"],
            "station_lon" => $rs["station_lon"],
            "station_alt_m" => $rs["station_alt_m"],
            "measurement_time" => $rs["measurement_time"],
            "temp_c" => $rs["temp_c"],
            "sun_min" => $rs["sun_min"],
            "precip_mm" => $rs["precip_mm"],
            "wind_dir" => $rs["wind_dir"],
            "wind_speed_kmh" => $rs["wind_speed_kmh"],
            "wind_gusts_kmh" => $rs["wind_gusts_kmh"],
            "qnh_hpa" => $rs["qnh_hpa"],
            "humidity_pc" => $rs["humidity_pc"]
        );
    }

    return $firList;
}
