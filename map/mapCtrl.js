/**
 * Map Controller
 */

navplanApp
	.controller('mapCtrl', [ '$scope', 'mapService', 'locationService', 'trafficService', 'geonameService', 'globalData', mapCtrl ]);


function mapCtrl($scope, mapService, locationService, trafficService, geonameService, globalData) {
	$scope.globalData = globalData;
	$scope.timerIntervallMs = 5000;
	$scope.selectedTraffic = {};

	var featureContainer = document.getElementById('feature-popup');
	var trafficContainer = document.getElementById('traffic-popup');
	var weatherContainer = document.getElementById('weather-popup');


	$scope.focusSearchWpInput = function()
	{
		document.getElementById('searchWpInput').focus();
	};
	

	$scope.searchGeonamesByValue = function(search)
	{
		return geonameService.searchGeonamesByValue(search, $scope.globalData.user.email, $scope.globalData.user.token);
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

		mapService.setMapPosition($item.latitude, $item.longitude, 12);
		mapService.drawGeopointSelection([ $item ], [0, 0]);
	};
	
	
	$scope.onGeonameSearch = function()
	{
		// TODO
	};

	
	$scope.onMapClicked = function(event, clickCoordinates, maxRadius)
	{
		geonameService.searchGeonamesByPosition(clickCoordinates[1], clickCoordinates[0], maxRadius, $scope.globalData.user.email, $scope.globalData.user.token)
			.success(function(data) {
				if (data.geonames)
				{
					mapService.closeOverlay();
					mapService.drawGeopointSelection(data.geonames, event.pixel);
				}
				else
					console.error("ERROR", data);
			})
			.error(function(data, status) {
				console.error("ERROR", status, data);
			});
	};


	$scope.onFeatureSelected = function(event, feature)
	{
		if (feature.geopoint)
		{
			$scope.globalData.selectedWp = {
				type: feature.geopoint.type,
				geopoint: feature.geopoint,
				airport: feature.airport, // where available
				id: feature.geopoint.id,
				freq: feature.geopoint.frequency,
				callsign: feature.geopoint.callsign,
				checkpoint: feature.geopoint.wpname,
				airport_icao: feature.geopoint.airport_icao,
				latitude: feature.geopoint.latitude,
				longitude: feature.geopoint.longitude,
				mt: '',
				dist: '',
				alt: '',
				remark: '',
				isNew: true
			};
			$scope.$apply();

			mapService.addOverlay(mapService.getMercatorCoordinates(feature.geopoint.latitude, feature.geopoint.longitude), featureContainer);
		}
		else if (feature.airport)
		{
			$scope.globalData.selectedWp = {
				type: 'airport',
				airport: feature.airport,
				freq: feature.airport.frequency,
				callsign: feature.airport.callsign,
				checkpoint: feature.airport.icao,
				airport_icao: feature.airport.icao,
				latitude: feature.airport.latitude,
				longitude: feature.airport.longitude,
				mt: '',
				dist: '',
				alt: '',
				remark: '',
				isNew: true
			};
			$scope.$apply();

			mapService.addOverlay(feature.getGeometry().getCoordinates(), featureContainer);
		}
		else if (feature.navaid)
		{
			$scope.globalData.selectedWp = {
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
				isNew: true
			};
			$scope.$apply();

			mapService.addOverlay(feature.getGeometry().getCoordinates(), featureContainer);
		}
		else if (feature.globalWaypoint)
		{
			$scope.globalData.selectedWp = {
				type: 'global',
				globalWaypoint: feature.globalWaypoint,
				freq: '',
				callsign: '',
				checkpoint: feature.globalWaypoint.name,
				latitude: feature.globalWaypoint.latitude,
				longitude: feature.globalWaypoint.longitude,
				mt: '',
				dist: '',
				alt: '',
				remark: feature.globalWaypoint.remark,
				isNew: true
			};
			$scope.$apply();

			mapService.addOverlay(feature.getGeometry().getCoordinates(), featureContainer);
		}
		else if (feature.userWaypoint)
		{
			$scope.globalData.selectedWp = {
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
				isNew: true
			};
			$scope.$apply();

			mapService.addOverlay(feature.getGeometry().getCoordinates(), featureContainer);
		}
		else if (feature.waypoint)
		{
			$scope.globalData.selectedWp = feature.waypoint;
			$scope.$apply();

			mapService.addOverlay(feature.getGeometry().getCoordinates(), featureContainer);
		}
		else if (feature.acInfo)
		{
			if (feature.acInfo.addresstype != "ICAO")
			{
				$scope.selectedTraffic = getUnknownTrafficInfo(feature.acInfo);
				mapService.addOverlay(feature.getGeometry().getCoordinates(), trafficContainer);
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
									$scope.selectedTraffic = response.data.aircrafts[0];
								else
									$scope.selectedTraffic = getUnknownTrafficInfo(feature.acInfo);

								mapService.addOverlay(feature.getGeometry().getCoordinates(), trafficContainer);
							}
						},
						function (response) {
							console.error("ERROR", response.status, response.data);
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
			mapService.addOverlay(feature.getGeometry().getCoordinates(), weatherContainer);
			$scope.$apply();
		}


		function getUnknownTrafficInfo(acInfo)
		{
			return {
				registration: "N/A",
				aircraftModelType: "N/A",
				manufacturer: "N/A",
				address: acInfo.address,
				addresstype: acInfo.addresstype
			};
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
		$scope.updateWpList();
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

		$scope.updateWpList();
		$scope.discardCache();
	};
	
	
	$scope.setAlternate = function(altWp)
	{
		$scope.globalData.navplan.alternate = altWp;
		
		$scope.updateWpList();
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
		mapService.addOverlay(coords, weatherContainer);
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

		if ($scope.globalData.showLocation)
		{
			$scope.globalData.locationStatus = "waiting";
			locationService.startWatching($scope.onLocationChanged, $scope.onLocationError);
		}
		else
		{
			locationService.stopWatching();
			mapService.updateLocation(undefined);
			$scope.globalData.locationStatus = "off";
		}		
	};
	

	$scope.onTrafficClicked = function()
	{
		$scope.globalData.showTraffic = !$scope.globalData.showTraffic;

		if ($scope.globalData.showTraffic)
		{				
			$scope.globalData.trafficStatus = "waiting";

			if (!$scope.globalData.trafficTimer)
				$scope.globalData.trafficTimer = window.setInterval($scope.onTrafficTimer, $scope.timerIntervallMs);

			$scope.updateTraffic();
		}
		else
		{
			window.clearInterval($scope.globalData.trafficTimer);
			$scope.globalData.trafficTimer = undefined;
			mapService.updateTraffic(undefined);
			$scope.globalData.trafficStatus = "off";
		}
	};
	
	
	$scope.onOfflineCacheClicked = function()
	{
		switch ($scope.globalData.cacheStatus)
		{
			case "off" :
				$scope.globalData.offlineCache = true;
				break;
			default :
				$scope.globalData.offlineCache = false;
		}

		
		if ($scope.globalData.offlineCache)
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
				return 'php/ad_charts.php?id=' + chartId;
			}


			function getChartUrl(filename)
			{
				return 'charts/' + filename;
			}
		}


		function updateAppCache()
		{
			if (window.applicationCache.status === window.applicationCache.DOWNLOADING) {
				window.applicationCache.abort();
			}
			else {
				$scope.globalData.cacheStatus = "updating";
				$scope.globalData.cacheProgress = {loaded: 0, total: 100, percent: 0};

				window.applicationCache.update(); // TODO: catch error
			}
		}		
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
						mapService.updateTraffic(response.data.aclist);
						$scope.globalData.trafficStatus = "current";
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


	mapService.init(
		$scope.onMapClicked,
		$scope.onFeatureSelected,
		$scope.onMapMoveEnd,
		$scope.globalData.currentMapPos,
		$scope.globalData.user.email,
		$scope.globalData.user.token);

	$scope.updateWpList();
}
