<?php

include "../php/config.php";
include "../php/helper.php";

$admin1codes_filename = "./geonames_codes/admin1CodesASCII.txt";
$admin2codes_filename = "./geonames_codes/admin2Codes.txt";

$conn = openDb();

// clear tables
$query = "TRUNCATE TABLE geonames_admin1codes";
$result = $conn->query($query);

if ($result === FALSE)
    die("error deleting admin1codes: " . $conn->error . " query:" . $query);

$query = "TRUNCATE TABLE geonames_admin2codes";
$result = $conn->query($query);

if ($result === FALSE)
    die("error deleting admin2codes: " . $conn->error . " query:" . $query);


// importing admin1codes
printLine("importing admin1codes: " . $admin1codes_filename);

$abs_filename = realpath($admin1codes_filename);

$query = "LOAD DATA LOCAL INFILE '" . $abs_filename . "' INTO TABLE geonames_admin1codes (geonames_key, name, name_ascii, geonames_id)";
$result = $conn->query($query);

if ($result === FALSE)
    die("error importing admin1codes: " . $conn->error . " query:" . $query);

printLine("ok");


// importing admin1codes
printLine("importing admin2codes: " . $admin2codes_filename);

$abs_filename2 = realpath($admin2codes_filename);

$query = "LOAD DATA LOCAL INFILE '" . $abs_filename2 . "' INTO TABLE geonames_admin2codes (geonames_key, name, name_ascii, geonames_id)";
$result = $conn->query($query);

if ($result === FALSE)
    die("error importing admin2codes: " . $conn->error . " query:" . $query);

printLine("ok");

printLine("done");
