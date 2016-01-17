/**
 * Main Controller
 */

navplanApp
	.controller('navplanCtrl', navplanCtrl);

navplanCtrl.$inject = ['$scope', 'globalData', 'userService', 'mapService', 'waypointService', 'fuelService'];

function navplanCtrl($scope, globalData, userService, mapService, waypointService, fuelService)
{
	// init global data object
	$scope.globalData = globalData;
	

	// globally used functions
	
	$scope.initGlobalData = function()
	{
		// init global data
		$scope.globalData.user =
		{
			email: undefined,
			token: undefined,
			navplanList: []
		};
		$scope.globalData.pilot =
		{
			name: 'Armand'
		};
		$scope.globalData.aircraft =
		{
			id: 'HB-SRA',
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
			selectedWaypoint: undefined,
		};
		$scope.globalData.settings =
		{
			variation: 2
		};
		$scope.globalData.currentMapPos = 
		{
			center: ol.proj.fromLonLat([7.4971, 46.9141]), // LSZB
			zoom: 11
		};
		$scope.globalData.selectedWp = undefined;
		$scope.globalData.wpBackup = undefined;
	}
	
	
	$scope.initUser = function()
	{
		// init user
		var	email = getCookie("email");
		var token = getCookie("token");

		if (email && token)
			$scope.loginUser(email, token, 90)
	}
	
	
	$scope.initDisclaimer = function()
	{
		// init disclaimer
		var hideDisclaimer = getCookie("hideDisclaimer");

		if (hideDisclaimer != "1")
			$('#disclaimerDialog').modal('show');
	}


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
	}
	
	
	$scope.loginUser = function(email, token, rememberDays)
	{
		setCookie("email", email, rememberDays);
		setCookie("token", token, rememberDays);
	
		$scope.globalData.user.email = email;
		$scope.globalData.user.token = token;

		$scope.readNavplanList();
		//TODO: read user data (name, plane, settings, etc.)
	}
	
	
	$scope.isLoggedIn = function()
	{
		return ($scope.globalData.user.email && $scope.globalData.user.token);
	}

	
	$scope.logoutUser = function()
	{
		$scope.globalData.user.email = undefined;
		$scope.globalData.user.token = undefined;
		
		deleteCookie("email");
		deleteCookie("token");
	}


	$scope.onDisclaimerOKClicked = function()
	{
		if ($scope.hideDisclaimer)
			setCookie("hideDisclaimer", "1", 90);
	}

	
	$scope.onLogoutClicked = function()
	{
		$scope.logoutUser();
	}


	$scope.updateWpList = function()
	{
		waypointService.updateWpList($scope.globalData.navplan.waypoints, $scope.globalData.settings.variation, $scope.globalData.aircraft.speed);
		fuelService.updateFuelCalc($scope.globalData.fuel, $scope.globalData.navplan.waypoints, $scope.globalData.aircraft);
		mapService.updateTrack($scope.globalData.navplan.waypoints, $scope.globalData.settings);
	}

	
	$scope.editSelectedWaypoint = function ()
	{
		// save backup for undo
		$scope.globalData.wpBackup = {
			checkpoint: $scope.globalData.selectedWp.checkpoint,
			freq: $scope.globalData.selectedWp.freq,
			callsign: $scope.globalData.selectedWp.callsign,
			alt: $scope.globalData.selectedWp.alt
		}
		
		$('#selectedWaypointDialog').modal('show');
	}
	
	
	$scope.onSaveSelectedWaypointClicked = function()
	{
		$scope.globalData.selectedWp.type = 'user';
		$scope.$apply();
		
		userService.saveUserWaypoint($scope.globalData.selectedWp, $scope.globalData.user.email, $scope.globalData.user.token);
		
		// todo message
	}


	$scope.onDeleteSelectedWaypointClicked = function()
	{
		userWaypointService.deleteUserWaypoint($scope.globalData.selectedWp.id, $scope.globalData.user.email, $scope.globalData.user.token);
		
		$scope.globalData.selectedWp = undefined;
		$scope.$apply();
		
		// todo message
	}

	
	$scope.onOkEditWpClicked = function()
	{
		// mapService.hideFeaturePopup();
		$scope.globalData.wpBackup = undefined;
	}
	
	
	$scope.onCancelEditWpClicked = function()
	{
		// restore backup
		$scope.globalData.selectedWp.checkpoint = $scope.globalData.wpBackup.checkpoint;
		$scope.globalData.selectedWp.freq = $scope.globalData.wpBackup.freq;
		$scope.globalData.selectedWp.callsign = $scope.globalData.wpBackup.callsign;
		$scope.globalData.selectedWp.alt = $scope.globalData.wpBackup.alt;
		
		//mapService.hideFeaturePopup();
	}

	
	$scope.onClearAllWaypointsClicked = function()
	{
		$scope.globalData.navplan = 
		{
			id: undefined,
			name: '',
			waypoints: [ ],
			selectedWaypoint: undefined,
		};
		$scope.globalData.selectedWp = undefined;
	
		$scope.updateWpList();
	}
	

	// init stuff
	$scope.initGlobalData();
	$scope.initUser();
	$scope.initDisclaimer();
}
