var navplanVersion = "1.2f"; // should be the same as in version.txt

// ensure current version
$.get("version.txt?q=" + Math.random(),
	function(serverVersion)
	{
		if (typeof indexVersion === 'undefined' || indexVersion != serverVersion)
		{
			if (location.search.indexOf("v=" + serverVersion) == -1)
			{
				var search = location.search.length == 0 ? "?v=" + serverVersion : location.search + "&v=" + serverVersion;
				location.replace(location.pathname + search + location.hash);
			}
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
