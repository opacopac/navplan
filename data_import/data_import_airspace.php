<?php
include "../php/config.php";
include "../php/helper.php";

const START_NUM_CORR_ADD_ENTRIES = 999000000;

// correction table
$corrLines = array(
    array('type' => 'CORR','aip_country' => 'CH','aip_cat' => 'PROHIBITED','aip_name' => 'SAMEDAN FIZ','corr_cat' => 'FIZ'),
    array('type' => 'CORR','aip_country' => 'CH','aip_cat' => 'RESTRICTED','aip_name' => 'LS-R4 LAC DE 128.675','corr_name' => 'LS-R4 LAC DE NEUCHATEL 128.675'),
    array('type' => 'CORR','aip_country' => 'CH','aip_cat' => 'RESTRICTED','aip_name' => 'LS-R4A LAC DE 128.675','corr_name' => 'LS-R4A LAC DE NEUCHATEL 128.675'),
    array('type' => 'CORR','aip_country' => 'CH','aip_cat' => 'RESTRICTED','aip_name' => 'LS-R8 DAMMAST 128.375','corr_name' => 'LS-R8 DAMMASTOCK 128.375'),
    array('type' => 'CORR','aip_country' => 'CH','aip_cat' => 'RESTRICTED','aip_name' => 'LS-R8A DAMMAS 128.375','corr_name' => 'LS-R8A DAMMASTOCK 128.375'),
    array('type' => 'CORR','aip_country' => 'CH','aip_cat' => 'RESTRICTED','aip_name' => 'LS-R11 ZUOZ S 135.475','corr_name' => 'LS-R11 ZUOZ / S-CHANF 135.475'),
    array('type' => 'CORR','aip_country' => 'CH','aip_cat' => 'RESTRICTED','aip_name' => 'LS-R11A ZUOZ 135.475','corr_name' => 'LS-R11A ZUOZ / S-CHANF 135.475'),
    array('type' => 'CORR','aip_country' => 'CH','aip_cat' => 'RESTRICTED','aip_name' => 'LS-R31 EMMEN 120.425','corr_name' => 'LS-R31 EMMEN EAST 120.425'),
    array('type' => 'CORR','aip_country' => 'CH','aip_cat' => 'DANGER','aip_name' => 'LS-D7 GRANDVI 135.475','corr_name' => 'LS-D7 GRANDVILLARD 135.475'),
    array('type' => 'CORR','aip_country' => 'CH','aip_cat' => 'GLIDING','aip_name' => 'LSR51 CALANDA (MIL OFF FL150)','corr_name' => 'LSR54 CALANDA (MIL OFF FL150)'),

    array('type' => 'CORR','aip_country' => 'FR','aip_cat' => 'D','aip_name' => 'Bale2 119.35','corr_alt_top_reference' => 'STD','corr_alt_top_height' => '100','corr_alt_top_unit' => 'FL'),
    array('type' => 'HIDE','aip_country' => 'FR','aip_cat' => 'C','aip_name' => 'Bale AZ1 119.35'),
    array('type' => 'HIDE','aip_country' => 'FR','aip_cat' => 'D','aip_name' => 'Bale AZ1 119.35'),
    array('type' => 'HIDE','aip_country' => 'FR','aip_cat' => 'C','aip_name' => 'Bale AZ2 119.35'),
    array('type' => 'HIDE','aip_country' => 'FR','aip_cat' => 'D','aip_name' => 'Bale AZ2 119.35'),
    array('type' => 'HIDE','aip_country' => 'FR','aip_cat' => 'C','aip_name' => 'Bale AZ3 119.35'),
    array('type' => 'HIDE','aip_country' => 'FR','aip_cat' => 'E','aip_name' => 'Bale AZ3 119.35'),
    array('type' => 'HIDE','aip_country' => 'FR','aip_cat' => 'C','aip_name' => 'Bale AZ4 119.35'),
    array('type' => 'HIDE','aip_country' => 'FR','aip_cat' => 'E','aip_name' => 'Bale AZ4 119.35'),
    array('type' => 'HIDE','aip_country' => 'FR','aip_cat' => 'C','aip_name' => 'TMA GENEVE partie 1'),
    array('type' => 'HIDE','aip_country' => 'FR','aip_cat' => 'C','aip_name' => 'TMA GENEVE partie 2'),
    array('type' => 'HIDE','aip_country' => 'FR','aip_cat' => 'E','aip_name' => 'Geneve2 E 126.35'),
    array('type' => 'HIDE','aip_country' => 'FR','aip_cat' => 'C','aip_name' => 'TMA GENEVE partie 3'),
    array('type' => 'HIDE','aip_country' => 'FR','aip_cat' => 'E','aip_name' => 'Geneve3 E 126.35'),

    array('type' => 'CORR','aip_country' => 'DE','aip_cat' => 'TMZ','aip_name' => 'TMZ-EDNY XPDR A2677 119.925','corr_alt_top_reference' => 'STD','corr_alt_top_height' => '100','corr_alt_top_unit' => 'FL'),

    array('type' => 'HIDE','aip_country' => 'IT','aip_cat' => 'D','aip_name' => 'LUGANO CTR'),
);


header('Content-type: text/html; charset=utf-8');

$conn = openDb();


// clear table
printLine("clearing old data...");

$query = "TRUNCATE TABLE openaip_airspace";
$result = $conn->query($query);

if ($result === FALSE)
    die("ERROR: " . $conn->error);

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
                if (isset($corrLine["corr_cat"]))
                    $category = $corrLine["corr_cat"];

                if (isset($corrLine["corr_name"]))
                    $name = $corrLine["corr_name"];

                if (isset($corrLine["corr_alt_top_reference"]))
                    $alt_top_reference = $corrLine["corr_alt_top_reference"];

                if (isset($corrLine["corr_alt_top_height"]))
                    $alt_top_height = $corrLine["corr_alt_top_height"];

                if (isset($corrLine["corr_alt_top_unit"]))
                    $alt_top_unit = $corrLine["corr_alt_top_unit"];

                if (isset($corrLine["corr_alt_bottom_reference"]))
                    $alt_bottom_reference = $corrLine["corr_alt_bottom_reference"];

                if (isset($corrLine["corr_alt_bottom_height"]))
                    $alt_bottom_height = $corrLine["corr_alt_bottom_height"];

                if (isset($corrLine["corr_alt_bottom_unit"]))
                    $alt_bottom_unit = $corrLine["corr_alt_bottom_unit"];

                if (isset($corrLine["polygon"]))
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
