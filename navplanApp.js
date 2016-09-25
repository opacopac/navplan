// version
var navplanVersion = "1.2q"; // should be the same as in version.txt


// js error handler
var errLogSent = false;
window.onerror = function(message, url, linenumber)
{
	if (!errLogSent)
	{
		errLogSent = true;
		var errLog = {
			handler: 'windown.onerror',
			verJs: navplanVersion,
			verIdx: indexVersion,
			errMsg: message,
			errUrl: url,
			errLine: linenumber
		};

		writeServerErrLog(errLog);
	}
	
	displayGenericError();
};


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

// add logging to angular exception handler
navplanApp.config(function($provide) {
	$provide.decorator("$exceptionHandler", ['$delegate', function($delegate) {
		return function(exception, cause) {
			$delegate(exception, cause);

			var errLog = {
				handler: 'angular',
				verJs: navplanVersion,
				verIdx: indexVersion,
				errMsg: exception.message,
				errCause: cause
			};

			writeServerErrLog(errLog);
		};
	}]);
});


// global data object
navplanApp
	.factory('globalData', globalData);

function globalData()
{
	return {}; // return empty object
}
