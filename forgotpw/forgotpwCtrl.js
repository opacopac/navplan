/**
 * Forgot PW Controller
 */

navplanApp
	.controller('forgotpwCtrl', forgotpwCtrl);
	
forgotpwCtrl.$inject = ['$scope', 'globalData', 'userService'];

function forgotpwCtrl($scope, globalData, userService)
{
	$scope.globalData = globalData;
	
	$scope.onReqPwClicked = function()
	{
		userService.forgotPassword($scope.email)
			.then(
			    function(response) // success
                {
                    if (response.data.resultcode == 0)
                    {
                        $scope.showSuccessMessage("A new password has be sent to your email");
                    }
                    else if (response.data.resultcode == -2)
                        $scope.showErrorMessage("Email not found!");
    			},
                function(response) // error
                {
                    logResponseError("ERROR sending new pw", response);
                }
            );
	}
}
