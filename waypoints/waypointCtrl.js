/**
 * Waypoint Controller
 */

navplanApp
	.controller('waypointCtrl', waypointCtrl);
	
waypointCtrl.$inject = ['$scope', '$http', '$timeout', 'geonameService', 'mapService', 'waypointService', 'fuelService', 'userService', 'globalData'];

function waypointCtrl($scope, $http, $timeout, geonameService, mapService, waypointService, fuelService, userService, globalData) {
	$scope.globalData = globalData;
	$scope.newWp = undefined;
	
	
	$scope.showSuccessMessage = function(text)
	{
		$scope.success_alert_message = text;
		
		$timeout(function () { $scope.success_alert_message = ""; }, 3000, true);
	}
	
	
	$scope.createPdfNavplan = function()
	{
		var navplanData = {
			waypoints: $scope.globalData.navplan.waypoints,
			fuel: $scope.globalData.fuel,
			pilot: $scope.globalData.pilot,
			aircraft: $scope.globalData.aircraft
		};
		
		var pdfLink = document.getElementById("dlPdfLink");
		pdfLink.href = 'php/navplanPdf.php?data=' + encodeURIComponent(JSON.stringify(navplanData))
	}
	
	
	$scope.createExcelNavplan = function()
	{
		var navplanData = {
			waypoints: $scope.globalData.navplan.waypoints,
			fuel: $scope.globalData.fuel,
			pilot: $scope.globalData.pilot,
			aircraft: $scope.globalData.aircraft
		};
		
		var excelLink = document.getElementById("dlExcelLink");
		excelLink.href = 'php/navplanExcel.php?data=' + encodeURIComponent(JSON.stringify(navplanData))
	}
	
	
	$scope.loadNavplan = function()
	{
		userService.readNavplan($scope.selectedNavplanId, $scope.globalData.user.email, $scope.globalData.user.token)
			.success(function(data) {
				if (data.navplan)
				{
					// general data
					$scope.globalData.navplan.id = data.navplan.id;
					$scope.globalData.navplan.title = data.navplan.title;
					$scope.globalData.aircraft.speed = data.navplan.aircraft_speed;
					$scope.globalData.aircraft.consumption = data.navplan.aircraft_consumption;
					$scope.globalData.fuel.extraTime = data.navplan.extra_fuel;
					
					// waypoints
					$scope.globalData.navplan.waypoints = [ ];
					
					if (data.navplan.waypoints)
					{
						for (i = 0; i < data.navplan.waypoints.length; i++)
						{
							wp = data.navplan.waypoints[i];
						
							wp2 = {
								type: wp.type,
								freq: wp.freq,
								callsign: wp.callsign,
								checkpoint: wp.checkpoint,
								latitude: wp.latitude,
								longitude: wp.longitude,
								mt: '',
								dist: '',
								alt: wp.alt,
								remark: wp.remark
							};
							
							$scope.globalData.navplan.waypoints.push(wp2);
						}
					}

					$scope.updateWpList();
				}
				else
					console.error("ERROR", data);
			})
			.error(function(data, status) {
				console.error("ERROR", status, data);
			});
	}
	
	
	$scope.saveNavplan = function()
	{
		if ($scope.globalData.navplan.id)
		{
			userService.updateNavplan($scope.globalData)
				.success(function(data) {
					if (data.success == 1)
					{
						$scope.readNavplanList();
						$scope.showSuccessMessage("Navplan successfully saved!");
					}
					else
						console.error("ERROR", data);
				})
				.error(function(data, status) {
					console.error("ERROR", status, data);
				});
		}
		else
		{
			userService.createNavplan($scope.globalData)
				.success(function(data) {
					if (data.navplan_id >= 0)
					{
						$scope.globalData.navplan.id = data.navplan_id
						$scope.readNavplanList();
					}
					else
						console.error("ERROR", data);
				})
				.error(function(data, status) {
					console.error("ERROR", status, data);
				});
		}
	}


	$scope.deleteNavplan = function()
	{
		if ($scope.selectedNavplanId)
		{
			userService.deleteNavplan($scope.selectedNavplanId, $scope.globalData.user.email, $scope.globalData.user.token)
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
	}
	

	$scope.searchGeonamesByValue = function(val)
	{
		return geonameService.searchGeonamesByValue($http, val);
	};
	
	
	$scope.editWaypoint = function(wp)
	{
		$scope.globalData.selectedWp = wp;
		$scope.editSelectedWaypoint();
	};
	
	
	$scope.removeWaypoint = function(idx)
	{
		$scope.globalData.navplan.waypoints.splice(idx, 1);
		$scope.updateWpList();
	};
}
