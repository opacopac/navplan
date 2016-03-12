/**
 * Login Controller
 */

navplanApp
	.controller('loginCtrl', loginCtrl);

loginCtrl.$inject = ['$scope', '$location', 'globalData', 'userService'];

function loginCtrl($scope, $location, globalData, userService)
{
	$scope.globalData = globalData;
	
    $scope.onLoginClicked = function()
	{
		userService.login($scope.email, $scope.password)
			.success(function(data) {
				if (data.resultcode == 0)
				{
					var rememberDays;

					if ($scope.rememberMeChecked == true)
						rememberDays = 90;
					else
						rememberDays = 0;
						
					$scope.loginUser($scope.email, data.token, rememberDays);
					
					$location.path("/map");
				}
				else if (data.resultcode == -1)
					$scope.showErrorMessage("Wrong password!");
				else if (data.resultcode == -2)
					$scope.showErrorMessage("Email not found!");
			})
			.error(function(data, status) {
				console.error("ERROR", status, data);
			});
	};
	
    $scope.onRegisterClicked = function()
	{
		userService.register($scope.email, $scope.password)
			.success(function(data) {
				if (data.resultcode == 0)
				{
					var rememberDays;

					if ($scope.rememberMeChecked == true)
						rememberDays = 90;
					else
						rememberDays = 0;
						
					$scope.loginUser($scope.email, data.token, rememberDays);
					
					$location.path("/map");
				}
				else if (data.resultcode == -1)
					$scope.showErrorMessage("Email already exists!");
			})
			.error(function(data, status) { console.error("ERROR", status, data); });
    };
}
