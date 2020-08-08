// version
var navplanVersion = "1.5ak"; // must be the same as in version.txt


// js error handler
var errLogSent = false;
window.onerror = function(message, url, linenum, colnum, error)
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
			errLine: linenum,
			errColumn: colnum ? colnum : '',
			stackTrace: (error && error.stack) ? error.stack : ''
		};

		writeServerErrLog(errLog);
		logError(errLog);
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
var navplanApp = angular.module('navplanApp', [ 'ngRoute', 'ngResource', 'ui.bootstrap', 'ui.sortable' ]);


// no hash prefix (!)
navplanApp.config(['$locationProvider', function($locationProvider) {
    $locationProvider.hashPrefix("");
}]);


// route provider
navplanApp.config(function($routeProvider) {
	$routeProvider
        //.when("",  { templateUrl: 'map/map.html?v=' + navplanVersion, controller: 'mapCtrl' })
		.when("/",  { templateUrl: 'map/map.html?v=' + navplanVersion, controller: 'mapCtrl' })
		.when("/map",  { templateUrl: 'map/map.html?v=' + navplanVersion, controller: 'mapCtrl' })
		.when("/traffic",  { templateUrl: 'map/map.html?v=' + navplanVersion, controller: 'mapCtrl', showtraffic: true })
		.when("/share/:shareid",  { templateUrl: 'map/map.html?v=' + navplanVersion, controller: 'mapCtrl' })
		.when("/lonlatzoom/:lonlatzoom",  { templateUrl: 'map/map.html?v=' + navplanVersion, controller: 'mapCtrl' })
		.when("/waypoints",  { templateUrl: 'waypoints/waypoints.html?v=' + navplanVersion, controller: 'waypointCtrl' })
		.when("/tracks",  { templateUrl: 'tracks/tracks.html?v=' + navplanVersion, controller: 'trackCtrl' })
		.when("/login",  { templateUrl: 'login/login.html?v=' + navplanVersion, controller: 'loginCtrl' })
		.when("/forgotpw",  { templateUrl: 'forgotpw/forgotpw.html?v=' + navplanVersion, controller: 'forgotpwCtrl' })
		.when("/edituser",  { templateUrl: 'edituser/edituser.html?v=' + navplanVersion, controller: 'edituserCtrl' })
		.when("/settings",  { templateUrl: 'settings/settings.html?v=' + navplanVersion, controller: 'settingsCtrl' })
		.when("/about",  { templateUrl: 'about/about.html?v=' + navplanVersion });
});


// url whitelist
navplanApp.config(function($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
        // Allow same origin resource loads.
        'self',
        'https://www.aviationweather.gov/cgi-bin/json/**',
        'https://public-api.adsbexchange.com/VirtualRadar/**',
		'https://global.adsbexchange.com/VirtualRadar/**',
        'https://v4p4sz5ijk.execute-api.us-east-1.amazonaws.com/anbdata/states/notams/**'
        // Allow loading from our assets domain.  Notice the difference between * and **.
        //'http://srv*.assets.example.com/**'
    ]);
});


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
			logError(errLog);
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
