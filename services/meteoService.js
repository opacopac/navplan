/**
 * Meteo Service
 */

navplanApp
    .factory('meteoService', meteoService );

meteoService.$inject = ['$http'];

function meteoService($http) {
    var BASE_URL = "php/sma_measurements.php";


    // return api reference
    return {
        getSmaMeasurements: getSmaMeasurements,
        getWindArrowImage: getWindArrowImage,
        getDetailBoxImage: getDetailBoxImage,
        getSmallBoxImage: getSmallBoxImage
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
        var arrWidth = 30;
        var arrHalfWidth = Math.floor(arrWidth / 2);
        var arrLength = arrHalfWidth + Math.round(smaMeasurement.wind_speed_kmh * 5);
        var arrTipLength = 10;
        var arrTipWidth = arrTipLength / 2;
        var fillColor = "#FFFFFF";
        var borderColor = "#000000";
        var lineWidth = 2;

        var canvas = createCanvas(arrWidth, arrLength + arrTipLength);
        var ctx = getCanvasContext(canvas);
        //ctx.shadowColor = borderColor;
        //ctx.shadowBlur = 10;

        // arrow shaft
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = fillColor;
        ctx.moveTo(arrHalfWidth, 0);
        ctx.lineTo(arrHalfWidth, arrLength);
        ctx.stroke();

        // arrow tip
        ctx.fillStyle = fillColor;
        ctx.moveTo(arrHalfWidth, arrLength + arrTipLength);
        ctx.lineTo(arrHalfWidth - arrTipWidth, arrLength);
        ctx.lineTo(arrHalfWidth + arrTipWidth, arrLength);
        ctx.closePath();
        ctx.fill();

        // text
        /*var rotRad = smaMeasurement.wind_dir >= 0 ? deg2rad(smaMeasurement.wind_dir) : 0;
        var labelText = Math.round(kmh2kt(smaMeasurement.wind_speed_kmh)) + "kt";

        ctx.save();
        ctx.translate(arrHalfWidth, arrLength / 2);
        ctx.rotate(-rotRad);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 15px Calibri,sans-serif";
        drawText(ctx, 0, 0, labelText, fillColor, borderColor, 2);
        ctx.restore();*/

        return canvas;
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


    function getSmallBoxImage(smaMeasurement)
    {
        var canvas = createCanvas(15, 15);
        var ctx = getCanvasContext(canvas);

        // TODO
        /*smaMeasurement.sun_min = 8;
        smaMeasurement.precip_mm = 0.5;*/

        // sunshine box
        if (smaMeasurement.sun_min != null && smaMeasurement.sun_min > 0.0)
            drawFillBox(ctx, 1, 1, 5, 13, 2, getSunColor(smaMeasurement.sun_min), getSunLevelFact(smaMeasurement.sun_min));

        // precip box
        if (smaMeasurement.precip_mm != null && smaMeasurement.precip_mm > 0.0)
            drawFillBox(ctx, 9, 1, 5, 13, 2, getRainColor(smaMeasurement.precip_mm), getRainLevelFact(smaMeasurement.precip_mm));

        return canvas;
    }


    function getDetailBoxImage(smaMeasurement)
    {
        var boxWidth = 230;
        var boxHeight = 80;
        var paddingTB = 3;
        var paddingLR = 5;
        var lineHeight = 17;
        var textColor = "#FFFFFF";
        var textColorTime = "#CCCCCC";

        var canvas = createCanvas(boxWidth, boxHeight);
        var ctx = getCanvasContext(canvas);

        // box
        drawRectangle(ctx, 0, 0, boxWidth, boxHeight ,"#666666", "#000000", 1);

        // station name + height text
        ctx.font = "bold 14px Calibri,sans-serif";
        var title_text = smaMeasurement.station_name + "  (" + Math.round(m2ft(smaMeasurement.station_alt_m)) + "ft)";
        drawText(ctx, paddingLR, paddingTB + lineHeight, title_text, textColor);

        // info-icon text
        /*var url = "http://www.meteoswiss.admin.ch/home/measurement-and-forecasting-systems/land-based-stations/automatisches-messnetz.html?station=" + smaMeasurement.station_id;
        var link = document.createElement("a");
        link.setAttribute("xlink:href", url);
        link.setAttribute("target", "_blank");
        drawText(ctx, boxWidth - paddingLR - 20, paddingTB + lineHeight, "🛈", textColor);*/

        ctx.font = "normal 14px Calibri,sans-serif";

        // wind text
        if (smaMeasurement.wind_dir != null && smaMeasurement.wind_speed_kmh != null && smaMeasurement.wind_gusts_kmh != null)
        {
            var wind_text = zeroPad(smaMeasurement.wind_dir, 3) + "°  " + Math.round(kmh2kt(smaMeasurement.wind_speed_kmh)) + "-" + Math.round(kmh2kt(smaMeasurement.wind_gusts_kmh)) + "kt";
            drawText(ctx, paddingLR, paddingTB + 2 * lineHeight, wind_text, textColor);
        }

        // temp text
        if (smaMeasurement.temp_c != null)
        {
            var temp_text = Math.round(smaMeasurement.temp_c) + "°C"
            drawText(ctx, paddingLR + 75 + 17, paddingTB + 2 * lineHeight, temp_text, textColor);
        }

        // humidity text
        if (smaMeasurement.humidity_pc != null)
        {
            var humidity_text = smaMeasurement.humidity_pc + "% RH";
            drawText(ctx, paddingLR + 160, paddingTB + 2 * lineHeight, humidity_text, textColor);
        }

        // qnh text
        if (smaMeasurement.qnh_hpa != null)
        {
            var qnh_text = "QNH " + Math.round(smaMeasurement.qnh_hpa);
            drawText(ctx, paddingLR, paddingTB + 3 * lineHeight, qnh_text, textColor);
        }

        // TODO
        /*smaMeasurement.sun_min = 10;
        smaMeasurement.precip_mm = 0.5;*/

        // sunshine box
        if (smaMeasurement.sun_min != null)
        {
            drawFillBox(ctx, paddingLR + 75, 43, 14, 14, 2, getSunColor(smaMeasurement.sun_min), getSunLevelFact(smaMeasurement.sun_min));

            var sun_text = smaMeasurement.sun_min + "/10min";
            drawText(ctx, paddingLR + 75 + 17, paddingTB + 3 * lineHeight, sun_text, textColor);
        }

        // precip box
        if (smaMeasurement.precip_mm != null)
        {
            drawFillBox(ctx, paddingLR + 160, 43, 14, 14, 2, getRainColor(smaMeasurement.precip_mm), getRainLevelFact(smaMeasurement.precip_mm));

            var sun_text = smaMeasurement.precip_mm + "mm";
            drawText(ctx, paddingLR + 160 + 17, paddingTB + 3 * lineHeight, sun_text, textColor);
        }

        // time text
        ctx.font = "italic 13px Calibri,sans-serif";
        if (smaMeasurement.measurement_time)
        {
            // format "2017-09-16 17:50:00" (in UTC)
            var measureDate = new Date(smaMeasurement.measurement_time.replace(" ", "T") + "Z");
            var time_text = measureDate.toLocaleDateString() + " " + zeroPad(measureDate.getHours(), 2) + ":" + zeroPad(measureDate.getMinutes(), 2);
            time_text += " (" + getHourMinAgeString(measureDate.getTime()) + " ago)";
            drawText(ctx, paddingLR, paddingTB + 4 * lineHeight, time_text, textColorTime);
        }

        return canvas;
    }
}
