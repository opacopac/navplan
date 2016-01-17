/**
 * Map Controller
 */

navplanApp
	.controller('mapCtrl', [ '$scope', '$http', '$resource', 'mapService', 'geonameService', 'waypointService', 'userWaypointService', 'fuelService', 'globalData', mapCtrl ]);


function mapCtrl($scope, $http, $resource, mapService, geonameService, waypointService, userWaypointService, fuelService, globalData) {
	$scope.globalData = globalData;

	
	$scope.focusSearchWpInput = function()
	{
		document.getElementById('searchWpInput').focus();
	}
	

	$scope.searchGeonamesByValue = function(val)
	{
		return geonameService.searchGeonamesByValue($http, val);
	};

	
	// select geopoint from search 
	$scope.onGeonameSelect = function ($item)
	{
		$scope.globalData.navplan.selectedWaypoint = {
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
	$scope.onGeonameSearch = function()
	{
		/*
		var wp = {
			type: $scope.globalData.navplan.selectedWaypoint.type,
			freq: $scope.globalData.navplan.selectedWaypoint.freq,
			callsign: $scope.globalData.navplan.selectedWaypoint.callsign,
			checkpoint: $scope.globalData.navplan.selectedWaypoint.checkpoint,
			latitude: $scope.globalData.navplan.selectedWaypoint.latitude,
			longitude: $scope.globalData.navplan.selectedWaypoint.longitude,
			mt: '',
			dist: '',
			alt: '',
			remark: ''
		};
			
		$scope.addWaypoint(wp);
		
		$scope.globalData.navplan.selectedWaypoint = undefined;*/
	}

	
	$scope.onMapClicked = function(event, clickCoordinates, maxRadius)
	{
		geonameService.resource.get({ lat: clickCoordinates[1], lon: clickCoordinates[0], rad: maxRadius }, function(data) {
			if (!data.geonames)
				data.geonames = [];

			mapService.hideFeaturePopup();
			mapService.drawGeopointSelection(data.geonames, event.pixel);
		});
	}
	
	
	$scope.onFeatureSelected = function(event, feature)
	{
		if (feature.geopoint)
		{
			$scope.globalData.selectedWp = {
				type: feature.geopoint.type,
				freq: feature.geopoint.frequency,
				callsign: feature.geopoint.callsign,
				checkpoint: feature.geopoint.wpname,
				latitude: feature.geopoint.latitude,
				longitude: feature.geopoint.longitude,
				mt: '',
				dist: '',
				alt: '',
				remark: '',
				isNew: true
			};
			$scope.$apply();

			mapService.showFeaturePopup($scope.globalData.selectedWp.latitude, $scope.globalData.selectedWp.longitude);
		}
		else if (feature.airport)
		{
			$scope.globalData.selectedWp = {
				type: 'airport',
				freq: feature.airport.frequency,
				callsign: feature.airport.callsign,
				checkpoint: feature.airport.icao,
				latitude: feature.airport.latitude,
				longitude: feature.airport.longitude,
				mt: '',
				dist: '',
				alt: '',
				remark: '',
				isNew: true
			};
			$scope.$apply();
				
			mapService.showFeaturePopup($scope.globalData.selectedWp.latitude, $scope.globalData.selectedWp.longitude);
		}
		else if (feature.navaid)
		{
			$scope.globalData.selectedWp = {
				type: 'navaid',
				freq: feature.navaid.frequency,
				callsign: feature.navaid.kuerzel,
				checkpoint: feature.navaid.kuerzel + ' ' + feature.navaid.type,
				latitude: feature.navaid.latitude,
				longitude: feature.navaid.longitude,
				mt: '',
				dist: '',
				alt: '',
				remark: '',
				isNew: true
			};
			$scope.$apply();
				
			mapService.showFeaturePopup($scope.globalData.selectedWp.latitude, $scope.globalData.selectedWp.longitude);
		}
		else if (feature.userWaypoint)
		{
			$scope.globalData.selectedWp = {
				type: 'user',
				freq: '',
				callsign: '',
				checkpoint: feature.userWaypoint.name,
				latitude: feature.userWaypoint.latitude,
				longitude: feature.userWaypoint.longitude,
				mt: '',
				dist: '',
				alt: '',
				remark: feature.userWaypoint.remark,
				isNew: true
			};
			$scope.$apply();
				
			mapService.showFeaturePopup($scope.globalData.selectedWp.latitude, $scope.globalData.selectedWp.longitude);
		}
		else if (feature.waypoint)
		{
			$scope.globalData.selectedWp = feature.waypoint;
			$scope.$apply();
			
			mapService.showFeaturePopup($scope.globalData.selectedWp.latitude, $scope.globalData.selectedWp.longitude);
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
	
	
	$scope.onAddSelectedWaypointClicked = function()
	{
		$scope.globalData.selectedWp.isNew = false;
		$scope.addWaypoint($scope.globalData.selectedWp);
		$scope.globalData.selectedWp = undefined;

		mapService.hideFeaturePopup();
	}
	
	
	$scope.onRemoveSelectedWaypointClicked = function()
	{
		removeFromArray($scope.globalData.navplan.waypoints, $scope.globalData.selectedWp);
		$scope.globalData.selectedWp = undefined;
		$scope.updateWpList();

		mapService.hideFeaturePopup();
	}
	

	$scope.onEditSelectedWaypointClicked = function()
	{
		$scope.editSelectedWaypoint();
	}


	$scope.addWaypoint = function(newWp)
	{
		var wps = $scope.globalData.navplan.waypoints;
		var numWp = wps.length;
		
		// skip if same coordinates as last waypoint
		if (numWp > 1 && wps[numWp - 1].latitude == newWp.latitude && wps[numWp - 1].longitude == newWp.longitude)				
			return;
			
		newWp.isNew = false;
		$scope.globalData.navplan.waypoints.push(newWp);
		
		$scope.updateWpList();
	}
	
	
	$scope.onKmlClick = function()
	{
		var navplanData = {
			waypoints: $scope.globalData.navplan.waypoints,
		};
	
		var kmlLink = document.getElementById("dlKmlLink");
		kmlLink.href = 'php/navplanKml.php?data=' + encodeURIComponent(JSON.stringify(navplanData))
	}
	
	
	// init feature popup
	var featureContainer = document.getElementById('feature-popup');
	var featureContent = document.getElementById('feature-popup-content');
	var featureCloser = document.getElementById('feature-popup-closer');

	// init mapservice
	mapService.init($scope.onMapClicked, $scope.onFeatureSelected, $scope.onMapMoveEnd, $scope.onKmlClick, $scope.globalData.currentMapPos, featureContainer, $scope.globalData.user.email, $scope.globalData.user.token);

	featureCloser.onclick = function() {
		mapService.hideFeaturePopup();
		featureCloser.blur();
		return false;
	};
	
	$scope.updateWpList();
	//$scope.focusSearchWpInput();
}
