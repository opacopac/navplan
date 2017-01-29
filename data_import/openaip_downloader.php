<?php
    $airportBaseUrl = "http://www.openaip.net/downloads/airports?field_apt_exp_country_value_many_to_one=";
	$airportMinIndex = 1;
	$airportMaxIndex = 2;
	$airportFileRegexp = '/href="(http:\/\/www\.openaip\.net\/.+?\.aip_\d+?)"';

    ini_set('user_agent','Mozilla/4.0 (compatible; MSIE 6.0)');

    for ($i = $airportMinIndex; $i <= $airportMaxIndex; $i++)
    {
        $url = $airportBaseUrl . $i;
        $html = file_get_contents($url);

        $numResults = preg_match_all($airportFileRegexp, $html, $matches);

        if (!$numResults || $numResults == 0)
            continue;

        $fileUrl = $matches[1];

        print $fileUrl . "\n";
    }
?>