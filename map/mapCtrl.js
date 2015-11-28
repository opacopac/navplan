/**
 * Map Controller
 */

navplanApp
	.controller('mapCtrl', [ '$scope', '$http', '$resource', 'mapService', 'geonameService', 'waypointService', 'userWaypointService', 'fuelService', 'globalData', mapCtrl ]);


function mapCtrl($scope, $http, $resource, mapService, geonameService, waypointService, userWaypointService, fuelService, globalData) {
	$scope.globalData = globalData;
	$scope.selectedWp = undefined;

	
	$scope.focusSearchWpInput = function()
	{
		document.getElementById('searchWpInput').focus();
	}
	

	$scope.searchGeonamesByValue = function(val)
	{
		return geonameService.searchGeonamesByValue($http, val);
	};

	
	$scope.updateTrack = function()
	{
		waypointService.updateWpList($scope.globalData.waypoints, $scope.globalData.settings.variation, $scope.globalData.aircraft.speed);
		fuelService.updateFuelCalc($scope.globalData.fuel, $scope.globalData.waypoints, $scope.globalData.aircraft);
		mapService.updateTrack($scope.globalData.waypoints);
	}
	

	// select geopoint from search 
	$scope.onGeonameSelect = function ($item)
	{
		$scope.globalData.selectedWaypoint = {
			type: $item.type,
			freq: $item.frequency,
			callsign: $item.callsign,
			checkpoint: $item.wpname,
			latitude: $item.latitude,
			longitude: $item.longitude
		}
		
		mapService.setMapPosition($item.latitude, $item.longitude, 12);
		mapService.drawGeopointSelection([ $item ], [0, 0]);
	};
	
	
	// adding geopoint from search with (+) sign 
	$scope.onGeonameAdd = function()
	{
		var wp = {
			type: $scope.globalData.selectedWaypoint.type,
			freq: $scope.globalData.selectedWaypoint.freq,
			callsign: $scope.globalData.selectedWaypoint.callsign,
			checkpoint: $scope.globalData.selectedWaypoint.checkpoint,
			latitude: $scope.globalData.selectedWaypoint.latitude,
			longitude: $scope.globalData.selectedWaypoint.longitude,
			mt: '',
			dist: '',
			alt: '',
			remark: ''
		};
			
		$scope.addWaypoint(wp);
		
		$scope.globalData.selectedWaypoint = undefined;
	}

	
	$scope.onMapClicked = function(event, clickCoordinates, maxRadius)
	{
		geonameService.resource.get({ lat: clickCoordinates[1], lon: clickCoordinates[0], rad: maxRadius }, function(data) {
			if (!data.geonames)
				data.geonames = [];

			mapService.drawGeopointSelection(data.geonames, event.pixel);
		});
	}
	
	
	$scope.onFeatureSelected = function(event, feature)
	{
		if (feature.geopoint)
		{
			var wp = {
				type: feature.geopoint.type,
				freq: feature.geopoint.frequency,
				callsign: feature.geopoint.callsign,
				checkpoint: feature.geopoint.wpname,
				latitude: feature.geopoint.latitude,
				longitude: feature.geopoint.longitude,
				mt: '',
				dist: '',
				alt: '',
				remark: ''
			};
				
			$scope.addWaypoint(wp);
		}
		else if (feature.airport)
		{
			var wp = {
				type: 'airport',
				freq: feature.airport.frequency,
				callsign: feature.airport.callsign,
				checkpoint: feature.airport.icao,
				latitude: feature.airport.latitude,
				longitude: feature.airport.longitude,
				mt: '',
				dist: '',
				alt: '',
				remark: '' };
				
			$scope.addWaypoint(wp);
		}
		else if (feature.navaid)
		{
			var wp = {
				type: 'navaid',
				freq: feature.navaid.frequency,
				callsign: feature.navaid.kuerzel,
				checkpoint: feature.navaid.kuerzel + ' ' + feature.navaid.type,
				latitude: feature.navaid.latitude,
				longitude: feature.navaid.longitude,
				mt: '',
				dist: '',
				alt: '',
				remark: '' };
				
			$scope.addWaypoint(wp);
		}
		else if (feature.userWaypoint)
		{
			var wp = {
				type: 'user',
				freq: '',
				callsign: '',
				checkpoint: feature.userWaypoint.name,
				latitude: feature.userWaypoint.latitude,
				longitude: feature.userWaypoint.longitude,
				mt: '',
				dist: '',
				alt: '',
				remark: feature.userWaypoint.remark };
				
			$scope.addWaypoint(wp);
		}
		else if (feature.waypoint)
		{
			$scope.selectedWp = feature.waypoint;
			$scope.selectedWp.type = "user";
			$scope.saveUserWp = false;
			$scope.$apply();
			
			$('#selectedWaypointDialog').modal('show');
		}
	}
	
	
	$scope.onMapMoveEnd = function(event)
	{
		var view = event.map.getView();
		
		$scope.globalData.currentMapPos = {
			center: view.getCenter(),
			zoom: view.getZoom()
		}
	}

	
	$scope.addWaypoint = function(newWp)
	{
		var wps = $scope.globalData.waypoints;
		var numWp = wps.length;
		
		// skip if same coordinates as last waypoint
		if (numWp > 1 && wps[numWp - 1].latitude == newWp.latitude && wps[numWp - 1].longitude == newWp.longitude)				
			return;
			
		$scope.globalData.waypoints.push(newWp);
		
		$scope.updateTrack();
	}
	
	
	$scope.onKmlClick = function()
	{
		var navplanData = {
			waypoints: $scope.globalData.waypoints,
		};
	
		var kmlLink = document.getElementById("dlKmlLink");
		kmlLink.href = 'php/navplanKml.php?data=' + encodeURIComponent(JSON.stringify(navplanData))
	}
	
	
	$scope.onWpOkClicked = function()
	{
		if ($scope.saveUserWp)
		{
			userWaypointService.saveUserWaypoint($scope.selectedWp);
		}
	}
	
	
	// init 
	mapService.init($scope.onMapClicked, $scope.onFeatureSelected, $scope.onMapMoveEnd, $scope.onKmlClick, $scope.globalData.currentMapPos, $http);
	
	$scope.updateTrack();
	$scope.focusSearchWpInput();
}
