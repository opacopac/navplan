/**
 * Map Service
 */

navplanApp
	.factory('mapService', mapService);

mapService.$inject = ['$http', 'trafficService'];

function mapService($http, trafficService)
{
	var map = {};
	var mapLayer, trackLayer, iconLayer, airspaceLayer, globalWpLayer, userWpLayer, geopointLayer, trafficLayer, locationLayer, webcamLayer;
	var chartLayers = [];
	var featureOverlay = {};
	var trafficOverlay = {};
	var isGeopointSelectionActive = false;
	var isFeaturePopupActive = false;
	var isTrafficPopupActive = false;
	var wgs84Sphere = new ol.Sphere(6378137);
	var minZoomLevel =
	{
		iconLayer: 9,
		airspaceLayer: 9,
		globalWpLayer: 11,
		userWpLayer: 11,
		webcamLayer: 9
	};
	

	// return api reference
	return {
		map: map,
		featureOverlay: featureOverlay,
		init: init,
		getMapPosition: getMapPosition,
		setMapPosition: setMapPosition,
		getViewExtent: getViewExtent,
		updateTrack: updateTrack,
		updateUserWaypoints: updateUserWaypoints,
		getDistance: getDistance,
		getBearing: getBearing,
		drawGeopointSelection: drawGeopointSelection,
		showFeaturePopup: showFeaturePopup,
		hideFeaturePopup: hideFeaturePopup,
		showTrafficPopup: showTrafficPopup,
		hideTrafficPopup: hideTrafficPopup,
		displayChart: displayChart,
		clearAllCharts: clearAllCharts,
		updateLocation: updateLocation,
		updateTraffic: updateTraffic
	};
	
	
	// init map
	function init(onMapClickCallback, onFeatureSelectCallback, onMoveEndCallback, mapPos, featureContainer, trafficContainer, email, token)
	{
		// init layers
		mapLayer = createMapLayer();
		locationLayer = createEmptyVectorLayer();
		trafficLayer = createEmptyVectorLayer();
		trackLayer = createEmptyVectorLayer();
		iconLayer = createEmptyVectorLayer();
		globalWpLayer = createEmptyVectorLayer();
		userWpLayer = createEmptyVectorLayer();
		airspaceLayer = createEmptyVectorLayer();
		webcamLayer = createEmptyVectorLayer();
		geopointLayer = createEmptyVectorLayer();

		// populate layers
		populateAirports(iconLayer);
		populateNavaids(iconLayer);
		populateAirspaces(airspaceLayer);
		populateWebcams(webcamLayer);
		populateGlobalWaypoints(globalWpLayer);
		updateUserWaypoints(email, token);

		// overlays
		featureOverlay = createOverlay(featureContainer);
		trafficOverlay = createOverlay(trafficContainer);

		// init map
		map = createMap();

		// register map events
		map.on('singleclick', onSingleClick);
		map.on('pointermove', onPointerMove);
		map.on('moveend', onMoveEnd);

		// restore chart layers
		for (var i = 0; i < chartLayers.length; i++)
			map.getLayers().insertAt(i + 1, chartLayers[i]);

		setLayerVisibility();


		// functions

		function createMap()
		{
			return new ol.Map({
				target: 'map',
				//interactions: ol.interaction.defaults().extend([new dragInteraction()]),
				controls: //ol.control.defaults().extend(
					[
						new ol.control.ScaleLine({units: 'nautical'})
					],
				layers: [
					mapLayer,
					airspaceLayer,
					webcamLayer,
					iconLayer,
					globalWpLayer,
					userWpLayer,
					trackLayer,
					geopointLayer,
					trafficLayer,
					locationLayer
				],
				overlays: [featureOverlay, trafficOverlay],
				view: new ol.View(
					{
						center: mapPos.center,
						zoom: mapPos.zoom
					})
			});
		}


		function createMapLayer()
		{
			return new ol.layer.Tile({
				source: new ol.source.OSM({
					//url: "http://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png",
					url: "//b.tile.opentopomap.org/{z}/{x}/{y}.png",
					maxZoom: 14,
					crossOrigin: null,
					attributions: [
						new ol.Attribution({html: 'Kartendaten: (c) OpenStreetMap-Mitwirkende, SRTM | Kartendarstellung: (c) <a href="http://www.opentopomap.org/">OpenTopoMap</a> (CC-BY-SA)'}),
						new ol.Attribution({html: 'Aviation Data: (c) <a href="http://www.openaip.net/">openAIP</a> (CC-BY-SA)'}),
						ol.source.OSM.ATTRIBUTION
					]
				})
			});
		}


		function createEmptyVectorLayer()
		{
			return new ol.layer.Vector({
				source: new ol.source.Vector({})
			});
		}


		// add airports to icon layer
		function populateAirports(iconLayer)
		{
			$http.get('php/airports.php')
				.success(function (data) {
					if (data.airports) {
						for (var i = 0; i < data.airports.length; i++) {
							// airport icon
							var adFeature = new ol.Feature({
								geometry: new ol.geom.Point(ol.proj.fromLonLat([data.airports[i].longitude, data.airports[i].latitude]))
							});

							adFeature.airport = data.airports[i];

							var adStyle = createAdStyle(data.airports[i].type, data.airports[i].icao);

							if (adStyle)
								adFeature.setStyle(adStyle);
							else
								continue;

							iconLayer.getSource().addFeature(adFeature);


							// rwy icon
							var rwyFeature = new ol.Feature({
								geometry: new ol.geom.Point(ol.proj.fromLonLat([data.airports[i].longitude, data.airports[i].latitude]))
							});

							var rwyStyle = createRwyStyle(data.airports[i].type, data.airports[i].rwy_surface, data.airports[i].rwy_direction1);

							if (rwyStyle)
								rwyFeature.setStyle(rwyStyle);
							else
								continue;

							iconLayer.getSource().addFeature(rwyFeature);
						}
					}
					else {
						console.error("ERROR", data);
					}
				})
				.error(function (data, status) {
					console.error("ERROR", status, data);
				});


			function createAdStyle(ad_type, name)
			{
				var textColor = "#451A57";
				var src;

				if (ad_type == "APT" || ad_type == "INTL_APT")
					src = 'icon/ad_civ.png';
				else if (ad_type == "AF_CIVIL" || ad_type == "GLIDING")
					src = 'icon/ad_civ_nofac.png';
				else if (ad_type == "AF_MIL_CIVIL")
					src = 'icon/ad_civmil.png';
				else if (ad_type == "AD_MIL") {
					src = 'icon/ad_mil.png';
					textColor = "#AE1E22";
				}
				else
					return;

				return new ol.style.Style({
					image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
						anchor: [0.5, 0.5],
						anchorXUnits: 'fraction',
						anchorYUnits: 'fraction',
						scale: 1,
						opacity: 0.75,
						src: src
					})),
					text: new ol.style.Text({
						font: 'bold 14px Calibri,sans-serif',
						text: name,
						fill: new ol.style.Fill({color: textColor}),
						stroke: new ol.style.Stroke({color: "#FFFFFF", width: 2}),
						offsetX: 0,
						offsetY: 25
					})
				});
			}


			function createRwyStyle(ad_type, rwy_surface, rwy_direction)
			{
				var src;

				if (ad_type == "AD_MIL")
					src = 'icon/rwy_mil.png';
				else if (rwy_surface == "ASPH" || rwy_surface == "CONC")
					src = 'icon/rwy_concrete.png';
				else if (rwy_surface == "GRAS")
					src = 'icon/rwy_grass.png';
				else
					return;

				return new ol.style.Style({
					image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
						anchor: [0.5, 0.5],
						anchorXUnits: 'fraction',
						anchorYUnits: 'fraction',
						scale: 1,
						rotation: (rwy_direction - 45) / 180 * Math.PI,
						rotateWithView: true,
						opacity: 0.75,
						src: src
					}))
				});
			}
		}


		// add navaids to icon layer
		function populateNavaids(iconLayer)
		{
			$http.get('php/navaids.php')
				.success(function (data) {
					if (data.navaids) {
						for (var i = 0; i < data.navaids.length; i++) {
							var navaidFeature = new ol.Feature({
								geometry: new ol.geom.Point(ol.proj.fromLonLat([data.navaids[i].longitude, data.navaids[i].latitude]))
							});

							navaidFeature.navaid = data.navaids[i];

							var navaidStyle = createNavaidStyle(data.navaids[i].type, data.navaids[i].kuerzel);

							if (navaidStyle)
								navaidFeature.setStyle(navaidStyle);
							else
								continue;

							iconLayer.getSource().addFeature(navaidFeature);
						}
					}
					else {
						console.error("ERROR", data);
					}
				})
				.error(function (data, status) {
					console.error("ERROR", status, data);
				});


			function createNavaidStyle(navaid_type, name) {
				var src, offsetY;

				if (navaid_type == "NDB") {
					src = 'icon/navaid_ndb.png';
					offsetY = 33;
				}
				else if (navaid_type == "VOR-DME" || navaid_type == "DVOR-DME") {
					src = 'icon/navaid_vor-dme.png';
					offsetY = 20;
				}
				else if (navaid_type == "DME") {
					src = 'icon/navaid_dme.png';
					offsetY = 20;
				}
				else
					return;

				return new ol.style.Style({
					image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
						anchor: [0.5, 0.5],
						anchorXUnits: 'fraction',
						anchorYUnits: 'fraction',
						scale: 1,
						opacity: 0.75,
						src: src
					})),
					text: new ol.style.Text({
						//textAlign: align,
						//textBaseline: baseline,
						font: 'bold 14px Calibri,sans-serif',
						text: name,
						fill: new ol.style.Fill({color: '#451A57'}),
						stroke: new ol.style.Stroke({color: '#FFFFFF', width: 2}),
						offsetX: 0,
						offsetY: offsetY
					})
				});
			}
		}


		// add global waypoints to icon layer
		function populateGlobalWaypoints(globalWpLayer)
		{
			$http.post('php/userWaypoint.php', obj2json({action: 'readGlobalWaypoints'}))
				.success(function (data) {
					if (data.globalWaypoints) {
						for (var i = 0; i < data.globalWaypoints.length; i++) {
							var globalWpFeature = new ol.Feature({
								geometry: new ol.geom.Point(ol.proj.fromLonLat([data.globalWaypoints[i].longitude, data.globalWaypoints[i].latitude]))
							});

							globalWpFeature.globalWaypoint = data.globalWaypoints[i];

							var globalWpStyle = createGlobalWpStyle(data.globalWaypoints[i].type, data.globalWaypoints[i].name);

							if (globalWpStyle)
								globalWpFeature.setStyle(globalWpStyle);
							else
								continue;

							globalWpLayer.getSource().addFeature(globalWpFeature);
						}
					}
					else {
						console.error("ERROR", data);
					}
				})
				.error(function (data, status) {
					console.error("ERROR", status, data);
				});


			function createGlobalWpStyle(wp_type, name) {
				var src, offsetY;

				if (wp_type == "report") {
					src = 'icon/wp_report.png';
					offsetY = 20;
				}
				else {
					src = 'icon/wp_user.png';
					offsetY = 20;
				}

				return new ol.style.Style({
					image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
						anchor: [0.5, 0.5],
						anchorXUnits: 'fraction',
						anchorYUnits: 'fraction',
						scale: 1,
						opacity: 0.75,
						src: src
					})),
					text: new ol.style.Text({
						font: 'bold 14px Calibri,sans-serif',
						text: name,
						fill: new ol.style.Fill({color: '#0077FF'}),
						stroke: new ol.style.Stroke({color: '#FFFFFF', width: 2}),
						offsetX: 0,
						offsetY: offsetY
					})
				});
			}
		}


		// add airspaces to airspace layer
		function populateAirspaces(airspaceLayer) {
			$http.get('php/airspace.php')
				.success(function (data, status, headers, config) {
					if (data.airspace) {
						for (var i = 0; i < data.airspace.length; i++) {
							// convert polygon
							var polygon = [];
							for (var j = 0; j < data.airspace[i].polygon.length; j++)
								polygon.push(ol.proj.fromLonLat(data.airspace[i].polygon[j]));

							var airspaceFeature = new ol.Feature({
								geometry: new ol.geom.Polygon([polygon]),
								airspace: data.airspace[i]
							});

							var airspaceStyle = createAirspaceStyle(data.airspace[i].category);

							if (airspaceStyle)
								airspaceFeature.setStyle(airspaceStyle);
							else
								continue;

							airspaceLayer.getSource().addFeature(airspaceFeature);
						}
					}
					else {
						console.error("ERROR", data);
					}
				})
				.error(function (data, status) {
					console.error("ERROR", status, data);
				});


			function createAirspaceStyle(category) {
				if (category == "CTR") {
					return new ol.style.Style({
						fill: new ol.style.Fill({
							color: 'rgba(152, 206, 235, 0.3)'
						}),
						stroke: new ol.style.Stroke({
							color: 'rgba(23, 128, 194, 0.8)',
							width: 3,
							lineDash: [10, 7]
						})
					});
				}
				else if (category == "CTR2") {
					return new ol.style.Style({
						stroke: new ol.style.Stroke({
							color: 'rgba(152, 206, 235, 0.8)',
							width: 10
						})
					});
				}
				else if (category == "C" || category == "D") {
					return new ol.style.Style({
						stroke: new ol.style.Stroke({
							color: 'rgba(23, 128, 194, 0.8)',
							width: 3
						})
					});
				}
				else if (category == "E") {
					return new ol.style.Style({
						stroke: new ol.style.Stroke({
							color: 'rgba(23, 128, 194, 0.8)',
							width: 2
						})
					});
				}
				else if (category == "DANGER" || category == "RESTRICTED") {
					return new ol.style.Style({
						stroke: new ol.style.Stroke({
							color: 'rgba(174, 30, 34, 0.8)',
							width: 2
						})
					});
				}
			}
		}


		// add webcams to webcam layer
		function populateWebcams(webcamLayer) {
			$http.post('php/webcams.php', obj2json({action: 'readNonAdWebcams'}))
				.then(
					function (response) { // success
						if (!response.data || !response.data.webcams) {
							console.error("ERROR reading webcams");
						}
						else {
							for (var i = 0; i < response.data.webcams.length; i++) {
								var webcam = response.data.webcams[i];
								var webcamFeature = new ol.Feature({
									geometry: new ol.geom.Point(ol.proj.fromLonLat([webcam.longitude, webcam.latitude])),
									title: webcam.name
								});

								var webcamStyle = new ol.style.Style({
									image: new ol.style.Icon(({
										anchor: [0.5, 0.5],
										anchorXUnits: 'fraction',
										anchorYUnits: 'fraction',
										scale: 1,
										opacity: 0.9,
										src: 'icon/webcam.png',
										title: webcam.name
									}))
								});

								webcamFeature.setStyle(webcamStyle);
								webcamFeature.webcam = webcam;

								webcamLayer.getSource().addFeature(webcamFeature);
							}
						}
					},
					function (response) { // error
						console.error("ERROR", response.status, response.data);
					}
				);
		}


		function createOverlay(container)
		{
			return new ol.Overlay(({
				element: container,
				autoPan: true,
				autoPanAnimation: {duration: 250}
			}));
		}


		// click event
		function onSingleClick(event)
		{
			var eventConsumed = false;

			// geopoint layers
			map.forEachFeatureAtPixel(
				event.pixel,
				function (feature, layer) {
					if (eventConsumed)
						return;

					// specific feature clicked
					if (feature.geopoint || feature.airport || feature.navaid || feature.waypoint || feature.userWaypoint || feature.globalWaypoint || feature.webcam)
					{
						onFeatureSelectCallback(event, feature);
						clearGeopointSelection();
						eventConsumed = true;
					}
				},
				null,
				function (layer) // layers to search for features
				{
					return layer === geopointLayer || layer === iconLayer || layer === globalWpLayer || layer === userWpLayer || layer === trackLayer || layer === webcamLayer;
				}
			);

			// traffic layer
			if (!eventConsumed)
			{
				map.forEachFeatureAtPixel(
					event.pixel,
					function (feature, layer) {
						if (eventConsumed)
							return;

						// specific feature clicked
						if (feature.acInfo)
						{
							onFeatureSelectCallback(event, feature);
							clearGeopointSelection();
							eventConsumed = true;
						}
					},
					null,
					function (layer) // layers to search for features
					{
						return layer === trafficLayer;
					}
				);
			}


			if (!eventConsumed)
			{
				if (isGeopointSelectionActive)
					clearGeopointSelection();
				else if (isFeaturePopupActive)
					hideFeaturePopup();
				else if (isTrafficPopupActive)
					hideTrafficPopup();
				else
					onMapClickCallback(event, ol.proj.toLonLat(event.coordinate), getClickRadius(event));
			}
		}


		// pointermove event
		function onPointerMove(event)
		{
			if (event.dragging)
				return;

			var hitLayer = map.forEachFeatureAtPixel(
				event.pixel,
				function (feature, layer) {
					return layer;
				},
				null,
				function (layer) {
					return layer === geopointLayer || layer === iconLayer || layer === globalWpLayer || layer === userWpLayer || layer === trackLayer || layer === trafficLayer || layer === webcamLayer;
				}
			);

			if (hitLayer === geopointLayer || hitLayer === iconLayer || hitLayer === globalWpLayer || hitLayer === userWpLayer || hitLayer === trackLayer || hitLayer === trafficLayer || hitLayer === webcamLayer)
				map.getTargetElement().style.cursor = 'pointer';
			else
				map.getTargetElement().style.cursor = '';
		}


		// moveend event (pan / zoom)
		function onMoveEnd(event)
		{
			setLayerVisibility();

			onMoveEndCallback(event);
		}



		function getClickRadius(event) {
			var clickPos = map.getEventPixel(event);
			var coord1 = map.getCoordinateFromPixel(clickPos);
			var lon1 = ol.proj.toLonLat(coord1)[0];

			clickPos[0] += 50;
			var coord2 = map.getCoordinateFromPixel(clickPos);
			var lon2 = ol.proj.toLonLat(coord2)[0];

			return lon2 - lon1;
		}
	}


	function setLayerVisibility()
	{
		var zoom = map.getView().getZoom();

		if (zoom >= minZoomLevel.airspaceLayer)
			airspaceLayer.setVisible(true);
		else
			airspaceLayer.setVisible(false);

		if (zoom >= minZoomLevel.iconLayer)
			iconLayer.setVisible(true);
		else
			iconLayer.setVisible(false);

		if (zoom >= minZoomLevel.userWpLayer)
			userWpLayer.setVisible(true);
		else
			userWpLayer.setVisible(false);

		if (zoom >= minZoomLevel.globalWpLayer)
			globalWpLayer.setVisible(true);
		else
			globalWpLayer.setVisible(false);

		if (zoom >= minZoomLevel.webcamLayer)
			webcamLayer.setVisible(true);
		else
			webcamLayer.setVisible(false);
	}


	function showFeaturePopup(lat, lon)
	{
		var coords = ol.proj.fromLonLat([lon, lat]);
		//var pixelCoords = map.getPixelFromCoordinate(coords);

		featureOverlay.setPosition(coords);
		isFeaturePopupActive = true;
	}
	
	
	function hideFeaturePopup()
	{
		featureOverlay.setPosition(undefined);
		isFeaturePopupActive = false;
	}


	function showTrafficPopup(trafficFeature)
	{
		trafficOverlay.setPosition(trafficFeature.getGeometry().getCoordinates());
		isTrafficPopupActive = true;
	}


	function hideTrafficPopup()
	{
		trafficOverlay.setPosition(undefined);
		isTrafficPopupActive = false;
	}


	function clearGeopointSelection()
	{
		geopointLayer.getSource().clear();
		isGeopointSelectionActive = false;
	}
	
	
	function drawGeopointSelection(geopoints, clickPixel)
	{
		var layerSource = geopointLayer.getSource();
		layerSource.clear();
		
		isGeopointSelectionActive = true;
		
		// add clickpoint
		if (geopoints.length < 8)
		{
			var clickLonLat = ol.proj.toLonLat(map.getCoordinateFromPixel(clickPixel));
			
			var clickPoint = {
				type: 'user',
				longitude: clickLonLat[0],
				latitude: clickLonLat[1],
				name: Math.round(clickLonLat[1] * 10000) / 10000 + " " + Math.round(clickLonLat[0] * 10000) / 10000,
				wpname: ol.coordinate.toStringHDMS(clickLonLat)
			};
			
			geopoints.push(clickPoint);
		}
		
		
		// create left/right partitions
		var pointsL = geopoints.slice(0).sort(function(a, b) { return a.longitude - b.longitude });
		var pointsR = pointsL.splice(0, Math.ceil(geopoints.length / 2));

		// create left top/bottom partition
		var pointsLB = pointsL.slice(0).sort(function(a, b) { return b.latitude - a.latitude });
		var pointsLT = pointsLB.splice(0, Math.ceil(pointsL.length / 2));

		// create right top/bottom partition
		var pointsRT = pointsR.slice(0).sort(function(a, b) { return a.latitude - b.latitude });
		var pointsRB = pointsRT.splice(0, Math.floor(pointsR.length / 2));

		setLabelCoordinates(pointsLT, 0.0, clickPixel);
		setLabelCoordinates(pointsLB, Math.PI * 0.5, clickPixel);
		setLabelCoordinates(pointsRB, Math.PI, clickPixel);
		setLabelCoordinates(pointsRT, Math.PI * 1.5, clickPixel);


		for (var i = 0; i < geopoints.length; i++)
		{
			var pointCoordLon = geopoints[i].longitude;
			var pointCoordLat = geopoints[i].latitude;

			
			// geo points
			var geoPoint = new ol.Feature({
				geometry: new ol.geom.Point(ol.proj.fromLonLat([pointCoordLon, pointCoordLat]))
			});
			
			geoPoint.geopoint = geopoints[i];
			
			geoPoint.setStyle(
				new ol.style.Style({
					image: new ol.style.Circle({
						radius: 5,
						fill: new ol.style.Fill({
							color: '#FFFFFF'
						}),
						stroke: new ol.style.Stroke({
							color: '#000000',
							width: 2
						})
					})
				})
			);
			
			layerSource.addFeature(geoPoint);
			
			
			// label points
			var labelPoint = new ol.Feature({
				geometry: new ol.geom.Point(geopoints[i].labelCoordinates)
			});
			
			labelPoint.geopoint = geopoints[i];
			
			labelPoint.setStyle(
				new ol.style.Style({
					image: new ol.style.Circle({
						radius: 1,
						fill: new ol.style.Fill({
							color: '#000000'
						}),
						stroke: new ol.style.Stroke({
							color: '#000000',
							width: 2
						})
					}),
					text: new ol.style.Text({
						font: 'bold 20px Calibri,sans-serif',
						text: geopoints[i].name,
						fill: new ol.style.Fill( { color: '#660066' } ),
						stroke: new ol.style.Stroke( {color: '#FFFFFF', width: 20 } ),
						offsetX: 0,
						offsetY: 0
					})
				})
			);

			layerSource.addFeature(labelPoint);
			

			// line
			var points = [];
			points.push(ol.proj.fromLonLat([pointCoordLon, pointCoordLat]));
			points.push(geopoints[i].labelCoordinates);
			
			var line = new ol.Feature({
				geometry: new ol.geom.LineString(points)
			});
		
			line.setStyle(
				new ol.style.Style({
					stroke : new ol.style.Stroke({
						color: '#000000',
						width: 3
					})
				})
			);
			
			layerSource.addFeature(line);
		}


		function setLabelCoordinates(geopoints, rotationRad, centerPixel)
		{
			if (geopoints.length == 0)
				return;

			var radiusPixel = 100;
			var rotOffset = 0;
			var rotInc = Math.PI / 2 / (geopoints.length + 1);

			for (var i = 0; i < geopoints.length; i++)
			{
				var geoPointPixel = map.getPixelFromCoordinate(ol.proj.fromLonLat([geopoints[i].longitude, geopoints[i].latitude]));
				var labelCoordX = geoPointPixel[0] + Math.sin(rotationRad + (i + 1) * rotInc + rotOffset) * radiusPixel;
				var labelCoordY = geoPointPixel[1] - Math.cos(rotationRad + (i + 1) * rotInc + rotOffset) * radiusPixel;

				geopoints[i].labelCoordinates = map.getCoordinateFromPixel([labelCoordX, labelCoordY]);
			}
		}
	}

	
	function updateUserWaypoints(email, token)
	{
		if (typeof userWpLayer === "undefined")
			return;
			
		var layerSource = userWpLayer.getSource();
		layerSource.clear();
			
			
		if (email && token)
		{
			$http.post('php/userWaypoint.php', obj2json({ action: 'readUserWaypoints', email: email, token: token }))
				.success(function(data) {
					if (data.userWaypoints)
					{
						for (var i = 0; i < data.userWaypoints.length; i++)
						{
							var userWpFeature = new ol.Feature({
								geometry: new ol.geom.Point(ol.proj.fromLonLat([data.userWaypoints[i].longitude, data.userWaypoints[i].latitude]))
							});
							
							userWpFeature.userWaypoint = data.userWaypoints[i];

							var userWpStyle = createUserWpStyle(data.userWaypoints[i].type, data.userWaypoints[i].name);
							
							if (userWpStyle)
								userWpFeature.setStyle(userWpStyle);
							else
								continue;
					
							layerSource.addFeature(userWpFeature);
						}
					}
					else
					{
						console.error("ERROR", data);
					}
				})
				.error(function(data, status) {
					console.error("ERROR", status, data);
				});
		}


		function createUserWpStyle(wp_type, name) {
			var src, offsetY;

			if (wp_type == "report") {
				src = 'icon/wp_report.png';
				offsetY = 20;
			}
			else {
				src = 'icon/wp_user.png';
				offsetY = 20;
			}

			return new ol.style.Style({
				image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
					anchor: [0.5, 0.5],
					anchorXUnits: 'fraction',
					anchorYUnits: 'fraction',
					scale: 1,
					opacity: 0.75,
					src: src
				})),
				text: new ol.style.Text({
					font: 'bold 14px Calibri,sans-serif',
					text: name,
					fill: new ol.style.Fill({color: '#0077FF'}),
					stroke: new ol.style.Stroke({color: '#FFFFFF', width: 2}),
					offsetX: 0,
					offsetY: offsetY
				})
			});
		}
	}
	
	
	function updateTrack(wps, alternate, settings)
	{
		if (typeof trackLayer === "undefined")
			return;
	
		var trackSource = trackLayer.getSource();
		trackSource.clear();
		
		var trackStyle = new ol.style.Style({
			stroke : new ol.style.Stroke({
				color: '#FF00FF',
				width: 5
			})
		});
		
		var trackAlternateStyle = new ol.style.Style({
			stroke : new ol.style.Stroke({
				color: '#FF00FF',
				width: 5,
				lineDash: [10, 10]
			})
		});
		
		
		// waypoints
		var prevWp, nextWp;

		for (var i = 0; i < wps.length; i++)
		{
			if (i > 0)
				prevWp = wps[i - 1];
			else
				prevWp = undefined;	
				
			if (i < wps.length - 1)
				nextWp = wps[i + 1];
			else if (alternate)
				nextWp = alternate;
			else
				nextWp = undefined;
				
			updateTrackSegment(trackSource, wps[i], prevWp, nextWp, trackStyle, settings);
		}
		
		
		// alternate
		if (alternate)
		{
			if (wps.length > 0)
				prevWp = wps[wps.length - 1];
			else
				prevWp = undefined;
				
			updateTrackSegment(trackSource, alternate, prevWp, undefined, trackAlternateStyle, settings);
		}


		function updateTrackSegment(trackSource, wp, prevWp, nextWp, trackStyle, settings)
		{
			// get wp coordinates
			var mapCoord = ol.proj.fromLonLat([wp.longitude, wp.latitude]);


			// add track line segment
			if (prevWp)
			{
				var mapCoord0 = ol.proj.fromLonLat([prevWp.longitude, prevWp.latitude]);

				var trackFeature = new ol.Feature({
					geometry: new ol.geom.LineString([ mapCoord0, mapCoord ])
				});

				trackFeature.setStyle(trackStyle);
				trackSource.addFeature(trackFeature);
			}


			// add waypoint + label
			var wpFeature  = new ol.Feature({
				geometry: new ol.geom.Point(mapCoord)
			});

			var wpStyle = createWaypointStyle(wp, nextWp);
			wpFeature.setStyle(wpStyle);
			wpFeature.waypoint = wp;
			trackSource.addFeature(wpFeature);


			// add direction & bearing label
			var dbFeature  = new ol.Feature({
				geometry: new ol.geom.Point(mapCoord)
			});

			var dbStyle = createDirBearStyle(nextWp, settings);
			dbFeature.setStyle(dbStyle);
			trackSource.addFeature(dbFeature);
		}


		function createWaypointStyle(wp1, wp2)
		{
			var rot, align;

			if (wp1.mt && wp2) // en route point
			{
				if (wp2.mt > wp1.mt)
					rot = deg2rad((wp1.mt + 270 + (wp2.mt - wp1.mt) / 2) % 360);
				else
					rot = deg2rad((wp1.mt + 270 + (wp2.mt + 360 - wp1.mt) / 2) % 360);
			}
			else if (!wp1.mt && wp2) // start point
			{
				rot = deg2rad((wp2.mt + 180) % 360);
			}
			else if (wp1.mt && !wp2) // end point
			{
				rot = deg2rad(wp1.mt);
			}
			else if (!wp1.mt && !wp2) // single point
			{
				rot = deg2rad(45); // 45°
			}
			else
				throw "invalid waypoints";

			if (rot < Math.PI)
				align = "start";
			else
				align = "end";

			return  new ol.style.Style({
				text: new ol.style.Text({
					font: 'bold 16px Calibri,sans-serif',
					text: wp1.checkpoint,
					fill: new ol.style.Fill( { color: '#660066' } ),
					stroke: new ol.style.Stroke( {color: '#FFFFFF', width: 10 } ),
					textAlign: align,
					offsetX: 15 * Math.sin(rot),
					offsetY: -15 * Math.cos(rot)
				})
			});
		}


		function createDirBearStyle(wp, settings)
		{
			var varRad = Number(settings.variation) ? deg2rad(Number(settings.variation)) : 0;
			var rotRad, align, text, offX, offY;

			if (!wp)
			{
				rotRad = 0;
				align = "start";
				text = '';
				offX = 0;
				offY = 0;
			}
			else if (wp.mt  < 180)
			{
				rotRad = deg2rad(wp.mt - 90);
				align = "start";
				text = wp.mt + '° ' + wp.dist + 'NM >';
				offX = 10 * Math.sin(rotRad + Math.PI / 2);
				offY = -10 * Math.cos(rotRad + Math.PI / 2);
			}
			else
			{
				rotRad = deg2rad(wp.mt - 270);
				align = "end";
				text = '< ' + wp.mt + '° ' + wp.dist + 'NM';
				offX = 10 * Math.sin(rotRad + Math.PI * 3 / 2);
				offY = -10 * Math.cos(rotRad + Math.PI * 3 / 2);
			}

			return  new ol.style.Style({
				image: new ol.style.Circle({
					radius: 6,
					fill: new ol.style.Fill({
						color: '#FF00FF',
						rotateWithView: true
					})
				}),
				text: new ol.style.Text({
					font: '14px Calibri,sans-serif',
					text: text,
					fill: new ol.style.Fill( { color: '#000000' } ),
					stroke: new ol.style.Stroke( {color: '#FFFFFF', width: 10 } ),
					rotation: rotRad + varRad,
					textAlign: align,
					offsetX: offX,
					offsetY: offY
				})
			});
		}
	}


	function getMapPosition()
	{
		return {
			center: ol.proj.toLonLat(map.getView().getCenter()),
			zoom: map.getView().getZoom()
		};
	}
	
	
	function setMapPosition(lat, lon, zoom)
	{
		if (lat && lon)
		{
			var pos = ol.proj.fromLonLat([lon, lat]);
			map.getView().setCenter(pos);
		}

		if (zoom)
			map.getView().setZoom(zoom);
	}


	function getViewExtent()
	{
		var extent = map.getView().calculateExtent(map.getSize());

		return ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
	}
	
	
	function displayChart(chartId)
	{
		// load chart data
		$http.get('php/ad_charts.php?id=' + chartId)
			.then(
				function(response) { // success

					if (!response.data || !response.data.chart) {
						console.error("ERROR reading chart");
					}
					else {
						var extent = [response.data.chart.mercator_w, response.data.chart.mercator_s, response.data.chart.mercator_e, response.data.chart.mercator_n];

						var projection = new ol.proj.Projection({
							code: 'chart',
							units: 'm',
							extent: extent
						});

						var chartLayer = new ol.layer.Image({
							source: new ol.source.ImageStatic({
								url: 'charts/' + response.data.chart.filename,
								projection: projection,
								imageExtent: extent
							}),
							opacity: 0.8
						});

						chartLayers.push(chartLayer);

						map.getLayers().insertAt(chartLayers.length, chartLayer);
					}
				},
				function(response) { // error
					console.error("ERROR reading chart", response.status, response.data);
				}
			);
	}


	function clearAllCharts()
	{
		for (var i = 0; i < chartLayers.length; i++)
			map.removeLayer(chartLayers[i]);

		chartLayers = [];
	}


	function updateLocation(lastPositions)
	{
		var layerSource = locationLayer.getSource();
		layerSource.clear();

		if (lastPositions)
			drawTrafficTrack(lastPositions, layerSource, { actype: "OWN" });
	}


	function updateTraffic(acList)
	{
		var layerSource = trafficLayer.getSource();
		layerSource.clear();

		if (acList)
		{
			for (var acAddress in acList)
			{
				var acInfo = {
					actype: acList[acAddress].actype,
					address: acAddress,
					addresstype: acList[acAddress].addresstype,
					callsign: ''
				};
				
				if (acList[acAddress].addresstype == "ICAO")
					acInfo.callsign = trafficService.tryReadAcCallsign(acAddress);
				
				drawTrafficTrack(acList[acAddress].positions, layerSource, acInfo);
			}
		}
	}


	function drawTrafficTrack(lastPositions, layerSource, acInfo)
	{
		if (!lastPositions)
			return;

		// draw track dots
		var maxIdx = lastPositions.length - 1;

		for (var i = 0; i < maxIdx; i++)
		{
			var trackDotFeature = createTrackDotFeature(lastPositions[i].longitude, lastPositions[i].latitude, acInfo.actype);
			layerSource.addFeature(trackDotFeature);
		}

		// draw plane
		if (maxIdx >= 0) {
			var rotation = 0;

			if (maxIdx > 0) {
				rotation = getBearing(
					lastPositions[maxIdx - 1].latitude,
					lastPositions[maxIdx - 1].longitude,
					lastPositions[maxIdx].latitude,
					lastPositions[maxIdx].longitude,
					0);
			}

			var planeFeature = createTrafficFeature(
				lastPositions[maxIdx].longitude,
				lastPositions[maxIdx].latitude,
				lastPositions[maxIdx].altitude,
				rotation,
				acInfo);

			layerSource.addFeature(planeFeature);

			if (acInfo.callsign)
			{
				var csFeature = createCallsignFeature(
					lastPositions[maxIdx].longitude,
					lastPositions[maxIdx].latitude,
					acInfo.callsign);

				layerSource.addFeature(csFeature);
			}
		}



		function createTrackDotFeature(longitude, latitude, trafficType)
		{
			var color;

			if (trafficType == "OWN")
				color = "#0000FF";
			else
				color = "#FF0000";

			var trackPoint = new ol.Feature({
				geometry: new ol.geom.Point(ol.proj.fromLonLat([longitude, latitude]))
			});

			trackPoint.setStyle(
				new ol.style.Style({
					image: new ol.style.Circle({
						radius: 2,
						fill: new ol.style.Fill({
							color: color
						})
					})
				})
			);

			return trackPoint;
		}


		function createTrafficFeature(longitude, latitude, altitude, rotation, acInfo)
		{
			var icon = "icon/";
			var color = "#FF0000";
			var heighttext = "";

			if (!acInfo.callsign)
				acInfo.callsign = "";

			if (altitude > 0)
				heighttext = Math.round(altitude * 3.28084).toString() + " ft"; // TODO: einstellbar

			switch (acInfo.actype)
			{
				case "OWN":
					icon += "own_plane.png";
					color = "#0000FF";
					break;
				case "HELICOPTER_ROTORCRAFT":
					icon += "traffic_heli.png";
					break;
				case "GLIDER":
					icon += "traffic_glider.png";
					break;
				case "PARACHUTE":
				case "HANG_GLIDER":
				case "PARA_GLIDER":
					icon += "traffic_parachute.png";
					rotation = 0;
					break;
				case "BALLOON":
				case "AIRSHIP":
					icon += "traffic_balloon.png";
					rotation = 0;
					break;
				case "UKNOWN":
				case "TOW_PLANE":
				case "DROP_PLANE":
				case "POWERED_AIRCRAFT":
				case "JET_AIRCRAFT":
				case "UFO":
				case "UAV":
				case "STATIC_OBJECT":
				default:
					icon += "traffic_plane.png";
					break;
			}

			var planeFeature = new ol.Feature({
				geometry: new ol.geom.Point(ol.proj.fromLonLat([longitude, latitude]))
			});

			planeFeature.setStyle(
				new ol.style.Style({
					image: new ol.style.Icon({
						anchor: [0.5, 0.5],
						anchorXUnits: 'fraction',
						anchorYUnits: 'fraction',
						scale: 1,
						opacity: 1.00,
						rotation: rotation / 180 * Math.PI,
						src: icon
					}),
					text: new ol.style.Text({
						font: 'bold 14px Calibri,sans-serif',
						text: heighttext,
						fill: new ol.style.Fill({color: color}),
						stroke: new ol.style.Stroke({color: '#FFFFFF', width: 2}),
						offsetX: 0,
						offsetY: 35
					})
				})
			);

			planeFeature.acInfo = acInfo;

			return planeFeature;
		}


		function createCallsignFeature(longitude, latitude, callsign)
		{
			var icon = "icon/";
			var color = "#FF0000";

			if (!callsign)
				callsign = "";

			var csFeature = new ol.Feature({
				geometry: new ol.geom.Point(ol.proj.fromLonLat([longitude, latitude]))
			});

			csFeature.setStyle(
				new ol.style.Style({
					text: new ol.style.Text({
						font: 'bold 14px Calibri,sans-serif',
						text: callsign,
						fill: new ol.style.Fill({color: color}),
						stroke: new ol.style.Stroke({color: '#FFFFFF', width: 2}),
						offsetX: 0,
						offsetY: -35
					})
				})
			);

			return csFeature;
		}
	}


	function getDistance(lat1, lon1, lat2, lon2)
	{
		return (wgs84Sphere.haversineDistance([lon1,lat1],[lon2,lat2]) * 0.000539957);
	}


	function getBearing(lat1, lon1, lat2, lon2, magvar)
	{
		var toRad = (Math.PI / 180);
		var toDeg = (180 / Math.PI);

		var f1 = lat1 * toRad;
		var f2 = lat2 * toRad;
		var dl = (lon2 - lon1) * toRad;
		var y = Math.sin(dl) * Math.cos(f2);
		var x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl);
		var t = Math.atan2(y, x);

		return ((t * toDeg + 360) % 360 - magvar);
	}
}
