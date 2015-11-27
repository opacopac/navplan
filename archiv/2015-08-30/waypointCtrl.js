/**
 * Waypoint Controller
 */

navplanApp
	.controller('waypointCtrl', [ '$scope', '$http', 'geonameService', 'mapService', 'globalData', waypointCtrl ]);


function waypointCtrl($scope, $http, geonameService, mapService, globalData) {
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
		
		var hiddenElement = document.createElement('a');
		hiddenElement.href = 'navplanPdf.php?data=' + encodeURIComponent(JSON.stringify(navplanData))
		hiddenElement.target = '_blank';
		hiddenElement.download = 'navplan.pdf';
		hiddenElement.click();
	}
	
	
	$scope.focusNewWpInput = function()
	{
		document.getElementById('newWpInput').focus();
	}
	

	$scope.searchGeonamesByValue = function(val)
	{
		return geonameService.searchGeonamesByValue($http, val);
	};
	
	
	$scope.onGeonameSelect = function (selectedWp)
	{
		var lat = selectedWp.latitude;
		var lon = selectedWp.longitude;
		
		$scope.newWp = {
			freq: selectedWp.frequency,
			callsign: selectedWp.callsign,
			checkpoint: selectedWp.name,
			latitude: lat,
			longitude: lon
		}


		// calc dist / bearing 
		var wps = $scope.globalData.waypoints;
		
		if (wps.length > 0)
		{
			var wps2 = [];
			wps2.push(wps[wps.length - 1]);
			wps2.push($scope.newWp);
			mapService.recalcDistBearing(wps2);
			
			$scope.newWp.dist = wps2[1].dist;
			$scope.newWp.mt = wps2[1].mt;
		}
	};
	
	
	$scope.addWaypoint = function()
	{
		var wp = {
			freq: $scope.newWp.freq,
			callsign: $scope.newWp.callsign,
			checkpoint: $scope.newWp.checkpoint,
			latitude: $scope.newWp.latitude,
			longitude: $scope.newWp.longitude,
			mt: '',
			dist: '',
			alt: '',
			remark: '',
			isAlternate: false };
		
		$scope.globalData.waypoints.push(wp);
		$scope.newWp = undefined;
		
		mapService.recalcDistBearing($scope.globalData.waypoints);
	};


	$scope.removeWaypoint = function(idx)
	{
		$scope.globalData.waypoints.splice(idx, 1);
		mapService.recalcDistBearing($scope.globalData.waypoints);
	};
	
	
	// mt formatter
	$scope.formatMt = function(wp)
	{
		if (!wp || !wp.mt || wp.mt.length > 3)
			return;
		
		var mt_num = parseInt(wp.mt);
		
		if (isNaN(mt_num))
			return;
		else
			mt_num += '';
		
		wp.mt = Array(4-mt_num.length).join("0") + mt_num;
	};
	
	
	// dist formatter
	$scope.formatDist = function(wp)
	{
		if (!wp || !wp.dist)
			return;
		
		var dist_num = parseFloat(wp.dist);
		
		if (isNaN(dist_num))
			return;
			
		wp.dist = Math.round(dist_num);
	};

	
	// calc eet
	$scope.calcEet = function(wp)
	{
		if (!wp || !wp.dist || wp.dist <= 0)
			return '';

		if (!$scope.globalData.aircraft || !$scope.globalData.aircraft.speed || $scope.globalData.aircraft.speed <= 0)
			return '';

		var dist_num = parseFloat(wp.dist);
		
		if (isNaN(dist_num))
			return '';

		eet = Math.round(Math.round(dist_num) / $scope.globalData.aircraft.speed * 60);

/*		if (wp.isAlternate || wp.mt.toUpperCase().indexOf("VAC") >= 0)
			return eet + '/+5';
		else*/
			return eet;
	};


	// TODO: deprecated?	
	$scope.alternateTime = function()
	{
		return Math.round($scope.globalData.alternate.dist / $scope.globalData.aircraft.speed * 60 + 5);
	};
	

	// TODO: deprecated?	
	$scope.updateEetSum = function()
	{
		return;
		/*
		var sumEet = 0;
		var countVac = 0;
		$scope.eetSum = '';
		
		if (!$scope.aircraft || !$scope.aircraft.speed || $scope.aircraft.speed <= 0)
			return;

		for (i = 0; i < $scope.waypoints.length; i++)
		{
			wp = $scope.waypoints[i];
			
			if (wp.mt.toUpperCase().indexOf("VAC") >= 0)
				countVac++;

			var dist_num = parseInt(wp.dist);
			
			if (!isNaN(dist_num))
				sumEet += Math.round(dist_num / $scope.aircraft.speed * 60);
		}
		
		if (sumEet <= 0)
			return;

		$scope.eetSum = sumEet + countVac * 5;*/
	}


	// set initial focus
	$scope.focusNewWpInput();
}
