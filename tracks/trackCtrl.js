/**
 * Track Controller
 */

navplanApp
	.controller('trackCtrl', trackCtrl);

trackCtrl.$inject = ['$scope', 'userService', 'mapService', 'globalData'];

function trackCtrl($scope, userService, mapService, globalData) {
	$scope.globalData = globalData;
	$scope.lasttrack = json2obj(localStorage.getItem("lasttrack"));


	$scope.getDateString = function(timestamp)
	{
		var d = new Date(timestamp * 1000);

		return getYearMonthDayString(d) + " " + getHourMinString(d);
	};


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
							mapService.drawFlightTrack($scope.globalData.track.positions);
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
	
	
	$scope.onLastTrackSelected = function()
	{
		if ($scope.globalData.track.islasttrack)
		{
			// unselect track
			$scope.globalData.track = { positions: [] };
		}
		else
		{
			$scope.globalData.track = $scope.lasttrack;
			$scope.globalData.track.islasttrack = true;
			$scope.globalData.track.positions = unshrinkPositions($scope.lasttrack.positions);
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


	$scope.onRemoveLasttrackClicked = function()
	{
		$scope.lasttrack = undefined;
		localStorage.removeItem("lasttrack");
	};


	$scope.onSaveLasttrackClicked = function()
	{
		$scope.editTrack = {
			id: undefined,
			name: $scope.lasttrack.name,
			positions: $scope.lasttrack.positions,
			timestamp: $scope.lasttrack.timestamp,
			recorded: $scope.getDateString($scope.lasttrack.timestamp)
		};

		$('#saveTrackDialog').modal('show');
	};


	$scope.onEditTrackClicked = function(track)
	{
		$scope.editTrack = {
			id: track.id,
			name: track.name,
			positions: track.positions,
			timestamp: track.timestamp,
			recorded: $scope.getDateString(track.timestamp)
		};

		$('#saveTrackDialog').modal('show');
	};


	$scope.onSaveTrackClicked = function()
	{
		if ($scope.editTrack.id > 0)
		{
			userService.updateUserTrack($scope.editTrack.id, $scope.editTrack.name)
				.then(
					function (response) {
						if (response.data && response.data.success == 1) {
							$scope.showSuccessMessage("Track successfully updated!");
							$scope.readTrackList();
						}
						else
							console.error("ERROR updating track:", response.status, response.data);
					},
					function (response) {
						console.error("ERROR updating track:", response.status, response.data);
					}
				);
		}
		else
		{
			userService.createUserTrack($scope.editTrack.timestamp, $scope.editTrack.name, $scope.editTrack.positions)
				.then(
					function (response) {
						if (response.data && response.data.success == 1) {
							$scope.showSuccessMessage("Track successfully saved!");
							$scope.readTrackList();
							$scope.lasttrack = undefined;
							localStorage.removeItem("lasttrack");
						}
						else
							console.error("ERROR creating track:", response.status, response.data);
					},
					function (response) {
						console.error("ERROR creating track:", response.status, response.data);
					}
				);
		}
	};


	$scope.onKmlClicked = function(track)
	{
		if (track.id) // saved track
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
		}
		else // last track
		{
			$scope.globalData.track = track;
			$scope.globalData.track.positions = unshrinkPositions(track.positions);
			$scope.exportKml();
		}
	};
}