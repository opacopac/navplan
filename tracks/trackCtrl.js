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
							mapService.drawFlightTrack($scope.globalData.track.positions, true);
						}
						else
							logResponseError("ERROR reading track:", response);
					},
					function (response) {
                        logResponseError("ERROR reading track:", response);
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
        $scope.showRuSureMessage(
            "Delete Saved Track?",
            "Do you really want to delete this saved track?",
            function()
            {
                userService.deleteUserTrack(track.id)
                    .then(
                        function (response) {
                            if (response.data && response.data.success == 1) {
                                $scope.showSuccessMessage("Track successfully deleted!");
                                $scope.readTrackList();
                            }
                            else
                                logResponseError("ERROR deleting track", response);
                        },
                        function (response) {
                            logResponseError("ERROR deleting track", response);
                        }
                    );
            }
        );
	};


	$scope.onRemoveLasttrackClicked = function()
	{
        $scope.showRuSureMessage(
            "Remove Track?",
            "Do you really want to remove this unsaved track?",
            function()
            {
                $scope.lasttrack = undefined;
                localStorage.removeItem("lasttrack");

                $scope.showSuccessMessage("Track successfully removed!");
            }
        );
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
							logResponseError("ERROR updating track", response);
					},
					function (response) {
                        logResponseError("ERROR updating track", response);
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
							logResponseError("ERROR creating track", response);
					},
					function (response) {
                        logResponseError("ERROR creating track", response);
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
							logResponseError("ERROR reading track", response);
					},
					function (response) {
                        logResponseError("ERROR reading track", response);
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