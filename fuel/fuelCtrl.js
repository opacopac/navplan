/**
 * Fuel Controller
 */

navplanApp
	.controller('fuelCtrl', [ '$scope', 'fuelService', 'globalData', fuelCtrl ]);


function fuelCtrl($scope, fuelService, globalData) {
	$scope.globalData = globalData;
	
	// set initial focus
	document.getElementById('extraFuelInput').focus();

	
	$scope.fuelByTime = function(time)
	{
		return fuelService.getFuelByTime(time, $scope.globalData.aircraft.consumption);
	};

	
	// initially calc fuel
	fuelService.updateFuelCalc($scope.globalData.fuel, $scope.globalData.navplan.waypoints, $scope.globalData.aircraft);
}
