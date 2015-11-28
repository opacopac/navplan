/**
 * Waypoint Controller
 */

navplanApp
	.controller('waypointCtrl', [ '$scope', '$http', 'geonameService', 'mapService', 'waypointService', 'fuelService', 'globalData', waypointCtrl ]);


function waypointCtrl($scope, $http, geonameService, mapService, waypointService, fuelService, globalData) {
	$scope.globalData = globalData;
	$scope.newWp = undefined;

	
	$scope.createPdfNavplan = function()
	{
		var navplanData = {
			waypoints: $scope.globalData.waypoints,
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
			waypoints: $scope.globalData.waypoints,
			fuel: $scope.globalData.fuel,
			pilot: $scope.globalData.pilot,
			aircraft: $scope.globalData.aircraft
		};
		
		var excelLink = document.getElementById("dlExcelLink");
		excelLink.href = 'php/navplanExcel.php?data=' + encodeURIComponent(JSON.stringify(navplanData))
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
		var wps = $scope.globalData.waypoints;
		
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
		waypointService.updateWpList($scope.globalData.waypoints, $scope.globalData.settings.variation, $scope.globalData.aircraft.speed);
		fuelService.updateFuelCalc($scope.globalData.fuel, $scope.globalData.waypoints, $scope.globalData.aircraft);
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
		
		$scope.globalData.waypoints.push(wp);
		$scope.newWp = undefined;
		
		$scope.updateWpList();
	};


	$scope.removeWaypoint = function(idx)
	{
		$scope.globalData.waypoints.splice(idx, 1);
		$scope.updateWpList();
	};
	
	
	// set initial focus
	$scope.focusNewWpInput();
}
