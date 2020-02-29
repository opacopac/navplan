<?php
include "../php/config.php";


// correction table
$corrLines = array(
	// hospital landing sites
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'INSELSPITAL BERN','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'KANTONSSPITAL AARAU','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'KANTONSSPITAL FRAUENFELD','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'KANTONSSPITAL GLARUS','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'KANTONSSPITAL GRAUBUENDEN','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'KANTONSSPITAL LUZERN','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'KANTONSSPITAL MüNSTERLINGEN','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'KANTONSSPITAL SCHAFFHAUSEN','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'KANTONSSPITAL URI','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'KANTONSSPITAL WINTERTHUR','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'KISPISG KINDERSPITAL ST.GALLEN','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'KISPIZH KINDERSPITAL ZUERICH','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'KSSG KANTONSSPITAL ST.GALLEN','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'REGIONALSPITAL BELLINZONA E VALLI','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'REGIONALSPITAL DAVOS','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'REGIONALSPITAL LOCARNO','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'REGIONALSPITAL LUGANO CIVICO','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'SPITAL APPENZELL','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'SPITAL GRABS','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'SPITAL HERISAU','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'SPITAL INTERLAKEN','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'SPITAL LINTH - UZNACH','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'SPITAL NEUENBURG POURTALES','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'SPITAL NYON','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'SPITAL OBERENGADIN','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'SPITAL SITTEN','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'SPITAL THUN','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'SPITAL VISP','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'SPITAL WALENSTADT','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'SPITAL WATTWIL','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'SPITAL ZWEISIMMEN','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'UNIVERSITAETSSPITAL BASEL','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'UNIVERSITAETSSPITAL ZUERICH','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'UNIVERSITäTSSPITAL GENF','corr_type' => 'HELI_HOSPITAL'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'UNIVERSITäTSSPITAL ZENTRUM KT WAADT LAUS','corr_type' => 'HELI_HOSPITAL'),

	// mountain landing sites
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'AESCHHORN','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'ALPE FOPPA','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'ALPHUBEL','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'AROLLA','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'AROSA','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'CLARIDEN-HüFIFIRN','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'COL DE MOSSES','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'FUORCLA GRISCHA','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'GLäRNISCHFIRN','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'GRIMENTZ','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'MADRISAHORN','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'MONTE ROSA','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'PETERSGRAT','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'STALDENHORN','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'SUSTENLIMMI','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'AF_CIVIL','aip_name' => 'VADRET PERS','corr_type' => 'AF_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'VORABGLETSCHER','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'VORDERE WALIG','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'ALP TRIDA','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'AF_CIVIL','aip_name' => 'BEC DE NANDAZ','corr_type' => 'AF_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'BLüEMLISALP','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'CRAP SOGN GION','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'CROIX DE COEUR','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'EBENEFLUH','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'FUORCLA CHAMUOTSCH','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'GLACIER DE TSANFLEURON','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'GLACIER DU BRENAY','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'GLACIER DU TRIENT','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'GSTELLIHORN','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'JUNGFRAUJOCH','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'AF_CIVIL','aip_name' => 'KANDERFIRN','corr_type' => 'AF_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'LANGGLETSCHER','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'LIMMERNFIRN','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'PETIT COMBIN','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'ROSA BLANCHE','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'SUSTEN STEINGLETSCHER','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'THEODULGLETSCHER','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'UNTERROTHHORN','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'VADRET DAL CORVATSCH','corr_type' => 'HELI_MOUNTAIN'),
	array('type' => 'CORR','aip_country' => 'CH','aip_type' => 'HELI_CIVIL','aip_name' => 'WILDHORN','corr_type' => 'HELI_MOUNTAIN'),
);


$conn = new mysqli($db_host, $db_user, $db_pw, $db_name) or die ('Unable to connect');
$conn->set_charset("utf8");

// clear table
$query = "TRUNCATE TABLE openaip_runways";
$result = $conn->query($query);

$query = "TRUNCATE TABLE openaip_radios";
$result = $conn->query($query);

$query = "TRUNCATE TABLE openaip_airports";
$result = $conn->query($query);

if (!$result)
{
	print "ERROR: " . $conn->error;
	exit;
}


// importing airport data
$airport_dir = realpath("./openaip_airports/");
$dir_entries = scandir($airport_dir);

