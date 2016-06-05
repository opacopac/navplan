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
			$scope.globalData.trafficTimer = data.trafficTimer;
			$scope.globalData.showLocation = data.showLocation;
			$scope.globalData.showTraffic = data.showTraffic;
			$scope.globalData.offlineCache = data.offlineCache;
			$scope.globalData.locationStatus = data.locationStatus;
			$scope.globalData.trafficStatus = data.trafficStatus;
			$scope.globalData.cacheStatus = data.cacheStatus;
			$scope.globalData.cacheProgress = data.cacheProgress;
		}
		else // load default values
		{
			$scope.globalData.initialData = true;
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
				variation: 2
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
			$scope.globalData.offlineCache = false;
			$scope.globalData.locationStatus = "off"; // "off", "waiting", "current", "error"
			$scope.globalData.trafficStatus = "off"; // "off", "waiting", "current", "error"
			$scope.globalData.cacheStatus = "off"; // "off", "updating", "updated", "error"
			$scope.globalData.cacheProgress =  { loaded: 0, total: 100, percent: 0 };
		}
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
			$scope.globalData.offlineCache = true;
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
			.success(function(data) {
				if (data.navplanList || data.navplanList === null)
					$scope.globalData.user.navplanList = data.navplanList;
				else
					console.error("ERROR", data);
			})
			.error(function(data, status) {
				console.error("ERROR", status, data);
			});
	};


	$scope.readTrackList = function()
	{
		userService.readUserTrackList()
			.then(
				function (response) {
					if (!response.data || !response.data.tracks)
						console.error("ERROR reading tracks", response.status, response.data);
					else
						$scope.globalData.user.trackList = response.data.tracks;
				},
				function (response) {
					console.error("ERROR reading tracks: ", response.status, response.data);
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

	
	$scope.updateWaypoints = function()
	{
		waypointService.recalcWaypoints($scope.globalData.navplan.waypoints, $scope.globalData.navplan.alternate, $scope.globalData.settings.variation, $scope.globalData.aircraft.speed);
		fuelService.updateFuelCalc($scope.globalData.fuel, $scope.globalData.navplan.waypoints, $scope.globalData.navplan.alternate, $scope.globalData.aircraft);
		mapService.updateWpTrack($scope.globalData.navplan.waypoints, $scope.globalData.navplan.alternate, $scope.globalData.settings);
	};


	$scope.updateFlightTrack = function()
	{
		if ($scope.globalData.track && $scope.globalData.track.positions)
			mapService.updateFlightTrack($scope.globalData.track.positions);
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
			.success(function(data) {
				if (data.success == 1)
				{
					mapService.updateUserWaypoints();
					mapService.closeOverlay();

					$scope.showSuccessMessage("User Waypoint successfully saved");
				}
				else
					console.error("ERROR", data);
			})
			.error(function(data, status) {
				console.error("ERROR", status, data);
			});
	};


	$scope.onDeleteUserWaypointClicked = function()
	{
		userService.deleteUserWaypoint($scope.globalData.selectedWp.id)
			.success(function(data) {
				if (data.success == 1)
				{
					mapService.updateUserWaypoints();
					mapService.closeOverlay();

					$scope.showSuccessMessage("User Waypoint successfully deleted");
				}
				else
					console.error("ERROR deleting user waypoint", data);
			})
			.error(function(data, status) {
				console.error("ERROR deleting user waypoint", status, data);
			});
	};

	
	$scope.onTrashClicked = function()
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

		$scope.globalData.track =
		{
			positions: []
		};
	
		$scope.updateWaypoints();
		$scope.updateFlightTrack();
		$scope.discardCache();

		mapService.clearAllCharts();
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
		$scope.globalData.offlineCache = false;

		deleteCookie("cachewaypoints");
		deleteCookie("cachecharts");

		if (window.applicationCache.status === window.applicationCache.DOWNLOADING)
		{
			window.applicationCache.abort();
		}
		else if (window.applicationCache.status !== window.applicationCache.UNCACHED)
		{
			$scope.globalData.cacheStatus = "updating";
			$scope.globalData.cacheProgress = {loaded: 0, total: 100, percent: 0};

			window.applicationCache.update();
		}
		else
		{
			$scope.globalData.cacheStatus = "off";
		}
	};


	$scope.onCacheProgress = function(e)
	{
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
		if (window.applicationCache.status == window.applicationCache.UPDATEREADY)
			window.applicationCache.swapCache();

		if ($scope.globalData.offlineCache)
			$scope.globalData.cacheStatus = "updated";
		else
			$scope.globalData.cacheStatus = "off";

		$scope.$apply();
	};


	$scope.onCacheError = function(e)
	{
		if ($scope.globalData.offlineCache == false && $scope.globalData.cacheStatus == "off")
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
	
	
	// init stuff
	$scope.initGlobalData();
	$scope.initUser();
	$scope.initDisclaimer();
	$scope.initPosition();

	// event listeners
	window.addEventListener("beforeunload", $scope.onLeaving);
	window.addEventListener("pagehide", $scope.onLeaving);
	window.applicationCache.addEventListener('progress', $scope.onCacheProgress, false);
	window.applicationCache.addEventListener('noupdate', $scope.onCacheReady, false);
	window.applicationCache.addEventListener('cached', $scope.onCacheReady, false);
	window.applicationCache.addEventListener('updateready', $scope.onCacheReady, false);
	window.applicationCache.addEventListener('obsolete', $scope.onCacheReady, false);
	window.applicationCache.addEventListener('error', $scope.onCacheError, false);
}
