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
			.then(
			    function(response) // success
                {
                    if (response.data.resultcode == 0)
                    {
                        $scope.loginUser($scope.email, response.data.token, $scope.rememberMeChecked);

                        $location.path("/map");
                    }
                    else if (response.data.resultcode == -1)
                        $scope.showErrorMessage("Wrong password!");
                    else if (response.data.resultcode == -2)
                        $scope.showErrorMessage("Email not found!");
			    },
                function(response)
                {
                    logResponseError("ERROR performing login", response);
                }
            );
	};
	
    $scope.onRegisterClicked = function()
	{
		userService.register($scope.email, $scope.password)
			.then(
			    function(response)
                {
                    if (response.data.resultcode == 0)
                    {
                        $scope.loginUser($scope.email, response.data.token, $scope.rememberMeChecked);

                        $location.path("/map");
                    }
                    else if (response.data.resultcode == -1)
                        $scope.showErrorMessage("Email already exists!");
			    },
			    function(response)
                {
                    logResponseError("ERROR registering user", response);
                }
            );
    };
}
