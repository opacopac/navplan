<?php
    // content type
    header('Content-Type: text/cache-manifest');

    // manifest header
    echo "CACHE MANIFEST\n";
    echo "\n";


	if(isset($_COOKIE["cachewaypoints"]))
	{
		addStaticUrls();
		addTileUrls(json_decode($_COOKIE["cachewaypoints"]), true);
		addChartUrls(json_decode($_COOKIE["cachecharts"]), true);
	}
	else // don't cache anything
	{
        echo "# " . time() . "\n"; // change manifest constantly
    	echo "\n";
		echo "NETWORK:\n";
		echo "*\n";
		echo "\n";
	}


	function addStaticUrls()
	{
		// default entries
		echo "# default files\n";
		echo "CACHE:\n";

		// html
		echo "index.php\n";
		echo "about/about.html\n";
		echo "map/map.html\n";
		echo "settings/settings.html\n";
		echo "waypoints/waypoints.html\n";
		echo "tracks/tracks.html\n";

		// php TODO: post => get
		echo "php/airports.php\n";
		echo "php/airspace.php\n";
		echo "php/navaids.php\n";
		echo "php/webcams.php\n";
		
		// css
		echo "css/navplan.css\n";
		echo "css/bootstrap.min.css\n";
		echo "css/ol.css\n";
		echo "css/arial-narrow.css\n";

		// fonts
        echo "fonts/arial-narrow_d0eb64ed2b91fe9a67f7800c1b14868b.ttf\n";
        echo "fonts/arial-narrow_d0eb64ed2b91fe9a67f7800c1b14868b.woff\n";
		echo "fonts/glyphicons-halflings-regular.woff2\n";
		echo "fonts/glyphicons-halflings-regular.woff\n";
		echo "fonts/glyphicons-halflings-regular.ttf\n";
		echo "fonts/glyphicons-halflings-regular.eot\n";
		echo "fonts/glyphicons-halflings-regular.svg\n";

		// images
		echo "icon/ad_civ.png\n";
		echo "icon/ad_civ_nofac.png\n";
		echo "icon/ad_civmil.png\n";
		echo "icon/ad_mil.png\n";
		echo "icon/navaid_dme.png\n";
		echo "icon/navaid_ndb.png\n";
		echo "icon/navaid_vor-dme.png\n";
		echo "icon/own_plane.png\n";
		echo "icon/rwy_concrete.png\n";
		echo "icon/rwy_grass.png\n";
		echo "icon/rwy_mil.png\n";
		echo "icon/traffic_balloon.png\n";
		echo "icon/traffic_glider.png\n";
		echo "icon/traffic_heli.png\n";
		echo "icon/traffic_parachute.png\n";
		echo "icon/traffic_plane.png\n";
		echo "icon/webcam.png\n";
		echo "icon/wp_report.png\n";
		echo "icon/wp_user.png\n";

		// js
	    echo "js/jquery-1.12.3.min.js\n";
        echo "js/jquery-ui.min.js\n";
        echo "js/jquery.ui.touch-punch.min.js\n";
        echo "js/angular.min.js\n";
        echo "js/angular-route.min.js\n";
        echo "js/angular-resource.min.js\n";
        echo "js/bootstrap.min.js\n";
        echo "js/ui-bootstrap-tpls-1.3.2.min.js\n";
        echo "js/ol.js\n";
        echo "js/turf.min.js\n";
		echo "navplanHelper.js\n";
		echo "navplanApp.js\n";
		echo "navplanCtrl.js\n";
		echo "map/mapCtrl.js\n";
		echo "login/loginCtrl.js\n";
		echo "forgotpw/forgotpwCtrl.js\n";
		echo "edituser/edituserCtrl.js\n";
		echo "waypoints/waypointCtrl.js\n";
		echo "tracks/trackCtrl.js\n";
		echo "settings/settingsCtrl.js\n";
		echo "services/mapService.js\n";
		echo "services/locationService.js\n";
		echo "services/trafficService.js\n";
		echo "services/geonameService.js\n";
		echo "services/waypointService.js\n";
		echo "services/fuelService.js\n";
		echo "services/userService.js\n";
		echo "\n";

		
		echo "NETWORK:\n";
		echo "*\n";
		echo "\n";

		
		echo "FALLBACK:\n";
		echo "edituser/edituser.html offline.html\n";
		echo "forgotpw/forgotpw.html offline.html\n";
		echo "login/login.html offline.html\n";
		echo "\n";
	}


	function addChartUrls($charturls)
	{
	    if (!$charturls)
	        return;

		echo "# charts\n";
	    echo "CACHE:\n";

	    foreach ($charturls as $url)
	        echo $url . "\n";

	    echo "\n";
    }

	
	function addTileUrls($waypoints)
	{
		$tileUrls = [];
		
		foreach ($waypoints as $waypoint)
		{
			$lat = floatval($waypoint->lat);
			$lon = floatval($waypoint->lon);
			$dir = intval($waypoint->tt);
			$dist = intval($waypoint->dist);
			$rad = floatval($waypoint->rad);
			$maxZoom = intval($waypoint->maxzoom);

			for ($zoom = 0; $zoom <= $maxZoom; $zoom++)
			{
				$stepdist = getStepDistNm($lat, $zoom);
				
				for ($i = -$rad; $i <= $dist + $rad; $i += $stepdist)
				{
					$latLon = moveBearDist($lat, $lon, $dir, $i);
						
					for ($j = -$rad; $j <= $rad; $j += $stepdist)
					{
						$latLon2 = moveBearDist($latLon[0], $latLon[1], ($dir + 90) % 360, $j);
						$url = getTileUrl($latLon2[0], $latLon2[1], $zoom);
						
						if (!in_array($url, $tileUrls))
							$tileUrls[] = $url;
					}
				}
			}
		}

        $urlcount = 0;

		echo "# map tiles\n";
		echo "CACHE:\n";

		foreach ($tileUrls as $tileUrl)
		{
			echo $tileUrl . "\n";
		    $urlcount ++;

		    if ($urlcount > 1000) // circuit breaker
		        exit;
		}

		echo "\n";
	}

	
	function getStepDistNm($lat, $zoom)
	{
		return 156543.03 * cos(deg2rad($lat)) / pow(2, $zoom) * 256 / 1852.0 / 3; // 1/3 of a tile side length
	}

	
	function getTileUrl($lat, $lon, $zoom)
	{
	    $localBaseUrl = "maptiles/";
		$otmBaseUrl = array(
			"//a.tile.opentopomap.org/",
			"//b.tile.opentopomap.org/",
			"//c.tile.opentopomap.org/"
		);

		$ytile = floor((($lon + 180) / 360) * pow(2, $zoom));
		$xtile = floor((1 - log(tan(deg2rad($lat)) + 1 / cos(deg2rad($lat))) / pi()) /2 * pow(2, $zoom));

		if (isLocalTile($zoom, $ytile, $xtile))
		{
            return $localBaseUrl . $zoom . "/" . $ytile . "/" . $xtile . ".png";
		}
		else
		{
            $n = ($zoom + $xtile + $ytile) % 3;
            return $otmBaseUrl[$n] . $zoom . "/" . $ytile . "/" . $xtile . ".png";
        }
	}


	function isLocalTile($z, $y, $x)
	{
	    $zrange = [6, 13];

        if ($z < $zrange[0] || $z > $zrange[1])
            return false;

        $zoomfact = pow(2, ($z - 6));
        $yrange = [33 * $zoomfact, 33 * $zoomfact + $zoomfact - 1 ];
        $xrange = [22 * $zoomfact, 22 * $zoomfact + $zoomfact - 1 ];

        if ($y < $yrange[0] || $y > $yrange[1])
            return false;

        if ($x < $xrange[0] || $x > $xrange[1])
            return false;

        return true;
	}
	
	
	function moveBearDist($lat, $lon, $brngDeg, $distNm)
	{
		$lat1 = deg2rad($lat);
		$lon1 = deg2rad($lon);
		$angDist = ($distNm * 1.852) / 6378.1;
	
		$lat2 = asin(sin($lat1) * cos($angDist) + cos($lat1) * sin($angDist) * cos(deg2rad($brngDeg)));
		$lon2 = $lon1 + atan2(sin(deg2rad($brngDeg)) * sin($angDist) * cos($lat1), cos($angDist) - sin($lat1) * sin($lat2));
		
		return array(rad2deg($lat2), rad2deg($lon2));
	}
?>