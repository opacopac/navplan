/**
 * Map Service
 */

navplanApp
	.factory('mapService', mapService);

mapService.$inject = ['$http'];

function mapService($http)
{
	var map = {}; 	// empty map reference
	var featureOverlay = {} // empty feature overlay reference
	var isSelectionActive = false;
	var wgs84Sphere = new ol.Sphere(6378137);
	

	// return api reference
	return {
		map: map,
		featureOverlay: featureOverlay,
		init: init,
		setMapPosition: setMapPosition,
		updateTrack: updateTrack,
		updateUserWaypoints: updateUserWaypoints,
		getDistance: getDistance,
		getBearing: getBearing,
		drawGeopointSelection: drawGeopointSelection,
		showFeaturePopup: showFeaturePopup,
		hideFeaturePopup: hideFeaturePopup,
		displayChart: displayChart
	};
	
	
	// init map
	function init(onMapClickCallback, onFeatureSelectCallback, onMoveEndCallback, onKmlClick, mapPos, featureContainer, email, token)
	{
		// map layer
		mapLayer =  new ol.layer.Tile({
			source: new ol.source.OSM({
				url: "http://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png",
				maxZoom: 14,
				crossOrigin: null,
				attributions: [
					new ol.Attribution({ html: 'Kartendaten: (c) OpenStreetMap-Mitwirkende, SRTM | Kartendarstellung: (c) <a href="http://www.opentopomap.org/">OpenTopoMap</a> (CC-BY-SA)'}),
					new ol.Attribution({ html: 'Aviation Data: (c) <a href="http://www.openaip.net/">openAIP</a> (CC-BY-SA)'}),
					ol.source.OSM.ATTRIBUTION
				]
			})
		});
		
		
		// track layer
		trackLayer = new ol.layer.Vector({
			source: new ol.source.Vector({ })
		});
		
		
		// icon layer
		iconLayer = new ol.layer.Vector({
			source: new ol.source.Vector({ })
		});


		// add airports to icon layer
		$http.get('php/airports.php')
			.success(function(data) {
				if (data.airports)
				{
					for (i = 0; i < data.airports.length; i++)
					{
						// airport icon
						var adFeature = new ol.Feature({
							geometry: new ol.geom.Point(ol.proj.fromLonLat([data.airports[i].longitude, data.airports[i].latitude]))
						});
						
						adFeature.airport = data.airports[i];
						
						var adStyle = createAdStyle(data.airports[i].type, data.airports[i].name);
						
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
				else
				{
					console.error("ERROR", data);
				}
			})
			.error(function(data, status)
			{
				console.error("ERROR", status, data);
			});
		
		
		// add navaids to icon layer
		$http.get('php/navaids.php')
			.success(function(data) {
				if (data.navaids)
				{
					for (i = 0; i < data.navaids.length; i++)
					{
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
				else
				{
					console.error("ERROR", data);
				}
			})
			.error(function(data, status) {
				console.error("ERROR", status, data);
			});

			
		// add global waypoints to icon layer
		$http.post('php/userWaypoint.php', obj2json({ action: 'readGlobalWaypoints' }))
			.success(function(data) {
				if (data.globalWaypoints)
				{
					for (i = 0; i < data.globalWaypoints.length; i++)
					{
						var globalWpFeature = new ol.Feature({
							geometry: new ol.geom.Point(ol.proj.fromLonLat([data.globalWaypoints[i].longitude, data.globalWaypoints[i].latitude]))
						});
						
						globalWpFeature.globalWaypoint = data.globalWaypoints[i];

						var globalWpStyle = createUserWpStyle(data.globalWaypoints[i].type, data.globalWaypoints[i].name); // TODO: different style for global (vs user)?
						
						if (globalWpStyle)
							globalWpFeature.setStyle(globalWpStyle);
						else
							continue;
				
						iconLayer.getSource().addFeature(globalWpFeature);
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


		// user waypoint layer
		userWpLayer = new ol.layer.Vector({
			source: new ol.source.Vector({ })
		});
		
		updateUserWaypoints(email, token);

			
		// airspace layer
		airspaceLayer = new ol.layer.Vector({
			source: new ol.source.Vector({ })
		});
		
		// add airspaces to airspace layer
		$http.get('php/airspace.php')
			.success(function(data, status, headers, config) {
				if (data.airspace)
				{
					for (i = 0; i < data.airspace.length; i++)
					{
						// convert polygon
						var polygon = [];
						for (j = 0; j < data.airspace[i].polygon.length; j++)
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
				else
				{
					console.error("ERROR", data);
				}
			})
			.error(function(data, status)
			{
				console.error("ERROR", status, data);
			});
		

			
		// geopoint selection layer
		geopointLayer = new ol.layer.Vector({
			source: new ol.source.Vector({ })
		});
		

		// kml export control
		var kmlLink = document.createElement('a');
		kmlLink.id = "dlKmlLink";
		kmlLink.title = "Save KML-Track for Google Earth";
		kmlLink.innerHTML = '<button type="button" class="btn btn-success btn-circle"><i class="glyphicon glyphicon-globe"></i></button>';
		kmlLink.href = "php/navplanKml.php";
		kmlLink.target = "_blank";
		kmlLink.download = "navplan-track.kml";
		kmlLink.addEventListener('click', onKmlClick, false);


		var kmlContainer = document.createElement('div');
		kmlContainer.className = 'kml-export ol-unselectable ol-control';
		kmlContainer.appendChild(kmlLink);



		// TODO: drag interactions
		// var dragInteraction = function() {
			// ol.interaction.Pointer.call(this, {
				// handleDownEvent: dragInteraction.prototype.handleDownEvent,
				// handleDragEvent: dragInteraction.prototype.handleDragEvent,
				// handleMoveEvent: dragInteraction.prototype.handleMoveEvent,
				// handleUpEvent: dragInteraction.prototype.handleUpEvent
			// });

			// this.coordinate_ = null;
			// this.cursor_ = 'pointer';
			// this.feature_ = null;
			// this.previousCursor_ = undefined;

		// };
		
		// ol.inherits(dragInteraction, ol.interaction.Pointer);


		// /**
		 // * @param {ol.MapBrowserEvent} evt Map browser event.
		 // * @return {boolean} `true` to start the drag sequence.
		 // */
		// dragInteraction.prototype.handleDownEvent = function(evt) {
			// var map = evt.map;

			// var feature = map.forEachFeatureAtPixel(
				// evt.pixel,
				// function(feature, layer) { return feature; },
				// null,
				// function(layer) { return layer === trackLayer; }
			// );

			// if (feature) {
				// this.coordinate_ = evt.coordinate;
				// this.feature_ = feature;
			// }

			// return !!feature;
		// };


		// /**
		 // * @param {ol.MapBrowserEvent} evt Map browser event.
		 // */
		// dragInteraction.prototype.handleDragEvent = function(evt) {
			// var map = evt.map;

			// var feature = map.forEachFeatureAtPixel(
				// evt.pixel,
				// function(feature, layer) { return feature; },
				// null,
				// function(layer) { return layer === trackLayer; }
			// );

		  // var deltaX = evt.coordinate[0] - this.coordinate_[0];
		  // var deltaY = evt.coordinate[1] - this.coordinate_[1];

		  // var geometry = /** @type {ol.geom.SimpleGeometry} */
			  // (this.feature_.getGeometry());
		  // geometry.translate(deltaX, deltaY);

		  // this.coordinate_[0] = evt.coordinate[0];
		  // this.coordinate_[1] = evt.coordinate[1];
		// };


		// /**
		 // * @param {ol.MapBrowserEvent} evt Event.
		 // */
		// dragInteraction.prototype.handleMoveEvent = function(evt) {
			// if (this.cursor_) {
				// var map = evt.map;
				// var feature = map.forEachFeatureAtPixel(
					// evt.pixel,
					// function(feature, layer) { return feature; },
					// null,
					// function(layer) { return layer === trackLayer; }
				// );
				// var element = evt.map.getTargetElement();
				// if (feature) {
					// if (element.style.cursor != this.cursor_) {
						// this.previousCursor_ = element.style.cursor;
						// element.style.cursor = this.cursor_;
					// }
				// } else if (this.previousCursor_ !== undefined) {
					// element.style.cursor = this.previousCursor_;
					// this.previousCursor_ = undefined;
				// }
			// }
		// };


		// /**
		 // * @param {ol.MapBrowserEvent} evt Map browser event.
		 // * @return {boolean} `false` to stop the drag sequence.
		 // */
		// dragInteraction.prototype.handleUpEvent = function(evt) {
			// this.coordinate_ = null;
			// this.feature_ = null;
			// return false;
		// };
		
		
		// feature overlay
		featureOverlay = new ol.Overlay(/** @type {olx.OverlayOptions} */ ({
			element: featureContainer,
			autoPan: true,
			autoPanAnimation: { duration: 250 }
		}));		

		
		// map
		map = new ol.Map({
			target: 'map',
			//interactions: ol.interaction.defaults().extend([new dragInteraction()]),
			controls: ol.control.defaults().extend([
				new ol.control.ScaleLine({ units: 'nautical' })
			]).extend([
				new ol.control.Control({ element: kmlContainer })
			]),
			layers: [ mapLayer, airspaceLayer, iconLayer, userWpLayer, trackLayer, geopointLayer ],
			overlays: [ featureOverlay ],
			view: new ol.View({
				center: mapPos.center,
				zoom: mapPos.zoom
			})
		});
		
		
		// click event
		map.on('click', function(event) {
			var eventConsumed = false;
			
			map.forEachFeatureAtPixel(
				event.pixel,
				function (feature, layer)
				{
					if (eventConsumed)
						return;
				
					if (feature.geopoint || feature.airport || feature.navaid || feature.waypoint || feature.userWaypoint || feature.globalWaypoint)
					{
						onFeatureSelectCallback(event, feature);
						clearGeopointSelection();
						eventConsumed = true;
					}
				},
				null,
				function(layer) { return layer === geopointLayer || layer === iconLayer || layer === userWpLayer || layer === trackLayer; }
			);
			
			if (!eventConsumed && !isSelectionActive)
				onMapClickCallback(event, ol.proj.toLonLat(event.coordinate), getClickRadius(event));
			else
				clearGeopointSelection();
		});
		

		// pointermove event
		map.on('pointermove', function(event) {
			var hitLayer = undefined;
			var hitLayer = map.forEachFeatureAtPixel(
				event.pixel,
				function(feature, layer) { return layer; },
				null,
				function(layer) { return layer === geopointLayer || layer === iconLayer || layer === userWpLayer || layer === trackLayer; }
			);
			
			if (hitLayer === geopointLayer || hitLayer === iconLayer || hitLayer === userWpLayer || hitLayer === trackLayer)
				map.getTargetElement().style.cursor = 'pointer';
			else
				map.getTargetElement().style.cursor = '';
		});
		
		
		// moveend event
		map.on('moveend', function(event) {
			onMoveEndCallback(event);
		});
	}
	
	
	function createNavaidStyle(navaid_type, name)
	{
		if (navaid_type == "NDB")
		{
			src = 'icon/navaid_ndb.png';
			offsetY = 33;
		}
		else if (navaid_type == "VOR-DME" || navaid_type == "DVOR-DME")
		{
			src = 'icon/navaid_vor-dme.png';
			offsetY = 20;
		}
		else if (navaid_type == "DME")
		{
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
				fill: new ol.style.Fill( { color: '#451A57' } ),
				stroke: new ol.style.Stroke( {color: '#FFFFFF', width: 2 } ),
				offsetX: 0,
				offsetY: offsetY
			})
		});
	}
	
	
	function createUserWpStyle(wp_type, name)
	{
		if (wp_type == "report")
		{
			src = 'icon/wp_report.png';
			offsetY = 20;
		}
		else 
		{
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
				fill: new ol.style.Fill( { color: '#0077FF' } ),
				stroke: new ol.style.Stroke( {color: '#FFFFFF', width: 2 } ),
				offsetX: 0,
				offsetY: offsetY
			})
		});
	}

	
	function createAdStyle(ad_type, name)
	{
		var textColor = "#451A57";
	
		if (ad_type == "APT" || ad_type == "INTL_APT")
			src = 'icon/ad_civ.png';
		else if (ad_type == "AF_CIVIL" || ad_type == "GLIDING")
			src = 'icon/ad_civ_nofac.png';
		else if (ad_type == "AF_MIL_CIVIL")
			src = 'icon/ad_civmil.png';
		else if (ad_type == "AD_MIL")
		{
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
				fill: new ol.style.Fill( { color: textColor } ),
				stroke: new ol.style.Stroke( {color: "#FFFFFF", width: 2 } ),
				offsetX: 0,
				offsetY: 25
			})
		});
	}

	
	function createRwyStyle(ad_type, rwy_surface, rwy_direction)
	{
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
				rotation: (rwy_direction - 45) / 180 * 3.1415926,
				rotateWithView: true,
				opacity: 0.75,
				src: src
			}))
		});
	}
		

	function createAirspaceStyle(category)
	{
		if (category == "CTR")
		{
			return new ol.style.Style({
				fill: new ol.style.Fill({
					color: 'rgba(152, 206, 235, 0.3)'
				}),
				stroke : new ol.style.Stroke({
					color: 'rgba(23, 128, 194, 0.8)',
					width: 3,
					lineDash: [10, 7]
				})
			});
		}
		else if (category == "CTR2")
		{
			return new ol.style.Style({
				stroke : new ol.style.Stroke({
					color: 'rgba(152, 206, 235, 0.8)',
					width: 10
				})
			});
		}
		else if (category == "C" || category == "D")
		{
			return new ol.style.Style({
				stroke : new ol.style.Stroke({
					color: 'rgba(23, 128, 194, 0.8)',
					width: 3
				})
			});
		}
		else if (category == "E")
		{
			return new ol.style.Style({
				stroke : new ol.style.Stroke({
					color: 'rgba(23, 128, 194, 0.8)',
					width: 2
				})
			});
		}
		else if (category == "DANGER" || category == "RESTRICTED")
		{
			return new ol.style.Style({
				stroke : new ol.style.Stroke({
					color: 'rgba(174, 30, 34, 0.8)',
					width: 2
				})
			});
		}
		else
			return;
	}		
		
	
	function getClickRadius(event)
	{
		var clickPos = map.getEventPixel(event);
		var coord1 = map.getCoordinateFromPixel(clickPos);
		var lon1 = ol.proj.toLonLat(coord1)[0];
		
		clickPos[0] += 50;
		var coord2 = map.getCoordinateFromPixel(clickPos);
		var lon2 = ol.proj.toLonLat(coord2)[0];
		
		return lon2 - lon1;
	}
	
	
	function showFeaturePopup(lat, lon)
	{
		var coords = ol.proj.fromLonLat([lon, lat]);
		//var pixelCoords = map.getPixelFromCoordinate(coords);
	
		featureOverlay.setPosition(coords);
	}
	
	
	function hideFeaturePopup()
	{
		featureOverlay.setPosition(undefined);
	}
	
	
	function clearGeopointSelection()
	{
		geopointLayer.getSource().clear();
		isSelectionActive = false;
	}
	
	
	function drawGeopointSelection(geopoints, clickPixel)
	{
		layerSource = geopointLayer.getSource();
		layerSource.clear();
		
		isSelectionActive = true;
		
		// add clickpoint
		if (geopoints.length < 8)
		{
			var clickLonLat = ol.proj.toLonLat(map.getCoordinateFromPixel(clickPixel));
			
			clickPoint = {
				type: 'user',
				longitude: clickLonLat[0],
				latitude: clickLonLat[1],
				name: Math.round(clickLonLat[1] * 10000) / 10000 + " " + Math.round(clickLonLat[0] * 10000) / 10000,
				wpname: ol.coordinate.toStringHDMS(clickLonLat)
			}
			
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


		for (i = 0; i < geopoints.length; i++)
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
	}
	

	function setLabelCoordinates(geopoints, rotationRad, centerPixel)
	{
		if (geopoints.length == 0)
			return;
			
		var radiusPixel = 100;
		var rotOffset = 0;
		var rotInc = Math.PI / 2 / (geopoints.length + 1);
		
		for (i = 0; i < geopoints.length; i++)
		{
			geoPointPixel = map.getPixelFromCoordinate(ol.proj.fromLonLat([geopoints[i].longitude, geopoints[i].latitude]));
		
			labelCoordX = geoPointPixel[0] + Math.sin(rotationRad + (i + 1) * rotInc + rotOffset) * radiusPixel;
			labelCoordY = geoPointPixel[1] - Math.cos(rotationRad + (i + 1) * rotInc + rotOffset) * radiusPixel;
			
			geopoints[i].labelCoordinates = map.getCoordinateFromPixel([labelCoordX, labelCoordY]);
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
						for (i = 0; i < data.userWaypoints.length; i++)
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
		for (i = 0; i < wps.length; i++)
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
	}
	
	
	function updateTrackSegment(trackSource, wp, prevWp, nextWp, trackStyle, settings)
	{
		// get wp coordinates
		mapCoord = ol.proj.fromLonLat([wp.longitude, wp.latitude]);
		
		
		// add track line segment
		if (prevWp)
		{
			mapCoord0 = ol.proj.fromLonLat([prevWp.longitude, prevWp.latitude]);

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
		
		wpStyle = createWaypointStyle(wp, nextWp);
		wpFeature.setStyle(wpStyle);
		wpFeature.waypoint = wp;
		trackSource.addFeature(wpFeature);

		
		// add direction & bearing label
		var dbFeature  = new ol.Feature({
			geometry: new ol.geom.Point(mapCoord)
		});
		
		dbStyle = createDirBearStyle(nextWp, settings);
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
	
	
	function setMapPosition(lat, lon, zoom)
	{
		var pos = ol.proj.fromLonLat([lon, lat]);
		
		map.getView().setCenter(pos);
		map.getView().setZoom(zoom);
	}
	
	
	function displayChart(chartId)
	{
		// load chart data
		$http.post('php/ad_charts.php', obj2json({ action: 'read', id: chartId }))
			.success(function(data) {
				if (data.chart)
				{
					var xmpp = data.chart.width_mm / 1000 / data.chart.width_pixel * data.chart.scale;
					var ympp = data.chart.height_mm / 1000 / data.chart.height_pixel * data.chart.scale;
					
					var posNE = ol.proj.fromLonLat(moveNorthEast(
						data.chart.longitude,
						data.chart.latitude,
						data.chart.arp_pixeloffset_south * ympp,
						(data.chart.width_pixel - data.chart.arp_pixeloffset_east) * xmpp));
					var posSW = ol.proj.fromLonLat(moveSouthWest(
						data.chart.longitude,
						data.chart.latitude,
						(data.chart.height_pixel - data.chart.arp_pixeloffset_south) * ympp,
						data.chart.arp_pixeloffset_east * xmpp));
					
					var extent = [posSW[0], posSW[1], posNE[0], posNE[1]];
					
					var projection = new ol.proj.Projection({
						code: 'chart',
						units: 'm',
						extent: extent
					});
					
					chartLayer = new ol.layer.Image({
						source: new ol.source.ImageStatic({
							url: 'charts/' + data.chart.filename,
							projection: projection,
							imageExtent: extent
						}),
						opacity: 0.8
					});
					
					map.getLayers().insertAt(1, chartLayer);
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
	
	
	function getDestination(lon1Deg, lat1Deg, distM, brngRad)
	{
		var dR = distM / 6378137.0;
		var lon1 = convertToRad(lon1Deg);
		var lat1 = convertToRad(lat1Deg);
		
		var lat2 = Math.asin(Math.sin(lat1) * Math.cos(dR) + Math.cos(lat1) * Math.sin(dR) * Math.cos(brngRad));
		var lon2 = lon1 + Math.atan2(Math.sin(brngRad) * Math.sin(dR) * Math.cos(lat1), Math.cos(dR) - Math.sin(lat1) * Math.sin(lat2));
		
		return [convertToDeg(lon2), convertToDeg(lat2)];
	}
	
	
	function moveNorthEast(lon1, lat1, distNorthM, distEastM)
	{
		var pos1 = getDestination(lon1, lat1, distNorthM, 0);
		return getDestination(pos1[0], pos1[1], distEastM, Math.PI / 2);
	}
	
	
	function moveSouthWest(lon1, lat1, distSouthM, distWestM)
	{
		var pos1 = getDestination(lon1, lat1, distSouthM, Math.PI);
		return getDestination(pos1[0], pos1[1], distWestM, 3* Math.PI / 2);
	}
	
	
	function convertToRad(deg)
	{
		return deg / 360 * 2 * Math.PI
	}
	
	
	function convertToDeg(rad)
	{
		return rad / (2 * Math.PI) * 360;
	}
	
	
	/*function convertDmsToDec(posDms)
	{
		var parts = posDms.split(/^(\d+)\D+(\d+)\D+(\d+)\D*(\w+)$/);
		var posDec = parseInt(parts[1]) + parseInt(parts[2])/60 + parseInt(parts[3])/(60*60);
		
		if (parts[4] == "W" || parts[4] == "w" || parts[4] == "S" || parts[4] == "s")
			posDec = -posDec;
			
		return posDec;
	}


	// Convert CH y/x to WGS lat
	function CHtoWGSlat(y, x) {
	  // Converts military to civil and  to unit = 1000km
	  // Auxiliary values (% Bern)
	  var y_aux = (y - 600000)/1000000;
	  var x_aux = (x - 200000)/1000000;
	  
	  // Process lat
	  lat = 16.9023892
		   +  3.238272 * x_aux
		   -  0.270978 * Math.pow(y_aux,2)
		   -  0.002528 * Math.pow(x_aux,2)
		   -  0.0447   * Math.pow(y_aux,2) * x_aux
		   -  0.0140   * Math.pow(x_aux,3);
		
	  // Unit 10000" to 1 " and converts seconds to degrees (dec)
	  lat = lat * 100/36;
	  
	  return lat;
	}

	// Convert CH y/x to WGS long
	function CHtoWGSlng(y, x) {
	  // Converts military to civil and  to unit = 1000km
	  // Auxiliary values (% Bern)
	  var y_aux = (y - 600000)/1000000;
	  var x_aux = (x - 200000)/1000000;
	  
	  // Process long
	  lng = 2.6779094
			+ 4.728982 * y_aux
			+ 0.791484 * y_aux * x_aux
			+ 0.1306   * y_aux * Math.pow(x_aux,2)
			- 0.0436   * Math.pow(y_aux,3);
		 
	  // Unit 10000" to 1 " and converts seconds to degrees (dec)
	  lng = lng * 100/36;
		 
	  return lng;
	}	*/
}
