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

        debugger;
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


    function addRoute(svg, terrain, waypoints, wpClickCallback)
    {
        if (terrain.legs.length !== waypoints.length - 1)
        {
            logError("number of legs and waypoints don't match");
            return;
        }

        const labelYOffsets = [0, 40];
        const maxelevation_m = terrain.maxelevation_m + IMAGE_HEADROOM_M; // Same as in getTerrainSvg

        // Build array of cumulative distances for each waypoint
        var wpDistances = [0];
        var cumulativeDist = 0;
        for (var i = 0; i < terrain.legs.length; i++)
        {
            cumulativeDist += terrain.legs[i].distance_m;
            wpDistances.push(cumulativeDist);
        }

        // Get terrain elevation at each waypoint position
        var wpTerrainElevations = getTerrainElevationsAtWaypoints(terrain.elevations_m, wpDistances);

        // Collect raw waypoint altitudes (null if not set)
        // Also track isaltatlegstart flag for each waypoint
        var rawAltitudes = [];
        var isAtLegStart = [];
        for (i = 0; i < waypoints.length; i++)
        {
            rawAltitudes.push(getWaypointAltitudeMeters(waypoints[i], wpTerrainElevations[i]));
            isAtLegStart.push(waypoints[i] && waypoints[i].isaltatlegstart ? true : false);
        }

        // Force first and last waypoints to ground level (terrain elevation)
        // This ensures the route starts and ends on the ground
        rawAltitudes[0] = wpTerrainElevations[0];
        rawAltitudes[waypoints.length - 1] = wpTerrainElevations[waypoints.length - 1];

        // Interpolate missing altitudes between waypoints that have them
        var interpolatedAltitudes = interpolateAltitudes(rawAltitudes, wpDistances, isAtLegStart, wpTerrainElevations);

        // Route always has altitudes now (at minimum, ground level at start/end)
        var hasAnyAltitude = true;

        // Draw route
        var currentDistPercent = 0;

        for (i = 0; i < terrain.legs.length; i++)
        {
            var leg = terrain.legs[i];
            var legDistPercent = 100 / terrain.totaldistance_m * leg.distance_m;

            // Get y-coordinates for this leg
            var y1, y2;
            if (hasAnyAltitude && interpolatedAltitudes[i] !== null)
            {
                var pt1 = getPointArray(wpDistances[i], interpolatedAltitudes[i], terrain.totaldistance_m, maxelevation_m, IMAGE_HEIGHT_PX, IMAGE_HEIGHT_PX);
                y1 = pt1[1];
            }
            else
            {
                y1 = 0;
            }

            if (hasAnyAltitude && interpolatedAltitudes[i + 1] !== null)
            {
                var pt2 = getPointArray(wpDistances[i + 1], interpolatedAltitudes[i + 1], terrain.totaldistance_m, maxelevation_m, IMAGE_HEIGHT_PX, IMAGE_HEIGHT_PX);
                y2 = pt2[1];
            }
            else
            {
                y2 = 0;
            }

            // line
            var line = document.createElementNS(SVG_NS, "line");
            line.setAttribute("x1", currentDistPercent.toString() + "%");
            line.setAttribute("x2", (currentDistPercent + legDistPercent).toString() + "%");
            line.setAttribute("y1", y1);
            line.setAttribute("y2", y2);
            line.setAttribute("style", "stroke:rgba(255, 0, 255, 1.0); stroke-width:5px;");
            line.setAttribute("shape-rendering", "crispEdges");
            svg.appendChild(line);

            // Waypoint dot and label
            addRouteDot(svg, currentDistPercent, y1, waypoints[i], wpClickCallback);
            addRouteDotPlumline(svg, currentDistPercent, y1, IMAGE_HEIGHT_PX);
            addWaypointLabel(svg, currentDistPercent, y1 + labelYOffsets[i % 2], waypoints[i], (i === 0) ? "start" : "middle", wpClickCallback);

            currentDistPercent += legDistPercent;
        }

        // Final waypoint dot
        var finalY = hasAnyAltitude && interpolatedAltitudes[waypoints.length - 1] !== null
            ? getPointArray(wpDistances[waypoints.length - 1], interpolatedAltitudes[waypoints.length - 1], terrain.totaldistance_m, maxelevation_m, IMAGE_HEIGHT_PX, IMAGE_HEIGHT_PX)[1]
            : 0;

        addRouteDot(svg, 100, finalY, waypoints[waypoints.length - 1], wpClickCallback);
        addRouteDotPlumline(svg, 100, finalY, IMAGE_HEIGHT_PX);
        addWaypointLabel(svg, currentDistPercent, finalY + labelYOffsets[(waypoints.length - 1) % 2], waypoints[waypoints.length - 1], "end", wpClickCallback);

        // Helper function to get terrain elevation at each waypoint from the elevations array
        function getTerrainElevationsAtWaypoints(elevations_m, distances)
        {
            var result = [];
            for (var wpIdx = 0; wpIdx < distances.length; wpIdx++)
            {
                var targetDist = distances[wpIdx];
                var elevation = 0;

                // Find the elevation entry closest to this distance
                for (var j = 0; j < elevations_m.length; j++)
                {
                    if (elevations_m[j][0] <= targetDist)
                    {
                        elevation = elevations_m[j][1];
                    }
                    else
                    {
                        break;
                    }
                }
                result.push(elevation);
            }
            return result;
        }

        // Helper function to get waypoint altitude in meters (AMSL)
        function getWaypointAltitudeMeters(waypoint, terrainElevation)
        {
            if (waypoint && waypoint.alt && !isNaN(parseFloat(waypoint.alt)))
            {
                // Convert altitude from feet to meters
                // Note: Currently assumes AMSL. For AGL support, would add terrainElevation here
                return ft2m(parseFloat(waypoint.alt));
            }
            return null;
        }

        // Interpolate missing altitudes between waypoints that have defined altitudes
        // isAtLegStart: array of booleans indicating if altitude is "at leg start" (vs "at leg end")
        // terrainElevations: terrain elevation at each waypoint (for ground reference)
        function interpolateAltitudes(altitudes, distances, isAtLegStart, terrainElevations)
        {
            var result = altitudes.slice(); // Copy array

            // Find segments where we need to interpolate
            var i = 0;
            while (i < result.length)
            {
                if (result[i] === null)
                {
                    // Find the previous waypoint with altitude
                    var prevIdx = -1;
                    for (var j = i - 1; j >= 0; j--)
                    {
                        if (result[j] !== null)
                        {
                            prevIdx = j;
                            break;
                        }
                    }

                    // Find the next waypoint with altitude
                    var nextIdx = -1;
                    for (j = i + 1; j < result.length; j++)
                    {
                        if (result[j] !== null)
                        {
                            nextIdx = j;
                            break;
                        }
                    }

                    // Interpolate if we have both bounds
                    if (prevIdx >= 0 && nextIdx >= 0)
                    {
                        var prevAlt = result[prevIdx];
                        var nextAlt = result[nextIdx];
                        var prevDist = distances[prevIdx];
                        var nextDist = distances[nextIdx];
                        var totalDist = nextDist - prevDist;

                        // Check isaltatlegstart flags to determine interpolation behavior
                        // If prev altitude is "at leg start", it applies from that waypoint onward
                        // If next altitude is "at leg end", it applies up to that waypoint
                        var prevIsAtStart = isAtLegStart[prevIdx];
                        var nextIsAtEnd = !isAtLegStart[nextIdx];

                        // Linear interpolation for all waypoints in between
                        for (j = prevIdx + 1; j < nextIdx; j++)
                        {
                            var ratio = (distances[j] - prevDist) / totalDist;
                            result[j] = prevAlt + (nextAlt - prevAlt) * ratio;
                        }
                        i = nextIdx;
                    }
                    else if (prevIdx >= 0)
                    {
                        // No next altitude - use the previous altitude for remaining waypoints
                        result[i] = result[prevIdx];
                        i++;
                    }
                    else if (nextIdx >= 0)
                    {
                        // No previous altitude - use the next altitude for earlier waypoints
                        result[i] = result[nextIdx];
                        i++;
                    }
                    else
                    {
                        // No altitudes defined at all - fall back to terrain elevation
                        result[i] = terrainElevations[i];
                        i++;
                    }
                }
                else
                {
                    i++;
                }
            }

            return result;
        }


        function addRouteDot(svg, cxProc, cy, waypoint, clickCallback)
        {
            const dot = document.createElementNS(SVG_NS, "circle");
            dot.setAttribute("cx", cxProc.toString() + "%");
            dot.setAttribute("cy", cy);
            dot.setAttribute("r", "6");
            dot.setAttribute("style", "stroke:#FF00FF; stroke-width:0px; fill:rgba(255, 0, 255, 1.0); cursor: pointer");
            dot.setAttribute("shape-rendering", "crispEdges");

            if (clickCallback)
                dot.addEventListener("click", function() { clickCallback(waypoint); });

            svg.appendChild(dot);
        }


        function addRouteDotPlumline(svg, cxProc, cy, height)
        {
            const line = document.createElementNS(SVG_NS, "line");
            line.setAttribute("x1", cxProc.toString() + "%");
            line.setAttribute("x2", cxProc.toString() + "%");
            line.setAttribute("y1", cy);
            line.setAttribute("y2", height);
            line.setAttribute("style", "stroke:#FF00FF; stroke-width:1px;");
            line.setAttribute("shape-rendering", "crispEdges");
            line.setAttribute("stroke-dasharray", "3, 5");

            svg.appendChild(line);
        }


        function addWaypointLabel(svg, xProc, y, waypoint, textAnchor, clickCallback)
        {
            let transformX;

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

            // glow around label
            const labelGlow = document.createElementNS(SVG_NS, "text");
            labelGlow.setAttribute("x", xProc.toString() + "%");
            labelGlow.setAttribute("y", y);
            labelGlow.setAttribute("style", "stroke:#FFFFFF; stroke-width:5px; fill:#FFFFFF; cursor: pointer");
            labelGlow.setAttribute("text-anchor", textAnchor);
            labelGlow.setAttribute("font-family", "Calibri,sans-serif");
            labelGlow.setAttribute("font-weight", "bold");
            labelGlow.setAttribute("font-size", "15px");
            labelGlow.setAttribute("transform", "translate(" + transformX + ", -15)");
            labelGlow.textContent = waypoint.checkpoint;

            svg.appendChild(labelGlow);

            // label
            const label = document.createElementNS(SVG_NS, "text");
            label.setAttribute("x", xProc.toString() + "%");
            label.setAttribute("y", y);
            label.setAttribute("style", "stroke:none; fill:#660066; cursor: pointer");
            label.setAttribute("text-anchor", textAnchor);
            label.setAttribute("font-family", "Calibri,sans-serif");
            label.setAttribute("font-weight", "bold");
            label.setAttribute("font-size", "15px");
            label.setAttribute("transform", "translate(" + transformX + ", -15)");
            label.textContent = waypoint.checkpoint;

            if (clickCallback)
                label.addEventListener("click", function() { clickCallback(waypoint); });

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
            const prevLeg = i > 0 ? terrain.legs[i - 1] : null;
            const wp = waypoints[i + 1];
            const prevWp = waypoints[i];
            
            // init leg start/end
            leg.startAlt = initAltMetaData();
            
            if (!leg.endAlt) {
                leg.endAlt = initAltMetaData();
            }
            

            // get altitudes defined by user
            const wpAlt = wp.alt ? parseFloat(wp.alt) : null;
            leg.startAlt.minUserAltFt = wp.isaltatlegstart && isWpMinAlt(wp) ? wpAlt : null;
            leg.startAlt.maxUserAltFt = wp.isaltatlegstart && isWpMaxAlt(wp) ? wpAlt : null;
            leg.endAlt.minUserAltFt = !wp.isaltatlegstart && isWpMinAlt(wp) ? wpAlt : null;
            leg.endAlt.maxUserAltFt = !wp.isaltatlegstart && isWpMaxAlt(wp) ? wpAlt : null;

            // set leg start altitudes
            if (leg.startAlt.minUserAltFt && (!leg.startAlt.minAltFt || leg.startAlt.minAltFt < leg.startAlt.minUserAltFt)) {
                leg.startAlt.minAltFt = leg.startAlt.minUserAltFt;
            }
            if (leg.startAlt.maxUserAltFt && (!leg.startAlt.maxAltFt || leg.startAlt.maxAltFt > leg.startAlt.maxUserAltFt)) {
                leg.startAlt.maxAltFt = leg.startAlt.maxUserAltFt;
            }

            // set leg end altitudes
            if (leg.endAlt.minUserAltFt && (!leg.endAlt.minAltFt || leg.endAlt.minAltFt < leg.endAlt.minUserAltFt)) {
                leg.endAlt.minAltFt = leg.endAlt.minUserAltFt;
            }
            if (leg.endAlt.maxUserAltFt && (!leg.endAlt.maxAltFt || leg.endAlt.maxAltFt > leg.endAlt.maxUserAltFt)) {
                leg.endAlt.maxAltFt = leg.endAlt.maxUserAltFt;
            }
            if (leg.endAlt.minUserAltFt && leg.endAlt.maxAltFt && leg.endAlt.maxAltFt < leg.endAlt.minUserAltFt) {
                leg.endAlt.maxAltFt = leg.endAlt.minUserAltFt;
            }
            if (leg.endAlt.maxUserAltFt && leg.endAlt.minAltFt && leg.endAlt.minAltFt > leg.endAlt.maxUserAltFt) {
                leg.endAlt.minAltFt = leg.endAlt.maxUserAltFt;
            }

            // first/last wp from/to airport: set alt to ground level
            const isFirstLegFromAirport = (i === 0 && prevWp.type === "airport");
            const isLastLegToAirport = (i === terrain.legs.length - 1 && wp.type === "airport");

            if (isFirstLegFromAirport) {
                leg.startAlt.minUserAltFt = m2ft(terrain.elevations_m[0][1]);
                leg.startAlt.maxUserAltFt = leg.startAlt.minUserAltFt;
                leg.startAlt.minAltFt = leg.startAlt.minUserAltFt;
                leg.startAlt.maxAltFt = leg.startAlt.maxUserAltFt;
            }

            if (isLastLegToAirport) {
                leg.endAlt.minUserAltFt = m2ft(terrain.elevations_m[terrain.elevations_m.length - 1][1]);
                leg.endAlt.maxUserAltFt = leg.endAlt.minUserAltFt;
                leg.endAlt.minAltFt = leg.endAlt.minUserAltFt;
                leg.endAlt.maxAltFt = leg.endAlt.maxUserAltFt;
            }

            // terrain clearance
            const minTerrainAltFt = m2ft(leg.maxelevation_m) + MIN_TERRAIN_CLEARANCE_FT;
            const minTerrainAltFtRounded = Math.ceil(minTerrainAltFt / 100) * 100;
            leg.startAlt.minTerrainAltFt = minTerrainAltFtRounded;
            // if no leg end alt is defined yet (e.g. no destination airport), set it according to terrain clearance.
            if (!leg.endAlt.minTerrainAltFt) {
                leg.endAlt.minTerrainAltFt = minTerrainAltFtRounded;
            }
            if (!leg.endAlt.minAltFt) {
                leg.endAlt.minAltFt = minTerrainAltFtRounded;
            }
            if (!leg.endAlt.maxAltFt) {
                leg.endAlt.maxAltFt = minTerrainAltFtRounded;
            }

            // calculate climb/descent performance backwards from leg end to start and set if not defined by user above
            const legDescentTimeMin = calcLegDescentTimeMin(wp, aircraft);
            const legClimbTimeMin = calcLegClimbTimeMin(wp, aircraft);
            const legStartMinClimbAltFt = calcClimbStartingAltFt(leg.endAlt.minAltFt, legClimbTimeMin, aircraft.rocSeaLevelFpm, aircraft.serviceCeilingFt);
            const legStartMaxDecentAltFt = calcDescentStartingAltFt(leg.endAlt.maxAltFt, legDescentTimeMin, aircraft.rodFpm);

            const legStartMinAltFt = legStartMinClimbAltFt < leg.endAlt.minAltFt ? Math.max(minTerrainAltFtRounded, legStartMinClimbAltFt) : minTerrainAltFtRounded;
            if (!isFirstLegFromAirport && (!leg.startAlt.minAltFt || leg.startAlt.minAltFt < legStartMinAltFt)) {
                leg.startAlt.minAltFt = legStartMinAltFt;
            }

            const legStartMaxAltFt = Math.max(minTerrainAltFtRounded, legStartMaxDecentAltFt);
            if (!isFirstLegFromAirport && (!leg.startAlt.maxAltFt || leg.startAlt.maxAltFt > legStartMaxAltFt)) {
                leg.startAlt.maxAltFt = legStartMaxAltFt;
            }

            // copy values to previous leg
            if (prevLeg) {
                prevLeg.endAlt = leg.startAlt;
                prevLeg.endAlt = leg.startAlt;
            }
        }
    }
    
    
    function initAltMetaData() {
        return {
            minAltFt: null,
            maxAltFt: null,
            minUserAltFt: null,
            maxUserAltFt: null,
            minTerrainAltFt: null,
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
                /*const legClimbTimeMin = calcLegClimbTimeMin(waypoints[i + 1], aircraft);
                const maxClimbAltFt = calcClimbTargetAltFt(currentAltFt, legClimbTimeMin, aircraft.rocSeaLevelFpm, aircraft.serviceCeilingFt);
                nextAltFt = Math.min(leg.endAlt.minAltFt, maxClimbAltFt);*/
                nextAltFt = leg.endAlt.minAltFt;
            } else if (leg.endAlt.maxAltFt < currentAltFt) {
                /*const legDescentTimeMin = calcLegDescentTimeMin(waypoints[i + 1], aircraft);
                const minDescentAltFt = calcDescentTargetAltFt(currentAltFt, legDescentTimeMin, aircraft.rodFpm);
                nextAltFt = Math.max(leg.endAlt.maxAltFt, minDescentAltFt);*/
                nextAltFt = leg.endAlt.maxAltFt;
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

            // Waypoint dot and label
            addRouteDot(svg, currentDistPercent, legY1Percent, waypoints[i], wpClickCallback);
            addRouteDotPlumline(svg, currentDistPercent, legY1Percent, IMAGE_HEIGHT_PX);
            addWaypointLabel(svg, currentDistPercent, legY1Percent, waypoints[i], (i === 0) ? "start" : "middle", (i % 2) === 1, wpClickCallback); // TODO: alternate label y pos

            // TODO: debug, min line
            /*const legMinY1Percent = 100 * (1 - leg.startAlt.minAltFt / maxelevation_ft);
            const legMinY2Percent = 100 * (1 - leg.endAlt.minAltFt / maxelevation_ft);

            const line = document.createElementNS(SVG_NS, "line");
            line.setAttribute("x1", legX1Percent.toString() + "%");
            line.setAttribute("y1", legMinY1Percent.toString() + "%");
            line.setAttribute("x2", legX2Percent.toString() + "%");
            line.setAttribute("y2", legMinY2Percent.toString() + "%");
            line.setAttribute("style", "stroke:rgba(0, 0, 255, 1.0); stroke-width:3px;");
            line.setAttribute("shape-rendering", "crispEdges");
            svg.appendChild(line);*/

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


        function addRouteDot(svg, cxPercent, cyPercent, waypoint, clickCallback)
        {
            var dot = document.createElementNS(SVG_NS, "circle");
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
            var line = document.createElementNS(SVG_NS, "line");
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
            var transformX, transformY;

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
            var labelGlow = document.createElementNS(SVG_NS, "text");
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
            var label = document.createElementNS(SVG_NS, "text");
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