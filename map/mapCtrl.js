/**
 * Map Controller
 */

navplanApp
	.controller('mapCtrl', [ '$scope', '$sce', '$route', 'mapService', 'locationService', 'trafficService', 'geonameService', 'userService', 'globalData', mapCtrl ]);


function mapCtrl($scope, $sce, $route, mapService, locationService, trafficService, geonameService, userService, globalData) {
	$scope.globalData = globalData;
	$scope.trafficTimerIntervallMs = 5000;
	$scope.selectedTraffic = {};
	$scope.followTrafficAddress = undefined;
	$scope.followTrafficLastPosition = undefined;

	var featureContainer = document.getElementById('feature-popup');
	var trafficContainer = document.getElementById('traffic-popup');
	var weatherContainer = document.getElementById('weather-popup');


	$scope.searchGeonamesByValue = function(search)
	{
		return geonameService.searchGeonamesByValue(search);
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

		mapService.setMapPosition($item.latitude, $item.longitude, 12, true);
		mapService.drawGeopointSelection([ $item ], undefined);
	};
	
	
	$scope.onGeonameSearch = function()
	{
		// TODO
	};

	
	$scope.onMapClicked = function(event, clickCoordinates, maxRadius)
	{
		$scope.globalData.clickHistory.push(clickCoordinates); // used internally only

		geonameService.searchGeonamesByPosition(clickCoordinates[1], clickCoordinates[0], maxRadius)
			.success(function(data) {
				if (data.geonames)
				{
					mapService.closeOverlay();
					mapService.drawGeopointSelection(data.geonames, event.pixel);
				}
				else
					console.error("ERROR searching geonames", data);
			})
			.error(function(data, status) {
				console.error("ERROR searching geonames", status, data);
			});
	};


	$scope.onFeatureSelected = function(event, feature)
	{
		if (feature.geopoint || feature.airport || feature.navaid || feature.reportingpoint || feature.userWaypoint)
		{
			$scope.globalData.selectedWp = $scope.getWpFromFeature(feature, mapService.getLatLonFromPixel(event.pixel[0], event.pixel[1]));
			$scope.globalData.selectedWp.isNew = true;

			$scope.$apply();
			$scope.openFeatureOverlay($scope.globalData.selectedWp.latitude, $scope.globalData.selectedWp.longitude);
		}
		else if (feature.waypoint)
		{
			$scope.globalData.selectedWp = feature.waypoint;
			$scope.globalData.selectedWp.airport = feature.waypoint.airport; // if set, undefined otherwise
			$scope.$apply();

			$scope.openFeatureOverlay(feature.waypoint.latitude, feature.waypoint.longitude);
		}
		else if (feature.acInfo)
		{
			$scope.selectedTraffic = {
				position: mapService.getLatLonCoordinates(feature.getGeometry().getCoordinates()),
				registration: "Unknown",
				aircraftModelType: "N/A",
				manufacturer: "N/A",
				address: feature.acInfo.address,
				addresstype: feature.acInfo.addresstype,
				receiver: feature.acInfo.receiver
			};


			if (feature.acInfo.addresstype != "ICAO")
			{
				mapService.addOverlay(feature.getGeometry().getCoordinates(), trafficContainer, true);
				$scope.$apply();
			}
			else {
				trafficService.readAcDetails(feature.acInfo.address)
					.then(
						function (response) {
							if (!response.data || !response.data.aircrafts || response.data.aircrafts.length > 1) {
								console.error("ERROR reading callsign");
							}
							else {
								if (response.data.aircrafts.length == 1)
								{
									var acDetails = response.data.aircrafts[0];
									$scope.selectedTraffic.registration = acDetails.registration;
									$scope.selectedTraffic.aircraftModelType = acDetails.aircraftModelType;
									$scope.selectedTraffic.manufacturer = acDetails.manufacturer;
								}

								mapService.addOverlay(feature.getGeometry().getCoordinates(), trafficContainer, true);
							}
						},
						function (response) {
							console.error("ERROR reading ac details", response.status, response.data);
						}
					)
			}
		}
		else if (feature.webcam)
		{
			window.open(feature.webcam.url);
		}
		else if (feature.weatherInfo)
		{
			$scope.selectedWeather = feature.weatherInfo;
			mapService.addOverlay(feature.getGeometry().getCoordinates(), weatherContainer, true);
			$scope.$apply();
		}
	};


	$scope.getWpFromFeature = function(feature, latLon)
	{
		if (feature.geopoint && !feature.airport && !feature.navaid && !feature.reportingpoint && !feature.userWaypoint) {
			return {
				type: feature.geopoint.type,
				geopoint: feature.geopoint,
				id: feature.geopoint.id,
				freq: '',
				callsign: '',
				checkpoint: feature.geopoint.wpname,
				airport_icao: '',
				latitude: feature.geopoint.latitude,
				longitude: feature.geopoint.longitude,
				mt: '',
				dist: '',
				alt: '',
				remark: ''
			};
		}
		else if (feature.airport) {
			return {
				type: 'airport',
				airport: feature.airport,
				freq: getFrequency(feature.airport),
				callsign: getCallsign(feature.airport),
				checkpoint: feature.airport.icao,
				airport_icao: feature.airport.icao,
				latitude: feature.airport.latitude,
				longitude: feature.airport.longitude,
				mt: '',
				dist: '',
				alt: '',
				remark: ''
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
				remark: ''
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
				remark: feature.reportingpoint.remark
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
				remark: feature.userWaypoint.remark
			};
		}
		else
			return undefined;


		function getFrequency(airport)
		{
			if (!airport || !airport.radios || airport.radios.length == 0)
				return '';
			else
				return airport.radios[0].frequency;
		}


		function getCallsign(airport)
		{
			if (!airport || !airport.radios || airport.radios.length == 0)
				return '';

			var radio = airport.radios[0];

			switch (radio.type)
			{
				case "TOWER" : return "TWR";
				case "APPROACH" : return "APP";
				case "ARRIVAL" : return "ARR";
				case "DEPARTURE" : return "DEP";
				case "GLIDING" : return "GLD";
				case "GROUND" : return "GND";
				case "CTAF" : return "AD";
				case "AFIS" : return "AD"; // TODO: TEMP
				case "OTHER" :
				{
					if (radio.description.toUpperCase().startsWith("AD"))
						return "AD";
					else
						return radio.typespec;
				}
				default : return radio.type;
			}
		}
	};


	$scope.onMapMoveEnd = function(event)
	{
		var view = event.map.getView();
		
		$scope.globalData.currentMapPos = {
			center: view.getCenter(),
			zoom: view.getZoom()
		};
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


	$scope.onAddSelectedWaypointClicked = function()
	{
		$scope.globalData.selectedWp.isNew = false;
		$scope.addWaypoint($scope.globalData.selectedWp);
		$scope.globalData.selectedWp = undefined;

		mapService.closeOverlay();
	};
	

	$scope.onSetAsAlternateClicked = function()
	{
		$scope.globalData.selectedWp.isNew = false;
		$scope.setAlternate($scope.globalData.selectedWp);
		$scope.globalData.selectedWp = undefined;

		mapService.closeOverlay();
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

		mapService.closeOverlay();
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
	
	
	$scope.setAlternate = function(altWp)
	{
		$scope.globalData.navplan.alternate = altWp;
		
		$scope.updateWaypoints();
		$scope.discardCache();
	};
	
	
	$scope.onDisplayChartClicked = function(chartId)
	{
		mapService.displayChart(chartId);
		mapService.closeOverlay();
	};


	$scope.onShowWeatherInfo = function()
	{
		$scope.selectedWeather = $scope.globalData.selectedWp.airport.weatherInfo;
		$scope.selectedWeather.airport_icao = $scope.globalData.selectedWp.airport.icao;
		var coords = mapService.getMercatorCoordinates($scope.globalData.selectedWp.airport.latitude, $scope.globalData.selectedWp.airport.longitude);
		mapService.addOverlay(coords, weatherContainer, true);
	};


	$scope.openFeatureOverlay = function(latitude, longitude)
	{
		var coordinates = mapService.getMercatorCoordinates(latitude, longitude);

		mapService.addOverlay(coordinates, featureContainer, true);

		$('#ad_details').hide();
		$('#ad_charts').hide();
	};


	$scope.onCloseOverlayClicked =  function(event)
	{
		mapService.closeOverlay();
	};


	$scope.onZoomInClicked = function()
	{
		var zoom = mapService.getMapPosition().zoom;

		if (zoom < mapService.MAX_ZOOMLEVEL)
			mapService.setMapPosition(null, null, zoom + 1);
	};


	$scope.onZoomOutClicked = function()
	{
		var zoom = mapService.getMapPosition().zoom;

		if (zoom > 1)
			mapService.setMapPosition(null, null, zoom - 1);
	};

	
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
		mapService.updateLocation(undefined);
		$scope.globalData.locationStatus = "off";
	};


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
			window.clearInterval($scope.globalData.trafficTimer);
			$scope.globalData.trafficTimer = undefined;
			$scope.stopFollowTraffic();
			mapService.updateTraffic(undefined);
			$scope.globalData.trafficStatus = "off";
		}
	};
	
	
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
				return 'charts/' + filename;
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


	$scope.onKmlClicked = function()
	{
		$scope.exportKml();
	};


	$scope.onLocationChanged = function(currentPosition)
	{
		var lastPositions = locationService.getLastPositions();

		mapService.updateLocation(lastPositions);

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


	$scope.onTrafficTimer = function()
	{
		if (navigator.onLine)
			$scope.updateTraffic();
	};


	$scope.updateTraffic = function()
	{
		if (!$scope.globalData.showTraffic)
			return;
		
		var extent = mapService.getViewExtent();

		trafficService.readTraffic(extent, 120)
			.then(
				function(response)
				{
					if (response.data.aclist)
					{
						trafficService.calcTimestamps(response.data.aclist); // TODO: temp => calc ms in php
						mapService.updateTraffic(response.data.aclist);
						$scope.globalData.trafficStatus = "current";

						if ($scope.followTrafficAddress)
							$scope.followTraffic(response.data.aclist);
					}
					else
					{
						$scope.globalData.trafficStatus = "error";
						console.error("ERROR reading traffic", response.data);
					}
				},
				function(response)
				{
					$scope.globalData.trafficStatus = "error";
					console.error("ERROR", response.status, response.data);
				}
			);
	};


	$scope.followTraffic = function(aclist)
	{
		var ac = aclist[$scope.followTrafficAddress];

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

		mapService.closeOverlay();
	};


	$scope.startFollowTraffic = function()
	{
		$scope.followTrafficAddress = $scope.selectedTraffic.address;
		$scope.followTrafficLastPosition = $scope.selectedTraffic.position;

		mapService.setMapPosition($scope.followTrafficLastPosition.latitude, $scope.followTrafficLastPosition.longitude);
	};


	$scope.stopFollowTraffic = function()
	{
		$scope.followTrafficAddress = undefined;
		$scope.followTrafficLastPosition = undefined;
	};
	
	
	$scope.onToggleElementClicked = function(element)
	{
		$(element).toggle();
	};


	$scope.getAgeString = function(datestring)
	{
		var ms = Date.now() - Date.parse(datestring);
		var h = Math.floor(ms / 1000 / 3600);
		var m = Math.floor(ms / 1000 / 60 - h * 60);

		if (h > 0)
			return h + "h " + m + "min";
		else
			return m + "min";
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


	$scope.resizeMap = function(event)
	{
		$('#map').height($(window).height() - $('#navbarheader').height());
		$('#map').width($(window).width());
		mapService.updateSize();
	};

	try
	{
		mapService.init(
			$scope.onMapClicked,
			$scope.onFeatureSelected,
			$scope.onMapMoveEnd,
			$scope.onTrackModifyEnd,
			$scope.globalData.currentMapPos);

		$scope.updateWaypoints();
		$scope.updateFlightTrack();
		$scope.resizeMap();
	}
	catch(err)
	{
		$scope.$parent.error_alert_message = "Sorry, an error occured while loading the map! Try to reload the page (CTRL+F5), or clear the browser cache, or use a newer browser (e.g Chrome 24+, Safari 6.2+, Firefox 23+, IE 10+)";

		var errLog = {
			handler: 'mapinit',
			verJs: navplanVersion,
			verIdx: indexVersion,
			errMsg: err.message
		};

		writeServerErrLog(errLog);
	}

	window.removeEventListener("resize", $scope.resizeMap);
	window.addEventListener("resize", $scope.resizeMap);

	if ($route.current.$$route.showtraffic && !$scope.globalData.showTraffic)
		$scope.onTrafficClicked();
}
