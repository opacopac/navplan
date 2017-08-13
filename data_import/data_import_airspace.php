<?php
include "../php/config.php";
include "../php/helper.php";

const START_NUM_CORR_ADD_ENTRIES = 999000000;

header('Content-type: text/html; charset=utf-8');

$conn = openDb();


// clear table
printLine("clearing old data...");

$query = "TRUNCATE TABLE openaip_airspace";
$result = $conn->query($query);

if ($result === FALSE)
    die("ERROR: " . $conn->error);

printLine("ok");


// reading correction table
printLine("reading correction table...");

$query = "SELECT * from airspace_corr";
$result = $conn->query($query);

if ($result === FALSE)
    die("ERROR: " . $conn->error);

$corrLines = [];

while ($rs = $result->fetch_array(MYSQLI_ASSOC))
{
    $corrLines[] = array(
        id => $rs["id"],
        type => $rs["type"],
        aip_country => $rs["aip_country"],
        aip_cat => $rs["aip_cat"],
        aip_name => $rs["aip_name"],
        corr_cat => $rs["corr_cat"],
        corr_alt_top_reference => $rs["corr_alt_top_reference"],
        corr_alt_top_height => $rs["corr_alt_top_height"],
        corr_alt_top_unit => $rs["corr_alt_top_unit"],
        corr_alt_bottom_reference => $rs["corr_alt_bottom_reference"],
        corr_alt_bottom_height => $rs["corr_alt_bottom_height"],
        corr_alt_bottom_unit => $rs["corr_alt_bottom_unit"],
        corr_polygon => $rs["corr_polygon"]
    );
}

printLine("ok");


// add additional entries from correction table
printLine("add additional entries from correction table...");

$counter = 0;
foreach ($corrLines as $corr)
{
    if ($corr["type"] != "ADD")
        continue;

    insertIntoDb(
        $corr["aip_cat"],
        START_NUM_CORR_ADD_ENTRIES + $counter,
        $corr["aip_country"],
        $corr["aip_name"],
        $corr["corr_alt_top_reference"],
        $corr["corr_alt_top_height"],
        $corr["corr_alt_top_unit"],
        $corr["corr_alt_bottom_reference"],
        $corr["corr_alt_bottom_height"],
        $corr["corr_alt_bottom_unit"],
        $corr["corr_polygon"]
    );

    $counter++;
}

printLine("ok");


// importing airspace data
printLine("importing airspace data...");

$data_dir = realpath("./openaip_airspace/");
$dir_entries = scandir($data_dir);

// iterate trough files
foreach ($dir_entries as $filename)
{
    $abs_filename = $data_dir . "/" . $filename;

    // skip directories
    if (is_dir($abs_filename))
        continue;

    printLine("processing file " . $abs_filename . "...");

    $data_file = simplexml_load_file($abs_filename);
    ob_flush();

    foreach ($data_file->AIRSPACES->ASP as $airspace)
    {
        // get values
        $category = $airspace['CATEGORY'];
        $aip_id = $airspace->ID;
        $country = $airspace->COUNTRY;
        $name = $airspace->NAME;
        $alt_top_reference = $airspace->ALTLIMIT_TOP['REFERENCE'];
        $alt_top_height = $airspace->ALTLIMIT_TOP->ALT;
        $alt_top_unit = $airspace->ALTLIMIT_TOP->ALT['UNIT'];
        $alt_bottom_reference = $airspace->ALTLIMIT_BOTTOM['REFERENCE'];
        $alt_bottom_height = $airspace->ALTLIMIT_BOTTOM->ALT;
        $alt_bottom_unit = $airspace->ALTLIMIT_BOTTOM->ALT['UNIT'];
        $polygon = $airspace->GEOMETRY->POLYGON;


        // check correction entries
        $hide = false;
        foreach ($corrLines as $corrLine)
        {
            if ($corrLine["type"] == 'ADD')
                continue;

            if ($country == $corrLine["aip_country"] && $category == $corrLine["aip_cat"] && $name == $corrLine["aip_name"])
            {
                // hide
                if ($corrLine["type"] == "HIDE")
                {
                    $hide = true;
                    break;
                }

                // corrections
                if ($corrLine["corr_cat"])
                    $category = $corrLine["corr_cat"];

                if ($corrLine["corr_alt_top_reference"])
                    $alt_top_reference = $corrLine["corr_alt_top_reference"];

                if ($corrLine["corr_alt_top_height"])
                    $alt_top_height = $corrLine["corr_alt_top_height"];

                if ($corrLine["corr_alt_top_unit"])
                    $alt_top_unit = $corrLine["corr_alt_top_unit"];

                if ($corrLine["corr_alt_bottom_reference"])
                    $alt_bottom_reference = $corrLine["corr_alt_bottom_reference"];

                if ($corrLine["corr_alt_bottom_height"])
                    $alt_bottom_height = $corrLine["corr_alt_bottom_height"];

                if ($corrLine["corr_alt_bottom_unit"])
                    $alt_bottom_unit = $corrLine["corr_alt_bottom_unit"];

                if ($corrLine["polygon"])
                    $polygon = $corrLine["polygon"];
            }
        }

        if ($hide)
            continue;

        // save to db
        insertIntoDb($category, $aip_id, $country, $name, $alt_top_reference, $alt_top_height, $alt_top_unit, $alt_bottom_reference, $alt_bottom_height, $alt_bottom_unit, $polygon);
    }

    printLine("ok");
}

printLine("finished.");


function insertIntoDb($category, $aip_id, $country, $name, $alt_top_reference, $alt_top_height, $alt_top_unit, $alt_bottom_reference, $alt_bottom_height, $alt_bottom_unit, $polygon)
{
    global $conn;

    $query = "INSERT INTO openaip_airspace (category, aip_id, country, name, alt_top_reference, alt_top_height, alt_top_unit, alt_bottom_reference, alt_bottom_height, alt_bottom_unit, polygon, extent) VALUES (";
    $query .= " '" . $category . "',";
    $query .= " '" . $aip_id . "',";
    $query .= " '" . $country . "',";
    $query .= " '" . mysqli_real_escape_string($conn, $name) . "',";
    $query .= " '" . $alt_top_reference . "',";
    $query .= " '" . $alt_top_height . "',";
    $query .= " '" . $alt_top_unit . "',";
    $query .= " '" . $alt_bottom_reference . "',";
    $query .= " '" . $alt_bottom_height . "',";
    $query .= " '" . $alt_bottom_unit . "',";
    $query .= " '" . $polygon . "',";
    $query .= " GeomFromText('POLYGON((" . $polygon  . "))')";
    $query .= ")";

    $result = $conn->query($query);

    if ($result === FALSE)
    {
        printLine("ERROR: " . $conn->error);
        //printLine("query: " . $query);
    }
}
