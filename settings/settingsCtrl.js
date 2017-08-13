/**
 * Settings Controller
 */

navplanApp
	.controller('settingsCtrl', [ '$scope', 'globalData', settingsCtrl ]);


function settingsCtrl($scope, globalData)
{
	$scope.globalData = globalData;

	$scope.getClickHistoryString = function()
	{
		var history = '';
		
		for (var i = 0; i < $scope.globalData.clickHistory.length; i++)
		{
			if (i > 0)
				history += ", ";
			
			history += roundToDigits($scope.globalData.clickHistory[i][0], 4) + " " + roundToDigits($scope.globalData.clickHistory[i][1], 4);
		}

		return history;
	};


    $scope.getRoutePolygonString = function()
    {
        var polyCoordList = [];

        for (var i = 0; i < $scope.globalData.navplan.waypoints.length; i++)
        {
            var wp = $scope.globalData.navplan.waypoints[i];
            polyCoordList.push(wp.longitude + " " + wp.latitude);
        }

        return polyCoordList.join(",");
    }
}
