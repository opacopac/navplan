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

	// init pilot
	$scope.globalData.pilot = { name: 'Armand' };
	
	// init aircraft
	$scope.globalData.aircraft = { id: 'HB-SRA', speed: 100, consumption: 20 };
	
	// init waypoints
	$scope.globalData.waypoints = [ ];
	$scope.globalData.alternate = { freq: '', callsign: '', checkpoint: '', mt: '', dist: '', alt: '', remark: '', latitude: null, longitude: null, isAlternate: true };
	$scope.globalData.currentIdx = -1;
	$scope.globalData.eetSum = '';

	// init fuel
	$scope.globalData.fuel = { reserve: 45, extra: '0' };
	
	// initial map position
	$scope.globalData.currentMapPos =
	{
		center: ol.proj.fromLonLat([8.3333, 46.8333]), // center of CH
		zoom: 9
	};
	
	// waypoint input field
	$scope.globalData.selectedWaypoint = undefined;
}
