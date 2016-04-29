<?php
	include "helper.php";


	if ($_GET["allWeather"])
	    getAllWeather();
	else
    	die("ERROR: unknown action!");


	function getAllWeather()
	{
    	$ap_icaos = [ 'LSZH', 'LSGG', 'LFSB', 'LSZB', 'LSZA', 'LSZG', 'LSZR', 'LSGS', 'LSGC', 'LSZC', 'LSZL', 'LSZS', 'LSMA', 'LSMD', 'LSME', 'LSMM', 'LSMP', 'LSMS' ];
    	//$ap_icaos = [ 'LSZB', 'LSZG' ];
    	$metarUrl = 'https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&requestType=retrieve&format=xml&stationString=' . implode(',', $ap_icaos) . '&hoursBeforeNow=2';
    	$tafUrl = 'https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=tafs&requestType=retrieve&format=xml&stationString=' . implode(',', $ap_icaos) . '&hoursBeforeNow=4';

	    // get metars
	    $metarXml = simplexml_load_string(file_get_contents($metarUrl)) or die("ERROR reading METAR");

        $metarlist = [];
	    foreach($metarXml->data->children() as $metar)
	    {
	        // skip older metars
	        $existingMetar = $metarlist[(string) $metar->station_id];

	        if ($existingMetar && $existingMetar->observation_time < (string) $metar->observation_time)
	            continue;


            // sky condition list
	        $sky_condition = [];

	        foreach($metar->sky_condition as $condition)
	        {
	            $sky_condition[] = array(
	                sky_cover => (string) $condition->attributes()->sky_cover,
	                cloud_base_ft_agl => $condition->attributes()->cloud_base_ft_agl ? (string) $condition->attributes()->cloud_base_ft_agl : NULL
	            );
	        }

	        $metarlist[(string) $metar->station_id] = array(
                raw_text => (string) $metar->raw_text,
                observation_time => (string) $metar->observation_time,
                temp_c => (string) $metar->temp_c,
                dewpoint_c => (string) $metar->dewpoint_c,
                visibility_m => (string) $metar->visibility_statute_mi > 0? ($metar->visibility_statute_mi * 1666.5) : NULL, // 1.60934
                wind_dir_degrees => (string) $metar->wind_dir_degrees,
                wind_speed_kt => (string) $metar->wind_speed_kt,
                sky_condition => $sky_condition
	        );
	    }


		// get tafs
   		$tarXml = simplexml_load_string(file_get_contents($tafUrl)) or die("ERROR reading TAF");

   		$taflist = [];
  	    foreach($tarXml->data[0]->children() as $taf)
  	    {
	        // skip older tafs
	        $existingTaf = $taflist[(string) $taf->station_id];

	        if ($existingTaf && $existingTaf->issue_time < (string) $taf->issue_time)
	            continue;

  	        $taflist[(string) $taf->station_id] = array(
  	            raw_text => (string) $taf->raw_text,
                issue_time => (string) $taf->issue_time
  	        );
        }


        echo json_encode(array("metarlist" => $metarlist, "taflist" => $taflist), JSON_NUMERIC_CHECK);
	}
?>