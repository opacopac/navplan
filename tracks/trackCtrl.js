/**
 * Track Controller
 */

navplanApp
	.controller('trackCtrl', trackCtrl);

trackCtrl.$inject = ['$scope', 'userService', 'mapService', 'globalData'];

function trackCtrl($scope, userService, mapService, globalData) {
	$scope.globalData = globalData;


	$scope.onTrackSelected = function (track)
	{
		if (track.id == $scope.globalData.track.id)
		{
			// unselect track
			$scope.globalData.track = { positions: [] };
		}
		else
		{
			// load track
			userService.readUserTrack(track.id)
				.then(
					function (response) {
						if (response.data && response.data.track) {
							$scope.globalData.track = response.data.track;
							$scope.globalData.track.positions = unshrinkPositions($scope.globalData.track.positions);
							mapService.updateFlightTrack($scope.globalData.track.positions);
						}
						else
							console.error("ERROR reading track:", response.status, response.data);
					},
					function (response) {
						console.error("ERROR reading track:", response.status, response.data);
					}
				);
		}
	};


	$scope.onRemoveTrackClicked = function(track)
	{
		userService.deleteUserTrack(track.id)
			.then(
				function (response) {
					if (response.data && response.data.success == 1) {
						$scope.showSuccessMessage("Track successfully deleted!");
						$scope.readTrackList();
					}
					else
						console.error("ERROR deleting track:", response.status, response.data);
				},
				function (response) {
					console.error("ERROR deleting track:", response.status, response.data);
				}
			);
	};


	$scope.onKmlClicked = function(track)
	{
		userService.readUserTrack(track.id)
			.then(
				function (response) {
					if (response.data && response.data.track) {
						$scope.globalData.track = response.data.track;
						$scope.globalData.track.positions = unshrinkPositions($scope.globalData.track.positions);
						$scope.exportKml();
					}
					else
						console.error("ERROR reading track:", response.status, response.data);
				},
				function (response) {
					console.error("ERROR reading track:", response.status, response.data);
				}
			);
	};


	$scope.getDateString = function(timestamp)
	{
		var d = new Date(timestamp * 1000);

		return getYearMonthDayString(d) + " " + getHourMinString(d);
	};
}