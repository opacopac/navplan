<?php
	include "helper.php";

    getAllWeather();


	function getAllWeather()
	{
    	$ap_icaos = [ 'LSZH', 'LSGG', 'LFSB', 'LSZB', 'LSZA', 'LSZG', 'LSZR', 'LSGS', 'LSGC', 'LSZC', 'LSZL', 'LSZS', 'LSMA', 'LSMD', 'LSME', 'LSMM', 'LSMP', 'LSMS' ];
    	//$ap_icaos = [ 'LSZB', 'LSZG' ];
    	$metarUrl = 'https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&requestType=retrieve&format=xml&stationString=' . implode(',', $ap_icaos) . '&hoursBeforeNow=2';
    	$tafUrl = 'https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=tafs&requestType=retrieve&format=xml&stationString=' . implode(',', $ap_icaos) . '&hoursBeforeNow=4';

	    // get metars
	    $metarXml = simplexml_load_string(file_get_contents($metarUrl)) or die("ERROR reading METAR");

        $weatherinfolist = [];
	    foreach($metarXml->data->children() as $metar)
	    {
	        // skip older metars
	        $existingMetar = $weatherinfolist[(string) $metar->station_id]["metar"];

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

	        $weatherinfolist[(string) $metar->station_id]["metar"] = array(
                raw_text => (string) $metar->raw_text,
                observation_time => (string) $metar->observation_time,
                temp_c => (string) $metar->temp_c,
                dewpoint_c => (string) $metar->dewpoint_c,
                visibility_m => (string) $metar->visibility_statute_mi > 0? ($metar->visibility_statute_mi * 1666.5) : NULL, // 1.60934
                wind_dir_degrees => (string) $metar->wind_dir_degrees,
                wind_speed_kt => (string) $metar->wind_speed_kt,
                wx_string => (string) $metar->wx_string,
                sky_condition => $sky_condition
	        );
	    }


		// get tafs
   		$tarXml = simplexml_load_string(file_get_contents($tafUrl)) or die("ERROR reading TAF");

   		$taflist = [];
  	    foreach($tarXml->data->children() as $taf)
  	    {
	        // skip older tafs
	        $existingTaf = $weatherinfolist[(string) $taf->station_id]["taf"];

	        if ($existingTaf && $existingTaf->issue_time < (string) $taf->issue_time)
	            continue;

  	        $weatherinfolist[(string) $taf->station_id]["taf"] = array(
  	            raw_text => (string) $taf->raw_text,
                issue_time => (string) $taf->issue_time
  	        );
        }


        echo json_encode(array("weatherinfolist" => $weatherinfolist), JSON_NUMERIC_CHECK);
	}
?>