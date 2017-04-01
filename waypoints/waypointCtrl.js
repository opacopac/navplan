/**
 * Waypoint Controller
 */

navplanApp
	.controller('waypointCtrl', waypointCtrl);
	
waypointCtrl.$inject = ['$scope', '$http', 'geonameService', 'fuelService', 'userService', 'mapService', 'globalData'];

function waypointCtrl($scope, $http, geonameService, fuelService, userService, mapService, globalData) {
	$scope.globalData = globalData;
	$scope.newWp = undefined;

	
	$scope.updateOrderCallback = function(startIndex, endIndex)
	{
		var movedElement = $scope.globalData.navplan.waypoints[startIndex];
		$scope.globalData.navplan.waypoints.splice(startIndex, 1);
		$scope.globalData.navplan.waypoints.splice(endIndex, 0, movedElement);
		
		$scope.updateWaypoints();
		$scope.discardCache();
		$scope.$apply();
	};

	makeWaypointsSortable($scope.updateOrderCallback);


	$scope.loadNavplan = function()
	{
		userService.readNavplan($scope.selectedNavplanId)
			.then(
			    function(response) // success
                {
                    if (response && response.data && response.data.navplan)
                        $scope.loadNavplanToGlobalData(response.data.navplan);
                    else
                        logResponseError("ERROR reading navplan", response);
                },
			    function(response) // error
                {
                    logResponseError("ERROR reading navplan", response);
                }
            );
	};
	
	
	$scope.saveNavplan = function()
	{
		if ($scope.globalData.navplan.id)
		{
			userService.updateNavplan($scope.globalData)
                .then(
                    function(response) // success
                    {
                        if (response && response.data && response.data.success == 1) {
                            $scope.readNavplanList();
                            $scope.showSuccessMessage("Flight log successfully updated!");
                        }
                        else
                            logResponseError("ERROR updating navplan", response);
                    },
                    function(response) // error
                    {
                        logResponseError("ERROR updating navplan", response);
		    		}
                );
		}
		else
		{
			userService.createNavplan($scope.globalData)
                .then(
                    function(response) // success
                    {
                        if (response && response.data && response.data.navplan_id >= 0)
                        {
                            $scope.globalData.navplan.id = response.data.navplan_id;
                            $scope.readNavplanList();
                            $scope.showSuccessMessage("Flight log successfully saved!");
                        }
                        else
                            logResponseError("ERROR creating navplan", response);
    				},
                    function(response) // error
                    {
                        logResponseError("ERROR creating navplan", response);
	    			}
                );
		}
	};

    $scope.saveNavplanCopy = function()
    {
        $scope.globalData.navplan.id = undefined;
        $scope.saveNavplan();
    };


	$scope.deleteNavplan = function()
	{
        $scope.showRuSureMessage(
            "Delete Flight Log?",
            "Do you really want to delete this flight log?",
            function()
            {
                if ($scope.selectedNavplanId) {
                    userService.deleteNavplan($scope.selectedNavplanId)
                        .then(
                            function (response) // success
                            {
                                if (response && response.data && response.data.success == 1) {
                                    $scope.readNavplanList();
                                    $scope.showSuccessMessage("Flight log successfully deleted!");
                                }
                                else
                                    logResponseError("ERROR deleting navplan", response);
                            },
                            function (response) // error
                            {
                                logResponseError("ERROR deleting navplan", response);
                            }
                        );
                }
            }
        );
	};
	

	$scope.searchGeonamesByValue = function(val)
	{
		return geonameService.searchGeonamesByValue($http, val);
	};
	
	
	$scope.editWaypoint = function(wp)
	{
		$scope.globalData.selectedWp = wp;
		$scope.editSelectedWaypoint();
	};
	
	
	$scope.removeWaypoint = function(wp)
	{
		var idx = $scope.globalData.navplan.waypoints.indexOf(wp);
		$scope.globalData.navplan.waypoints.splice(idx, 1);
		$scope.updateWaypoints();
		$scope.discardCache();
	};
	
	
	$scope.removeAlternate = function()
	{
		$scope.globalData.navplan.alternate = undefined;
		$scope.updateWaypoints();
		$scope.discardCache();
	};


    $scope.onReverseWaypointsClicked = function ()
    {
        if ($scope.globalData.navplan.waypoints.length == 0)
            return;

        var wpTmp = [];

        for (var i = $scope.globalData.navplan.waypoints.length - 1; i >= 0; i--)
            wpTmp.push($scope.globalData.navplan.waypoints[i]);

        $scope.globalData.navplan.waypoints = [];

        for (i = 0; i < wpTmp.length; i++)
            $scope.globalData.navplan.waypoints.push(wpTmp[i]);

        $scope.updateWaypoints();
        $scope.discardCache();
    };


	$scope.onKmlClicked = function()
	{
		$scope.exportKml();
	};
	
	
	$scope.fuelByTime = function(time)
	{
		return fuelService.getFuelByTime(time, $scope.globalData.aircraft.consumption);
	};
	
	
	$scope.formatHourMin = function(minutes)
	{
		if (minutes > 0)
		{
			var h = Math.floor(minutes / 60);
			var m = minutes - h * 60;
			
			return $scope.padNumber(h) + ":" + $scope.padNumber(m);
		}
		else 
			return "";
	};
	
	
	$scope.padNumber = function(num)
	{
		if (num < 10)
			return "0" + num;
		else
			return "" + num;
	};
}


function makeWaypointsSortable(updateOrderCallback)
{
	//Helper function to keep table row from collapsing when being sorted
	var fixHelperModified = function(e, tr) {
		var $originals = tr.children();
		var $helper = tr.clone();
		$helper.children().each(function(index)
		{
		  $(this).width($originals.eq(index).width())
		});
		return $helper;
	};

	//Make diagnosis table sortable
	$('#waypoint_list tbody').sortable({
		items: '.tr_sortable',
    	helper: fixHelperModified,
		start: function(event, ui) {
			ui.item.startPos = ui.item.index();
		},
		stop: function(event,ui) {
			updateOrderCallback(ui.item.startPos, ui.item.index());
		}
	}).disableSelection();	
}