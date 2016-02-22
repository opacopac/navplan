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
			.success(function(data) {
				if (data.resultcode == 0)
				{
					$scope.showSuccessMessage("A new password has be sent to your email");
				}
				else if (data.resultcode == -2)
					$scope.showErrorMessage("Email not found!");
			})
			.error(function(data, status) {
				console.error("ERROR", status, data);
			});
	}
}
