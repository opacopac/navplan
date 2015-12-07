/**
 * Login Controller
 */

navplanApp
	.controller('loginCtrl', loginCtrl);

loginCtrl.$inject = ['$scope', 'globalData', 'userService'];

function loginCtrl($scope, globalData, userService)
{
	$scope.globalData = globalData;
	
    $scope.onLoginClicked = function()
	{
		userService.login($scope.email, $scope.password)
			.success(function(data) {
				if (data.resultcode == 0)
				{
					if ($scope.rememberMeChecked == true)
						rememberDays = 90;
					else
						rememberDays = 0;
						
					$scope.loginUser($scope.email, data.token, rememberDays);
				}
			})
			.error(function(data, status) { console.error("ERROR", status, data); });
    }	
	
    $scope.onRegisterClicked = function()
	{
		userService.register($scope.email, $scope.password)
			.success(function(data) { return data; })
			.error(function(data, status) { console.error("ERROR", status, data); });
    }	
}
