// version check
var navplanVersion = "1.2b";

/*$.get("version.txt?q=" + Math.random(),
	function(serverVersion)
	{
		if (typeof indexVersion === 'undefined' || indexVersion != serverVersion)
		{
			//alert("index: " + navplanVersion + " php: " + serverVersion);
			//window.location.reload(true);
		}
	}
);*/


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
