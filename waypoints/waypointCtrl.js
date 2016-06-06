/**
 * Waypoint Controller
 */

navplanApp
	.controller('waypointCtrl', waypointCtrl);
	
waypointCtrl.$inject = ['$scope', '$http', 'geonameService', 'fuelService', 'userService', 'globalData'];

function waypointCtrl($scope, $http, geonameService, fuelService, userService, globalData) {
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

	
	$scope.createPdfNavplan = function()
	{
		var navplanData = $scope.getNavplanExportData();
		
		sendPostForm('php/navplanPdf.php', '_blank', 'data', JSON.stringify(navplanData));
	};
	
	
	$scope.createExcelNavplan = function()
	{
		var navplanData = $scope.getNavplanExportData();
		
		sendPostForm('php/navplanExcel.php', '_blank', 'data', JSON.stringify(navplanData));
	};


	$scope.getNavplanExportData = function ()
	{
		var waypoints = [];

		for (var i = 0; i < $scope.globalData.navplan.waypoints.length; i++)
			waypoints.push(getWaypointData($scope.globalData.navplan.waypoints[i]));


		return {
			waypoints: waypoints,
			alternate: $scope.globalData.navplan.alternate ? getWaypointData($scope.globalData.navplan.alternate) : undefined,
			fuel: $scope.globalData.fuel,
			pilot: $scope.globalData.pilot,
			aircraft: $scope.globalData.aircraft
		};


		function getWaypointData(wp)
		{
			return {
				freq: wp.freq,
				callsign: wp.callsign,
				checkpoint: wp.checkpoint,
				mtText: wp.mtText,
				distText: wp.distText,
				alt: wp.alt,
				isminalt: wp.isminalt,
				ismaxalt: wp.ismaxalt,
				eetText: wp.eetText,
				remark: wp.remark
			};
		};
	};


	$scope.loadNavplan = function()
	{
		userService.readNavplan($scope.selectedNavplanId)
			.success(function(data) {
				if (data.navplan)
				{
					// general data
					$scope.globalData.navplan.id = data.navplan.id;
					$scope.globalData.navplan.title = data.navplan.title;
					$scope.globalData.aircraft.speed = data.navplan.aircraft_speed;
					$scope.globalData.aircraft.consumption = data.navplan.aircraft_consumption;
					$scope.globalData.fuel.extraTime = data.navplan.extra_fuel;
					$scope.globalData.navplan.alternate = undefined; // TODO
					
					// waypoints
					$scope.globalData.navplan.waypoints = [ ];
					var wp;

					if (data.navplan.waypoints)
					{
						for (var i = 0; i < data.navplan.waypoints.length; i++)
						{
							wp = $scope.getWaypointFromData(data.navplan.waypoints[i]);
							$scope.globalData.navplan.waypoints.push(wp);
						}
					}

					// alternate
					$scope.globalData.navplan.alternate = undefined;

					if (data.navplan.alternate)
					{
						wp = $scope.getWaypointFromData(data.navplan.alternate);
						$scope.globalData.navplan.alternate = wp;
					}

					$scope.updateWaypoints();
					$scope.discardCache();
				}
				else
					console.error("ERROR", data);
			})
			.error(function(data, status) {
				console.error("ERROR", status, data);
			});
	};
	
	
	$scope.getWaypointFromData = function (wp_data)
	{
		return {
			type: wp_data.type,
			freq: wp_data.freq,
			callsign: wp_data.callsign,
			checkpoint: wp_data.checkpoint,
			airport_icao: wp_data.airport_icao,
			latitude: wp_data.latitude,
			longitude: wp_data.longitude,
			charts: wp_data.charts,
			webcams: wp_data.webcams,
			mt: '',
			dist: '',
			alt: wp_data.alt,
			isminalt: wp_data.isminalt,
			ismaxalt: wp_data.ismaxalt,
			remark: wp_data.remark
		};
	};
	
	
	$scope.saveNavplan = function()
	{
		if ($scope.globalData.navplan.id)
		{
			userService.updateNavplan($scope.globalData)
				.success(function(data) {
					if (data.success == 1)
					{
						$scope.readNavplanList();
						$scope.showSuccessMessage("Navplan successfully updated!");
					}
					else
						console.error("ERROR updating navplan", data);
				})
				.error(function(data, status) {
					console.error("ERROR updating navplan", status, data);
				});
		}
		else
		{
			userService.createNavplan($scope.globalData)
				.success(function(data) {
					if (data.navplan_id >= 0)
					{
						$scope.globalData.navplan.id = data.navplan_id;
						$scope.readNavplanList();
						$scope.showSuccessMessage("Navplan successfully saved!");
					}
					else
						console.error("ERROR creating navplan", data);
				})
				.error(function(data, status) {
					console.error("ERROR creating navplan", status, data);
				});
		}
	};


	$scope.deleteNavplan = function()
	{
		if ($scope.selectedNavplanId)
		{
			userService.deleteNavplan($scope.selectedNavplanId)
				.success(function(data) {
					if (data.success == 1)
					{
						$scope.readNavplanList();
						$scope.showSuccessMessage("Navplan successfully deleted!");
					}
					else
						console.error("ERROR", data);
				})
				.error(function(data, status) {
					console.error("ERROR", status, data);
				});
		}
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