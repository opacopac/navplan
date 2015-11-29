/**
 * Login Controller
 */

navplanApp
	.controller('loginCtrl', loginCtrl);

loginCtrl.$inject = ['$scope', 'globalData', 'loginService'];

function loginCtrl($scope, globalData, loginService)
{
	$scope.globalData = globalData;
	
    $scope.login = function()
	{
		loginService.login($scope.email, $scope.password)
			.success(function(data) {
				if (data.resultcode == 0)
				{
					if ($scope.remember == true)
						$days = 90;
					else
						$days = 0;
						
					setCookie("email", $scope.email, $days);
					setCookie("token", data.token, $days);
					$scope.globalData.user.isLoggedIn = true;
				}
			})
			.error(function(data, status) { console.error("ERROR", status, data); });
    }	
	
    $scope.register = function()
	{
		loginService.register($scope.email, $scope.password)
			.success(function(data) { return data; })
			.error(function(data, status) { console.error("ERROR", status, data); });
    }	
}
