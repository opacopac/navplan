// js error handler
/*var errMsgShown = false;
window.onerror = function()
{
	if (!errMsgShown)
	{
		errMsgShown = true;
		var errMsg = "Oops, something went wrong. Please close this dialog and try to reload (CTRL+F5) the page.";
		alert(errMsg);
	}
};*/


// version check
var navplanVersion = "1.2k"; // should be the same as in version.txt

// ensure current version
$.get("version.txt?q=" + Math.random(),
	function(serverVersion)
	{
		if (typeof indexVersion === 'undefined' || indexVersion != serverVersion)
		{
			if (location.search.indexOf("v=" + serverVersion) == -1)
				location.replace(location.pathname + "?v=" + serverVersion + location.hash);
		}
	}
);


// init app
var navplanApp = angular.module('navplanApp', [ 'ngRoute', 'ngResource', 'ui.bootstrap' ])
	.config(routeprovider);

function routeprovider($routeProvider)
{
	$routeProvider
		.when("/",  { templateUrl: 'map/map.html?v=' + navplanVersion, controller: 'mapCtrl' })
		.when("/map",  { templateUrl: 'map/map.html?v=' + navplanVersion, controller: 'mapCtrl' })
		.when("/traffic",  { templateUrl: 'map/map.html?v=' + navplanVersion, controller: 'mapCtrl', showtraffic: true })
		.when("/waypoints",  { templateUrl: 'waypoints/waypoints.html?v=' + navplanVersion, controller: 'waypointCtrl' })
		.when("/tracks",  { templateUrl: 'tracks/tracks.html?v=' + navplanVersion, controller: 'trackCtrl' })
		.when("/login",  { templateUrl: 'login/login.html?v=' + navplanVersion, controller: 'loginCtrl' })
		.when("/forgotpw",  { templateUrl: 'forgotpw/forgotpw.html?v=' + navplanVersion, controller: 'forgotpwCtrl' })
		.when("/edituser",  { templateUrl: 'edituser/edituser.html?v=' + navplanVersion, controller: 'edituserCtrl' })
		.when("/settings",  { templateUrl: 'settings/settings.html?v=' + navplanVersion, controller: 'settingsCtrl' })
		.when("/about",  { templateUrl: 'about/about.html?v=' + navplanVersion });
}


// global data object
 navplanApp
	.factory('globalData', globalData);

function globalData()
{
	return {}; // return empty object
}
