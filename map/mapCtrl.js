/**
 * Map Controller
 */

navplanApp
	.controller('mapCtrl', [ '$scope', '$sce', '$route', 'mapService', 'mapFeatureService', 'locationService', 'trafficService', 'geopointService', 'userService', 'metarTafNotamService', 'terrainService', 'meteoService', 'globalData', mapCtrl ]);

navplanApp
    .directive('addToRouteDirective', addToRouteDirective);

function addToRouteDirective()
{
    return { templateUrl: 'map/add-to-route-directive.html' };
}


function mapCtrl($scope, $sce, $route, mapService, mapFeatureService, locationService, trafficService, geopointService, userService, metarTafNotamService, terrainService, meteoService, globalData)
{
    //region INIT VARS
	$scope.$route = $route;
	$scope.globalData = globalData;
	$scope.trafficTimerIntervallMs = 5000;
	$scope.trafficMinZoomlevel = 7;
	$scope.trafficMaxAgeSec = 120;
	$scope.selectedTraffic = {};
	$scope.followTrafficAddress = undefined;
	$scope.followTrafficLastPosition = undefined;
	$scope.featureContainer = document.getElementById('feature-popup');
	$scope.trafficContainer = document.getElementById('traffic-popup');
    $scope.notamContainer = document.getElementById('notam-popup');
	$scope.metarTafContainer = document.getElementById('metartaf-popup');
    $scope.weatherContainer = document.getElementById('weather-popup');

	//endregion


    //region SEARCH

    $scope.onSearchGeonamesByName = function(search)
	{
		return geopointService.searchGeonamesByValue(search);
	};


	// select geopoint from search
	$scope.onGeonameSelect = function ($item)
	{
		$scope.globalData.navplan.selectedWaypoint = {
			type: $item.type,
			freq: $item.frequency,
			callsign: $item.callsign,
			checkpoint: $item.wpname,
			latitude: $item.latitude,
			longitude: $item.longitude
		};

		mapService.setMapPosition($item.latitude, $item.longitude, 11, true);
		mapService.drawGeopointSelection([ $item ], [], undefined);
	};


	$scope.onGeonameSearch = function()
	{
	    // re-trigger typeahead by adding a space
        $("#searchWpInput").controller('ngModel').$setViewValue($scope.globalData.navplan.selectedWaypoint.checkpoint.trim() + ' ');
	};


	// ctrl+f => focus search box
    $scope.onKeyDown = function(e)
    {
        if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) // check for ctrl+f
        {
            e.preventDefault();
            document.getElementById("searchWpInput").focus();
        }
    };

	//endregion


    //region MAP

    $scope.onMapClicked = function(event, clickCoordinates, maxRadius)
	{
		$scope.globalData.clickHistory.push(clickCoordinates); // used internally only

        var minMaxTimes = metarTafNotamService.getDefaultNotamTimeslot();

		geopointService.searchGeonamesByPosition(clickCoordinates[1], clickCoordinates[0], maxRadius, minMaxTimes[0], minMaxTimes[1])
			.then(
			    function(response)
                {
                    if (response.data.geonames)
                    {
                        $scope.closeFeatureOverlay();
                        mapService.drawGeopointSelection(response.data.geonames, response.data.notams, event.pixel);
                    }
                    else
                        logResponseError("ERROR searching geonames", response);
			    },
			    function(response)
                {
                    logResponseError("ERROR searching geonames", response);

                    mapService.drawGeopointSelection([], [], event.pixel); // draw with empty set (client data only)
    			}
            );
	};


    $scope.onMapMoveEnd = function(event)
    {
        var view = event.map.getView();

        $scope.globalData.currentMapPos = {
            center: view.getCenter(),
            zoom: view.getZoom()
        };

        $scope.updateMeteo();
    };


    $scope.fitView = function()
    {
        if ($scope.globalData.fitViewLatLon)
        {
            mapService.fitViewLatLon($scope.globalData.fitViewLatLon);
            $scope.globalData.fitViewLatLon = undefined;
        }
    };


    //endregion


    //region WAYPOINTS


    $scope.redrawWaypoints = function()
    {
        // update waypoints
        mapService.drawWaypoints($scope.globalData.navplan.waypoints, $scope.globalData.navplan.alternate, $scope.globalData.settings.variation);

        // update terrain
        if ($scope.globalData.showTerrain)
        {
            if ($scope.globalData.navplan.waypoints && $scope.globalData.navplan.waypoints.length >= 2)
                terrainService.updateTerrain($scope.globalData.navplan.waypoints, $scope.onTerrainWaypointClicked);
            else
                $scope.globalData.showTerrain = false;
        }
    };


	$scope.onTrackModifyEnd = function(feature, latLon, idx, isInsert)
	{
		var newWp = $scope.getWpFromFeature(feature, latLon);

		if (newWp)
		{
			if (isInsert)
				$scope.globalData.navplan.waypoints.splice(idx, 0, newWp);
			else
				$scope.globalData.navplan.waypoints.splice(idx, 1, newWp);
		}

		$scope.updateWaypoints();
	};


	$scope.onMapActivityOccured = function()
    {
        $scope.updateLastActivity();
    };


	$scope.onAddSelectedWaypointClicked = function()
	{
		$scope.globalData.selectedWp.isNew = false;
		$scope.addWaypoint($scope.globalData.selectedWp);
		$scope.globalData.selectedWp = undefined;

        $scope.closeFeatureOverlay();
	};


    $scope.onAddSelectedWaypointClicked2 = function()
    {
        $scope.globalData.selectedWp.isNew = false;
        $scope.insertWaypoint($scope.globalData.selectedWp, parseInt($scope.addToRouteAfterWp));
        $scope.globalData.selectedWp = undefined;

        $scope.closeFeatureOverlay();
    };


    $scope.onSetAsAlternateClicked = function()
	{
		$scope.globalData.selectedWp.isNew = false;
		$scope.setAlternate($scope.globalData.selectedWp);
		$scope.globalData.selectedWp = undefined;

        $scope.closeFeatureOverlay();
	};


	$scope.onRemoveSelectedWaypointClicked = function()
	{
		if ($scope.globalData.selectedWp == $scope.globalData.navplan.alternate)
			$scope.globalData.navplan.alternate = undefined;
		else
			removeFromArray($scope.globalData.navplan.waypoints, $scope.globalData.selectedWp);
			
		$scope.globalData.selectedWp = undefined;
		$scope.updateWaypoints();
		$scope.discardCache();

        $scope.closeFeatureOverlay();
	};
	

	$scope.onEditSelectedWaypointClicked = function()
	{
		$scope.editSelectedWaypoint();
	};


	$scope.onEditUserWaypointClicked = function()
	{
		$scope.editUserWaypoint();
	};


	$scope.addWaypoint = function(newWp)
	{
		var wps = $scope.globalData.navplan.waypoints;
		var numWp = wps.length;
		
		// skip if same coordinates as last waypoint
		if (numWp > 1 && wps[numWp - 1].latitude == newWp.latitude && wps[numWp - 1].longitude == newWp.longitude)				
			return;
			
		$scope.globalData.navplan.waypoints.push(newWp);

		$scope.updateWaypoints();
		$scope.discardCache();
	};


    $scope.insertWaypoint = function(newWp, newWpIdx)
    {
        /*var wps = $scope.globalData.navplan.waypoints;
        var numWp = wps.length;

        // skip if same coordinates as last waypoint
        if (numWp > 1 && wps[numWp - 1].latitude == newWp.latitude && wps[numWp - 1].longitude == newWp.longitude)
            return;

        $scope.globalData.navplan.waypoints.push(newWp);*/

        if (newWpIdx < 0 || newWpIdx > $scope.globalData.navplan.waypoints.length)
            newWpIdx = $scope.globalData.navplan.waypoints.length; // default: append

        $scope.globalData.navplan.waypoints.splice(newWpIdx, 0, newWp);


        $scope.updateWaypoints();
        $scope.discardCache();
    };


    $scope.setAlternate = function(altWp)
	{
		$scope.globalData.navplan.alternate = altWp;
		
		$scope.updateWaypoints();
		$scope.discardCache();
	};

	//endregion


    //region TRACK

    $scope.redrawFlightTrack = function()
    {
        if ($scope.globalData.track && $scope.globalData.track.positions)
            mapService.drawFlightTrack($scope.globalData.track.positions);
    };

    //endregion


    //region FEATURES N OVERLAYS

    $scope.onFeatureSelected = function(event, feature)
    {
        if (feature.geopoint || feature.airport || feature.navaid || feature.reportingpoint || feature.userWaypoint)
        {
            $scope.globalData.selectedWp = $scope.getWpFromFeature(feature, mapService.getLatLonFromPixel(event.pixel[0], event.pixel[1]));
            $scope.globalData.selectedWp.isNew = true;
            $scope.addToRouteAfterWp = "" + ($scope.globalData.navplan.waypoints.length + 1); // TODO

            $scope.$apply();
            $scope.openFeatureOverlay($scope.globalData.selectedWp.latitude, $scope.globalData.selectedWp.longitude);
        }
        else if (feature.waypoint)
        {
            $scope.globalData.selectedWp = feature.waypoint;
            // try to add feature object from the cache on the fly
            mapFeatureService.addFeatureByTypeAndPos(feature.waypoint.type, feature.waypoint.latitude, feature.waypoint.longitude, $scope.globalData.selectedWp);
            //$scope.globalData.selectedWp.airport = feature.waypoint.airport; // if set, undefined otherwise

            $scope.$apply();

            $scope.openFeatureOverlay(feature.waypoint.latitude, feature.waypoint.longitude);
        }
        else if (feature.acInfo)
        {
            var csText = "Unknown";

            if (feature.acInfo.callsign)
            {
                csText = feature.acInfo.callsign;

                if (feature.acInfo.opCallsign)
                    csText += " (" + feature.acInfo.opCallsign + ")";
            }
            else if (feature.acInfo.opCallsign)
            {
                csText = feature.acInfo.opCallsign;
            }


            $scope.selectedTraffic = {
                position: mapService.getLatLonCoordinates(feature.getGeometry().getCoordinates()),
                registration: feature.acInfo.registration ? feature.acInfo.registration : "Unknown",
                callsign: csText,
                aircraftModelType: feature.acInfo.aircraftModelType ? feature.acInfo.aircraftModelType : "N/A",
                acaddress: feature.acInfo.acaddress,
                addresstype: feature.acInfo.addresstype,
                receiver: feature.acInfo.receiver
            };

            mapService.addOverlay(feature.getGeometry().getCoordinates(), $scope.trafficContainer, true);
            $scope.$apply();
        }
        else if (feature.webcam)
        {
            window.open(feature.webcam.url);
        }
        else if (feature.smaMeasurement)
        {
            //var baseUrl = "http://www.meteoswiss.admin.ch/home/measurement-and-forecasting-systems/land-based-stations/automatisches-messnetz.html?station=";
            var baseUrl = "http://www.meteoswiss.admin.ch/product/input/smn-stations/docs/";
            window.open(baseUrl + feature.smaMeasurement.station_id + ".pdf");
        }
        else if (feature.weatherInfo)
        {
            $scope.selectedMetarTaf = feature.weatherInfo;
            mapService.addOverlay(feature.getGeometry().getCoordinates(), $scope.metarTafContainer, true);
            $scope.$apply();
        }
        else if (feature.notam)
        {
            $scope.selectedNotam = {
                id: feature.notam.id,
                title: metarTafNotamService.getNotamTitle(feature.notam),
                notams: [ feature.notam ],
                airport_icao: undefined
            };
            mapService.addOverlay(mapService.getMercatorFromPixel(event.pixel[0], event.pixel[1]), $scope.notamContainer, true);
            $scope.$apply();
        }
        else if (feature.notamList)
        {
            $scope.selectedNotam = {
                id: undefined,
                title: undefined,
                notams: feature.notamList,
                airport_icao: undefined
            };
            mapService.addOverlay(mapService.getMercatorFromPixel(event.pixel[0], event.pixel[1]), $scope.notamContainer, true);
            $scope.$apply();
        }
    };


    $scope.onDisplayChartClicked = function(chartId)
	{
		mapService.displayChart(chartId);
		$scope.closeFeatureOverlay();
	};


    $scope.onShowAirportNotams = function()
    {
        $scope.selectedNotam = {
            id: undefined,
            title: undefined,
            airport_icao: $scope.globalData.selectedWp.airport.icao,
            notams: globalData.selectedWp.airport.notams
        };

        var coords = mapService.getMercatorCoordinates($scope.globalData.selectedWp.airport.latitude, $scope.globalData.selectedWp.airport.longitude);
        mapService.addOverlay(coords, $scope.notamContainer, true);
    };


    $scope.getFormatedNotamHtml = function(notam)
    {
        var subTitle = "<b>" + metarTafNotamService.getNotamTitle(notam) + "</b> ";

        var fromTill = metarTafNotamService.getNotamValidityLt(notam);
        var validText = "<i>(" + fromTill[0] + " - " + fromTill[1] + ")</i><br />";

        var notamText = notam.all.replace(/\n/g, "<br />");

        return $sce.trustAsHtml(subTitle + validText + notamText);
    };


	$scope.onShowMetarTaf = function()
	{
		$scope.selectedMetarTaf = $scope.globalData.selectedWp.airport.weatherInfo;
		$scope.selectedMetarTaf.airport_icao = $scope.globalData.selectedWp.airport.icao;
		var coords = mapService.getMercatorCoordinates($scope.globalData.selectedWp.airport.latitude, $scope.globalData.selectedWp.airport.longitude);
		mapService.addOverlay(coords, $scope.metarTafContainer, true);
	};


	$scope.onShowWeather = function(latitude, longitude, locationName)
    {
        if (locationName)
            $scope.selectedLocationName = locationName;
        else
            $scope.selectedLocationName = undefined;

        var coords = mapService.getMercatorCoordinates(latitude, longitude);
        mapService.addOverlay(coords, $scope.weatherContainer, true);

        var span = document.getElementById("windytviframe");
        while (span.firstChild)
            span.removeChild(span.firstChild);

        //<iframe width="800" height="220" src="https://embed.windytv.com/embed2.html?lat=46.9458&lon=7.4713&type=forecast&metricWind=kt&metricTemp=%C2%B0C" frameborder="0"></iframe>
        var iframe = document.createElement('iframe');
        //iframe.src = "https://embed.windytv.com/embed2.html?lat=" + latitude + "&lon=" + longitude + "&type=forecast&display=meteogram&metricWind=kt&metricTemp=%C2%B0C";
        iframe.src = "https://embed.windy.com/embed2.html?lat=" + latitude + "&lon=" + longitude + "&type=forecast&display=meteogram&metricWind=kt&metricTemp=%C2%B0C";
        iframe.width = $scope.weatherContainer.clientWidth - 2 * 16;
        iframe.height = 280;
        iframe.frameborder = 0;

        span.appendChild(iframe);
    };


    $scope.openFeatureOverlay = function(latitude, longitude)
	{
		var coordinates = mapService.getMercatorCoordinates(latitude, longitude);
		mapService.addOverlay(coordinates, $scope.featureContainer, true);

		$('#ad_details').hide();
		$('#ad_charts').hide();
	};


	$scope.closeFeatureOverlay = function()
    {
        $('#ad_details').hide();
        $('#ad_charts').hide();
        mapService.closeOverlay();
    };


	$scope.onCloseOverlayClicked =  function(event)
	{
        $scope.closeFeatureOverlay();
	};


    $scope.onToggleElementClicked = function(element)
    {
        $(element).toggle();
    };


    //endregion


    //region LOCATION

	$scope.onLocationClicked = function()
	{
		$scope.globalData.showLocation = !$scope.globalData.showLocation;

		$scope.stopFollowTraffic();

		if ($scope.globalData.showLocation)
		{
			$scope.startLocationService();
		}
		else
		{
			$scope.stopLocationService();
			$scope.storeTrackLocal();
		}
	};


	$scope.startLocationService = function ()
	{
		$scope.globalData.locationStatus = "waiting";
		locationService.startWatching($scope.onLocationChanged, $scope.onLocationError);
		$scope.startClockTimer();
	};


	$scope.stopLocationService = function ()
	{
		$scope.stopClockTimer();
		locationService.stopWatching();
		mapService.drawOwnPlane(undefined);
		$scope.globalData.locationStatus = "off";
	};


    $scope.onLocationChanged = function(currentPosition)
    {
        var lastPositions = locationService.getLastPositions();

        mapService.drawOwnPlane(lastPositions);

        if ($scope.globalData.showLocation)
        {
            var lastIdx = lastPositions.length - 1;

            if (lastIdx >= 1)
            {
                var latDiff = lastPositions[lastIdx].latitude - lastPositions[lastIdx - 1].latitude;
                var lonDiff = lastPositions[lastIdx].longitude - lastPositions[lastIdx - 1].longitude;
                var pos = mapService.getMapPosition();

                mapService.setMapPosition(pos.center[1] + latDiff, pos.center[0] + lonDiff, pos.zoom);
            }
            else
                mapService.setMapPosition(currentPosition.coords.latitude, currentPosition.coords.longitude);
        }

        $scope.globalData.locationStatus = "current";
        $scope.$apply();
    };


    $scope.onLocationError = function(error)
    {
        // TODO
        $scope.showErrorMessage(error.message);
        $scope.globalData.locationStatus = "error";
        $scope.$apply();
    };

	//endregion


    //region STOPWATCH

	$scope.startClockTimer = function()
	{
		var d = new Date();
		d.setMilliseconds(0);
		$scope.globalData.clockTimer = window.setInterval($scope.onClockTimer, 1000);
		$scope.globalData.timer = {
			currentTime: d,
			currentTimeString: getHourMinSecString(d)
		};
	};


	$scope.stopClockTimer = function()
	{
		window.clearInterval($scope.globalData.clockTimer);
		$scope.globalData.timer = undefined;
	};


	$scope.onTimerClicked = function()
	{
		$scope.globalData.timer.stopTime = $scope.globalData.timer.currentTime;
		$scope.globalData.timer.stopTimeString = getHourMinSecString($scope.globalData.timer.stopTime);
		$scope.globalData.timer.elapsedTimeString = "+00:00";
	};

	//endregion


    //region TRAFFIC

    $scope.onTrafficClicked = function()
	{
		$scope.globalData.showTraffic = !$scope.globalData.showTraffic;

		$scope.stopFollowTraffic();

		if ($scope.globalData.showTraffic)
		{
			$scope.globalData.trafficStatus = "waiting";

			if (!$scope.globalData.trafficTimer)
				$scope.globalData.trafficTimer = window.setInterval($scope.onTrafficTimer, $scope.trafficTimerIntervallMs);

			$scope.updateTraffic();
		}
		else
		{
            $scope.stopTrafficUpdates();
		}
	};


	$scope.onTrafficTimer = function()
	{
	    if (!$scope.globalData.showLocation && Date.now() > $scope.globalData.lastActivity + 10 * 60 * 1000)
        {
            $scope.stopTrafficUpdates();
            $scope.showErrorMessage("Traffic updates automatically turned off after 10 minutes of inactivity");
            $scope.$apply();
        }
        else if ($scope.$route.current.controller == "mapCtrl")
        {
            $scope.updateTraffic();
        }
	};


	$scope.stopTrafficUpdates = function()
    {
        window.clearInterval($scope.globalData.trafficTimer);
        $scope.globalData.showTraffic = false;
        $scope.globalData.trafficTimer = undefined;
        $scope.stopFollowTraffic();
        mapService.drawTraffic(undefined);
        $scope.globalData.trafficStatus = "off";
    };


	$scope.updateTraffic = function()
	{
		if (!$scope.globalData.showTraffic)
			return;

		var pos = mapService.getMapPosition();
		if (pos.zoom < $scope.trafficMinZoomlevel)
		{
            $scope.globalData.trafficStatus = "waiting";
            $scope.$apply();
            return;
        }

		var extent = mapService.getViewExtentLatLon();

		trafficService.requestTraffic(extent, $scope.trafficMaxAgeSec, $scope.globalData.settings.maxTrafficAltitudeFt + 1000, $scope.globalData.sessionId, successCallback, errorCallback);

		if ($scope.globalData.trafficStatus != "current")
            $scope.globalData.trafficStatus = "waiting";

		function successCallback(acList)
        {
            if (!$scope.globalData.showTraffic)
                return;

            $scope.globalData.trafficStatus = "current";
            mapService.drawTraffic(acList, $scope.globalData.settings.maxTrafficAltitudeFt);

            if ($scope.followTrafficAddress)
                $scope.followTraffic(acList);
        }

        function errorCallback(acList)
        {
            if (!$scope.globalData.showTraffic)
                return;

            $scope.globalData.trafficStatus = "error";
            mapService.drawTraffic(acList, $scope.globalData.settings.maxTrafficAltitudeFt);
        }
	};


	$scope.followTraffic = function(acList)
	{
		var ac = acList[$scope.followTrafficAddress];

		if (!ac || !ac.positions || ac.positions.length == 0)
			return;

		var currentAcPosition = ac.positions[ac.positions.length - 1];

		var latDiff = currentAcPosition.latitude - $scope.followTrafficLastPosition.latitude;
		var lonDiff = currentAcPosition.longitude - $scope.followTrafficLastPosition.longitude;
		var pos = mapService.getMapPosition();

		mapService.setMapPosition(pos.center[1] + latDiff, pos.center[0] + lonDiff, pos.zoom);

		$scope.followTrafficLastPosition = currentAcPosition;
	};


	$scope.onFollowSelectedTraffic = function()
	{
		if ($scope.globalData.showLocation)
			$scope.stopLocationService();

		$scope.startFollowTraffic();

        $scope.closeFeatureOverlay();
	};


	$scope.startFollowTraffic = function()
	{
		$scope.followTrafficAddress = $scope.selectedTraffic.acaddress;
		$scope.followTrafficLastPosition = $scope.selectedTraffic.position;

		mapService.setMapPosition($scope.followTrafficLastPosition.latitude, $scope.followTrafficLastPosition.longitude);
	};


	$scope.stopFollowTraffic = function()
	{
		$scope.followTrafficAddress = undefined;
		$scope.followTrafficLastPosition = undefined;
	};

	//endregion


    //region METEO

    $scope.onMeteoClicked = function()
    {
        $scope.globalData.showMeteo = !$scope.globalData.showMeteo;
        $scope.updateMeteo();
    };


    $scope.updateMeteo = function()
    {
        if ($scope.globalData.showMeteo)
        {
            mapService.drawMeteoBg(true);
            meteoService.getSmaMeasurements(mapService.getViewExtentLatLon(), mapService.drawSmaMeasurements);
        }
        else
        {
            mapService.drawMeteoBg(false);
            mapService.drawSmaMeasurements(undefined);
        }
    };

    //endregion


    //region TERRAIN

    $scope.onTerrainClicked = function()
    {
        $scope.globalData.showTerrain = !$scope.globalData.showTerrain;

        if ($scope.globalData.showTerrain)
            terrainService.updateTerrain($scope.globalData.navplan.waypoints, $scope.onTerrainWaypointClicked);
    };


    $scope.onTerrainWaypointClicked = function(waypoint)
    {
        var mockFeature = { waypoint : waypoint };
        $scope.onFeatureSelected(undefined, mockFeature);
    };

    //endregion


    //region OFFLINE CACHE

    $scope.onOfflineCacheClicked = function()
    {
        switch ($scope.globalData.cacheStatus)
        {
            case "off" :
                $scope.globalData.cacheIsActive = true;
                break;
            default :
                $scope.globalData.cacheIsActive = false;
        }


        if ($scope.globalData.cacheIsActive)
        {
            setWaypointCacheCookie();
            setChartCacheCookie();
            cacheMapFeatures();
            cacheNotams();
            updateAppCache();
        }
        else
        {
            $scope.discardCache();
        }


        function setWaypointCacheCookie()
        {
            var cacheWps = [];
            var wps = $scope.globalData.navplan.waypoints;
            var variation = globalData.settings.variation ? globalData.settings.variation : 0;

            if (wps && wps.length > 0)
            {
                for (var i = 0; i < wps.length; i++)
                    cacheWps.push(getCacheWaypoint(wps[i]));

                if ($scope.globalData.navplan.alternate)
                    cacheWps.push(getCacheWaypoint($scope.globalData.navplan.alternate));

                // start high res
                cacheWps.push({
                    lat: wps[0].latitude,
                    lon: wps[0].longitude,
                    tt: 0,
                    dist: 0,
                    rad: 5,
                    maxzoom: 13
                });

                // destination high res
                cacheWps.push({
                    lat: wps[wps.length - 1].latitude,
                    lon: wps[wps.length - 1].longitude,
                    tt: 0,
                    dist: 0,
                    rad: 5,
                    maxzoom: 13
                });
            }

            setCookie("cachewaypoints", obj2json(cacheWps), 0);


            function getCacheWaypoint(wp)
            {
                var tt = (wp.mt) ? (wp.mt + variation + 180) % 360 : 0; // reverse direction, pointing back from waypoint
                var dist = (wp.dist) ? wp.dist : 0;

                return {
                    lat: wp.latitude,
                    lon: wp.longitude,
                    tt: tt,
                    dist: dist,
                    rad: 3,
                    maxzoom: 12
                };
            }
        }


        function setChartCacheCookie()
        {
            var chartUrls = [];
            var wps = $scope.globalData.navplan.waypoints;

            // waypoints
            for (var i = 0; i < wps.length; i++)
            {
                if (wps[i].airport && wps[i].airport.charts && wps[i].airport.charts.length > 0)
                {
                    for (var j = 0; j < wps[i].airport.charts.length; j++)
                    {
                        pushUnique(chartUrls, getRestUrl(wps[i].airport.charts[j].id));
                        pushUnique(chartUrls, getChartUrl(wps[i].airport.charts[j].filename));
                    }
                }
            }

            // alternate
            var wpAlt = $scope.globalData.navplan.alternate;

            if (wpAlt)
            {
                if (wpAlt.airport && wpAlt.airport.charts && wpAlt.airport.charts.length > 0)
                {
                    for (var k = 0; k < wpAlt.airport.charts.length; k++)
                    {
                        pushUnique(chartUrls, getRestUrl(wpAlt.airport.charts[k].id));
                        pushUnique(chartUrls, getChartUrl(wpAlt.airport.charts[k].filename));
                    }
                }
            }

            setCookie("cachecharts", obj2json(chartUrls), 0);


            function getRestUrl(chartId)
            {
                return 'php/ad_charts.php?v=' + navplanVersion + '&id=' + chartId;
            }


            function getChartUrl(filename)
            {
                return 'charts/' + filename + '?v=' + navplanVersion;
            }
        }


        function cacheMapFeatures()
        {
            mapFeatureService.getMapFeatures($scope.getNavplanExtentLatLon(), cacheMapFeaturesSuccess, cacheMapFeaturesError);


            function cacheMapFeaturesSuccess(mapFeatureList)
            {
                window.sessionStorage.setItem("mapFeatureCache", obj2json(mapFeatureList));
            }


            function cacheMapFeaturesError()
            {
                // TODO: cache status => error
            }
        }


        function cacheNotams()
        {
            metarTafNotamService.getNotams($scope.getNavplanExtentLatLon(), [], cacheNotamsSuccess, cacheNotamsError);


            function cacheNotamsSuccess(notamList)
            {
                window.sessionStorage.setItem("notamCache", obj2json(notamList));
            }


            function cacheNotamsError()
            {
                // TODO: cache status => error
            }
        }


        function updateAppCache()
        {
            if (!$scope.appCache || $scope.appCache.status == $scope.appCache.UNCACHED)
            {
                $scope.showErrorMessage("Application Cache not available!");
                $scope.globalData.cacheStatus = "error";
                return;
            }

            if ($scope.appCache.status == $scope.appCache.DOWNLOADING)
            {
                $scope.appCache.abort();
            }
            else
            {
                $scope.globalData.cacheStatus = "updating";
                $scope.globalData.cacheProgress = {loaded: 0, total: 100, percent: 0};

                $scope.appCache.update();
            }
        }
    };

    //endregion


    //region FULL SCREEN

    $scope.isInFullScreenMode = function()
    {
        return isInFullScreenMode();
    };


    $scope.onFullScreenModeClicked = function()
    {
        var fsElement = document.getElementById("fullScreenContent");

        if (isInFullScreenMode())
            stopFullScreenMode();
        else
            startFullScreenMode(fsElement);
    };

    //endregion


	//region UTIL FUNCTIONS

    $scope.getWpFromFeature = function(feature, latLon)
    {
        if (feature.geopoint && !feature.airport && !feature.navaid && !feature.reportingpoint && !feature.userWaypoint) {
            return {
                type: feature.geopoint.type,
                geopoint: feature.geopoint,
                id: feature.geopoint.id,
                freq: feature.geopoint.frequency ? feature.geopoint.frequency : "",
                callsign: feature.geopoint.callsign ? feature.geopoint.callsign : "",
                checkpoint: feature.geopoint.wpname,
                airport_icao: '',
                latitude: feature.geopoint.latitude,
                longitude: feature.geopoint.longitude,
                mt: '',
                dist: '',
                alt: '',
                remark: '',
                supp_info: feature.geopoint.supp_info
            };
        }
        else if (feature.airport) {
            return {
                type: 'airport',
                airport: feature.airport,
                freq: getMainFrequency(feature.airport),
                callsign: getMainCallsign(feature.airport),
                checkpoint: feature.airport.icao ? feature.airport.icao : feature.airport.name,
                airport_icao: feature.airport.icao,
                latitude: feature.airport.latitude,
                longitude: feature.airport.longitude,
                mt: '',
                dist: '',
                alt: '',
                remark: '',
                supp_info: getAirportSuppInfoString(feature.airport)
            };
        }
        else if (feature.navaid) {
            return {
                type: 'navaid',
                navaid: feature.navaid,
                freq: feature.navaid.frequency,
                callsign: feature.navaid.kuerzel,
                checkpoint: feature.navaid.kuerzel + ' ' + feature.navaid.type,
                latitude: feature.navaid.latitude,
                longitude: feature.navaid.longitude,
                mt: '',
                dist: '',
                alt: '',
                remark: '',
                supp_info: ''
            };
        }
        else if (feature.reportingpoint) {
            var lat, lon;
            if (feature.reportingpoint.type == 'SECTOR') {
                lat = latLon.latitude;
                lon = latLon.longitude;
            }
            else {
                lat = feature.reportingpoint.latitude;
                lon = feature.reportingpoint.longitude;
            }

            var alt, ismaxalt, isminalt;
            if (feature.reportingpoint.max_ft) {
                alt = feature.reportingpoint.max_ft;
                ismaxalt = true;
            }
            else if (feature.reportingpoint.min_ft) {
                alt = feature.reportingpoint.min_ft;
                isminalt = true;
            }

            return {
                type: 'report',
                reportingpoint: feature.reportingpoint,
                freq: '',
                callsign: '',
                checkpoint: feature.reportingpoint.name,
                latitude: lat,
                longitude: lon,
                mt: '',
                dist: '',
                alt: alt ? alt : '',
                ismaxalt: ismaxalt,
                isminalt: isminalt,
                remark: feature.reportingpoint.remark,
                supp_info: feature.reportingpoint.supp_info
            };
        }
        else if (feature.userWaypoint) {
            return {
                type: 'user',
                userWaypoint: feature.userWaypoint,
                id: feature.userWaypoint.id,
                freq: '',
                callsign: '',
                checkpoint: feature.userWaypoint.name,
                latitude: feature.userWaypoint.latitude,
                longitude: feature.userWaypoint.longitude,
                mt: '',
                dist: '',
                alt: '',
                remark: feature.userWaypoint.remark,
                supp_info: feature.userWaypoint.supp_info
            };
        }
        else
            return undefined;


        function getMainFrequency(airport)
        {
            if (!airport || !airport.radios || airport.radios.length == 0)
                return '';
            else
                return airport.radios[0].frequency;
        }


        function getMainCallsign(airport)
        {
            if (!airport || !airport.radios || airport.radios.length == 0)
                return '';

            return getCallsign(airport.radios[0], airport.country);
        }


        function getCallsign(radio, country)
        {
            switch (radio.type)
            {
                case "TOWER" : return "TWR";
                case "APPROACH" : return "APP";
                case "ARRIVAL" : return "ARR";
                case "DEPARTURE" : return "DEP";
                case "GLIDING" : return "GLD";
                case "GROUND" : return "GND";
                case "DELIVERY" : return "DEL";
                case "CTAF" :
                    if (country == "CH") // spezialregel nur für country = CH
                        return "AD";
                    else
                        return "CTAF";
                case "AFIS" : return "AFIS";
                case "OTHER" :
                {
                    if (radio.description.toUpperCase().indexOf("AD") == 0) // starts with AD...
                        return "AD";
                    else
                        return radio.typespec;
                }
                default : return radio.type;
            }
        }


        function getAirportSuppInfoString(airport)
        {
            var i;
            var suppInfoPart = [];

            // altitude
            if (airport.elevation)
                suppInfoPart.push("ELEV:" + $scope.getElevationString(airport.elevation));

            // runways
            if (airport.runways && airport.runways.length > 0)
            {
                var runwayStringList = [];

                for (i = 0; i < airport.runways.length; i++)
                {
                    var rwy = airport.runways[i];

                    if (rwy.name.toString().indexOf("GLD") == -1 || airport.runways.length == 1) // skip GLD strip unless it's the only rwy
                        runwayStringList.push(rwy.name);
                }

                suppInfoPart.push("RWY:" + runwayStringList.join(","));
            }

            // frequencies
            if (airport.radios && airport.radios.length > 0)
            {
                var radioStringList = [];

                for (i = 0; i < airport.radios.length; i++)
                {
                    var radio = airport.radios[i];
                    var callsign = getCallsign(radio, airport.country);
                    if ((radio.type != "GLIDING" && radio.type != "INFO" && radio.type != "FIS" && callsign != "VDF") || airport.radios.length == 1) // skip GLD, FIS, VDF freq unless it's the only frequency
                        radioStringList.push(callsign + ":" + radio.frequency);
                }

                suppInfoPart.push(radioStringList.join(" "));
            }

            return suppInfoPart.join(" ");
        }
    };


    $scope.storeTrackLocal = function()
    {
        var lastTrack = {
            timestamp: Math.floor(Date.now() / 1000),
            name: "",
            positions: shrinkPositions(locationService.getLastPositions())
        };

        if ($scope.isLoggedIn()) {
            if ($scope.globalData.navplan && $scope.globalData.navplan.title)
                lastTrack.name = $scope.globalData.navplan.title;
        }

        localStorage.setItem("lasttrack", obj2json(lastTrack));

        $scope.showSuccessMessage("Track sucessfully stored in 'tracks' tab!");
    };


	$scope.getAdTypeString = function(adtype)
	{
		switch (adtype)
		{
			case 'AD_CLOSED' : return "Closed Aerodrome";
			case 'AD_MIL' : return "Military Aerodrome";
			case 'AF_CIVIL' : return "Civil Airfield";
			case 'AF_MIL_CIVIL' : return "Airfield (civil/military)";
			case 'AF_WATER' : return "Water Airfield";
			case 'APT' : return "Airport resp. Airfield IFR";
			case 'GLIDING' : return "Glider Site";
			case 'HELI_CIVIL' : return "Civil Heliport";
			case 'HELI_MIL' : return "Military Heliport";
			case 'INTL_APT' : return "International Airport";
			case 'LIGHT_AIRCRAFT' : return "Ultra Light Flying Site";
			default : return "Unknown";
		}
	};


	$scope.getAgeString = function(dateString)
    {
        return metarTafNotamService.getAgeString(dateString)
    };


    $scope.getTafAgeString = function(weatherInfo)
    {
        return metarTafNotamService.getTafAgeString(weatherInfo)
    };


    $scope.getPositionString = function(latitude, longitude)
	{
		return getDmsString(latitude, longitude);
	};


	$scope.getElevationString = function(elevation_m)
	{
		return Math.round(m2ft(elevation_m)) + "ft";
	};


	$scope.getDimensionsString = function(runway)
	{
		return Math.round(runway.length) + " x " + Math.round(runway.width) + "m";
	};


	$scope.getMorseString = function(text)
	{
		if (!text)
			return;

		var dotHtml = " <b>&middot;</b> ";
		var dashHtml = " <b>&#8211;</b> ";
		var spacer = "&nbsp;&nbsp;&nbsp;";
		var out = "";

		for (var i = 0; i < text.length; i++)
		{
			var letter = text.substring(i, i + 1).toUpperCase();
			var code = getMorseString(letter);
			code = code.replace(/\./g, dotHtml);
			code = code.replace(/\-/g, dashHtml);

			if (i > 0)
				out += spacer;

			out += letter + " " + code;
		}

		return $sce.trustAsHtml(out);
	};


	$scope.isInFullScreenMode = function()
    {
        return (document.fullscreenElement != null
            || document.webkitFullscreenElement != null
            || document.mozFullScreenElement != null
            || document.msFullscreenElement != null
            || document.fullscreen
            || document.webkitIsFullScreen
            || document.mozFullScreen
            || document.webkitIsFullScreen);
    };


	$scope.resizeMapToWindow = function(event)
	{
        if ($scope.isInFullScreenMode())
        {
            $('#map').offset({top: 0, left: 0});
            $('#map').height($(window).height());
        }
        else
        {
            $('#map').offset({top: $('#navbarheader').height(), left: 0});
            $('#map').height($(window).height() - $('#navbarheader').height());
        }

		$('#map').width($(window).width());
		mapService.updateMapSize();
		$scope.updateWaypoints();
	};


    $scope.loadSharedNavplan = function(shareId)
    {
        userService.readSharedNavplan(shareId)
            .then(
                function(response)
                {
                    if (response.data.navplan)
                        $scope.loadNavplanToGlobalData(response.data.navplan);
                    else
                        logResponseError("ERROR loading shared navplan", response);
                },
                function(response)
                {
                    logResponseError("ERROR loading shared navplan", response);
                }
            );
    };

    //endregion


    //region INIT MAP & EVENT LISTENERS

    try
	{
		mapService.init(
            $scope.globalData.currentMapPos,
			$scope.onMapClicked,
			$scope.onFeatureSelected,
			$scope.onMapMoveEnd,
			$scope.onTrackModifyEnd,
            $scope.onMapActivityOccured,
            $scope.onFullScreenModeClicked
        );

		$scope.redrawWaypoints();
		$scope.redrawFlightTrack();
		$scope.fitView();
		$scope.resizeMapToWindow();
	}
	catch(err)
	{
		$scope.$parent.error_alert_message = "Sorry, an error occured while loading the map! Try to reload the page (CTRL+F5), or clear the browser cache, or use a newer browser (e.g Chrome 24+, Safari 6.2+, Firefox 23+, IE 10+)";

        var errLog = {
            handler: 'mapinit',
            verJs: navplanVersion,
            verIdx: indexVersion,
            errMsg: err && err.message ? err.message : "unknown",
            stackTrace: err && err.stack ? err.stack : "unknown"
        };

		writeServerErrLog(errLog);
		logError(errLog);
	}

	// navplan broadcast events
	$scope.$on("redrawWaypoints", $scope.redrawWaypoints);
	$scope.$on("onTrashClicked", $scope.redrawFlightTrack);
	$scope.$on("onNavbarCollapsed", $scope.resizeMapToWindow);

	// other event listeners
    window.addEventListener("keydown", $scope.onKeyDown);
    window.addEventListener("resize", $scope.resizeMapToWindow);
    document.addEventListener("fullscreenchange", $scope.resizeMapToWindow);
    document.addEventListener("webkitfullscreenchange", $scope.resizeMapToWindow);
    document.addEventListener("mozfullscreenchange", $scope.resizeMapToWindow);
    document.addEventListener("MSFullscreenChange", $scope.resizeMapToWindow);


    $scope.$on('$destroy', function()
    {
        window.removeEventListener("keydown", $scope.onKeyDown);
        window.removeEventListener("resize", $scope.resizeMapToWindow);
        document.removeEventListener("fullscreenchange", $scope.resizeMapToWindow);
        document.removeEventListener("webkitfullscreenchange", $scope.resizeMapToWindow);
        document.removeEventListener("mozfullscreenchange", $scope.resizeMapToWindow);
        document.removeEventListener("MSFullscreenChange", $scope.resizeMapToWindow);
    });

	if ($route.current.$$route.showtraffic && !$scope.globalData.showTraffic)
		$scope.onTrafficClicked();

	if ($route.current.params.shareid)
		$scope.loadSharedNavplan($route.current.params.shareid);

	//endregion
}
