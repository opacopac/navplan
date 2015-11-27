/**
 * Navplan App
 */
 
var navplanApp = 
	angular.module('navplanApp', [ 'ngRoute', 'ngResource', 'ui.bootstrap' ])
	.config(routeprovider);

function routeprovider($routeProvider)
{
	$routeProvider
		.when("/",  { templateUrl: 'map.html', controller: 'mapCtrl' })
		.when("/map",  { templateUrl: 'map.html', controller: 'mapCtrl' })
		.when("/waypoints",  { templateUrl: 'waypoints.html', controller: 'waypointCtrl' })
		.when("/aircraft",  { templateUrl: 'aircraft.html', controller: 'aircraftCtrl' })
		.when("/fuel",  { templateUrl: 'fuel.html', controller: 'fuelCtrl' })
		.when("/about",  { templateUrl: 'about.html' });
}
