/**
 * Terrain Service
 */

navplanApp
    .factory('terrainService', terrainService );

terrainService.$inject = ['$http'];

function terrainService($http)
{
    var BASE_URL = "php/terrain.php";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var IMAGE_HEIGHT_PX = 200;
    var GRID_ELEVATION_MAIN_STEP_FT = 5000;
    var GRID_ELEVATION_MINOR_STEP_FT = 1000;
    var ID_TEXTBG_BLUE = "textBgBlue";
    var ID_TEXTBG_RED = "textBgRed";
    var ID_TEXTBG_GREEN = "textBgGreeen";
    var MIN_TERRAIN_CLEARANCE_FT = 1000;
    var MIN_TERRAIN_CLEARANCE_FOR_WARNING_FT = 500;
    var IMAGE_HEADROOM_M = 1000;


    // return api reference
    return {
        updateTerrain: updateTerrain
    };


    function updateTerrain(waypoints, aircraft, wpClickCallback, successCallback, errorCallback)
    {
        getElevations(waypoints, aircraft, showTerrain, errorCallback);

        function showTerrain(terrain, aircraft)
        {
            const container = document.getElementById("terrainContainer");

            if (!container)
                return;

            const imageWitdhPx = container.clientWidth;
            const maxAltitudeM = Math.max(terrain.maxelevation_m, getHighestWpAltM(waypoints)) + IMAGE_HEADROOM_M;
            const svg = getTerrainSvg(waypoints, terrain, aircraft, maxAltitudeM, imageWitdhPx, IMAGE_HEIGHT_PX, wpClickCallback);

            while (container.firstChild)
                container.removeChild(container.firstChild);

            container.appendChild(svg);

            if (successCallback)
                successCallback();
        }
    }


    function getHighestWpAltM(waypoints) {
        let highestAltFt = 0;
        for (const wp of waypoints) {
            if (wp.alt && parseFloat(wp.alt) > highestAltFt) {
                highestAltFt = parseFloat(wp.alt);
            }
        }

        return ft2m(highestAltFt);
    }


    function getElevations(waypoints, aircraft, successCallback, errorCallback)
    {
        var positions = [];
        for (var i = 0; i < waypoints.length; i++)
            positions.push([waypoints[i].longitude, waypoints[i].latitude]);

        loadTerrain(positions, aircraft, successCallback, errorCallback);
    }


    function loadTerrain(positions, aircraft, successCallback, errorCallback)
    {
        $http.post(BASE_URL, obj2json({ positions: positions }))
            .then(
                function (response) // success
                {
                    if (response && response.data && response.data.terrain)
                    {
                        if (successCallback)
                            successCallback(response.data.terrain, aircraft);
                    }
                    else
                    {
                        logResponseError("ERROR reading terrain", response);

                        if (errorCallback)
                            errorCallback();
                    }
                },
                function (response) // error
                {
                    logResponseError("ERROR reading terrain", response);

                    if (errorCallback)
                        errorCallback();
                }
            );
    }


    function getTerrainSvg(waypoints, terrain, aircraft, maxelevation_m, imageWidthPx, imageHeightPx, wpClickCallback)
    {
        var svg = document.createElementNS(SVG_NS, "svg");
        svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        svg.setAttribute('width', imageWidthPx);
        svg.setAttribute('height', imageHeightPx);
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.setAttribute('class', 'map-terrain-svg');

        addFilterDefs(svg);
        addElevationPolygon(svg, terrain, maxelevation_m, imageWidthPx, imageHeightPx);
        addAirspacePolygons(svg, terrain, maxelevation_m, imageWidthPx, imageHeightPx);
        addSvgGrid(svg, maxelevation_m);
        //addRoute(svg, terrain, waypoints, wpClickCallback);

        calcLegsAltitudeMetaData(waypoints, aircraft, terrain);
        addRoute2(svg, terrain, waypoints, aircraft, wpClickCallback, maxelevation_m);

        return svg;
    }


    function addFilterDefs(svg)
    {
        var defs = document.createElementNS(SVG_NS, "defs");
        svg.appendChild(defs);

        addColorFilter(defs, ID_TEXTBG_BLUE, "#1780C2");
        addColorFilter(defs, ID_TEXTBG_RED, "#AE1E22");
        addColorFilter(defs, ID_TEXTBG_GREEN, "#009640");


        function addColorFilter(defs, id, color)
        {
            var filter = document.createElementNS(SVG_NS, "filter");
            filter.setAttribute("id", id);
            filter.setAttribute("x", "0");
            filter.setAttribute("y", "0");
            filter.setAttribute("width", "1");
            filter.setAttribute("height", "1");
            defs.appendChild(filter);

            var feFlood = document.createElementNS(SVG_NS, "feFlood");
            feFlood.setAttribute("flood-color", color);
            filter.appendChild(feFlood);

            var feComp = document.createElementNS(SVG_NS, "feComposite");
            feComp.setAttribute("in", "SourceGraphic");
            //feComp.setAttribute("operator", "xor");
            filter.appendChild(feComp);
        }

        /*
         <defs>
         <filter x="0" y="0" width="1" height="1" id="solid">
         <feFlood flood-color="yellow"/>
         <feComposite in="SourceGraphic" operator="xor"/>
         </filter>
         </defs>
         <text filter="url(#solid)" x="20" y="50" font-size="50"> solid background </text>
         <text x="20" y="50" font-size="50">solid background</text>
         */
    }


    function addElevationPolygon(svg, terrain, maxelevation_m, imageWidthPx, imageHeightPx)
    {
        var points = getPointString(0, 0, terrain.totaldistance_m, maxelevation_m, imageWidthPx, imageHeightPx);

        for (var i = 0; i < terrain.elevations_m.length; i++)
        {
            var dist = terrain.elevations_m[i][0];
            var elevation = terrain.elevations_m[i][1];

            points += getPointString(dist, elevation, terrain.totaldistance_m, maxelevation_m, imageWidthPx, imageHeightPx);
        }

        points += getPointString(terrain.totaldistance_m, terrain.elevations_m[terrain.elevations_m.length - 1][1], terrain.totaldistance_m, maxelevation_m, imageWidthPx, imageHeightPx);
        points += getPointString(terrain.totaldistance_m, 0, terrain.totaldistance_m, maxelevation_m, imageWidthPx, imageHeightPx);

        var polygon = document.createElementNS(SVG_NS, "polygon");
        polygon.setAttribute('style', "fill:lime; stroke:darkgreen; stroke-width:0.5px");
        polygon.setAttribute("points", points);
        svg.appendChild(polygon);
    }


    function addAirspacePolygons(svg, terrain, maxelevation_m, imageWidthPx, imageHeightPx)
    {
        // sort airspaces top down (lower ones, e.g. CTR will be drawn "in front" of higher ones)
        terrain.airspaces.sort(function(a, b) {
            return b.heights[0][1] - a.heights[0][1];
        });


        // add airspace polygons to svg
        for (var i = 0; i < terrain.airspaces.length; i++)
        {
            var airspace = terrain.airspaces[i];
            var points = "";

            for (var j = 0; j < airspace.heights.length; j++) // upper heights
                points += getPointString(airspace.heights[j][0], airspace.heights[j][2], terrain.totaldistance_m, maxelevation_m, imageWidthPx, imageHeightPx);

            for (j = airspace.heights.length - 1; j >= 0; j--) // lower heights
                points += getPointString(airspace.heights[j][0], airspace.heights[j][1], terrain.totaldistance_m, maxelevation_m, imageWidthPx, imageHeightPx);

            // polygon
            var polygon = document.createElementNS(SVG_NS, "polygon");
            setAirspacePolyLineStyle(polygon, airspace.category);
            polygon.setAttribute("points", points);
            svg.appendChild(polygon);

            // tooltip
            var title = document.createElementNS(SVG_NS, "title");
            title.textContent = terrain.airspaces[i].name;
            polygon.appendChild(title);

            // category label
            ptBottomLeft = getPointArray(airspace.heights[0][0], airspace.heights[0][1], terrain.totaldistance_m, maxelevation_m, imageWidthPx, imageHeightPx);

            if (ptBottomLeft[1] > 0)
                addAirspaceCategory(svg, ptBottomLeft, airspace.category);
        }


        function setAirspacePolyLineStyle(polyline, category)
        {
            switch (category)
            {
                case "CTR":
                    polyline.setAttribute("style", "fill:rgba(152, 206, 235, 0.7); stroke:rgba(23, 128, 194, 0.8); stroke-width:3px");
                    //polyline.setAttribute("style", "fill:rgba(23, 128, 194, 0.6); stroke:rgba(23, 128, 194, 0.8); stroke-width:3px");
                    polyline.setAttribute("stroke-dasharray", "10, 7");
                    break;
                case "A" :
                    polyline.setAttribute("style", "fill:rgba(174, 30, 34, 0.2); stroke:rgba(174, 30, 34, 0.8); stroke-width:4px");
                    break;
                case "B":
                case "C":
                case "D":
                    polyline.setAttribute("style", "fill:rgba(23, 128, 194, 0.2); stroke:rgba(23, 128, 194, 0.8); stroke-width:3px");
                    break;
                case "E":
                    polyline.setAttribute("style", "fill:rgba(23, 128, 194, 0.2); stroke:rgba(23, 128, 194, 0.8); stroke-width:3px");
                    break;
                case "DANGER":
                case "RESTRICTED":
                case "PROHIBITED":
                    polyline.setAttribute("style", "fill:rgba(174, 30, 34, 0.2); stroke:rgba(174, 30, 34, 0.8); stroke-width:3px");
                    break;
                case "TMZ":
                case "RMZ":
                case "FIZ":
                case "ATZ":
                    polyline.setAttribute("style", "fill:rgba(23, 128, 194, 0.2); stroke:rgba(23, 128, 194, 0.8); stroke-width:3px");
                    polyline.setAttribute("stroke-dasharray", "3, 7");
                    break;
                case "GLIDING":
                case "WAVE":
                case "SPORT":
                    polyline.setAttribute("style", "fill:rgba(0, 150, 64, 0.2); stroke:rgba(0, 150, 64, 0.8); stroke-width:3px");
                    break;
                default :
                    polyline.setAttribute("style", "fill:none; stroke:none; stroke-width:0px");
                    return;
            }
        }


        function addAirspaceCategory(svg, point, cat)
        {
            var height = 20;
            var charWidth1 = 14;
            var charWidth3 = 33;
            var x = point[0];
            var y = point[1];
            var colorBlue = "rgba(23, 128, 194, 0.8)"; // "#1780C2";
            var colorRed = "rgba(174, 30, 34, 0.8)"; // "#AE1E22";
            var colorGreen = "rgba(0, 150, 64, 0.8)"; // "#009640";

            switch(cat)
            {
                case "CTR":
                    addText(svg, cat, x, y, charWidth3, height, colorBlue);
                    break;
                case "A" :
                    addText(svg, cat, x, y, charWidth1, height, colorRed);
                    break;
                case "B":
                case "C":
                case "D":
                case "E":
                    addText(svg, cat, x, y, charWidth1, height, colorBlue);
                    break;
                case "DANGER":
                    addText(svg, "Dng", x, y, charWidth3, height, colorRed);
                    break;
                case "RESTRICTED":
                    addText(svg, "R", x, y, charWidth1, height, colorRed);
                    break;
                case "PROHIBITED":
                    addText(svg, "P", x, y, charWidth1, height, colorRed);
                    break;
                case "TMZ":
                case "RMZ":
                case "FIZ":
                case "ATZ":
                    addText(svg, cat, x, y, charWidth3, height, colorBlue);
                    break;
                case "GLIDING":
                case "WAVE":
                    addText(svg, "GLD", x, y, charWidth3, height, colorGreen);
                    break;
                case "SPORT":
                    addText(svg, cat, x, y, charWidth3, height, colorGreen);
                    break;
            }


            function addText(svg, text, x, y, width, height, color)
            {
                var textBg = document.createElementNS(SVG_NS, "rect");
                textBg.setAttribute("x", x);
                textBg.setAttribute("y", y - height);
                textBg.setAttribute("width", width);
                textBg.setAttribute("height", height);
                textBg.setAttribute("style", "fill:" + color + ";stroke-width:0");
                svg.appendChild(textBg);

                var textFg = document.createElementNS(SVG_NS, "text");
                textFg.setAttribute("x", Math.round(x + width / 2));
                textFg.setAttribute("y", Math.round(y - height / 2));
                textFg.setAttribute("text-anchor", "middle");
                textFg.setAttribute("transform", "translate(0 4)");
                textFg.setAttribute("style", "stroke:none; fill:#FFFFFF;");
                textFg.setAttribute("font-family", "Calibri,sans-serif");
                textFg.setAttribute("font-weight", "bold");
                textFg.setAttribute("font-size", "14px");
                textFg.textContent = text;
                svg.appendChild(textFg);
            }
        }
    }

    function addSvgGrid(svg, maxelevation_m)
    {
        var maxelevation_ft = m2ft(maxelevation_m);
        var showMinorLabels = maxelevation_ft / GRID_ELEVATION_MAIN_STEP_FT < 2.5;

        // major lines
        for (var i = 0; i <= maxelevation_ft; i += GRID_ELEVATION_MAIN_STEP_FT)
        {
            var elevationPercent = 100 * (1 - i / maxelevation_ft);
            var labelText = (i == 0) ? i + " ft (AMSL)" : i + " ft";
            addGridLine(svg, elevationPercent, false);
            addGridLabel(svg, elevationPercent, labelText);
        }

        // minor lines
        for (i = 0; i <= maxelevation_ft; i += GRID_ELEVATION_MINOR_STEP_FT)
        {
            if (i % GRID_ELEVATION_MAIN_STEP_FT == 0)
                continue;

            var elevationPercent = 100 * (1 - i / maxelevation_ft);
            addGridLine(svg, elevationPercent, true);

            if (showMinorLabels)
                addGridLabel(svg, elevationPercent, i + " ft");
        }


        function addGridLine(svg, elevationPercent, isDashed)
        {
            var line = document.createElementNS(SVG_NS, "line");
            line.setAttribute("x1", "0%");
            line.setAttribute("x2", "100%");
            line.setAttribute("y1", elevationPercent.toString() + "%");
            line.setAttribute("y2", elevationPercent.toString() + "%");
            line.setAttribute("style", "stroke:green; stroke-width:1px;");
            line.setAttribute("vector-effect", "non-scaling-stroke");
            line.setAttribute("shape-rendering", "crispEdges");

            if (isDashed)
                line.setAttribute("stroke-dasharray", "1, 2");

            svg.appendChild(line);
        }


        function addGridLabel(svg, elevationPercent, text)
        {
            var label = document.createElementNS(SVG_NS, "text");
            label.setAttribute("x", "5");
            label.setAttribute("y", elevationPercent.toString() + "%");
            label.setAttribute("style", "stroke:none; fill:green;");
            label.setAttribute("text-anchor", "start");
            label.setAttribute("font-family", "Calibri,sans-serif");
            label.setAttribute("font-size", "10px");
            label.setAttribute("transform", "translate(3, -3)");
            label.textContent = text;

            svg.appendChild(label);
        }
    }


    function getPointArray(dist_m, height_m, maxdistance_m, maxelevation_m, imageWidthPx, imageHeightPx)
    {
        const x = Math.round(dist_m / maxdistance_m * imageWidthPx);
        const y = Math.round((maxelevation_m - height_m) / maxelevation_m * imageHeightPx);

        return [x, y];
    }

    function getPointString(dist_m, height_m, maxdistance_m, maxelevation_m, imageWidthPx, imageHeightPx)
    {
        const pt = getPointArray(dist_m, height_m, maxdistance_m, maxelevation_m, imageWidthPx, imageHeightPx);

        return pt[0] + "," + pt[1] + " ";
    }


    function calcLegsAltitudeMetaData(waypoints, aircraft, terrain) {
        for (let i = terrain.legs.length - 1; i >= 0; i--) {
            const leg = terrain.legs[i];
            const nextLeg = i < terrain.legs.length - 1 ? terrain.legs[i + 1] : null;
            const wp = waypoints[i + 1];
            const prevWp = waypoints[i];
            const wpAlt = wp.alt ? parseFloat(wp.alt) : null;
            const isFirstLegFromAirport = (i === 0 && prevWp.type === "airport");
            const isLastLegToAirport = (i === terrain.legs.length - 1 && wp.type === "airport");

            // get terrain clearance
            const minTerrainAltFt = m2ft(leg.maxelevation_m) + MIN_TERRAIN_CLEARANCE_FT;
            leg.minTerrainAltFt = Math.ceil(minTerrainAltFt / 100) * 100;


            // leg END
            leg.endAlt = initAltMetaData();

            // get leg end altitudes defined by user
            leg.endAlt.minUserAltFt = !wp.isaltatlegstart && isWpMinAlt(wp) ? wpAlt : null;
            leg.endAlt.maxUserAltFt = !wp.isaltatlegstart && isWpMaxAlt(wp) ? wpAlt : null;

            // clamp leg end altitudes for destination airport to GND
            if (isLastLegToAirport) {
                const gndAltFt = m2ft(terrain.elevations_m[terrain.elevations_m.length - 1][1]);
                leg.endAlt.minUserAltFt = gndAltFt;
                leg.endAlt.maxUserAltFt = gndAltFt;
            }

            // find back propagated altitudes from next leg (if any)
            const backPropMinAltFt = nextLeg ? nextLeg.startAlt.minAltFt : leg.minTerrainAltFt;
            const backPropMaxAltFt = nextLeg ? nextLeg.startAlt.maxAltFt : leg.minTerrainAltFt;

            // calculate leg end altitudes by prio
            calcAltByPrio(leg.endAlt, leg.minTerrainAltFt, backPropMinAltFt, backPropMaxAltFt);


            // leg START
            leg.startAlt = initAltMetaData();

            // get altitudes defined by user
            leg.startAlt.minUserAltFt = wp.isaltatlegstart && isWpMinAlt(wp) ? wpAlt : null;
            leg.startAlt.maxUserAltFt = wp.isaltatlegstart && isWpMaxAlt(wp) ? wpAlt : null;

            // clamp leg start altitudes for origin airport to GND
            if (isFirstLegFromAirport) {
                const gndAltFt = m2ft(terrain.elevations_m[0][1]);
                leg.startAlt.minUserAltFt = gndAltFt;
                leg.startAlt.maxUserAltFt = gndAltFt;
            }

            // calculate climb/descent performance backwards from leg end to start
            const legDescentTimeMin = calcLegDescentTimeMin(wp, aircraft);
            const legClimbTimeMin = calcLegClimbTimeMin(wp, aircraft);
            const legStartMinClimbAltFt = calcClimbStartingAltFt(leg.endAlt.minAltFt, legClimbTimeMin, aircraft.rocSeaLevelFpm, aircraft.serviceCeilingFt);
            const legStartMaxDecentAltFt = calcDescentStartingAltFt(leg.endAlt.maxAltFt, legDescentTimeMin, aircraft.rodFpm);

            // calculate leg start altitudes by prio
            calcAltByPrio(leg.startAlt, leg.minTerrainAltFt, legStartMinClimbAltFt, legStartMaxDecentAltFt);
        }
    }


    function calcAltByPrio(legAlt, legMinTerrainAltFt, backPropMinAltFt, backPropMaxAltFt) {
        // prio 3: back-propagate from next leg
        legAlt.minAltFt = backPropMinAltFt;
        legAlt.maxAltFt = backPropMaxAltFt;

        // prio 2: terrain clearance: override back-propagation if below terrain clearance
        if (legMinTerrainAltFt > legAlt.minAltFt) {
            legAlt.minAltFt = legMinTerrainAltFt;
        }
        if (legMinTerrainAltFt > legAlt.maxAltFt) {
            legAlt.maxAltFt = legMinTerrainAltFt;
        }

        // prio 1: used defined altitudes: override values if above previous min / below previous max
        if (legAlt.minUserAltFt && legAlt.minUserAltFt > legAlt.minAltFt) {
            legAlt.minAltFt = legAlt.minUserAltFt;
        }
        if (legAlt.maxUserAltFt && legAlt.maxUserAltFt < legAlt.maxAltFt) {
            legAlt.maxAltFt = legAlt.maxUserAltFt;
        }
        // TODO
        if (legAlt.minUserAltFt && legAlt.minUserAltFt > legAlt.maxAltFt) {
            legAlt.maxAltFt = legAlt.minUserAltFt;
        }
        // TODO
        if (legAlt.maxUserAltFt && legAlt.maxUserAltFt < legAlt.minAltFt) {
            legAlt.minAltFt = legAlt.maxUserAltFt;
        }
    }
    
    
    function initAltMetaData() {
        return {
            minAltFt: null,
            maxAltFt: null,
            minUserAltFt: null,
            maxUserAltFt: null,
        }
    }


    function isWpMinAlt(waypoint) {
        return waypoint.alt && (waypoint.isminalt || (!waypoint.isminalt && !waypoint.ismaxalt));
    }


    function isWpMaxAlt(waypoint) {
        return waypoint.alt && (waypoint.ismaxalt || (!waypoint.isminalt && !waypoint.ismaxalt));
    }


    function calcLegDescentTimeMin(wp, aircraft) {
        return wp.dist / aircraft.speed * 60 + (wp.vacTime ? wp.vacTime : 0);
    }


    function calcLegClimbTimeMin(wp, aircraft) {
        const legDescentTimeMin = calcLegDescentTimeMin(wp, aircraft);
        return legDescentTimeMin * (100 / aircraft.climbSpeedPercent);
    }



    function addRoute2(svg, terrain, waypoints, aircraft, wpClickCallback, maxelevation_m) {
        if (terrain.legs.length !== waypoints.length - 1) {
            logError("number of legs and waypoints don't match");
            return;
        }

        const maxelevation_ft = m2ft(maxelevation_m);

        let currentDistPercent = 0;
        let currentAltFt = m2ft(terrain.elevations_m[0][1]); // Start at terrain elevation of first point
        let nextAltFt = currentAltFt;
        for (let i = 0; i < terrain.legs.length; i++)
        {
            const leg = terrain.legs[i];
            const legDistPercent = 100 / terrain.totaldistance_m * leg.distance_m;
            const legX1Percent = currentDistPercent;
            const legX2Percent = currentDistPercent + legDistPercent;

            if (leg.endAlt.minAltFt > currentAltFt) {
                const legClimbTimeMin = calcLegClimbTimeMin(waypoints[i + 1], aircraft);
                const maxClimbAltFt = calcClimbTargetAltFt(currentAltFt, legClimbTimeMin, aircraft.rocSeaLevelFpm, aircraft.serviceCeilingFt);
                nextAltFt = Math.min(leg.endAlt.minAltFt, maxClimbAltFt);
                if (maxClimbAltFt < leg.endAlt.minUserAltFt || maxClimbAltFt < leg.minTerrainAltFt) {
                    leg.warning = "Climb performance may be insufficient to reach the altitude before the end of the leg! (update climb performance in ⚙️ Settings)";
                    nextAltFt = leg.endAlt.minAltFt;
                }
            } else if (leg.endAlt.maxAltFt < currentAltFt) {
                nextAltFt = leg.endAlt.maxAltFt;
            }

            if (!leg.warning) {
                const terrainClearanceText = "Flight path may be below min. terrain clearance of leg!";
                const minTerrainAltFtForWarning = leg.minTerrainAltFt - MIN_TERRAIN_CLEARANCE_FT + MIN_TERRAIN_CLEARANCE_FOR_WARNING_FT;
                if (i > 0 && i < terrain.legs.length - 1 && (currentAltFt < minTerrainAltFtForWarning)) {
                    leg.warning = terrainClearanceText;
                } else if (i === 0 && nextAltFt < minTerrainAltFtForWarning) {
                    leg.warning = terrainClearanceText;
                } else if (i === terrain.legs.length - 1 && currentAltFt < minTerrainAltFtForWarning) {
                    leg.warning = terrainClearanceText;
                }
            }

            const legY1Percent = 100 * (1 - currentAltFt / maxelevation_ft);
            const legY2Percent = 100 * (1 - nextAltFt / maxelevation_ft);

            // line
            var line = document.createElementNS(SVG_NS, "line");
            line.setAttribute("x1", legX1Percent.toString() + "%");
            line.setAttribute("x2", legX2Percent.toString() + "%");
            line.setAttribute("y1", legY1Percent.toString() + "%");
            line.setAttribute("y2", legY2Percent.toString() + "%");
            line.setAttribute("style", "stroke:rgba(255, 0, 255, 1.0); stroke-width:5px;");
            line.setAttribute("shape-rendering", "crispEdges");
            svg.appendChild(line);

            //waypoint dot and label
            addRouteDot(svg, currentDistPercent, legY1Percent, waypoints[i], wpClickCallback);
            addRouteDotPlumline(svg, currentDistPercent, legY1Percent, IMAGE_HEIGHT_PX);
            addWaypointLabel(svg, currentDistPercent, legY1Percent, waypoints[i], (i === 0) ? "start" : "middle", (i % 2) === 1, wpClickCallback); // TODO: alternate label y pos

            // warning
            if (leg.warning) {
                const xPercent = (legX1Percent + legX2Percent) / 2;
                const yPercent = (legY1Percent + legY2Percent) / 2;
                addRouteWarning(svg, xPercent, yPercent, leg.warning);
            }

            // TODO: debug, min line
            /*const legMinY1Percent = 100 * (1 - leg.startAlt.minAltFt / maxelevation_ft);
            const legMinY2Percent = 100 * (1 - leg.endAlt.minAltFt / maxelevation_ft);

            const line3 = document.createElementNS(SVG_NS, "line");
            line3.setAttribute("x1", legX1Percent.toString() + "%");
            line3.setAttribute("y1", legMinY1Percent.toString() + "%");
            line3.setAttribute("x2", legX2Percent.toString() + "%");
            line3.setAttribute("y2", legMinY2Percent.toString() + "%");
            line3.setAttribute("style", "stroke:rgba(0, 0, 255, 1.0); stroke-width:3px;");
            line3.setAttribute("shape-rendering", "crispEdges");
            svg.appendChild(line3);*/

            // TODO: debug, max line
            /*const legMaxY1Percent = 100 * (1 - leg.startAlt.maxAltFt / maxelevation_ft);
            const legMaxY2Percent = 100 * (1 - leg.endAlt.maxAltFt / maxelevation_ft);

            const line2 = document.createElementNS(SVG_NS, "line");
            line2.setAttribute("x1", legX1Percent.toString() + "%");
            line2.setAttribute("y1", legMaxY1Percent.toString() + "%");
            line2.setAttribute("x2", legX2Percent.toString() + "%");
            line2.setAttribute("y2", legMaxY2Percent.toString() + "%");
            line2.setAttribute("style", "stroke:rgba(255, 0, 0, 1.0); stroke-width:2px;");
            line2.setAttribute("shape-rendering", "crispEdges");
            svg.appendChild(line2);*/

            currentDistPercent += legDistPercent;
            currentAltFt = nextAltFt;
        }


        // final dot
        const legY2Percent = 100 * (1 - currentAltFt / maxelevation_ft);
        const lastIdx = waypoints.length - 1;
        const lastWp = waypoints[lastIdx];

        addRouteDot(svg, 100, legY2Percent, lastWp, wpClickCallback);
        addRouteDotPlumline(svg, 100, legY2Percent, IMAGE_HEIGHT_PX);
        addWaypointLabel(svg, currentDistPercent, legY2Percent, lastWp, "end", lastIdx % 2 === 1, wpClickCallback);


        function addRouteWarning(svg, xPercent, yPercent, message)
        {
            const icon = document.createElementNS(SVG_NS, "text");
            icon.setAttribute("x", xPercent.toString() + "%");
            icon.setAttribute("y", yPercent.toString() + "%");
            icon.setAttribute("style", "stroke:#FFFF00; fill:#FFFF00; cursor: help");
            icon.setAttribute("text-anchor", "middle");
            icon.setAttribute("font-family", "Calibri,sans-serif");
            icon.setAttribute("font-weight", "bold");
            icon.setAttribute("font-size", "24px");
            icon.setAttribute("transform", "translate(0 6)");
            icon.textContent = "⚠️";

            const title = document.createElementNS(SVG_NS, "title");
            title.textContent = message;
            icon.appendChild(title);

            svg.appendChild(icon);
        }


        function addRouteDot(svg, cxPercent, cyPercent, waypoint, clickCallback)
        {
            const dot = document.createElementNS(SVG_NS, "circle");
            dot.setAttribute("cx", cxPercent.toString() + "%");
            dot.setAttribute("cy", cyPercent.toString() + "%");
            dot.setAttribute("r", "6");
            dot.setAttribute("style", "stroke:#FF00FF; stroke-width:0px; fill:rgba(255, 0, 255, 1.0); cursor: pointer");
            dot.setAttribute("shape-rendering", "crispEdges");

            if (clickCallback)
                dot.addEventListener("click", function() { clickCallback(waypoint); });

            svg.appendChild(dot);
        }


        function addRouteDotPlumline(svg, cxPercent, cyPercent, height)
        {
            const line = document.createElementNS(SVG_NS, "line");
            line.setAttribute("x1", cxPercent.toString() + "%");
            line.setAttribute("x2", cxPercent.toString() + "%");
            line.setAttribute("y1", cyPercent.toString() + "%");
            line.setAttribute("y2", height);
            line.setAttribute("style", "stroke:#FF00FF; stroke-width:1px;");
            line.setAttribute("shape-rendering", "crispEdges");
            line.setAttribute("stroke-dasharray", "3, 5");

            svg.appendChild(line);
        }


        function addWaypointLabel(svg, xPercent, yPercent, waypoint, textAnchor, isOddWp, clickCallback)
        {
            let transformX, transformY;

            switch (textAnchor)
            {
                case "start":
                    transformX = 7;
                    break;
                case "end":
                    transformX = -7;
                    break;
                default:
                    transformX = 0;
                    break;
            }

            if (isOddWp) {
                transformY = 25;
            } else {
                transformY = -15;
            }

            // glow around label
            const labelGlow = document.createElementNS(SVG_NS, "text");
            labelGlow.setAttribute("x", xPercent.toString() + "%");
            labelGlow.setAttribute("y", yPercent.toString() + "%");
            labelGlow.setAttribute("style", "stroke:#FFFFFF; stroke-width:5px; fill:#FFFFFF; cursor: pointer");
            labelGlow.setAttribute("text-anchor", textAnchor);
            labelGlow.setAttribute("font-family", "Calibri,sans-serif");
            labelGlow.setAttribute("font-weight", "bold");
            labelGlow.setAttribute("font-size", "15px");
            labelGlow.setAttribute("transform", "translate(" + transformX + ", " + transformY + ")");
            labelGlow.textContent = waypoint.checkpoint;

            svg.appendChild(labelGlow);

            // label
            const label = document.createElementNS(SVG_NS, "text");
            label.setAttribute("x", xPercent.toString() + "%");
            label.setAttribute("y", yPercent.toString() + "%");
            label.setAttribute("style", "stroke:none; fill:#660066; cursor: pointer");
            label.setAttribute("text-anchor", textAnchor);
            label.setAttribute("font-family", "Calibri,sans-serif");
            label.setAttribute("font-weight", "bold");
            label.setAttribute("font-size", "15px");
            label.setAttribute("transform", "translate(" + transformX + ", " + transformY + ")");
            label.textContent = waypoint.checkpoint;

            if (clickCallback)
                label.addEventListener("click", function() { clickCallback(waypoint); });

            svg.appendChild(label);
        }
    }
}