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
			
			$scope.globalData.user = data.user;
			$scope.globalData.pilot = data.pilot;
			$scope.globalData.aircraft = data.aircraft;
			$scope.globalData.fuel = data.fuel;
			$scope.globalData.navplan =  data.navplan;
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
			$scope.globalData.user =
			{
				email: undefined,
				token: undefined,
				navplanList: []
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
		var storedUser = window.localStorage.getItem("user");

		if (storedUser)
		{
			$scope.globalData.user = json2obj(storedUser);

			if ($scope.globalData.user.email && $scope.globalData.user.token)
				$scope.loginUser($scope.globalData.user.email, $scope.globalData.user.token, true)
		}

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


	$scope.readNavplanList = function()
	{
		var email = $scope.globalData.user.email;
		var token = $scope.globalData.user.token;
		
		userService.readNavplanList(email, token)
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
	
	
	$scope.loginUser = function(email, token, remember)
	{
		$scope.globalData.user.email = email;
		$scope.globalData.user.token = token;
		$scope.readNavplanList();

		//TODO: read user data (name, plane, settings, etc.)

		if (remember)
			window.localStorage.setItem("user", obj2json($scope.globalData.user));

		$scope.showSuccessMessage("Welcome " + email + "!");
	};
	
	
	$scope.isLoggedIn = function()
	{
		return ($scope.globalData.user.email && $scope.globalData.user.token);
	};

	
	$scope.logoutUser = function()
	{
		$scope.globalData.user.email = undefined;
		$scope.globalData.user.token = undefined;
		$scope.globalData.user.navplanList = [];

		window.localStorage.removeItem("user");
		
		$scope.showSuccessMessage("User Logged out successfully!");
	};


	$scope.onDisclaimerOKClicked = function()
	{
		if ($scope.hideDisclaimer)
			window.localStorage.setItem("hideDisclaimer", "true");
	};

	
	$scope.updateWpList = function()
	{
		waypointService.updateWpList($scope.globalData.navplan.waypoints, $scope.globalData.navplan.alternate, $scope.globalData.settings.variation, $scope.globalData.aircraft.speed);
		fuelService.updateFuelCalc($scope.globalData.fuel, $scope.globalData.navplan.waypoints, $scope.globalData.navplan.alternate, $scope.globalData.aircraft);
		mapService.updateTrack($scope.globalData.navplan.waypoints, $scope.globalData.navplan.alternate, $scope.globalData.settings);
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
		userService.saveUserWaypoint($scope.globalData.selectedWp, $scope.globalData.user.email, $scope.globalData.user.token)
			.success(function(data) {
				if (data.success == 1)
				{
					mapService.updateUserWaypoints($scope.globalData.user.email, $scope.globalData.user.token);

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
		userService.deleteUserWaypoint($scope.globalData.selectedWp.id, $scope.globalData.user.email, $scope.globalData.user.token)
			.success(function(data) {
				if (data.success == 1)
				{
					mapService.updateUserWaypoints($scope.globalData.user.email, $scope.globalData.user.token);
					mapService.hideFeaturePopup();
			
					$scope.showSuccessMessage("User Waypoint successfully deleted");
				}
				else
					console.error("ERROR", data);
			})
			.error(function(data, status) {
				console.error("ERROR", status, data);
			});
	};

	
	$scope.onClearAllWaypointsClicked = function()
	{
		$scope.globalData.navplan = 
		{
			id: undefined,
			name: '',
			waypoints: [ ],
			selectedWaypoint: undefined,
			alternate: undefined
		};
		$scope.globalData.selectedWp = undefined;
	
		$scope.updateWpList();

		mapService.clearAllCharts();
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
	
	
	$scope.onLeaving = function()
	{
		window.sessionStorage.setItem("globalData", obj2json($scope.globalData));
	}
	
	
	// init stuff
	$scope.initGlobalData();
	$scope.initUser();
	$scope.initDisclaimer();
	
	// event listeners
	window.addEventListener("beforeunload", $scope.onLeaving);
	window.addEventListener("pagehide", $scope.onLeaving);
}
