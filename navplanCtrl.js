/**
 * Main Controller
 */

navplanApp
	.controller('navplanCtrl', navplanCtrl);

navplanCtrl.$inject = ['$scope', '$timeout', 'globalData', 'userService', 'mapService', 'waypointService', 'fuelService'];

function navplanCtrl($scope, $timeout, globalData, userService, mapService, waypointService, fuelService)
{
	// init global data object
	$scope.globalData = globalData;


	// globally used functions
	
	$scope.initGlobalData = function()
	{
		var storedGlobalData = window.sessionStorage.getItem("globalData");
		
		if (storedGlobalData) // load session data
		{
			var data = json2obj(storedGlobalData);

			$scope.globalData.initialData = false;
			$scope.globalData.sessionId = $scope.createSessionId();
			$scope.globalData.user = data.user;
			$scope.globalData.pilot = data.pilot;
			$scope.globalData.aircraft = data.aircraft;
			$scope.globalData.fuel = data.fuel;
			$scope.globalData.navplan =  data.navplan;
			$scope.globalData.track =  data.track;
			$scope.globalData.settings = data.settings;
			$scope.globalData.currentMapPos = data.currentMapPos;
			$scope.globalData.selectedWp = data.selectedWp;
			$scope.globalData.wpBackup = data.wpBackup;
			$scope.globalData.trafficTimer = undefined;
			$scope.globalData.showLocation = false; // data.showLocation;
			$scope.globalData.showTraffic = false; // data.showTraffic;
			$scope.globalData.cacheIsActive = data.cacheIsActive;
			$scope.globalData.locationStatus = "off"; // data.locationStatus;
			$scope.globalData.trafficStatus = "off"; // data.trafficStatus;
			$scope.globalData.cacheStatus = data.cacheStatus;
			$scope.globalData.cacheProgress = data.cacheProgress;
			$scope.globalData.clickHistory = []; // internally used only
		}
		else // load default values
		{
			$scope.globalData.initialData = true;
			$scope.globalData.sessionId = $scope.createSessionId();
			$scope.globalData.user =
			{
				email: undefined,
				token: undefined,
				navplanList: [],
				trackList: []
			};
			$scope.globalData.pilot =
			{
				name: ''
			};
			$scope.globalData.aircraft =
			{
				id: '',
				speed: 100,
				consumption: 20
			};
			$scope.globalData.fuel =
			{
				tripTime: 0,
				alternatTime: 0,
				reserveTime: 45,
				extraTime: 0
			};
			$scope.globalData.navplan = 
			{
				id: undefined,
				name: '',
				waypoints: [ ],
				alternate: undefined,
				selectedWaypoint: undefined
			};
			$scope.globalData.track =
			{
				positions: [ ]
			};
			$scope.globalData.settings =
			{
				variation: 2,
				maxTrafficAltitudeFt: 15000
			};
			$scope.globalData.currentMapPos = 
			{
				center: ol.proj.fromLonLat([7.4971, 46.9141]), // LSZB, TODO => nearest ap
				zoom: 11
			};
			$scope.globalData.selectedWp = undefined;
			$scope.globalData.wpBackup = undefined;
			$scope.globalData.trafficTimer = undefined;
			$scope.globalData.clockTimer = undefined;
			$scope.globalData.showLocation = false;
			$scope.globalData.showTraffic = false;
			$scope.globalData.cacheIsActive = false;
			$scope.globalData.locationStatus = "off"; // "off", "waiting", "current", "error"
			$scope.globalData.trafficStatus = "off"; // "off", "waiting", "current", "error"
			$scope.globalData.cacheStatus = "off"; // "off", "updating", "updated", "error"
			$scope.globalData.cacheProgress =  { loaded: 0, total: 100, percent: 0 };
			$scope.globalData.clickHistory = []; // internally used only
		}
	};


	$scope.createSessionId = function ()
	{
        return Math.floor((Math.random() * 1000000000));
    };

	
	$scope.showSuccessMessage = function(text)
	{
		$scope.success_alert_message = text;
		
		$timeout(function () { $scope.success_alert_message = ""; }, 3000, true);
	};
	
	
	$scope.showErrorMessage = function(text)
	{
		$scope.error_alert_message = text;
		
		$timeout(function () { $scope.error_alert_message = ""; }, 3000, true);
	};


	$scope.showRuSureMessage = function(title, text, confirmCallback)
    {
        $scope.globalData.ruSureTitle = title;
        $scope.globalData.ruSureMessage = text;
        $scope.globalData.ruSureCallback = confirmCallback;

        $('#ruSureDialog').modal('show');
    };
	
	
	$scope.initUser = function()
	{
		/*var storedUser = window.localStorage.getItem("user");

		if (storedUser)
		{
			$scope.globalData.user = json2obj(storedUser);

			if ($scope.globalData.user.email && $scope.globalData.user.token)
				$scope.loginUser($scope.globalData.user.email, $scope.globalData.user.token, true)
		}*/

		// var user
		var email = getCookie("email");
		var token = getCookie("token");

		if (email && token)
			$scope.loginUser(email, token, true); // TODO: remember-flag korrigieren

		// cached waypoints
		var cachewaypoints = getCookie("cachewaypoints");
		
		if (cachewaypoints)
		{
			$scope.globalData.cacheIsActive = true;
			$scope.globalData.cacheStatus = "updated"; // TODO: check cache
		}
	};
	
	
	$scope.initDisclaimer = function()
	{
		var storedHideDisclaimer = window.localStorage.getItem("hideDisclaimer");

		if (storedHideDisclaimer != "true")
			$('#disclaimerDialog').modal('show');
	};


	$scope.initPosition = function()
	{
		if ($scope.globalData.initialData && navigator.geolocation)
			navigator.geolocation.getCurrentPosition($scope.setPosition);
	};


	$scope.setPosition = function(position)
	{
		mapService.setMapPosition(position.coords.latitude, position.coords.longitude, 11);
		$scope.globalData.currentMapPos = mapService.getMapPosition();
	};


	$scope.readNavplanList = function()
	{
		userService.readNavplanList()
			.then(
			    function(response) // success
                {
                    if (response && response.data && (response.data.navplanList || response.data.navplanList === null))
                        $scope.globalData.user.navplanList = response.data.navplanList;
                    else
                        logResponseError("ERROR reading navplan list", response);
			    },
			    function(response) // error
                {
                    logResponseError("ERROR reading navplan list", response);
			    }
            );
	};


	$scope.readTrackList = function()
	{
		userService.readUserTrackList()
			.then(
				function (response) {
					if (!response.data || !response.data.tracks)
						logResponseError("ERROR reading tracks", response);
					else
						$scope.globalData.user.trackList = response.data.tracks;
				},
				function (response) {
                    logResponseError("ERROR reading tracks", response);
				}
			);
	};


	$scope.loginUser = function(email, token, remember)
	{
		$scope.globalData.user.email = email;
		$scope.globalData.user.token = token;
		$scope.readNavplanList();
		$scope.readTrackList();

		/*if (remember)
			window.localStorage.setItem("user", obj2json($scope.globalData.user));*/
		
		var rememberDays = 0;
		
		if (remember)
			rememberDays = 90;
		
		setCookie("email", email, rememberDays);
		setCookie("token", token, rememberDays);

		$scope.showSuccessMessage("Welcome " + email + "!");
	};
	
	
	$scope.logoutUser = function()
	{
		$scope.globalData.user.email = undefined;
		$scope.globalData.user.token = undefined;
		$scope.globalData.user.navplanList = [];
		$scope.globalData.user.trackList = [];

		//window.localStorage.removeItem("user");
		deleteCookie("email");
		deleteCookie("token");
		
		$scope.showSuccessMessage("User Logged out successfully!");
	};


	$scope.isLoggedIn = function()
	{
		return ($scope.globalData.user.email && $scope.globalData.user.token);
	};


	$scope.hasLastTrack = function()
	{
		return (localStorage.getItem('lasttrack') !== null);
	};


	$scope.onDisclaimerOKClicked = function()
	{
		if ($scope.hideDisclaimer)
			window.localStorage.setItem("hideDisclaimer", "true");
	};


    $scope.onRuSureYesClicked = function()
    {
        if ($scope.globalData.ruSureCallback)
            $scope.globalData.ruSureCallback();
    };

	
	$scope.updateWaypoints = function()
	{
		waypointService.recalcWaypoints($scope.globalData.navplan.waypoints, $scope.globalData.navplan.alternate, $scope.globalData.settings.variation, $scope.globalData.aircraft.speed);
		fuelService.updateFuelCalc($scope.globalData.fuel, $scope.globalData.navplan.waypoints, $scope.globalData.navplan.alternate, $scope.globalData.aircraft);
		mapService.drawWaypoints($scope.globalData.navplan.waypoints, $scope.globalData.navplan.alternate, $scope.globalData.settings.variation);
	};


	$scope.updateFlightTrack = function()
	{
		if ($scope.globalData.track && $scope.globalData.track.positions)
			mapService.drawFlightTrack($scope.globalData.track.positions);
	};


	$scope.editSelectedWaypoint = function ()
	{
		$scope.backupSelectedWaypoint();
		
		$('#selectedWaypointDialog').modal('show');
	};
	
	
	$scope.onOkEditWpClicked = function()
	{
		$scope.globalData.wpBackup = undefined;
	};
	
	
	$scope.onCancelEditWpClicked = function()
	{
		$scope.restoreSelectedWaypoint();
	};

	
	$scope.editUserWaypoint = function ()
	{
		$scope.backupSelectedWaypoint();
		
		$('#userWaypointDialog').modal('show');
	};
	
	
	$scope.onSaveUserWaypointClicked = function()
	{
		userService.saveUserWaypoint($scope.globalData.selectedWp)
			.then(
			    function(response) // success
                {
                    if (response.data.success == 1)
                    {
                        mapService.loadAndDrawUserPoints();
                        mapService.closeOverlay();

                        $scope.showSuccessMessage("User point successfully saved");
                    }
                    else
                        logResponseError("ERROR saving user point", response);
			    },
                function(response) // error
                {
                    logResponseError("ERROR saving user point", response);
			    }
            );
	};


	$scope.onDeleteUserWaypointClicked = function()
	{
		userService.deleteUserWaypoint($scope.globalData.selectedWp.id)
			.then(
			    function(response) // success
                {
                    if (response.data.success == 1)
                    {
                        mapService.loadAndDrawUserPoints();
                        mapService.closeOverlay();

                        $scope.showSuccessMessage("User Waypoint successfully deleted");
                    }
                    else
                        logResponseError("ERROR deleting user waypoint", response);
			    },
			    function(response) // error
                {
                    logResponseError("ERROR deleting user waypoint", response);
			    }
        );
	};

	
	$scope.onTrashClicked = function()
	{
        $scope.showRuSureMessage(
            "Clear Map?",
            "Do you really want to clear all waypoints, charts and tracks from the map? Unsaved changes will be lost!",
            function()
            {
                $scope.globalData.navplan =
                {
                    id: undefined,
                    name: '',
                    waypoints: [],
                    selectedWaypoint: undefined,
                    alternate: undefined
                };
                $scope.globalData.selectedWp = undefined;
                $scope.globalData.track = { positions: [] };
                $scope.globalData.clickHistory = [];

                $scope.updateWaypoints();
                $scope.updateFlightTrack();
                $scope.discardCache();

                mapService.clearAllCharts();
            }
        );
	};


	$scope.onShareClicked = function(shareType)
	{
		/*var sharerUrl;
		var tinyUrl = "https://www.navplan.ch/branch/";
		var np_title = ($scope.globalData.navplan.name && $scope.globalData.navplan.name.length > 0) ? " " + $scope.globalData.navplan.name : "";
		var text = "Check out my VFR Navigation Log" + np_title + ":";
		var hashtags = "navplan,vfr,flightplan";*/

		switch (shareType)
		{
			/*case "facebook":
				var sharerUrl = "http://www.facebook.com/sharer.php?u=" + encodeURI(tinyUrl);
                createAndClickLink(sharerUrl, "_blank");
				break;
            case "twitter":
                var sharerUrl = "https://twitter.com/share?url=" + encodeURI(tinyUrl) + "&text=" + encodeURI(text) + "&hashtags=" + encodeURI(hashtags);
                createAndClickLink(sharerUrl, "_blank");
                break;
            case "google":
                var sharerUrl = "https://plus.google.com/share?url=" + encodeURI(tinyUrl);
                createAndClickLink(sharerUrl, "_blank");
                break;*/
			case "url":
				$scope.createShareUrl();
				break;
			}
	};
	
	
	// TODO: include in onShareClicked
	$scope.createPdfNavplan = function()
	{
		var navplanData = $scope.getNavplanExportData();
		
		sendPostForm('php/navplanPdf.php', '_blank', 'data', JSON.stringify(navplanData));
	};
	
	
	// TODO: include in onShareClicked
	$scope.createExcelNavplan = function()
	{
		var navplanData = $scope.getNavplanExportData();
		
		sendPostForm('php/navplanExcel.php', '_blank', 'data', JSON.stringify(navplanData));
	};


	$scope.getNavplanExportData = function ()
	{
		var waypoints = [];

		for (var i = 0; i < $scope.globalData.navplan.waypoints.length; i++)
			waypoints.push(getWaypointData($scope.globalData.navplan.waypoints[i]));


		return {
			waypoints: waypoints,
			alternate: $scope.globalData.navplan.alternate ? getWaypointData($scope.globalData.navplan.alternate) : undefined,
			fuel: $scope.globalData.fuel,
			pilot: $scope.globalData.pilot,
			aircraft: $scope.globalData.aircraft
		};


		function getWaypointData(wp)
		{
			return {
				freq: wp.freq,
				callsign: wp.callsign,
				checkpoint: wp.checkpoint,
				mtText: wp.mtText,
				distText: wp.distText,
				alt: wp.alt,
				isminalt: wp.isminalt,
				ismaxalt: wp.ismaxalt,
				eetText: wp.eetText,
				remark: wp.remark
			};
		};
	};	


	$scope.exportKml = function()
	{
		var waypoints = [];

		if ($scope.globalData.navplan && $scope.globalData.navplan.waypoints) {
			for (var i = 0; i < $scope.globalData.navplan.waypoints.length; i++) {
				var wp = $scope.globalData.navplan.waypoints[i];

				waypoints.push({
					name: wp.checkpoint,
					lat: wp.latitude,
					lon: wp.longitude
				});
			}
		}

		var flightPositions = [];

		if ($scope.globalData.track && $scope.globalData.track.positions) {
			for (var j = 0; j < $scope.globalData.track.positions.length; j++) {
				var pos = $scope.globalData.track.positions[j];

				flightPositions.push({
					lat: pos.latitude,
					lon: pos.longitude,
					alt: pos.altitude
				});
			}
		}

		sendPostForm('php/navplanKml.php', '_blank', 'data', JSON.stringify({ wpPositions: waypoints, flightPositions: flightPositions }));

		//window.open('php/navplanKml.php?waypoints=' + encodeURIComponent(JSON.stringify(waypoints)), "_blank");
	};


    $scope.exportGpx = function()
    {
        var routeTitle = $scope.globalData.navplan.title ? $scope.globalData.navplan.title : '';

        var waypoints = [];
        if ($scope.globalData.navplan && $scope.globalData.navplan.waypoints) {
            for (var i = 0; i < $scope.globalData.navplan.waypoints.length; i++) {
                var wp = $scope.globalData.navplan.waypoints[i];

                waypoints.push({
                    name: wp.checkpoint,
                    lat: wp.latitude,
                    lon: wp.longitude
                });
            }
        }

        var trackTitle = $scope.globalData.track.name ? $scope.globalData.track.name : '';

        var trackpoints = [];
        if ($scope.globalData.track && $scope.globalData.track.positions) {
            for (var j = 0; j < $scope.globalData.track.positions.length; j++) {
                var pos = $scope.globalData.track.positions[j];

                trackpoints.push({
                    lat: pos.latitude,
                    lon: pos.longitude,
                    alt: pos.altitude,
                    time: getIsoTimeString(pos.timestamp)
                });
            }
        }

        sendPostForm('php/navplanGpx.php', '_blank', 'data', JSON.stringify({ routeTitle: routeTitle, waypoints: waypoints, trackTitle: trackTitle, trackpoints: trackpoints }));
    };


    $scope.createShareUrl = function()
	{
		userService.createSharedNavplan($scope.globalData)
			.then(
			    function(response) // success
                {
                    if (response.data.share_id) {
                        $scope.globalData.shareUrl =
                            window.location.protocol
                            + "//" + window.location.host
                            + window.location.pathname
                            + window.location.search
                            + "#/share/" + response.data.share_id;

                        $('#shareUrlDialog').modal('show');
                    }
                    else
                        logResponseError("ERROR creating shared navplan", response);
                },
			    function(response) // error
                {
                    logResponseError("ERROR creating shared navplan", response);
			    }
            );
	};


	$scope.backupSelectedWaypoint = function()
	{
		$scope.globalData.wpBackup = {
			checkpoint: $scope.globalData.selectedWp.checkpoint,
			freq: $scope.globalData.selectedWp.freq,
			callsign: $scope.globalData.selectedWp.callsign,
			alt: $scope.globalData.selectedWp.alt,
			isminalt:  $scope.globalData.selectedWp.isminalt,
			ismaxalt:  $scope.globalData.selectedWp.ismaxalt
		}
	};
	
	
	$scope.restoreSelectedWaypoint = function()
	{
		$scope.globalData.selectedWp.checkpoint = $scope.globalData.wpBackup.checkpoint;
		$scope.globalData.selectedWp.freq = $scope.globalData.wpBackup.freq;
		$scope.globalData.selectedWp.callsign = $scope.globalData.wpBackup.callsign;
		$scope.globalData.selectedWp.alt = $scope.globalData.wpBackup.alt;
		$scope.globalData.selectedWp.isminalt = $scope.globalData.wpBackup.isminalt;
		$scope.globalData.selectedWp.ismaxalt = $scope.globalData.wpBackup.ismaxalt;
	};


	$scope.discardCache = function()
	{
		$scope.globalData.cacheIsActive = false;

		deleteCookie("cachewaypoints");
		deleteCookie("cachecharts");
        window.sessionStorage.removeItem("mapFeatureCache");

		if ($scope.appCache.status == $scope.appCache.DOWNLOADING)
		{
			$scope.appCache.abort();
		}
		else if ($scope.appCache.status != $scope.appCache.UNCACHED)
		{
			$scope.globalData.cacheStatus = "updating";
			$scope.globalData.cacheProgress = {loaded: 0, total: 100, percent: 0};

			$scope.appCache.update();
		}
		else
		{
			$scope.globalData.cacheStatus = "off";
		}
	};


	$scope.onCacheProgress = function(e)
	{
		if ($scope.globalData.cacheIsActive == false && $scope.globalData.cacheStatus == "off")
			return;

		if (!e.loaded || !e.total) // hack for firefox
		{
			e.loaded = $scope.globalData.cacheProgress.loaded + 1;
			e.total = $scope.globalData.cacheProgress.total;

			if (e.loaded > e.total)
				e.total += 100;
		}

		$scope.globalData.cacheProgress = { loaded: e.loaded, total: e.total, percent: Math.round(e.loaded / e.total * 100) };
		$scope.$apply();
	};


	$scope.onCacheReady = function(e)
	{
		if ($scope.appCache.status == $scope.appCache.UPDATEREADY)
			$scope.appCache.swapCache();

		if ($scope.globalData.cacheIsActive)
			$scope.globalData.cacheStatus = "updated";
		else
			$scope.globalData.cacheStatus = "off";

		$scope.$apply();
	};


	$scope.onCacheError = function(e)
	{
		if ($scope.globalData.cacheIsActive == false && $scope.globalData.cacheStatus == "off")
			return;

		$scope.globalData.cacheStatus = "error";
		$scope.$apply();
	};


	$scope.onLeaving = function()
	{
		window.sessionStorage.setItem("globalData", obj2json($scope.globalData));
	};


	$scope.onClockTimer = function()
	{
		var timer = $scope.globalData.timer;

		if (!timer)
			return;

		// current time
		var d = new Date();
		d.setMilliseconds(0);
		timer.currentTime =  d;
		timer.currentTimeString = getHourMinSecString(d);

		// elapsed time
		if (timer.stopTime)
			timer.elapsedTimeString = "+" + getMinSecString(timer.currentTime - timer.stopTime);

		$scope.$apply();
	};

	
	$scope.loadNavplanToGlobalData = function(navplanData)
	{
		// general data
		$scope.globalData.navplan.id = navplanData.id;
		$scope.globalData.navplan.title = navplanData.title;
		$scope.globalData.aircraft.speed = navplanData.aircraft_speed;
		$scope.globalData.aircraft.consumption = navplanData.aircraft_consumption;
		$scope.globalData.fuel.extraTime = navplanData.extra_fuel;
		$scope.globalData.navplan.alternate = undefined; // TODO
		
		// waypoints
		$scope.globalData.navplan.waypoints = [ ];
		var wp;

		if (navplanData.waypoints)
		{
			for (var i = 0; i < navplanData.waypoints.length; i++)
			{
				wp = $scope.getWaypointFromData(navplanData.waypoints[i]);
				$scope.globalData.navplan.waypoints.push(wp);
			}
		}

		// alternate
		$scope.globalData.navplan.alternate = undefined;

		if (navplanData.alternate)
		{
			wp = $scope.getWaypointFromData(navplanData.alternate);
			$scope.globalData.navplan.alternate = wp;
		}

        $scope.updateWaypoints();
        mapService.fitView($scope.getNavplanExtentMercator());
		$scope.discardCache();
	};
	
	
	$scope.getWaypointFromData = function(wp_data)
	{
		var ap = undefined;

		if (wp_data.airport_icao)
			ap = mapService.getAirport(wp_data.airport_icao);

		return {
			type: wp_data.type,
			freq: wp_data.freq,
			callsign: wp_data.callsign,
			checkpoint: wp_data.checkpoint,
			airport_icao: wp_data.airport_icao,
			latitude: wp_data.latitude,
			longitude: wp_data.longitude,
			charts: wp_data.charts,
			webcams: wp_data.webcams,
			mt: '',
			dist: '',
			alt: wp_data.alt,
			isminalt: wp_data.isminalt,
			ismaxalt: wp_data.ismaxalt,
			remark: wp_data.remark,
			airport: ap
		};
	};


    $scope.getNavplanExtentLatLon = function()
    {
        var minLon, maxLon, minLat, maxLat;
        var navplan = $scope.globalData.navplan;

        if (!navplan || !navplan.waypoints)
            return undefined;

        // create list with all wps (including alternate)
        var allWps = [];

        for (var i = 0; i < navplan.waypoints.length; i++)
            allWps.push(navplan.waypoints[i]);

        if (navplan.alternate)
            allWps.push(navplan.alternate);


        // find max values
        for (i = 0; i < allWps.length; i++)
        {
            if (!minLon || allWps[i].longitude < minLon)
                minLon = allWps[i].longitude;

            if (!minLat || allWps[i].latitude < minLat)
                minLat = allWps[i].latitude;

            if (!maxLon || allWps[i].longitude > maxLon)
                maxLon = allWps[i].longitude;

            if (!maxLat || allWps[i].latitude > maxLat)
                maxLat = allWps[i].latitude;
        }

        if (minLon && minLat && maxLon && maxLat)
            return [minLon, minLat, maxLon, maxLat];
        else
            return undefined;
    };


	$scope.getNavplanExtentMercator = function()
    {
        var extentLatLon = $scope.getNavplanExtentLatLon();

        if (!extentLatLon)
            return undefined;

        var minMercator = mapService.getMercatorCoordinates(extentLatLon[1], extentLatLon[0]);
        var maxMercator = mapService.getMercatorCoordinates(extentLatLon[3], extentLatLon[2]);

        return [minMercator[0], minMercator[1], maxMercator[0], maxMercator[1]];
    };
	
	
	// init stuff
	$scope.initGlobalData();
	$scope.initUser();
	$scope.initDisclaimer();
	$scope.initPosition();

	// event listeners
	window.addEventListener("beforeunload", $scope.onLeaving);
	window.addEventListener("pagehide", $scope.onLeaving);

	// init application cache
	window.frames[0].onload = function()
	{
		$scope.appCache = window.frames[0].applicationCache;

		if ($scope.appCache && $scope.appCache.addEventListener)
		{
			$scope.appCache.addEventListener('progress', $scope.onCacheProgress, false);
			$scope.appCache.addEventListener('noupdate', $scope.onCacheReady, false);
			$scope.appCache.addEventListener('cached', $scope.onCacheReady, false);
			$scope.appCache.addEventListener('updateready', $scope.onCacheReady, false);
			$scope.appCache.addEventListener('obsolete', $scope.onCacheReady, false);
			$scope.appCache.addEventListener('error', $scope.onCacheError, false);
		}
	};
}
