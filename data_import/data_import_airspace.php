<?php
include "../php/config.php";
include "../php/helper.php";

header('Content-type: text/html; charset=utf-8');

$conn = openDb();


// clear table
printLine("clearing old data...");

$query = "DELETE FROM openaip_airspace2";
$result = $conn->query($query);

if ($result === FALSE)
    die("ERROR: " . $conn->error);

printLine("ok");


// reading correction table
printLine("reading correction table...");

$query = "SELECT * from airspace_corr2";
$result = $conn->query($query);

if ($result === FALSE)
    die("ERROR: " . $conn->error);

$corrLines = [];

while ($rs = $result->fetch_array(MYSQLI_ASSOC))
{
    $corrLines[] = array(
        id => $rs["id"],
        aip_country => $rs["aip_country"],
        aip_cat => $rs["aip_cat"],
        aip_name => $rs["aip_name"]
    );
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
        $query = "INSERT INTO openaip_airspace2 (category, aip_id, country, name, alt_top_reference, alt_top_height, alt_top_unit, alt_bottom_reference, alt_bottom_height, alt_bottom_unit, polygon, extent) VALUES (";
        $query .= " '" . $airspace['CATEGORY'] . "',";
        $query .= " '" . $airspace->ID . "',";
        $query .= " '" . $airspace->COUNTRY . "',";
        $query .= " '" . mysqli_real_escape_string($conn, $airspace->NAME) . "',";
        $query .= " '" . $airspace->ALTLIMIT_TOP['REFERENCE'] . "',";
        $query .= " '" . $airspace->ALTLIMIT_TOP->ALT . "',";
        $query .= " '" . $airspace->ALTLIMIT_TOP->ALT['UNIT'] . "',";
        $query .= " '" . $airspace->ALTLIMIT_BOTTOM['REFERENCE'] . "',";
        $query .= " '" . $airspace->ALTLIMIT_BOTTOM->ALT . "',";
        $query .= " '" . $airspace->ALTLIMIT_BOTTOM->ALT['UNIT'] . "',";
        $query .= " '" . $airspace->GEOMETRY->POLYGON . "',";
        $query .= " GeomFromText('POLYGON((" . $airspace->GEOMETRY->POLYGON . "))')";
        $query .= ")";

        $result = $conn->query($query);

        if ($result === FALSE)
        {
            printLine("ERROR: " . $conn->error);
            //printLine("query: " . $query);

            continue;
        }


        // try to find airspace ids for correction table
        foreach ($corrLines as &$corrLine)
        {

            if ($airspace->COUNTRY == $corrLine["aip_country"] && $airspace['CATEGORY'] == $corrLine["aip_cat"] && $airspace->NAME == $corrLine["aip_name"])
            {
                if (!$corrLine["aip_id"] || $corrLine["aip_id"] == $airspace->ID->__toString())
                    $corrLine["aip_id"] = $airspace->ID->__toString();
                else
                    printLine("ERROR: duplicate aip_id " . $corrLine["aip_id"]);

                continue;
            }
        }
    }

    printLine("ok");
}

// writing airspace ids to correction table
printLine("updating correction table with aip-airspace-ids");

foreach ($corrLines as &$corrLine)
{
    if ($corrLine["aip_id"])
    {
        printLine("updating ID " . $corrLine["id"] . ": " . $corrLine["aip_name"] . "...");

        $query = "UPDATE airspace_corr2 SET aip_id = '" . $corrLine["aip_id"] . "' WHERE id = '" . $corrLine["id"] . "'";
        $result = $conn->query($query);

        if ($result === FALSE)
        {
            printLine("ERROR: " . $conn->error);
            //printLine("query: " . $query);

            continue;
        }
    }
}

printLine("ok");
printLine("finished.");
