/**
 * Settings Controller
 */

navplanApp
	.controller('settingsCtrl', [ '$scope', 'globalData', settingsCtrl ]);


function settingsCtrl($scope, globalData)
{
	$scope.globalData = globalData;
}
