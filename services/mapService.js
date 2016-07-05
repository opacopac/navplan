/**
 * Map Service
 */

navplanApp
	.factory('mapService', mapService);

mapService.$inject = ['$http', 'trafficService', 'weatherService'];

function mapService($http, trafficService, weatherService)
{
	const MAX_ZOOMLEVEL = 17;

	var map = {};
	var mapLayer, wpTrackLayer, closeIconLayer, airportLayer, navaidLayer, airspaceLayer, reportingpointLayer, userWpLayer, flightTrackLayer, geopointLayer, trafficLayer, locationLayer, weatherLayer, webcamLayer;
	var airports = {};
	var navaids = {};
	var reportingPoints = {};
	var userWaypoints = {};
	var chartLayers = [];
	var airspaces = [];
	var currentOverlay = undefined;
	var isGeopointSelectionActive = false;
	var wgs84Sphere = new ol.Sphere(6378137);
	var minZoomLevel = [];
	var maxAgeSecTrackDots = 120; 
	var maxAgeSecInactive = 30;
	var maxTrafficForDots = 30;

	// return api reference
	return {
		MAX_ZOOMLEVEL: MAX_ZOOMLEVEL,
		addOverlay: addOverlay,
		clearAllCharts: clearAllCharts,
		closeOverlay: closeOverlay,
		displayChart: displayChart,
		drawGeopointSelection: drawGeopointSelection,
		getAirport: getAirport,
		getBearing: getBearing,
		getDistance: getDistance,
		getLatLonCoordinates: getLatLonCoordinates,
		getMapPosition: getMapPosition,
		getMercatorCoordinates: getMercatorCoordinates,
		getViewExtent: getViewExtent,
		init: init,
		setMapPosition: setMapPosition,
		updateFlightTrack: updateFlightTrack,
		updateLocation: updateLocation,
		updateSize: updateSize,
		updateTraffic: updateTraffic,
		updateUserWaypoints: updateUserWaypoints,
		updateWpTrack: updateWpTrack
	};
	
	
	// init map
	function init(onMapClickCallback, onFeatureSelectCallback, onMoveEndCallback, mapPos)
	{
		// init layers
		mapLayer = createMapLayer();
		locationLayer = createEmptyVectorLayer();
		trafficLayer = createEmptyVectorLayer();
		wpTrackLayer = createEmptyVectorLayer();
		closeIconLayer = createEmptyVectorLayer();
		airportLayer = createEmptyVectorLayer();
		navaidLayer = createEmptyVectorLayer();
		reportingpointLayer = createEmptyVectorLayer();
		userWpLayer = createEmptyVectorLayer();
		airspaceLayer = createEmptyVectorLayer();
		flightTrackLayer = createEmptyVectorLayer();
		webcamLayer = createEmptyVectorLayer();
		weatherLayer = createEmptyVectorLayer();
		geopointLayer = createEmptyVectorLayer();

		// populate layers
		populateAirports(airportLayer);
		populateNavaids(navaidLayer);
		populateAirspaces(airspaceLayer);
		populateWebcams(webcamLayer);
		populateReportingpoints(reportingpointLayer);
		updateUserWaypoints();


		// init map
		map = createMap();

		// register map events
		map.on('singleclick', onSingleClick);
		map.on('pointermove', onPointerMove);
		map.on('moveend', onMoveEnd);

		// restore chart layers
		for (var i = 0; i < chartLayers.length; i++)
			map.getLayers().insertAt(i + 1, chartLayers[i]);

		minZoomLevel = [
			{ layer: closeIconLayer, minZoom: 9 },
			{ layer: airportLayer, minZoom: 9 },
			{ layer: navaidLayer, minZoom: 9 },
			{ layer: airspaceLayer, minZoom:  9 },
			{ layer: reportingpointLayer, minZoom:  11 },
			{ layer: userWpLayer, minZoom:  11 },
			{ layer: webcamLayer, minZoom:  9 },
			{ layer: weatherLayer, minZoom:  9 }];

		setLayerVisibility();


		// functions

		function createMap()
		{
			return new ol.Map({
				target: 'map',
				//interactions: ol.interaction.defaults().extend([new dragInteraction()]),
				controls: //ol.control.defaults().extend(
					[
						new ol.control.ScaleLine({ units: 'nautical' }),
						new ol.control.Attribution()
					],
				layers: [
					mapLayer,
					airspaceLayer,
					webcamLayer,
					closeIconLayer,
					navaidLayer,
					airportLayer,
					reportingpointLayer,
					userWpLayer,
					weatherLayer,
					wpTrackLayer,
					flightTrackLayer,
					geopointLayer,
					trafficLayer,
					locationLayer
				],
				view: new ol.View(
					{
						center: mapPos.center,
						zoom: mapPos.zoom
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
		function populateAirports(layer)
		{
			$http.get('php/airports.php')
				.then(
					function (response) { // success
						if (response.data && response.data.airports) {
							for (var key in response.data.airports) {
								var ap = response.data.airports[key];

								// cache for later use
								airports[ap.icao] = ap;

								// airport icon
								var adFeature = new ol.Feature({
									geometry: new ol.geom.Point(ol.proj.fromLonLat([ap.longitude, ap.latitude]))
								});

								adFeature.airport = ap;

								var adStyle = createAdStyle(ap.type, ap.icao);

								if (adStyle)
									adFeature.setStyle(adStyle);
								else
									continue;

								layer.getSource().addFeature(adFeature);


								// rwy icon
								var rwyFeature = new ol.Feature({
									geometry: new ol.geom.Point(ol.proj.fromLonLat([ap.longitude, ap.latitude]))
								});

								var rwyStyle = createRwyStyle(ap.type, ap.runways.length > 0 ? ap.runways[0] : undefined);

								if (rwyStyle)
									rwyFeature.setStyle(rwyStyle);
								else
									continue;

								layer.getSource().addFeature(rwyFeature);


								//  parachute feature
								if (ap.mapfeatures && ap.mapfeatures.length > 0 && ap.mapfeatures[0].type == "PARACHUTE")
								{
									var parachuteFeature = new ol.Feature({
										geometry: new ol.geom.Point(ol.proj.fromLonLat([ap.longitude, ap.latitude]))
									});

									parachuteFeature.airport = ap;

									var parachuteStyle = createParachuteStyle();
									parachuteFeature.setStyle(parachuteStyle);

									layer.getSource().addFeature(parachuteFeature);
								}
							}
						}
						else {
							console.error("ERROR reading airports", response);
						}
					},
					function(response) // error
					{
						console.error("ERROR reading airports", response.status, response.data);
					}
				)
				.then(
					function() {
						weatherService.getAllWeatherInfos(populateWeatherInfo);
					}
				);


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
				else if (ad_type == "HELI_CIVIL")
					src = 'icon/ad_heli.png';
				else if (ad_type == "AF_WATER")
					src = 'icon/ad_water.png';
				else if (ad_type == "AD_MIL") {
					src = 'icon/ad_mil.png';
					textColor = "#AE1E22";
				}
				else if (ad_type == "AD_CLOSED") {
					src = 'icon/ad_closed.png';
					name = '';
				}
				else
					return;

				return new ol.style.Style({
					image: new ol.style.Icon(({
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


			function createRwyStyle(ad_type, rwy)
			{
				if (!rwy)
					return;

				var src;
				var rwy_surface = rwy.surface ? rwy.surface : undefined;
				var rwy_direction = rwy.direction1 ? rwy.direction1 : undefined;


				if (ad_type == "AD_MIL")
					src = 'icon/rwy_mil.png';
				else if (rwy_surface == "ASPH" || rwy_surface == "CONC")
					src = 'icon/rwy_concrete.png';
				else if (rwy_surface == "GRAS")
					src = 'icon/rwy_grass.png';
				else
					return;

				return new ol.style.Style({
					image: new ol.style.Icon(({
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


			function createParachuteStyle()
			{
				return new ol.style.Style({
					image: new ol.style.Icon(({
						anchor: [45, 16],
						anchorXUnits: 'pixels',
						anchorYUnits: 'pixels',
						scale: 1,
						rotateWithView: false,
						opacity: 0.8,
						src: 'icon/feature_parachute.png'
					}))
				});
			}


			function populateWeatherInfo(weatherinfolist)
			{
				for (var icao in weatherinfolist)
				{
					var ap = airports[icao];

					if (!ap)
						continue;
					else
						ap.weatherInfo = weatherinfolist[icao];

					// sky conditions
					var skycondFeature = new ol.Feature({
						geometry: new ol.geom.Point(ol.proj.fromLonLat([ap.longitude, ap.latitude]))
					});

					skycondFeature.weatherInfo = {
						airport_icao: icao,
						metar: 	weatherinfolist[icao].metar,
						taf: weatherinfolist[icao].taf
					};

					var skycondStyle = createSkycondStyle(weatherinfolist[icao].metar);

					if (skycondStyle) {
						skycondFeature.setStyle(skycondStyle);
						weatherLayer.getSource().addFeature(skycondFeature);
					}


					// wind
					var windFeature = new ol.Feature({
						geometry: new ol.geom.Point(ol.proj.fromLonLat([ap.longitude, ap.latitude]))
					});

					windFeature.weatherInfo = {
						airport_icao: icao,
						metar: 	weatherinfolist[icao].metar,
						taf: weatherinfolist[icao].taf
					};

					var windStyle = createWindStyle(weatherinfolist[icao].metar);

					if (windStyle) {
						windFeature.setStyle(windStyle);
						weatherLayer.getSource().addFeature(windFeature);
					}

				}


				function createSkycondStyle(metar)
				{
					if (!metar)
						return;

					var worstSkyCond = weatherService.getWorstSkyCondition(metar);
					var wx_cond = metar.wx_string ? metar.wx_string : "";
					var src;

					switch (worstSkyCond)
					{
						case "CAVOK" :
						case "SKC" :
						case "CLR" :
						case "NSC" :
							src = "icon/sky_skc.png";
							break;
						case "FEW" :
							src = "icon/sky_few.png";
							break;
						case "SCT" :
							src = "icon/sky_sct.png";
							break;
						case "BKN" :
							src = "icon/sky_bkn.png";
							break;
						case "OVC" :
							src = "icon/sky_ovc.png";
							break;
						default:
							return;
					}

					return new ol.style.Style({
						image: new ol.style.Icon(({
							anchor: [-24, 20],
							anchorXUnits: 'pixels',
							anchorYUnits: 'pixels',
							scale: 1,
							//opacity: 0.75,
							src: src
						})),
						text: new ol.style.Text({
							textAlign: "start",
							textBaseline: "baseline",
							font: '13px Calibri,sans-serif',
							text: wx_cond,
							fill: new ol.style.Fill({color: '#000000'}),
							stroke: new ol.style.Stroke({color: '#FFFFFF', width: 2}),
							offsetX: 43,
							offsetY: -8
						})
					});
				}


				function createWindStyle(metar)
				{
					if (!metar)
						return;

					var src;
					var rot = metar.wind_dir_degrees ? deg2rad(metar.wind_dir_degrees - 90) : undefined;
					var windrange = [[0, "0"], [2, "1-2"], [7, "5"], [12, "10"], [17, "15"], [22, "20"], [27, "25"], [32, "30"], [37, "35"], [42, "40"], [47, "45"], [55, "50"], [65, "60"], [75, "70"], [85, "80"], [95, "90"], [105, "100"]];

					for (var i = 0; i < windrange.length; i++)
					{
						if (metar.wind_speed_kt <= windrange[i][0])
						{
							src = "icon/wind_" + windrange[i][1] + "kt.png";

							if (i == 0)
								rot = 0;

							break;
						}
					}

					if (!src)
						return;

					var anchorX = -15 - 17;
					var anchorY = 5 - 17;
					var fakeX = anchorX * Math.cos(-rot) - anchorY * Math.sin(-rot) + 17;
					var fakeY = anchorX * Math.sin(-rot) + anchorY * Math.cos(-rot) + 17;

					return new ol.style.Style({
						image: new ol.style.Icon(({
							anchor: [fakeX, fakeY],
							anchorXUnits: 'pixels',
							anchorYUnits: 'pixels',
							//anchor: [0.5, 0.5],
							//anchorXUnits: 'fraction',
							//anchorYUnits: 'fraction',
							scale: 1,
							rotation: rot,
							rotateWithView: true,
							src: src
						}))
					});
				}
			}
		}


		// add navaids to icon layer
		function populateNavaids(layer)
		{
			$http.get('php/navaids.php')
				.then(
					function (response) { // success
						if (response.data && response.data.navaids) {
							for (var i = 0; i < response.data.navaids.length; i++) {
								var navaid = response.data.navaids[i];

								// cache for later use
								navaids[navaid.id] = navaid;

								var navaidFeature = new ol.Feature({
									geometry: new ol.geom.Point(ol.proj.fromLonLat([navaid.longitude, navaid.latitude]))
								});

								navaidFeature.navaid = navaid;

								var navaidStyle = createNavaidStyle(navaid.type, navaid.kuerzel);

								if (navaidStyle)
									navaidFeature.setStyle(navaidStyle);
								else
									continue;

								layer.getSource().addFeature(navaidFeature);
							}
						}
						else {
							console.error("ERROR reading navaids", response);
						}
					},
					function(response) // error
					{
						console.error("ERROR reading navaids", response.status, response.data);
					}
				);


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
					image: new ol.style.Icon(({
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


		// add reporting points
		function populateReportingpoints(reportingpointLayer)
		{
			$http.get('php/userWaypoint.php?action=readGlobalWaypoints')
				.then(
					function (response) { // success
						if (response.data && response.data.globalWaypoints) {
							for (var i = 0; i < response.data.globalWaypoints.length; i++) {
								var rp = response.data.globalWaypoints[i];

								// cache for later use
								reportingPoints[rp.id] = rp;

								var reportingpointFeature = new ol.Feature({
									geometry: new ol.geom.Point(ol.proj.fromLonLat([rp.longitude, rp.latitude]))
								});

								reportingpointFeature.reportingpoint = rp;

								var reportingpointStyle = createReportingpointStyle(rp.type, rp.name);

								if (reportingpointStyle)
									reportingpointFeature.setStyle(reportingpointStyle);
								else
									continue;

								reportingpointLayer.getSource().addFeature(reportingpointFeature);
							}
						}
						else {
							console.error("ERROR reading reporting points", response);
						}
					},
					function(response) // error
					{
						console.error("ERROR reading reporting points", response.status, response.data);
					}
				);


			function createReportingpointStyle(wp_type, name) {
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
					image: new ol.style.Icon(({
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
				.then(
					function (response) { // success
						if (response.data && response.data.airspace)
						{
							for (var key in response.data.airspace)
							{
								var airspace = response.data.airspace[key];


								// cache for later use
								airspaces[airspace.id] = airspace;

								convertPolygon(airspace);

								var airspaceFeature = new ol.Feature({
									geometry: new ol.geom.Polygon([airspace.merPolygon]),
									airspace: airspace
								});

								var airspaceStyle = createAirspaceStyle(airspace.category);

								if (airspaceStyle)
									airspaceFeature.setStyle(airspaceStyle);
								else
									continue;

								airspaceLayer.getSource().addFeature(airspaceFeature);
							}
						}
						else {
							console.error("ERROR reading airspaces", response);
						}
					},
					function(response) // error
					{
						console.error("ERROR reading airspaces", response.status, response.data);
					}
				);


			function convertPolygon(airspace)
			{
				var merCoords, lonLat;
				var merPoly = [];
				var minLat, maxLat, minLon, maxLon;

				for (var i = 0; i < airspace.polygon.length; i++)
				{
					lonLat = airspace.polygon[i];
					merCoords = ol.proj.fromLonLat(lonLat);
					merPoly.push(merCoords);

					if (!minLon || lonLat[0] < minLon)
						minLon = lonLat[0];

					if (!maxLon || lonLat[0] > maxLon)
						maxLon = lonLat[0];

					if (!minLat || lonLat[1] < minLat)
						minLat = lonLat[1];

					if (!maxLat || lonLat[1] > maxLat)
						maxLat = lonLat[1];
				}

				airspace.merPolygon = merPoly;
				airspace.lonLatExtent = [[minLon, maxLon], [minLat, maxLat]];
			}


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
				else if (category == "FIR") {
					return new ol.style.Style({
						fill: new ol.style.Fill({
							color: 'rgba(152, 206, 235, 0.3)'
						}),
						stroke: new ol.style.Stroke({
							color: 'rgba(23, 128, 194, 0.8)',
							//color: 'rgba(0, 0, 0, 1.0)',
							width: 3,
							lineDash: [1, 7]
						})
					});
				}
				else if (category == "A") {
					return new ol.style.Style({
						stroke: new ol.style.Stroke({
							color: 'rgba(174, 30, 34, 0.8)',
							width: 3
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
				else if (category == "E" || category == "TMZ") {
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
			$http.get('php/webcams.php?action=readNonAdWebcams')
				.then(
					function (response) { // success
						if (!response.data || !response.data.webcams) {
							console.error("ERROR reading webcams", response);
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
						console.error("ERROR reading webcams", response.status, response.data);
					}
				);
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
					if (feature.geopoint ||
						feature.airport ||
						feature.navaid ||
						feature.waypoint ||
						feature.userWaypoint ||
						feature.reportingpoint ||
						feature.webcam ||
						feature.weatherInfo ||
						feature.closeLayer)
					{
						closeOverlay();
						clearGeopointSelection();

						if (feature.closeLayer) {
							map.removeLayer(feature.closeLayer);
							closeIconLayer.getSource().removeFeature(feature);
						}
						else
							onFeatureSelectCallback(event, feature);

						eventConsumed = true;
					}
				},
				null,
				function (layer) // layers to search for features
				{
					return (layer === geopointLayer ||
						layer === closeIconLayer ||
						layer === airportLayer ||
						layer === navaidLayer ||
						layer === reportingpointLayer ||
						layer === userWpLayer ||
						layer === wpTrackLayer ||
						layer === webcamLayer ||
						layer === weatherLayer);
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
				if (isGeopointSelectionActive || currentOverlay) // close overlay or geopointselection
				{
					clearGeopointSelection();
					closeOverlay();
				}
				else // click on 'empty' map
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
					return (layer === geopointLayer ||
						layer === closeIconLayer ||
						layer === airportLayer ||
						layer === navaidLayer ||
						layer === reportingpointLayer ||
						layer === userWpLayer ||
						layer === wpTrackLayer ||
						layer === trafficLayer ||
						layer === webcamLayer ||
						layer === weatherLayer);
				}
			);

			if (hitLayer === geopointLayer ||
					hitLayer === closeIconLayer ||
					hitLayer === airportLayer ||
					hitLayer === navaidLayer ||
					hitLayer === reportingpointLayer ||
					hitLayer === userWpLayer ||
					hitLayer === wpTrackLayer ||
					hitLayer === trafficLayer ||
					hitLayer === webcamLayer ||
					hitLayer === weatherLayer)
			{
				map.getTargetElement().style.cursor = 'pointer';
			}
			else
			{
				map.getTargetElement().style.cursor = '';
			}
		}


		// moveend event (pan / zoom)
		function onMoveEnd(event)
		{
			setLayerVisibility();

			onMoveEndCallback(event);
		}


		function getClickRadius(event) {
			var clickPos = [event.pixel[0], event.pixel[1]];
			var coord1 = map.getCoordinateFromPixel(clickPos);
			var lat1 = ol.proj.toLonLat(coord1)[1];

			clickPos[1] -= 50;
			var coord2 = map.getCoordinateFromPixel(clickPos);
			var lat2 = ol.proj.toLonLat(coord2)[1];

			return Math.abs(lat2 - lat1);
		}
	}


	function setLayerVisibility()
	{
		var zoom = map.getView().getZoom();

		for (var i = 0; i < minZoomLevel.length; i++)
		{
			if (zoom >= minZoomLevel[i].minZoom)
				minZoomLevel[i].layer.setVisible(true);
			else
				minZoomLevel[i].layer.setVisible(false);
		}
	}


	function addOverlay(coordinates, container, autopan)
	{
		if (currentOverlay)
			closeOverlay();

		if (container.style.visibility = "hidden")
			container.style.visibility = "visible";

		currentOverlay = new ol.Overlay({
			element: container,
			autoPan: autopan,
			autoPanAnimation: {duration: 250}
		});

		map.addOverlay(currentOverlay);
		
		currentOverlay.setPosition(coordinates); // force auto panning
	}


	function closeOverlay()
	{
		if (!currentOverlay)
			return;
		else
			map.removeOverlay(currentOverlay);

		currentOverlay = undefined;
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

		var clickLonLat;
		if (clickPixel)
			clickLonLat = ol.proj.toLonLat(map.getCoordinateFromPixel(clickPixel));
		else
			clickLonLat = ol.proj.fromLonLat([geopoints[0].longitude, geopoints[0].latitude]);

		// limit to 6 points
		var maxPoints = 6;
		if (geopoints.length > maxPoints)
			geopoints = geopoints.splice(0, maxPoints);

		// add clickpoint if less than 6 points found
		if (clickPixel && geopoints.length < maxPoints)
			geopoints.push(getClickPoint(clickLonLat));

		var airspaceSelection = getAirspacesAtLatLon(clickLonLat);

		var numPointsB = Math.floor(geopoints.length / 3);
		var numPointsT = geopoints.length - numPointsB;
		var numPointsTR = Math.floor(numPointsT / 2);
		var numPointsTL = numPointsT - numPointsTR;

		// create top/bottom partitions
		var pointsT = geopoints.slice(0).sort(function(a, b) { return b.latitude - a.latitude });
		var pointsB = pointsT.splice(numPointsT, numPointsB);

		// create top left/right partitions
		var pointsTL = pointsT.slice(0).sort(function(a, b) { return a.longitude - b.longitude });
		var pointsTR = pointsTL.splice(numPointsTL, numPointsTR);

		sortQuadrantClockwise(pointsTL, true, true);
		sortQuadrantClockwise(pointsTR, true, false);
		sortQuadrantClockwise(pointsB, false, true);

		setLabelCoordinates(pointsTL, Math.PI * 1.5);
		setLabelCoordinates(pointsTR, 0.0);
		setLabelCoordinates(pointsB, Math.PI);


		for (var i = 0; i < geopoints.length; i++)
		{
			// geo point feature
			var geoPointFeature = createGeoPointFeature(geopoints[i]);
			layerSource.addFeature(geoPointFeature);

			// label point feature
			var labelFeature = createLabelFeature(geopoints[i]);
			layerSource.addFeature(labelFeature);

			// line
			var lineFeature = createLineFeature(geopoints[i]);
			layerSource.addFeature(lineFeature);

			// add data object
			addCachedObject(geopoints[i], geoPointFeature, labelFeature);
		}

		addAirspaceOverlay(airspaceSelection, geopoints);
		//addAirspaceFeature(layerSource, airspaceSelection, geopoints);


		function getAirspacesAtLatLon(clickLonLat)
		{
			var asList = [];
			var pt = turf.point(clickLonLat);

			for (key in airspaces) {
				var airspace = airspaces[key];

				if (clickLonLat[0] < airspace.lonLatExtent[0][0] || clickLonLat[0] > airspace.lonLatExtent[0][1] || clickLonLat[1] < airspace.lonLatExtent[1][0] || clickLonLat[1] > airspace.lonLatExtent[1][1])
					continue;

				var poly = turf.polygon([airspace.polygon]);

				if (turf.inside(pt, poly))
					asList.push(airspace);
			}

			// reset previous exclusions
			for (var i = 0; i < asList.length; i++)
			{
				asList[i].hide = undefined;
				asList[i].alt.bottom_replace = undefined;
			}

			// check exclusions
			for (i = 0; i < asList.length; i++)
			{
				if (asList[i].exclude_aip_id)
				{
					for (var j = 0; j < asList.length; j++)
					{
						if (asList[j].aip_id == asList[i].exclude_aip_id)
						{
							var as1b = getAirspaceHeight(asList[i].alt.bottom);
							var as1t = getAirspaceHeight(asList[i].alt.top);
							var as2b = getAirspaceHeight(asList[j].alt.bottom);
							var as2t = getAirspaceHeight(asList[j].alt.top);

							if (as1b <= as2b && as1t >= as2t) // as1 completely embraces as2
								asList[j].hide = true;
							else if (as1b <= as2b && as1t <= as2t && as1t > as2b) // as1 pushes from below into as2
								asList[j].alt.bottom_replace = asList[i].alt.top;
						}
					}
				}
			}


			// sort airspaces top to bottom
			asList.sort(function(a, b) { return getAirspaceHeight(b.alt.bottom) - getAirspaceHeight(a.alt.bottom); });

			return asList;
		}


		function getAirspaceHeight(height)
		{
			if (height.unit == 'FL')
				return height.height * 100;
			else
				return height.height;
		}


		function getClickPoint(clickLonLat)
		{
			var clickPoint = {
				type: 'user',
				longitude: clickLonLat[0],
				latitude: clickLonLat[1],
				name: Math.round(clickLonLat[1] * 10000) / 10000 + " " + Math.round(clickLonLat[0] * 10000) / 10000,
				wpname: ol.coordinate.toStringHDMS(clickLonLat)
			};


			return clickPoint;
		}


		function sortQuadrantClockwise(geopoints, isTopQuadrant, isLeftQuadrant)
		{
			if (!geopoints || geopoints.length <= 0)
				return;

			var center = { latitude: undefined, longitude: undefined };

			geopoints.sort(function(a, b) { return a.latitude - b.latitude }); // bottom to top

			if (isTopQuadrant)
				center.latitude = geopoints[0].latitude - 0.1;
			else
				center.latitude = geopoints[geopoints.length - 1].latitude + 0.1;

			geopoints.sort(function(a, b) { return a.longitude - b.longitude}); // left to right

			if (isLeftQuadrant)
				center.longitude = geopoints[geopoints.length - 1].longitude + 0.1;
			else
				center.longitude = geopoints[0].longitude - 0.1;

			geopoints.sort(function(a, b) {
				return Math.atan2(b.latitude - center.latitude, b.longitude - center.longitude) - Math.atan2(a.latitude - center.latitude, a.longitude - center.longitude)
			});
		}


		function setLabelCoordinates(geopoints, rotationRad)
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


		function createGeoPointFeature(geopoint)
		{
			var geoPointFeature = new ol.Feature({
				geometry: new ol.geom.Point(ol.proj.fromLonLat([geopoint.longitude, geopoint.latitude]))
			});

			geoPointFeature.geopoint = geopoint;

			geoPointFeature.setStyle(
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

			return geoPointFeature;
		}


		function createLabelFeature(geopoint)
		{
			var labelFeature = new ol.Feature({
				geometry: new ol.geom.Point(geopoint.labelCoordinates)
			});

			labelFeature.geopoint = geopoint;

			labelFeature.setStyle(
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
						text: geopoint.name,
						fill: new ol.style.Fill( { color: '#660066' } ),
						stroke: new ol.style.Stroke( {color: '#FFFFFF', width: 20 } ),
						offsetX: 0,
						offsetY: 0
					})
				})
			);

			return labelFeature;
		}


		function createLineFeature(geopoint)
		{
			var points = [];
			points.push(ol.proj.fromLonLat([geopoint.longitude, geopoint.latitude]));
			points.push(geopoint.labelCoordinates);

			var lineFeature = new ol.Feature({
				geometry: new ol.geom.LineString(points)
			});

			lineFeature.setStyle(
				new ol.style.Style({
					stroke : new ol.style.Stroke({
						color: '#000000',
						width: 3
					})
				})
			);

			return lineFeature;
		}


		function addAirspaceOverlay(airspaceSelection, geopoints)
		{
			// determine top left coordinate
			var minLat, maxLon;

			for (var i = 0; i < geopoints.length; i++)
			{
				if (!minLat || geopoints[i].latitude < minLat)
					minLat = geopoints[i].latitude;

				if (!maxLon || geopoints[i].longitude > maxLon)
					maxLon = geopoints[i].longitude;
			}

			var pixelTopLeft = map.getPixelFromCoordinate(ol.proj.fromLonLat([maxLon, minLat]));
			pixelTopLeft[0] += 10;
			pixelTopLeft[1] += 10;


			var airspaceHtml = '<table style="border-spacing: 3px; border-collapse: separate;">';

			for (var j = 0; j < airspaceSelection.length; j++)
			{
				var airspace = airspaceSelection[j];

				if (airspace.hide)
					continue;

				var bottom_height = airspace.alt.bottom_replace ? airspace.alt.bottom_replace : airspace.alt.bottom;

				// box
				airspaceHtml += '<tr><td><div style="position:relative"><table class="airspace-overlay ' + getBoxClass(airspace) + '">';

				// top height
				airspaceHtml += '<tr style="border-bottom: thin solid"><td>' + getHeightText(airspace.alt.top) + '</td></tr>';

				// bottom height
				airspaceHtml += '<tr><td>' + getHeightText(bottom_height) + '</td></tr>';

				airspaceHtml += '</table>';

				// airspace category
				var categoryBox = getAirspaceCategoryBox(airspace);

				if (categoryBox)
					airspaceHtml += categoryBox;

				// airspace name
				var airspaceName = getAirspaceName(airspace);

				if (airspaceName)
					airspaceHtml += airspaceName;

				airspaceHtml += '</div></td></tr>';

			}

			airspaceHtml += '</table>';

			var airspaceContainer = document.createElement('div');
			airspaceContainer.setAttribute("id", "airspace-popup");
			airspaceContainer.setAttribute("class", "airspace-container");
			airspaceContainer.innerHTML = airspaceHtml;

			addOverlay(map.getCoordinateFromPixel(pixelTopLeft), airspaceContainer, false);


			function getBoxClass(airspace)
			{
				switch (airspace.category)
				{
					case 'A':
					case 'DANGER':
					case 'RESTRICTED':
					case 'PROHIBITED':
					case 'GLIDING':
						return 'airspace-overlay-red';
					case 'CTR':
					case 'FIR':
					case 'C':
					case 'D':
					case 'E':
					case 'G':
					default:
						return 'airspace-overlay-blue';
				}
			}


			function getAirspaceCategoryBox(airspace)
			{
				var classStyle;
				var catText = airspace.category;

				switch (airspace.category)
				{
					case 'A':
						classStyle = "airspace-class-red";
						break;
					case 'C':
					case 'D':
					case 'E':
					case 'G':
						classStyle = "airspace-class-blue";
						break;
					case 'CTR':
						classStyle = "airspace-class-blue";
						catText = "D";
						break;
					case 'TMZ':
						classStyle = "airspace-class-blue";
						catText = "E";
						break;
					default:
						catText = undefined;
				}

				if (catText)
					return '<span class="airspace-class ' + classStyle + '">' + catText + '</span>';
				else
					return undefined;
			}


			function getAirspaceName(airspace)
			{
				var classStyle;
				var text = airspace.name;
				//text += '(' + airspace.aip_id + ')';

				switch (airspace.category)
				{
					case 'A':
					case 'DANGER':
					case 'RESTRICTED':
					case 'PROHIBITED':
					case 'GLIDING':
						classStyle = "airspace-name-red";
						break;
					case 'CTR':
					case 'FIR':
					case 'C':
					case 'D':
					case 'E':
					case 'G':
					default:
						classStyle = "airspace-name-blue";
						break;
				}

				if (text)
					return '<span class="airspace-name ' + classStyle + '">' + text + '</span>';
				else
					return undefined;
			}


			function getHeightText(height)
			{
				var text = height.height.toString();
				var cssClass = "airspace-overlay-heighttext-normal";

				switch (height.ref) {
					case "STD":
						text = "FL " + text;
						break;
					case "GND":
						if (height.height > 0)
							text += " AGL";
						else
							text = "GND";
						break;
					case "MSL":
						cssClass = "airspace-overlay-heighttext-agl"; // italic
						break;
				}

				return '<span class="' + cssClass + '">' + text + '</span>';
			}			
		}


		function addCachedObject(geopoint, geoPointFeature, labelFeature)
		{
			switch (geopoint.type) {
				case 'airport':
				{
					var ap = airports[geopoint.airport_icao];

					if (ap) {
						geoPointFeature.airport = ap;
						labelFeature.airport = ap;
					}
					break;
				}
				case 'navaid':
				{
					var nav = navaids[geopoint.id];

					if (nav) {
						geoPointFeature.navaid = nav;
						labelFeature.navaid = nav;
					}
					break;
				}
				case 'global':
				{
					var rp = reportingPoints[geopoint.id];

					if (rp) {
						geoPointFeature.reportingpoint = rp;
						labelFeature.reportingpoint = rp;
					}

					break;
				}
				case 'user':
				{
					var uwp = userWaypoints[geopoint.id];

					if (uwp) {
						geoPointFeature.userWaypoint = uwp;
						labelFeature.userWaypoint = uwp;
					}

					break;
				}
			}
		}
	}

	
	function updateUserWaypoints()
	{
		if (typeof userWpLayer === "undefined")
			return;
			
		var layerSource = userWpLayer.getSource();
		layerSource.clear();
			
			
		$http.get('php/userWaypoint.php')
			.success(function(data) {
				if (data.userWaypoints)
				{
					for (var i = 0; i < data.userWaypoints.length; i++)
					{
						var uwp = data.userWaypoints[i];

						// cache for later use
						userWaypoints[uwp.id] = uwp;

						var userWpFeature = new ol.Feature({
							geometry: new ol.geom.Point(ol.proj.fromLonLat([uwp.longitude, uwp.latitude]))
						});
						
						userWpFeature.userWaypoint = uwp;

						var userWpStyle = createUserWpStyle(uwp.type, uwp.name);
						
						if (userWpStyle)
							userWpFeature.setStyle(userWpStyle);
						else
							continue;
				
						layerSource.addFeature(userWpFeature);
					}
				}
				else
				{
					console.error("ERROR reading user waypoints", data);
				}
			})
			.error(function(data, status) {
				console.error("ERROR reading user waypoints", status, data);
			});


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
				image: new ol.style.Icon(({
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
	
	
	function updateWpTrack(wps, alternate, settings)
	{
		if (typeof wpTrackLayer === "undefined")
			return;
	
		var trackSource = wpTrackLayer.getSource();
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
				width: 4,
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
				
			updateWpTrackSegment(trackSource, wps[i], prevWp, nextWp, trackStyle, settings);
		}
		
		
		// alternate
		if (alternate)
		{
			if (wps.length > 0)
				prevWp = wps[wps.length - 1];
			else
				prevWp = undefined;
				
			updateWpTrackSegment(trackSource, alternate, prevWp, undefined, trackAlternateStyle, settings);
		}


		function updateWpTrackSegment(trackSource, wp, prevWp, nextWp, trackStyle, settings)
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


	function updateFlightTrack(positions)
	{
		if (typeof flightTrackLayer === "undefined")
			return;

		var flightTrackSource = flightTrackLayer.getSource();
		flightTrackSource.clear();

		var flightTrackStyle = new ol.style.Style({
			stroke : new ol.style.Stroke({
				color: '#0000FF',
				width: 3
			})
		});


		for (var i = 0; i < positions.length - 1; i++)
		{
			var pos1 = positions[i];
			var pos2 = positions[i + 1];

			// get wp coordinates
			var mapCoord1 = ol.proj.fromLonLat([pos1.longitude, pos1.latitude]);
			var mapCoord2 = ol.proj.fromLonLat([pos2.longitude, pos2.latitude]);

			var flightTrackFeature = new ol.Feature({
				geometry: new ol.geom.LineString([mapCoord1, mapCoord2])
			});

			flightTrackFeature.setStyle(flightTrackStyle);
			flightTrackSource.addFeature(flightTrackFeature);
		}
	}


	function getMapPosition()
	{
		return {
			center: ol.proj.toLonLat(map.getView().getCenter()),
			zoom: map.getView().getZoom()
		};
	}
	
	
	function setMapPosition(lat, lon, zoom, forceRender)
	{
		if (lat && lon)
		{
			var pos = ol.proj.fromLonLat([lon, lat]);
			map.getView().setCenter(pos);
		}

		if (zoom)
			map.getView().setZoom(zoom);

		if (forceRender)
			map.renderSync();
	}


	function updateSize()
	{
		map.updateSize();
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

						addChartCloseFeature(chartId, chartLayer, extent);
					}
				},
				function(response) { // error
					console.error("ERROR reading chart", response.status, response.data);
				}
			);


		function addChartCloseFeature(chartId, chartLayer, extent)
		{
			var closerFeature = new ol.Feature({
				geometry: new ol.geom.Point([extent[2], extent[3]])
			});

			var closerStyle = new ol.style.Style({
				image: new ol.style.Icon(({
					anchor: [0.5, 0.5],
					anchorXUnits: 'fraction',
					anchorYUnits: 'fraction',
					scale: 1,
					opacity: 0.90,
					src: 'icon/closerbutton.png'
				}))
			});

			closerFeature.setStyle(closerStyle);
			closerFeature.closeLayer = chartLayer;

			closeIconLayer.getSource().addFeature(closerFeature);
		}
	}


	function clearAllCharts()
	{
		for (var i = 0; i < chartLayers.length; i++)
			map.removeLayer(chartLayers[i]);


		var iconFeatures = closeIconLayer.getSource().getFeatures();


		for (var j = 0; j < iconFeatures.length; j++)
		{
			if (iconFeatures[j].closeLayer)
				closeIconLayer.getSource().removeFeature(iconFeatures[j]);
		}

		chartLayers = [];
	}


	function updateLocation(lastPositions)
	{
		var layerSource = locationLayer.getSource();
		layerSource.clear();

		if (lastPositions)
			drawTrafficTrack(lastPositions, layerSource, { actype: "OWN" }, false);
	}


	function updateTraffic(acList)
	{
		var layerSource = trafficLayer.getSource();
		layerSource.clear();

		if (acList)
		{
			var acCount = Object.keys(acList).length;

			for (var acAddress in acList)
			{
				var acInfo = {
					actype: acList[acAddress].actype,
					address: acAddress,
					addresstype: acList[acAddress].addresstype,
					callsign: '',
					receiver: acList[acAddress].positions[acList[acAddress].positions.length - 1].receiver
				};
				
				if (acList[acAddress].addresstype == "ICAO")
					acInfo.callsign = trafficService.tryReadAcCallsign(acAddress);
				
				drawTrafficTrack(acList[acAddress].positions, layerSource, acInfo, acCount > maxTrafficForDots);
			}
		}
	}


	function drawTrafficTrack(lastPositions, layerSource, acInfo, skipDots)
	{
		if (!lastPositions)
			return;

		var maxIdx = lastPositions.length - 1;

		// draw track dots
		if (!skipDots) {
			for (var i = maxIdx; i >= 0; i--) {
				if (Date.now() - lastPositions[i].timestamp < maxAgeSecTrackDots * 1000) {
					var trackDotFeature = createTrackDotFeature(lastPositions[i], acInfo.actype);
					layerSource.addFeature(trackDotFeature);
				}
				else
					break;
			}
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
				lastPositions[maxIdx],
				rotation,
				acInfo);

			layerSource.addFeature(planeFeature);

			if (acInfo.callsign)
			{
				var csFeature = createCallsignFeature(
					lastPositions[maxIdx],
					acInfo.callsign);

				layerSource.addFeature(csFeature);
			}
		}



		function createTrackDotFeature(position, trafficType)
		{
			var color;

			if (trafficType == "OWN")
				color = "#0000FF";
			else
				color = "#FF0000";

			var trackPoint = new ol.Feature({
				geometry: new ol.geom.Point(ol.proj.fromLonLat([position.longitude, position.latitude]))
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


		function createTrafficFeature(position, rotation, acInfo)
		{
			var icon = "icon/";
			var color = "#FF0000";
			var heighttext = "";
			var typetext = "";

			if (!acInfo.callsign)
				acInfo.callsign = "";

			if (position.altitude > 0)
				heighttext = Math.round(position.altitude * 3.28084).toString() + " ft"; // TODO: einstellbar

			var iconSuffix = "";
			if (position.timestamp && (Date.now() - position.timestamp > maxAgeSecInactive * 1000))
				iconSuffix = "_inactive";

			switch (acInfo.actype)
			{
				case "OWN":
					icon += "own_plane.png";
					color = "#0000FF";
					break;
				case "HELICOPTER_ROTORCRAFT":
					icon += "traffic_heli" + iconSuffix + ".png";
					break;
				case "GLIDER":
					icon += "traffic_glider" + iconSuffix + ".png";
					break;
				case "PARACHUTE":
				case "HANG_GLIDER":
				case "PARA_GLIDER":
					icon += "traffic_parachute" + iconSuffix + ".png";
					rotation = 0;
					break;
				case "BALLOON":
				case "AIRSHIP":
					icon += "traffic_balloon" + iconSuffix + ".png";
					rotation = 0;
					break;
				case "UKNOWN":
					icon += "traffic_unknown" + iconSuffix + ".png";
					rotation = 0;
					break;
				case "STATIC_OBJECT":
					icon += "traffic_static" + iconSuffix + ".png";
					rotation = 0;
					break;
				case "DROP_PLANE":
					typetext = " - Drop Plane";
					icon += "traffic_plane" + iconSuffix + ".png";
					break;
				case "UFO":
					typetext = " - UFO";
					icon += "traffic_plane" + iconSuffix + ".png";
					break;
				case "UAV":
					typetext = " - UAV";
					icon += "traffic_plane" + iconSuffix + ".png";
					break;
				case "POWERED_AIRCRAFT":
				case "TOW_PLANE":
				case "JET_AIRCRAFT":
				default:
					icon += "traffic_plane" + iconSuffix + ".png";
					break;
			}

			var planeFeature = new ol.Feature({
				geometry: new ol.geom.Point(ol.proj.fromLonLat([position.longitude, position.latitude]))
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
						text: heighttext + typetext,
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


		function createCallsignFeature(position, callsign)
		{
			var icon = "icon/";
			var color = "#FF0000";

			if (!callsign)
				callsign = "";

			var csFeature = new ol.Feature({
				geometry: new ol.geom.Point(ol.proj.fromLonLat([position.longitude, position.latitude]))
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


	function createMapLayer()
	{
		return new ol.layer.Tile({
			source: new ol.source.XYZ({
				tileUrlFunction: getTileUrl,
				minZoom: 0,
				maxZoom: MAX_ZOOMLEVEL,
				crossOrigin: null,
				attributions:
				[
					new ol.Attribution({ html: 'Map Data: &copy; <a href="https://openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors <a href="https://creativecommons.org/licenses/by-sa/2.0/" target="_blank">(CC-BY-SA)</a>' }),
					new ol.Attribution({ html: 'Elevation Data: <a href="https://lta.cr.usgs.gov/SRTM" target="_blank">SRTM</a>' }),
					new ol.Attribution({ html: 'Map Visualization: <a href="http://www.opentopomap.org/" target="_blank">OpenTopoMap</a> <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank">(CC-BY-SA)</a>' }),
					new ol.Attribution({ html: 'Aviation Data: <a href="http://www.openaip.net/" target="_blank">openAIP</a> <a href="https://creativecommons.org/licenses/by-nc-sa/3.0/" target="_blank">(BY-NC-SA)</a>' }),
					new ol.Attribution({ html: 'Traffic Data: <a href="http://wiki.glidernet.org/about" target="_blank">Open Glider Network</a>' }),
					new ol.Attribution({ html: 'Weather Data: <a href="https://www.aviationweather.gov/" target="_blank">NOAA - Aviation Weather Center</a>' }),
					new ol.Attribution({ html: 'Geographical Data: <a href="http://www.geonames.org/" target="_blank">GeoNames</a> <a href="http://creativecommons.org/licenses/by/3.0/" target="_blank">(CC-BY)</a>' }),
					new ol.Attribution({ html: 'Links to Webcams: all images are digital property of the webcam owners. check the reference for details.' })
				]
			})
		});


		function getTileUrl(coordinate)
		{
			var otmBaseUrls = [ "//a.tile.opentopomap.org/", "//b.tile.opentopomap.org/", "//c.tile.opentopomap.org/" ];
			var localBaseUrl = "maptiles/";
			var z = coordinate[0];
			var y = coordinate[1];
			var x = (-coordinate[2] - 1);

			if (isLocalTile(z, y, x))
			{
				return localBaseUrl + z + "/" + y + "/" + x + ".png";
			}
			else
			{
				var n = (z + y + x) % otmBaseUrls.length;
				return otmBaseUrls[n] + z + "/" + y + "/" + x + ".png";
			}
		}


		function isLocalTile(z, y, x)
		{
			var zrange = [ 6, 13 ];
			var zoomfact = Math.pow(2, (z - 6));
			var yrange = [33 * zoomfact, 33 * zoomfact + zoomfact - 1 ];
			var xrange = [22 * zoomfact, 22 * zoomfact + zoomfact - 1 ];

			if (z < zrange[0] || z > zrange[1])
				return false;

			if (y < yrange[0] || y > yrange[1])
				return false;

			if (x < xrange[0] || x > xrange[1])
				return false;

			return true;
		}
	}

	
	function getMercatorCoordinates(lat, lon)
	{
		return ol.proj.fromLonLat([lon, lat]);
	}


	function getLatLonCoordinates(mercatorPosition)
	{
		var latLon = ol.proj.toLonLat(mercatorPosition);
		return { latitude: latLon[1], longitude: latLon[0] };
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


	function getAirport(icao)
	{
		return airports[icao];
	}
}
