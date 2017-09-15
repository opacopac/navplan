/**
 * Meteo Service
 */

navplanApp
    .factory('meteoService', meteoService );

meteoService.$inject = ['$http'];

function meteoService($http) {
    var BASE_URL = "php/sma_measurements.php";
    var SVG_NS = "http://www.w3.org/2000/svg";


    // return api reference
    return {
        getSmaMeasurements: getSmaMeasurements,
        getWindArrowImage: getWindArrowImage,
        getWindArrowSvg: getWindArrowSvg,
        getDetailBoxSvg: getDetailBoxSvg,
        getSmallBoxSvg: getSmallBoxSvg
    };


    function getSmaMeasurements(extent, successCallback, errorCallback)
    {
        loadSmaMeasurements(extent, onLoadedSuccessfully, onLoadedError);


        function onLoadedSuccessfully(smaMeasurementList) {
            if (successCallback)
                successCallback(smaMeasurementList);
        }


        function onLoadedError() {
            if (errorCallback)
                errorCallback();
        }
    }


    function loadSmaMeasurements(extent, successCallback, errorCallback) {
        var url = BASE_URL + "?minlon=" + extent[0] + "&minlat=" + extent[1] + "&maxlon=" + extent[2] + "&maxlat=" + extent[3];

        $http.get(url)
            .then(
                function (response) // success
                {
                    if (response && response.data && response.data.smameasurements) {
                        if (successCallback)
                            successCallback(response.data.smameasurements);
                    }
                    else {
                        logResponseError("ERROR reading SMA measurements", response);

                        if (errorCallback)
                            errorCallback();
                    }
                },
                function (response) // error
                {
                    logResponseError("ERROR reading SMA smameasurements", response);

                    if (errorCallback)
                        errorCallback();
                }
            );
    }


    function getWindArrowImage(smaMeasurement)
    {
        var canvas = document.createElement('canvas');

        canvas.id = "CursorLayer";
        canvas.width = 100;
        canvas.height = 100;
        canvas.style.zIndex = 8;
        canvas.style.position = "absolute";
        canvas.style.border = "1px solid";

        var ctx = canvas.getContext("2d");
        ctx.moveTo(0,0);
        ctx.lineTo(200,100);
        ctx.stroke();

        return canvas;
    }


    function getWindArrowSvg(smaMeasurement)
    {
        var arrWidth = 30;
        var arrHalfWidth = Math.ceil(arrWidth / 2);
        var arrLength = arrHalfWidth + Math.round(smaMeasurement.wind_speed_kmh * 5);
        var arrColor = "#FFFFFF";
        var lineStyle = "stroke:" + arrColor + "; stroke-width:2px;";

        // svg element
        var svg = document.createElementNS(SVG_NS, "svg");
        svg.setAttribute("version", "1.1");
        svg.setAttribute("xmlns", SVG_NS);
        svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
        svg.setAttribute("width", arrWidth);
        svg.setAttribute("height", arrLength + 10);
        svg.setAttribute("viewBox", "0 0 " + arrWidth + " " + (arrLength + 10));

        // arrow tip definition
        var defs = document.createElementNS(SVG_NS, "defs");
        svg.appendChild(defs);

        var marker = document.createElementNS(SVG_NS, "marker");
        marker.setAttribute("id", "Triangle");
        marker.setAttribute("viewBox", "0 0 10 10");
        marker.setAttribute("refX", "1");
        marker.setAttribute("refY", "5");
        marker.setAttribute("markerWidth", "6");
        marker.setAttribute("markerHeight", "6");
        marker.setAttribute("orient", "auto");
        marker.setAttribute("style", "fill:" + arrColor);
        defs.appendChild(marker);

        var path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
        marker.appendChild(path);

        // arrow
        if (smaMeasurement.wind_speed_kmh > 0)
        {
            var arrow = document.createElementNS(SVG_NS, "line");
            arrow.setAttribute("x1", arrHalfWidth);
            arrow.setAttribute("y1", "3");
            arrow.setAttribute("x2", arrHalfWidth);
            arrow.setAttribute("y2", arrLength);
            arrow.setAttribute("style", lineStyle);
            arrow.setAttribute("marker-end", "url(#Triangle)");
            svg.appendChild(arrow);
        }

        // speed label
        var rotateString = "rotate(" + (-smaMeasurement.wind_dir) + " " + arrHalfWidth + " " + Math.round(arrLength / 2) + ")";
        var labelText = Math.round(kmh2kt(smaMeasurement.wind_speed_kmh)) + "kt";

        // text glow
        var glowColor = "#000000";
        var labelGlow = document.createElementNS(SVG_NS, "text");
        labelGlow.setAttribute("x", arrHalfWidth);
        labelGlow.setAttribute("y", Math.round(arrLength / 2));
        labelGlow.setAttribute("text-anchor", "middle");
        labelGlow.setAttribute("dominant-baseline", "middle");
        labelGlow.setAttribute("style", "stroke:" + glowColor + "; stroke-width:2px; fill:" + glowColor + ";");
        labelGlow.setAttribute("font-family", "Calibri,sans-serif");
        labelGlow.setAttribute("font-weight", "bold");
        labelGlow.setAttribute("font-size", "15px");
        labelGlow.setAttribute("transform", rotateString);
        labelGlow.textContent = labelText;
        svg.appendChild(labelGlow);

        // inner text
        var textColor = arrColor;
        var label = document.createElementNS(SVG_NS, "text");
        label.setAttribute("x", arrHalfWidth);
        label.setAttribute("y", Math.round(arrLength / 2));
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("dominant-baseline", "middle");
        label.setAttribute("style", "stroke:none; fill:" + textColor + ";");
        label.setAttribute("font-family", "Calibri,sans-serif");
        label.setAttribute("font-weight", "bold");
        label.setAttribute("font-size", "15px");
        label.setAttribute("transform", rotateString);
        label.textContent = labelText;
        svg.appendChild(label);

        return svg.outerHTML;
    }


    function getSunColor(sun_min)
    {
        if (sun_min > 0)
            return "#FFFF00";
        else
            return "#AAAA00";
    }


    function getRainColor(precip_mm)
    {
        if (precip_mm > 0)
            return "#00CCFF";
        else
            return "#0099AA";
    }


    function getSunLevelFact(sun_min)
    {
        return sun_min / 10;
    }


    function getRainLevelFact(precip_mm)
    {
        var minFact = 0.0;
        var maxLevelMm = 3;

        if (precip_mm >= 5)
            return 1;
        else if (precip_mm / maxLevelMm > minFact)
            return precip_mm / maxLevelMm;
        else if (precip_mm > 0.0)
            return minFact;
        else
            return 0;
    }


    function getSmallBoxSvg(smaMeasurement)
    {
        var boxWidth = 15;
        var boxHeight = 15;

        var svg = document.createElementNS(SVG_NS, "svg");
        svg.setAttribute("version", "1.1");
        svg.setAttribute("xmlns", SVG_NS);
        svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
        svg.setAttribute("width", boxWidth);
        svg.setAttribute("height", boxHeight);
        svg.setAttribute("viewBox", "0 0 " + boxWidth + " " + boxHeight);

        // TODO
        /*smaMeasurement.sun_min = 8;
        smaMeasurement.precip_mm = 0.5;*/

        // sunshine box
        if (smaMeasurement.sun_min != null && smaMeasurement.sun_min > 0.0)
            addFillBox(svg, 1, 1, 5, 13, getSunColor(smaMeasurement.sun_min), getSunLevelFact(smaMeasurement.sun_min));

        // precip box
        if (smaMeasurement.precip_mm != null && smaMeasurement.precip_mm > 0.0)
            addFillBox(svg, 9, 1, 5, 13, getRainColor(smaMeasurement.precip_mm), getRainLevelFact(smaMeasurement.precip_mm));

        return svg.outerHTML;
    }


    function getDetailBoxSvg(smaMeasurement)
    {
        var boxWidth = 230;
        var boxHeight = 63;
        var paddingTB = 3;
        var paddingLR = 5;
        var lineHeight = 17;
        var fontSize = "14px";

        var svg = document.createElementNS(SVG_NS, "svg");
        svg.setAttribute("version", "1.1");
        svg.setAttribute("xmlns", SVG_NS);
        svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
        svg.setAttribute("width", boxWidth);
        svg.setAttribute("height", boxHeight);
        svg.setAttribute("viewBox", "0 0 " + boxWidth + " " + boxHeight);

        // box
        var textBox = document.createElementNS(SVG_NS, "rect");
        textBox.setAttribute("x", 0);
        textBox.setAttribute("y", 0);
        textBox.setAttribute("width", boxWidth);
        textBox.setAttribute("height", boxHeight);
        textBox.setAttribute("style", "fill:#666666; stroke-width:1; stroke:#000000");
        svg.appendChild(textBox);


        // station name + height text
        var line1_text = smaMeasurement.station_name + " (" + smaMeasurement.station_alt_m + "m)";
        addText(svg, paddingLR, paddingTB + lineHeight, fontSize, "bold", line1_text);

        // info-icon text
        /*var url = "http://www.meteoswiss.admin.ch/home/measurement-and-forecasting-systems/land-based-stations/automatisches-messnetz.html?station=" + smaMeasurement.station_id;
        var link = document.createElement("a");
        link.setAttribute("xlink:href", url);
        link.setAttribute("target", "_blank");
        addText(link, boxWidth - paddingLR - 20, paddingTB + lineHeight, fontSize, "normal", "🛈");
        svg.appendChild(link);*/

        // wind text
        if (smaMeasurement.wind_dir != null && smaMeasurement.wind_speed_kmh != null && smaMeasurement.wind_gusts_kmh != null)
        {
            var wind_text = zeroPad(smaMeasurement.wind_dir, 3) + "°  " + Math.round(kmh2kt(smaMeasurement.wind_speed_kmh)) + "-" + Math.round(kmh2kt(smaMeasurement.wind_gusts_kmh)) + "kt";
            addText(svg, paddingLR, paddingTB + 2 * lineHeight, fontSize, "normal", wind_text);
        }

        // temp text
        if (smaMeasurement.temp_c != null)
        {
            var temp_text = Math.round(smaMeasurement.temp_c) + "°C"
            addText(svg, paddingLR + 75 + 17, paddingTB + 2 * lineHeight, fontSize, "normal", temp_text);
        }

        // humidity text
        if (smaMeasurement.humidity_pc != null)
        {
            var humidity_text = smaMeasurement.humidity_pc + "% RH";
            addText(svg, paddingLR + 160, paddingTB + 2 * lineHeight, fontSize, "normal", humidity_text);
        }

        // qnh text
        if (smaMeasurement.qnh_hpa != null)
        {
            var qnh_text = "QNH " + Math.round(smaMeasurement.qnh_hpa);
            addText(svg, paddingLR, paddingTB + 3 * lineHeight, fontSize, "normal", qnh_text);
        }


        // TODO
        /*smaMeasurement.sun_min = 10;
        smaMeasurement.precip_mm = 0.5;*/

        // sunshine box
        if (smaMeasurement.sun_min != null)
        {
            addFillBox(svg, paddingLR + 75, 43, 14, 14, getSunColor(smaMeasurement.sun_min), getSunLevelFact(smaMeasurement.sun_min));

            var sun_text = smaMeasurement.sun_min + "/10min";
            addText(svg, paddingLR + 75 + 17, paddingTB + 3 * lineHeight, fontSize, "normal", sun_text);
        }

        // precip box
        if (smaMeasurement.precip_mm != null)
        {
            addFillBox(svg, paddingLR + 160, 43, 14, 14, getRainColor(smaMeasurement.precip_mm), getRainLevelFact(smaMeasurement.precip_mm));

            var sun_text = smaMeasurement.precip_mm + "mm";
            addText(svg, paddingLR + 160 + 17, paddingTB + 3 * lineHeight, fontSize, "normal", sun_text);
        }

        return svg.outerHTML;
    }


    function addText(parent, x, y, size, weight, text)
    {
        var textElement = document.createElementNS(SVG_NS, "text");
        textElement.setAttribute("x", x);
        textElement.setAttribute("y", y);
        textElement.setAttribute("style", "stroke:none; fill:#FFFFFF;");
        textElement.setAttribute("font-family", "Calibri,sans-serif");
        textElement.setAttribute("font-weight", weight);
        textElement.setAttribute("font-size", size);
        var textNode = document.createTextNode(text);
        textElement.appendChild(textNode);
        parent.appendChild(textElement);
    }


    function addFillBox(parent, x, y, width, height, color, levelFact)
    {
        var box = document.createElementNS(SVG_NS, "rect");
        box.setAttribute("x", x);
        box.setAttribute("y", y);
        box.setAttribute("width", width);
        box.setAttribute("height", height);
        box.setAttribute("style", "fill:none; stroke-width:2; stroke:" + color);
        parent.appendChild(box);

        var fillLevel = document.createElementNS(SVG_NS, "rect");
        fillLevel.setAttribute("x", x);
        fillLevel.setAttribute("y", y + height - height * levelFact);
        fillLevel.setAttribute("width", width);
        fillLevel.setAttribute("height", height * levelFact);
        fillLevel.setAttribute("style", "fill:" + color + "; stroke-width:1; stroke:" + color);
        parent.appendChild(fillLevel);
    }
}
