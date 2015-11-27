/**
 * Map Controller
 */

navplanApp
	.controller('mapCtrl', [ '$scope', '$http', '$resource', 'mapService', 'geonameService', 'kmlService', 'globalData', mapCtrl ]);


function mapCtrl($scope, $http, $resource, mapService, geonameService, kmlService, globalData) {
	$scope.globalData = globalData;

	
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
		mapService.updateTrack($scope.globalData.waypoints);
	}
	

	$scope.onGeonameSelect = function ($item)
	{
		$scope.globalData.selectedWaypoint = {
			checkpoint: $item.name,
			latitude: $item.latitude,
			longitude: $item.longitude
		}
		
		mapService.setMapPosition($item.latitude, $item.longitude, 12);
		mapService.drawGeopointSelection([ $item ], [0, 0]);
	};
	
	
	$scope.onGeonameAdd = function()
	{
		var wp = {
			freq: '',
			callsign: '',
			checkpoint: $scope.globalData.selectedWaypoint.checkpoint,
			latitude: $scope.globalData.selectedWaypoint.latitude,
			longitude: $scope.globalData.selectedWaypoint.longitude,
			mt: '',
			dist: '',
			alt: '',
			remark: '',
			isAlternate: false };
			
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
			if (feature.geopoint.nameAfterClick)
				feature.geopoint.name = feature.geopoint.nameAfterClick;
		
			var wp = {
				freq: feature.geopoint.frequency,
				callsign: feature.geopoint.callsign,
				checkpoint: feature.geopoint.name,
				latitude: feature.geopoint.latitude,
				longitude: feature.geopoint.longitude,
				mt: '',
				dist: '',
				alt: '',
				remark: '',
				isAlternate: false };
				
			$scope.addWaypoint(wp);
		}
		else if (feature.airport)
		{
			var wp = {
				freq: feature.airport.frequency,
				callsign: feature.airport.callsign,
				checkpoint: feature.airport.icao + " (" + feature.airport.name + ")",
				latitude: feature.airport.latitude,
				longitude: feature.airport.longitude,
				mt: '',
				dist: '',
				alt: '',
				remark: '',
				isAlternate: false };
				
			$scope.addWaypoint(wp);
		}
		else if (feature.navaid)
		{
			var wp = {
				freq: feature.navaid.frequency,
				callsign: feature.navaid.kuerzel,
				checkpoint: feature.navaid.kuerzel + " (" + feature.navaid.type + ")",
				latitude: feature.navaid.latitude,
				longitude: feature.navaid.longitude,
				mt: '',
				dist: '',
				alt: '',
				remark: '',
				isAlternate: false };
				
			$scope.addWaypoint(wp);
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
		var kmlString = kmlService.createKmlTrack($scope.globalData.waypoints);
		
		// create temporary anchor
		var a = window.document.createElement('a');
		a.href = window.URL.createObjectURL(new Blob([kmlString], {type: 'application/vnd.google-earth.kml+xml'}));
		//a.href = 'data:Application/octet-stream,' + encodeURIComponent(kmlString);
		//a.href = "data:application/octet-stream,field1%2Cfield2%0Afoo%2Cbar%0Agoo%2Cgai%0A";
		a.download = 'track.kml';

		// append anchor & click
		document.body.appendChild(a)
		a.click();

		// remove anchor 
		document.body.removeChild(a)		
	}
	
	
	// init 
	mapService.init($scope.onMapClicked, $scope.onFeatureSelected, $scope.onMapMoveEnd, $scope.onKmlClick, $scope.globalData.currentMapPos, $http);
	
	$scope.updateTrack();
	$scope.focusSearchWpInput();
}
