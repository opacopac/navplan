<?php
	// content type
	header('Content-Type: text/cache-manifest');
	/*header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
	header("Cache-Control: post-check=0, pre-check=0", false);
	header("Pragma: no-cache");*/


	// manifest header
	echo "CACHE MANIFEST\n";
	echo "# v7\n";
	echo "\n";
	
	
	// map tiles
	if(isset($_COOKIE["cachewaypoints"]))
	{
		addStaticUrls();
		addTileUrls(json_decode($_COOKIE["cachewaypoints"]), true);
		addChartUrls(json_decode($_COOKIE["cachecharts"]), true);
	}
	else // don't cache anything
	{
		echo "NETWORK:\n";
		echo "*\n";
		echo "./\n";
	}

	function addStaticUrls()
	{
		// default entries
		echo "# default files\n";
		echo "CACHE:\n";

		// html
		echo "index.html\n";
		echo "about/about.html\n";
		echo "map/map.html\n";
		echo "settings/settings.html\n";
		echo "waypoints/waypoints.html\n";
			
		// php TODO: post => get
		echo "php/airports.php\n";
		echo "php/airspace.php\n";
		echo "php/navaids.php\n";
		echo "php/webcams.php\n";
		
		// css & fonts
		echo "css/navplan.css\n";
		echo "//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css\n";
		echo "//openlayers.org/en/v3.9.0/css/ol.css\n";
		//echo "//allfont.net/allfont.css?fonts=arial-narrow\n";
		echo "//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/fonts/glyphicons-halflings-regular.woff2\n";
		echo "//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/fonts/glyphicons-halflings-regular.woff\n";
		echo "//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/fonts/glyphicons-halflings-regular.ttf\n";
		
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
		echo "//ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js\n";
		echo "//ajax.googleapis.com/ajax/libs/jqueryui/1.11.2/jquery-ui.min.js\n";
		echo "js/jquery.ui.touch-punch.min.js\n";
		echo "//ajax.googleapis.com/ajax/libs/angularjs/1.4.2/angular.min.js\n";
		echo "//ajax.googleapis.com/ajax/libs/angularjs/1.4.2/angular-route.min.js\n";
		echo "//ajax.googleapis.com/ajax/libs/angularjs/1.4.2/angular-resource.min.js\n";
		echo "//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js\n";
		echo "//cdnjs.cloudflare.com/ajax/libs/angular-ui-bootstrap/0.13.0/ui-bootstrap-tpls.min.js\n";
		echo "//openlayers.org/en/v3.14.1/build/ol.js\n";
		echo "navplanHelper.js\n";
		echo "navplanApp.js\n";
		echo "navplanCtrl.js\n";
		echo "map/mapCtrl.js\n";
		echo "login/loginCtrl.js\n";
		echo "forgotpw/forgotpwCtrl.js\n";
		echo "edituser/edituserCtrl.js\n";
		echo "waypoints/waypointCtrl.js\n";
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

	    echo "CACHE:\n";

	    foreach ($charturls as $url)
	        echo $url . "\n";

	    echo "\n";
    }

	
	function addTileUrls($waypoints)
	{
		$urlPrefix = array(
			"//a.tile.opentopomap.org/",
			"//b.tile.opentopomap.org/",
			"//c.tile.opentopomap.org/"
		);
		$urlSuffixList = [];
		
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
						$url = getTileUrlSuffix($latLon2[0], $latLon2[1], $zoom);
						
						if (!in_array($url, $urlSuffixList))
							$urlSuffixList[] = $url;
					}
				}
			}
		}

		// create urls
		$counter = 0;
		$tileUrls = [];
		foreach ($urlSuffixList as $urlSuffix)
		{
			$counter = ($counter + 1) % 3;
			$c2 = ($counter + 1) % 3;
			$c3 = ($counter + 2) % 3;
			
			//$tileUrls[] = $urlPrefix[$counter] . $urlSuffix;
			$tileUrls[] = $urlPrefix[1] . $urlSuffix;
		}
		
		
		echo "# map tiles\n";
		echo "CACHE:\n";

		foreach ($tileUrls as $tileUrl)
			echo $tileUrl . "\n";

	}

	
	function getStepDistNm($lat, $zoom)
	{
		return 156543.03 * cos(deg2rad($lat)) / pow(2, $zoom) * 256 / 1852.0 / 2;
	}

	
	function getTileUrlSuffix($lat, $lon, $zoom)
	{
		$xtile = floor((($lon + 180) / 360) * pow(2, $zoom));
		$ytile = floor((1 - log(tan(deg2rad($lat)) + 1 / cos(deg2rad($lat))) / pi()) /2 * pow(2, $zoom));
		
		return $zoom . "/" . $xtile . "/" . $ytile . ".png";
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