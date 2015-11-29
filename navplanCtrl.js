/**
 * Global Data
 */
navplanApp
	.factory('globalData', globalData);

function globalData()
{
	return {}; // return empty object
}


/**
 * Main Controller
 */

navplanApp
	.controller('navplanCtrl', [ '$scope', 'globalData', navplanCtrl ]);


function navplanCtrl($scope, globalData)
{
	$scope.globalData = globalData;
	
	// init user
	var	$email = getCookie("email");
	var $token = getCookie("token");

	$scope.globalData.user =
	{
		email: $email,
		token: $token,
		isLoggedIn: $email && $token
	}
		
	// init disclaimer
	var hideDisclaimer = getCookie("hideDisclaimer");

	if (hideDisclaimer != "1")
		$('#disclaimerDialog').modal('show');

	// init pilot
	$scope.globalData.pilot = { name: 'Armand' };
	
	// init aircraft
	$scope.globalData.aircraft = { id: 'HB-SRA', speed: 100, consumption: 20 };
	
	// init waypoints
	$scope.globalData.waypoints = [ ];
	$scope.globalData.currentIdx = -1;
	$scope.globalData.eetSum = '';

	// init fuel
	$scope.globalData.fuel = { tripTime: 0, alternatTime: 0, reserveTime: 45, extraTime: 0 };
	
	// init settings
	$scope.globalData.settings = { variation: 2 };
	
	// initial map position
	$scope.globalData.currentMapPos =
	{
		//center: ol.proj.fromLonLat([8.3333, 46.8333]), // center of CH
		//zoom: 9
		center: ol.proj.fromLonLat([7.4971, 46.9141]), // LSZB
		zoom: 11
	};
	
	// waypoint input field
	$scope.globalData.selectedWaypoint = undefined;
	
	
	$scope.onDisclaimerOKClicked = function()
	{
		if ($scope.hideDisclaimer)
			setCookie("hideDisclaimer", "1", 90);
	}
	
	$scope.onLogoutClicked = function()
	{
		$scope.globalData.user.email = "";
		$scope.globalData.user.token = "";
		$scope.globalData.user.isLoggedIn = false;
		
		deleteCookie("email");
		deleteCookie("token");
	}
}