// iterate trough files
foreach ($dir_entries as $filename)
{
	$abs_filename = $airport_dir . "/" . $filename;

	// skip directories
	if (is_dir($abs_filename))
		continue;

	$airport_file = simplexml_load_file($abs_filename);

	foreach ($airport_file->WAYPOINTS->AIRPORT as $airport)
	{
		$country = $airport->COUNTRY;
		$type = $airport['TYPE'];
		$icao = $airport->ICAO;
		$name = $airport->NAME;
		$lat = $airport->GEOLOCATION->LAT;
		$lon = $airport->GEOLOCATION->LON;
		$elev = $airport->GEOLOCATION->ELEV;

		// apply correction entries
		foreach ($corrLines as $corrLine)
		{
			if ($corrLine["type"] !== 'CORR')
				continue;

			if ($country == $corrLine["aip_country"] && $type == $corrLine["aip_type"] && $name == $corrLine["aip_name"])
			{
				if (isset($corrLine["corr_type"]))
					$type = $corrLine["corr_type"];
			}
		}


		$query = "INSERT INTO openaip_airports (type, country, name, icao, latitude, longitude, elevation, lonlat) VALUES (";
		$query .= " '" . mysqli_real_escape_string($conn, $type) . "',";
		$query .= " '" . mysqli_real_escape_string($conn, $country) . "',";
		$query .= " '" . mysqli_real_escape_string($conn, $name) . "',";
		$query .= " '" . mysqli_real_escape_string($conn, $icao) . "',";
		$query .= " '" . mysqli_real_escape_string($conn, $lat) . "',";
		$query .= " '" . mysqli_real_escape_string($conn, $lon) . "',";
		$query .= " '" . mysqli_real_escape_string($conn, $elev) . "',";
		$query .= " GeomFromText('POINT(" . mysqli_real_escape_string($conn, $lon) . " " . mysqli_real_escape_string($conn, $lat) . ")')";
		$query .= ")";

		$result = $conn->query($query);

		if (!$result)
		{
			print "ERROR AP: " . $conn->error . "<br>\n";
			print "File: " . $abs_filename . "<br>\n";
			var_dump($airport);
			print "<br><br>\n\n";
			continue;
		}

		$airport_id = $conn->insert_id;

		// add runways
		foreach ($airport->RWY as $runway)
		{
			$tora1 = ($runway->DIRECTION[0]->RUNS && $runway->DIRECTION[0]->RUNS->TORA) ? $runway->DIRECTION[0]->RUNS->TORA : "NULL";
			$tora2 = ($runway->DIRECTION[1]->RUNS && $runway->DIRECTION[1]->RUNS->TORA) ? $runway->DIRECTION[1]->RUNS->TORA : "NULL";
			$lda1 = ($runway->DIRECTION[0]->RUNS && $runway->DIRECTION[0]->RUNS->LDA) ? $runway->DIRECTION[0]->RUNS->LDA : "NULL";
			$lda2 = ($runway->DIRECTION[1]->RUNS && $runway->DIRECTION[1]->RUNS->LDA) ? $runway->DIRECTION[1]->RUNS->LDA : "NULL";
			$papi1 = ($runway->DIRECTION[0]->LANDINGAIDS && $runway->DIRECTION[0]->LANDINGAIDS->PAPI && $runway->DIRECTION[0]->LANDINGAIDS->PAPI == 'TRUE') ? '1' : "NULL";
			$papi2 = ($runway->DIRECTION[1]->LANDINGAIDS && $runway->DIRECTION[1]->LANDINGAIDS->PAPI && $runway->DIRECTION[1]->LANDINGAIDS->PAPI == 'TRUE') ? '1' : "NULL";

			$query = "INSERT INTO openaip_runways (airport_id, operations, name, surface, length, width, direction1, direction2, tora1, tora2, lda1, lda2, papi1, papi2) VALUES (";
			$query .= " '" . $airport_id . "',";
			$query .= " '" . $runway['OPERATIONS'] . "',";
			$query .= " '" . mysqli_real_escape_string($conn, $runway->NAME) . "',";
			$query .= " '" . $runway->SFC . "',";
			$query .= " '" . $runway->LENGTH . "',";
			$query .= " '" . $runway->WIDTH . "',";
			$query .= " '" . $runway->DIRECTION[0]['TC'] . "',";
			$query .= " '" . $runway->DIRECTION[1]['TC'] . "',";
			$query .= " " . $tora1 . ",";
			$query .= " " . $tora2 . ",";
			$query .= " " . $lda1 . ",";
			$query .= " " . $lda2 . ",";
			$query .= " " . $papi1 . ",";
			$query .= " " . $papi2 . "";
			$query .= ")";

			$result = $conn->query($query);

			if (!$result)
			{
				print "ERROR RWY: " . $conn->error;
				exit;
			}
		}

		// add radios
		foreach ($airport->RADIO as $radio)
		{
			$query = "INSERT INTO openaip_radios (airport_id, category, frequency, type, typespec, description) VALUES (";
			$query .= " '" . $airport_id . "',";
			$query .= " '" . $radio['CATEGORY'] . "',";
			$query .= " '" . $radio->FREQUENCY . "',";
			$query .= " '" . $radio->TYPE . "',";
			$query .= " '" . $radio->TYPESPEC . "',";
			$query .= " '" . mysqli_real_escape_string($conn, $radio->DESCRIPTION) . "'";
			$query .= ")";

			$result = $conn->query($query);

			if (!$result)
			{
				print "ERROR RADIO: " . $conn->error;
				exit;
			}
		}
	}
}

print "done.";
