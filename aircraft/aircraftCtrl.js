/**
 * Aircraft Controller
 */

navplanApp
	.controller('aircraftCtrl', [ '$scope', 'globalData', aircraftCtrl ]);


function aircraftCtrl($scope, globalData)
{
	$scope.globalData = globalData;
}
