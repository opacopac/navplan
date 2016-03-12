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
		// init global data
		$scope.globalData.user =
		{
			email: undefined,
			token: undefined,
			navplanList: []
		};
		$scope.globalData.pilot =
		{
			name: '' // TODO => cookie
		};
		$scope.globalData.aircraft =
		{
			id: '', // TODO => cookie
			speed: 100,  // TODO => cookie
			consumption: 20  // TODO => cookie
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
		// init user
		var	email = getCookie("email");
		var token = getCookie("token");

		if (email && token)
			$scope.loginUser(email, token, 90)
	};
	
	
	$scope.initDisclaimer = function()
	{
		// init disclaimer
		var hideDisclaimer = getCookie("hideDisclaimer");

		if (hideDisclaimer != "1")
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
	
	
	$scope.loginUser = function(email, token, rememberDays)
	{
		setCookie("email", email, rememberDays);
		setCookie("token", token, rememberDays);
	
		$scope.globalData.user.email = email;
		$scope.globalData.user.token = token;

		$scope.readNavplanList();
		
		//TODO: read user data (name, plane, settings, etc.)

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
		
		deleteCookie("email");
		deleteCookie("token");
		
		$scope.initGlobalData();

		$scope.showSuccessMessage("User Logged out successfully!");
	};


	$scope.onDisclaimerOKClicked = function()
	{
		if ($scope.hideDisclaimer)
			setCookie("hideDisclaimer", "1", 90);
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
	};
	
	
	$scope.backupSelectedWaypoint = function()
	{
		$scope.globalData.wpBackup = {
			checkpoint: $scope.globalData.selectedWp.checkpoint,
			freq: $scope.globalData.selectedWp.freq,
			callsign: $scope.globalData.selectedWp.callsign,
			alt: $scope.globalData.selectedWp.alt
		}
	};
	
	
	$scope.restoreSelectedWaypoint = function()
	{
		$scope.globalData.selectedWp.checkpoint = $scope.globalData.wpBackup.checkpoint;
		$scope.globalData.selectedWp.freq = $scope.globalData.wpBackup.freq;
		$scope.globalData.selectedWp.callsign = $scope.globalData.wpBackup.callsign;
		$scope.globalData.selectedWp.alt = $scope.globalData.wpBackup.alt;
	};
	

	// init stuff
	$scope.initGlobalData();
	$scope.initUser();
	$scope.initDisclaimer();
}
