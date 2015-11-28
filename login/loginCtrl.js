/**
 * Login Controller
 */

navplanApp
	.controller('loginCtrl', [ '$scope', 'globalData', loginCtrl ]);


function loginCtrl($scope, globalData)
{
	$scope.globalData = globalData;
}
