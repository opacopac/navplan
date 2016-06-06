/**
 * Navplan App
 */
 
var navplanApp = angular.module('navplanApp', [ 'ngRoute', 'ngResource', 'ui.bootstrap' ])
	.config(routeprovider);

function routeprovider($routeProvider)
{
	$routeProvider
		.when("/",  { templateUrl: 'map/map.html', controller: 'mapCtrl' })
		.when("/map",  { templateUrl: 'map/map.html', controller: 'mapCtrl' })
		.when("/traffic",  { templateUrl: 'map/map.html', controller: 'mapCtrl', showtraffic: true })
		.when("/waypoints",  { templateUrl: 'waypoints/waypoints.html', controller: 'waypointCtrl' })
		.when("/tracks",  { templateUrl: 'tracks/tracks.html', controller: 'trackCtrl' })
		.when("/login",  { templateUrl: 'login/login.html', controller: 'loginCtrl' })
		.when("/forgotpw",  { templateUrl: 'forgotpw/forgotpw.html', controller: 'forgotpwCtrl' })
		.when("/edituser",  { templateUrl: 'edituser/edituser.html', controller: 'edituserCtrl' })
		.when("/settings",  { templateUrl: 'settings/settings.html', controller: 'settingsCtrl' })
		.when("/about",  { templateUrl: 'about/about.html' });
}

/**
 * Global Data
 */

 navplanApp
	.factory('globalData', globalData);

function globalData()
{
	return {}; // return empty object
}
