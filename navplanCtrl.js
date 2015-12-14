/**
 * Main Controller
 */

navplanApp
	.controller('navplanCtrl', navplanCtrl);

navplanCtrl.$inject = ['$scope', 'globalData', 'userService'];

function navplanCtrl($scope, globalData, userService)
{
	// init global data object
	$scope.globalData = globalData;

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
	

	// globally used functions
	
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

	
	// init user
	var	email = getCookie("email");
	var token = getCookie("token");

	if (email && token)
		$scope.loginUser(email, token, 90)

		
	// init disclaimer
	var hideDisclaimer = getCookie("hideDisclaimer");

	if (hideDisclaimer != "1")
		$('#disclaimerDialog').modal('show');


	$scope.onDisclaimerOKClicked = function()
	{
		if ($scope.hideDisclaimer)
			setCookie("hideDisclaimer", "1", 90);
	}

	
	$scope.onLogoutClicked = function()
	{
		$scope.logoutUser();
	}
}
