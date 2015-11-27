/**
 * Fuel Controller
 */

navplanApp
	.controller('fuelCtrl', [ '$scope', 'globalData', fuelCtrl ]);


function fuelCtrl($scope, globalData) {
	$scope.globalData = globalData;
	
	// set initial focus
	document.getElementById('extraFuelInput').focus();

	
	$scope.fuelByTime = function(time)
	{
		return Math.round(time / 60 * $scope.globalData.aircraft.consumption);
	};
	

	$scope.alternateTime = function()
	{
		return Math.round($scope.globalData.alternate.dist / $scope.globalData.aircraft.speed * 60 + 5);
	};
	
	
	$scope.calcEetSum = function()
	{
		if (!$scope.globalData.aircraft || !$scope.globalData.aircraft.speed || $scope.globalData.aircraft.speed <= 0)
			return;
			
		var sumEet = 0;
		var countVac = 0;

		for (i = 0; i < $scope.globalData.waypoints.length; i++)
		{
			wp = $scope.globalData.waypoints[i];
			
//			if (wp.mt.toUpperCase().indexOf("VAC") >= 0)
//				countVac++;

			if (!isNaN(wp.dist))
				sumEet += Math.round(wp.dist / $scope.globalData.aircraft.speed * 60);
		}
		
		if (sumEet <= 0)
			return;

		return sumEet + countVac * 5;
	}

	
	// initially calc eet sum
	$scope.eetSum = $scope.calcEetSum();
}
