/**
 * Edit User Controller
 */

navplanApp
	.controller('edituserCtrl', edituserCtrl);
	
edituserCtrl.$inject = ['$scope', '$location', 'globalData', 'userService'];

function edituserCtrl($scope, $location, globalData, userService)
{
	$scope.globalData = globalData;
	
	$scope.onLogoffClicked = function()
	{
		$scope.logoutUser();
		$location.path("/map");
	}
	
	$scope.onChangePwClicked = function()
	{
		userService.updatePassword($scope.globalData.user.email, $scope.oldpassword, $scope.newpassword)
			.success(function(data) {
				if (data.resultcode == 0)
					$scope.showSuccessMessage("Password sucessfully updated");
				else if (data.resultcode == -1)
					$scope.showErrorMessage("Wrong password!");
				else if (data.resultcode == -2)
					$scope.showErrorMessage("Email not found!");
			})
			.error(function(data, status) {
				console.error("ERROR", status, data);
			});
	}
}
