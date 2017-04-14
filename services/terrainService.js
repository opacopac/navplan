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
    var GRID_ELEVATION_MAIN_STEP_FT = 5000;
    var GRID_ELEVATION_MINOR_STEP_FT = 1000;

    // return api reference
    return {
        getElevation: getElevation,
        getElevations: getElevations,
        updateTerrain: updateTerrain
    };


    function getElevation(lat, lon, successCallback, errorCallback)
    {
        loadTerrain([[lon, lat]], successCallback, errorCallback);
    }


    function getElevations(waypoints, successCallback, errorCallback)
    {
        var positions = [];
        for (var i = 0; i < waypoints.length; i++)
            positions.push([waypoints[i].longitude, waypoints[i].latitude]);

        loadTerrain(positions, successCallback, errorCallback);
    }


    function updateTerrain(waypoints, successCallback, errorCallback)
    {
        getElevations(waypoints, showTerrain, errorCallback);

        function showTerrain(terrain)
        {
            var container = document.getElementById("terrainContainer");

            if (!container)
                return;

            var polyLineStyle = "fill:lime; stroke:darkgreen; stroke-width:3px";
            var svg = getTerrainSvg(waypoints, terrain, terrain.maxelevation_m + 1000, "200", "100%", polyLineStyle);

            while (container.firstChild)
                container.removeChild(container.firstChild);

            container.appendChild(svg);

            if (successCallback)
                successCallback();
        }
    }


    function loadTerrain(positions, successCallback, errorCallback)
    {
        $http.post(BASE_URL, obj2json({ positions: positions }))
            .then(
                function (response) // success
                {
                    if (response && response.data && response.data.terrain)
                    {
                        if (successCallback)
                            successCallback(response.data.terrain);
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


    function getTerrainSvg(waypoints, terrain, maxelevation_m, height, width, polyLineStyle)
    {
        var outerSvg = document.createElementNS(SVG_NS, "svg");
        outerSvg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        outerSvg.setAttribute('width', width);
        outerSvg.setAttribute('height', height);
        outerSvg.setAttribute('preserveAspectRatio', 'none');

        var viewBoxSvg = document.createElementNS(SVG_NS, "svg");
        viewBoxSvg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        viewBoxSvg.setAttribute('width', "100%");
        viewBoxSvg.setAttribute('height', "100%");
        viewBoxSvg.setAttribute('preserveAspectRatio', 'none');
        viewBoxSvg.setAttribute("viewBox", "0 0 " + terrain.totaldistance_m + " " + maxelevation_m);

        outerSvg.appendChild(viewBoxSvg);

        addSvgPolyline(viewBoxSvg, terrain, maxelevation_m, polyLineStyle);
        addSvgGrid(outerSvg, maxelevation_m, terrain.totaldistance_m);
        addRoute(outerSvg, terrain, waypoints, height);

        return outerSvg;
    }


    function addSvgPolyline(svg, terrain, maxelevation_m, polyLineStyle)
    {
        var points =  "0," + Math.round(maxelevation_m) + " ";
        var currentDist = 0;

        // legs
        for (var i = 0; i < terrain.legs.length; i++)
        {
            var leg = terrain.legs[i];
            var deltaDist = leg.distance_m / leg.elevations_m.length;

            // elevations
            for (var j = 0; j < leg.elevations_m.length; j++)
            {
                points += Math.round(currentDist) + "," + Math.round(maxelevation_m - leg.elevations_m[j]) + " ";
                currentDist += deltaDist;
            }
        }

        points += Math.round(terrain.totaldistance_m) + "," + Math.round(maxelevation_m - leg.elevations_m[leg.elevations_m.length - 1]) +
            " " + Math.round(terrain.totaldistance_m) + "," + Math.round(maxelevation_m) +
            " 0," + Math.round(maxelevation_m);


        var polyline = document.createElementNS(SVG_NS, "polyline");
        polyline.setAttribute('style', polyLineStyle);
        polyline.setAttribute("points", points);
        svg.appendChild(polyline);
    }


    function addSvgGrid(svg, maxelevation_m, totaldistance_m)
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

        // bounding rectangle
        var rect = document.createElementNS(SVG_NS, "rect");
        rect.setAttribute("x", "0");
        rect.setAttribute("y", "0");
        rect.setAttribute("width", (totaldistance_m).toString());
        rect.setAttribute("height", (maxelevation_m).toString());
        rect.setAttribute("style", "stroke:green; stroke-width:1px; fill:none");
        rect.setAttribute("vector-effect", "non-scaling-stroke");
        rect.setAttribute("shape-rendering", "crispEdges");
        svg.appendChild(rect);


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


    function addRoute(svg, terrain, waypoints, height)
    {
        if (terrain.legs.length != waypoints.length - 1)
        {
            logError("number of legs and waypoints don't match");
            return;
        }

        var currentDist = 0;
        var yOffset = [40, 80];

        for (var i = 0; i < terrain.legs.length; i++)
        {
            var leg = terrain.legs[i];
            var legDistPercent = 100 / terrain.totaldistance_m * leg.distance_m;

            // line
            var line = document.createElementNS(SVG_NS, "line");
            line.setAttribute("x1", currentDist.toString() + "%");
            line.setAttribute("x2", (currentDist + legDistPercent).toString() + "%");
            line.setAttribute("y1", "40"); // TODO: temp
            line.setAttribute("y2", "40"); // TODO: temp
            line.setAttribute("style", "stroke:#FF00FF; stroke-width:5px;");
            line.setAttribute("shape-rendering", "crispEdges");
            svg.appendChild(line);

            addRouteDot(svg, currentDist, yOffset[0]);
            addRouteDotPlumline(svg, currentDist, yOffset[0], height);
            addWaypointLabel(svg, currentDist, yOffset[i % 2], waypoints[i].checkpoint, (i == 0) ? "start" : "middle");

            currentDist += legDistPercent;
        }

        // final dot
        addRouteDot(svg, 100, yOffset[0]);
        addRouteDotPlumline(svg, 100, yOffset[0], height);
        addWaypointLabel(svg, currentDist, yOffset[(waypoints.length - 1) % 2], waypoints[waypoints.length - 1].checkpoint, "end");


        function addRouteDot(svg, cxProc, cy)
        {
            var dot = document.createElementNS(SVG_NS, "circle");
            dot.setAttribute("cx", cxProc.toString() + "%");
            dot.setAttribute("cy", cy);
            dot.setAttribute("r", "6");
            dot.setAttribute("style", "stroke:#FF00FF; stroke-width:0px; fill:#FF00FF");
            dot.setAttribute("shape-rendering", "crispEdges");

            svg.appendChild(dot);
        }


        function addRouteDotPlumline(svg, cxProc, cy, height)
        {
            var line = document.createElementNS(SVG_NS, "line");
            line.setAttribute("x1", cxProc.toString() + "%");
            line.setAttribute("x2", cxProc.toString() + "%");
            line.setAttribute("y1", cy); // TODO: temp
            line.setAttribute("y2", height); // TODO: temp
            line.setAttribute("style", "stroke:#FF00FF; stroke-width:1px;");
            line.setAttribute("shape-rendering", "crispEdges");
            line.setAttribute("stroke-dasharray", "3, 5");

            svg.appendChild(line);
        }


        function addWaypointLabel(svg, xProc, y, text, textAnchor)
        {
            var transformX;

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
            var labelGlow = document.createElementNS(SVG_NS, "text");
            labelGlow.setAttribute("x", xProc.toString() + "%");
            labelGlow.setAttribute("y", y);
            labelGlow.setAttribute("style", "stroke:#FFFFFF; stroke-width:5px; fill:#FFFFFF");
            labelGlow.setAttribute("text-anchor", textAnchor);
            labelGlow.setAttribute("font-family", "Calibri,sans-serif");
            labelGlow.setAttribute("font-weight", "bold");
            labelGlow.setAttribute("font-size", "15px");
            labelGlow.setAttribute("transform", "translate(" + transformX + ", -15)");
            labelGlow.textContent = text;

            svg.appendChild(labelGlow);

            // label
            var label = document.createElementNS(SVG_NS, "text");
            label.setAttribute("x", xProc.toString() + "%");
            label.setAttribute("y", y);
            label.setAttribute("style", "stroke:none; fill:#660066");
            label.setAttribute("text-anchor", textAnchor);
            label.setAttribute("font-family", "Calibri,sans-serif");
            label.setAttribute("font-weight", "bold");
            label.setAttribute("font-size", "15px");
            label.setAttribute("transform", "translate(" + transformX + ", -15)");
            label.textContent = text;

            svg.appendChild(label);
        }
    }
}
