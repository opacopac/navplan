/**
 * Waypoint Controller
 */

navplanApp
	.controller('waypointCtrl', waypointCtrl);
	
waypointCtrl.$inject = ['$scope', '$http', 'geonameService', 'mapService', 'waypointService', 'fuelService', 'userService', 'globalData'];

function waypointCtrl($scope, $http, geonameService, mapService, waypointService, fuelService, userService, globalData) {
	$scope.globalData = globalData;
	$scope.newWp = undefined;

	
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
						// TODO: success message
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

						// TODO: success message
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
						// TODO: success message

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
	
	$scope.focusNewWpInput = function()
	{
		document.getElementById('newWpInput').focus();
	}
	

	$scope.searchGeonamesByValue = function(val)
	{
		return geonameService.searchGeonamesByValue($http, val);
	};
	
	
	// geopoint selected from search results
	$scope.onGeonameSelect = function (selectedWp)
	{
		$scope.newWp = {
			type: selectedWp.type,
			freq: selectedWp.frequency,
			callsign: selectedWp.callsign,
			checkpoint: selectedWp.wpname,
			latitude: selectedWp.latitude,
			longitude: selectedWp.longitude
		}


		// calc dist / bearing 
		var wps = $scope.globalData.navplan.waypoints;
		
		if (wps.length > 0)
		{
			var wp1 = wps[wps.length - 1];
			var wp2 = $scope.newWp;
			
			$scope.newWp.dist = mapService.getDistance(wp1.latitude, wp1.longitude, wp2.latitude, wp2.longitude);
			$scope.newWp.mt = mapService.getBearing(wp1.latitude, wp1.longitude, wp2.latitude, wp2.longitude, $scope.globalData.settings.variation);
		}
	};
	
	
	$scope.updateWpList = function()
	{
		waypointService.updateWpList($scope.globalData.navplan.waypoints, $scope.globalData.settings.variation, $scope.globalData.aircraft.speed);
		fuelService.updateFuelCalc($scope.globalData.fuel, $scope.globalData.navplan.waypoints, $scope.globalData.aircraft);
	}
	
	
	$scope.addWaypoint = function()
	{
		var wp = {
			type: $scope.newWp.type,
			freq: $scope.newWp.freq,
			callsign: $scope.newWp.callsign,
			checkpoint: $scope.newWp.checkpoint,
			latitude: $scope.newWp.latitude,
			longitude: $scope.newWp.longitude,
			mt: '',
			dist: '',
			alt: '',
			remark: ''
		};
		
		$scope.globalData.navplan.waypoints.push(wp);
		$scope.newWp = undefined;
		
		$scope.updateWpList();
	};


	$scope.removeWaypoint = function(idx)
	{
		$scope.globalData.navplan.waypoints.splice(idx, 1);
		$scope.updateWpList();
	};
	
	
	// set initial focus
	$scope.focusNewWpInput();
}
