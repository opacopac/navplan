/**
 * helper functions
 */

//region CONSTANTS

var TMP_DIR = 'tmp/';

//endregion


//region LOGGING / ERROR HANDLING

function logError(message)
{
    console.error(message);
}


function logResponseError(message, response)
{
    console.error(message);
    console.error(response);
}


function writeServerErrLog(errLog)
{
	$.post("php/errorlog.php", obj2json(errLog));
}


function displayGenericError()
{
	var msg = '<div class="container messages"><div class="alert alert-danger">';
	msg += "Sorry, something went wrong! :( Try to: <br>\n";
	msg += "- reload the page (CTRL+F5)<br>\n";
	msg += "- clear the browser cache<br>\n";
	msg += "- use a different browser (e.g Chrome 24+, Safari 6.2+, Firefox 23+, IE 10+)\n";
	msg += '</div></div>';

	document.body.innerHTML += msg;
}

//endregion


//region COOKIES

function setCookie(cname, cvalue, exdays)
{
	if (exdays > 0)
	{
		var d = new Date();
		d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
		var expires = "expires=" + d.toUTCString();
		document.cookie = cname + "=" + cvalue + "; " + expires;
	}
	else
		document.cookie = cname + "=" + cvalue;
}


function getCookie(cname)
{
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++)
	{
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}


function deleteCookie(cname)
{
	document.cookie = cname + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
}

//endregion


//region DOWNLOAD

function createTempFile($http, url, mimeType, userFileName, data, successCallback)
{
    var postData = {
        userFileName: userFileName,
        mimeType: mimeType,
        data: data
    };

    $http.post(url, obj2json(postData))
    .then(
        function (response) // success
        {
            if (response && response.data && response.data.tmpFile)
            {
                if (successCallback)
                    successCallback(TMP_DIR + response.data.tmpFile, mimeType, userFileName);
                //startDownload(TMP_DIR + response.data.tmpFile, userFileName, mimeType);
            }
            else
                logResponseError("ERROR writing temp file", response);
        },
        function (response) // error
        {
            logResponseError("ERROR writing temp file", response);
        }
    );
}

//endregion


//region JSON

function undef2null(key, val)
{
	if (val === undefined)
		return null;
	else
		return val;
}


function obj2json(obj)
{
	 return JSON.stringify(obj, undef2null);
}


function json2obj(json)
{
	 return JSON.parse(json);
}

//endregion


//region ARRAYS

function pushUnique(itemList, item)
{
	if (itemList.indexOf(item) == - 1)
		itemList.push(item);
}


function removeFromArray(array, value)
{
	var idx = array.indexOf(value);

	if (idx !== -1)
		array.splice(idx, 1);

	return array;
}


function chunkUpList(itemList, chunkSize)
{
    var chunkList = [];
    var currentChunk = [];

    for (var i = 0; i < itemList.length; i++)
    {
        currentChunk.push(itemList[i]);

        if (currentChunk.length >= chunkSize)
        {
            chunkList.push(currentChunk);
            currentChunk = [];
        }
    }

    if (currentChunk.length > 0 || chunkList.length == 0)
        chunkList.push(currentChunk);

    return chunkList;
}


//endregion


//region TIME / COORDINATES

function getMinSecString(timeMs)
{
	return zeroPad(Math.floor(timeMs / 60000)) + ":" + zeroPad(Math.floor(timeMs / 1000) % 60);
}


function getHourMinSecString(date)
{
	return zeroPad(date.getHours()) + ":" + zeroPad(date.getMinutes()) + ":" + zeroPad(date.getSeconds());
}


function getHourMinString(date)
{
	return zeroPad(date.getHours()) + ":" + zeroPad(date.getMinutes());
}


function getYearMonthDayString(date)
{
	return date.getFullYear() + "-" + zeroPad(date.getMonth() + 1) + "-" + zeroPad(date.getDate());
}


function getHourMinAgeString(timeMs)
{
    var ms = Date.now() - timeMs;
    var h = Math.floor(ms / 1000 / 3600);
    var m = Math.floor(ms / 1000 / 60 - h * 60);

    if (h > 0)
        return h + "h " + m + "min";
    else
        return m + "min";
}


function getIsoTimeString(timeMs)
{
    var date = new Date(timeMs);
    return date.toISOString();
}


function getDecimalYear()
{
    var d1 = new Date();
    var d2 = new Date(d1.getFullYear(), 0, 0, 0, 0, 0, 0);
    var d3 = new Date(d1.getFullYear() + 1, 0, 0, 0, 0, 0, 0);
    var dec = (d1.getTime() - d2.getTime()) / (d3.getTime() - d2.getTime());

    return d1.getFullYear() + dec;
}


function getDmsString(latitude, longitude)
{
	var latString = getCoordString(latitude);
	if (latitude >= 0)
		latString += " N";
	else
		latString += " S";

	var lonString = getCoordString(longitude);
	if (longitude >= 0)
		lonString += " E";
	else
		lonString += " W";

	return latString + " / " + lonString;

	function getCoordString(coord)
	{
	    if (coord < 0)
	        coord = -coord;

		var d = Math.floor(coord);
		var m = Math.floor((coord - d) * 60);
		var s = Math.floor((coord - d - m/60) * 3600);

		return d + "° " + zeroPad(m) + "' " + zeroPad(s) + '"';
	}
}


function getLonLatFromGradMinSec(latGrad, latMin, latSec, latDir, lonGrad, lonMin, lonSec, lonDir)
{
    var latG = parseInt(latGrad);
    var latM = parseInt(latMin);
    var latS = parseFloat(latSec);
    var lat = latG + latM / 60 + latS / 3600;
    if (latDir.toUpperCase().indexOf("S") >= 0)
        lat = -lat;

    var lonG = parseInt(lonGrad);
    var lonM = parseInt(lonMin);
    var lonS = parseFloat(lonSec);
    var lon = lonG + lonM / 60 + lonS / 3600;
    if (lonDir.toUpperCase().indexOf("W") >= 0)
        lon = -lon;

    return [ lon, lat ];
}


function getSignDegMinFromLonLat(longitude, latitude) {
    const absLat = Math.abs(latitude);
    const latDeg = Math.floor(absLat);
    const latMin = Math.floor((absLat - latDeg) * 60);
    const latSign = latitude < 0 ? 'S' : 'N';
    const latDegText = zeroPad(latDeg, 2);
    const latMinText = zeroPad(latMin, 2);

    const absLon = Math.abs(longitude);
    const lonDeg = Math.floor(absLon);
    const lonMin = Math.floor((absLon - lonDeg) * 60);
    const lonSign = longitude < 0 ? 'W' : 'E';
    const lonDegText = zeroPad(lonDeg, 3);
    const lonMinText = zeroPad(lonMin, 2);

    return {
        latDeg: latDeg,
        latMin: latMin,
        latDegText: latDegText,
        latMinText: latMinText,
        latSign: latSign,
        lonDeg: lonDeg,
        lonMin: lonMin,
        lonDegText: lonDegText,
        lonMinText: lonMinText,
        lonSign: lonSign,
    }
}


function shrinkPositions(positions)
{
	var shrinkedpos = [];

	for (var i = 0; i < positions.length; i++)
		shrinkedpos.push([
			roundToDigits(positions[i].latitude, 7),
			roundToDigits(positions[i].longitude, 7),
			positions[i].altitude ? roundToDigits(positions[i].altitude, 1) : null,
			positions[i].timestamp
		]);

	return shrinkedpos;
}


function unshrinkPositions(positions)
{
	var unshrinkedpos = [];

	for (var i = 0; i < positions.length; i++)
		unshrinkedpos.push({
			latitude: positions[i][0],
			longitude: positions[i][1],
			altitude: positions[i][2],
			timestamp: positions[i][3]
		});

	return unshrinkedpos;
}


function zeroPad(number, digits)
{
    if (!digits)
        digits = 2;

    var text = number.toString();

    while (text.length < digits)
        text = "0" + text;

    return text;
}


function roundToDigits(num, digits)
{
	return Math.round(num * Math.pow(10, digits)) / Math.pow(10, digits);
}

//endregion


//region EXTENTS

function containsExtent(outerExtent, innerExtent)
{
    if (!outerExtent || !innerExtent)
        return false;

    return (outerExtent[0] <= innerExtent[0] && outerExtent[1] <= innerExtent[1] && outerExtent[2] >= innerExtent[2] && outerExtent[3] >= innerExtent[3]);
}


function calcOversizeExtent(extent, factor)
{
    var minHalfDiffDeg = 0.1;
    var maxDigits = 7;

    var halfDiffLon = (extent[2] - extent[0]) / 2;
    var halfDiffLat = (extent[3] - extent[1]) / 2;

    if (halfDiffLon < minHalfDiffDeg)
        halfDiffLon = minHalfDiffDeg;

    if (halfDiffLat < minHalfDiffDeg)
        halfDiffLat = minHalfDiffDeg;

    var centerLon = extent[0] + halfDiffLon;
    var centerLat = extent[1] + halfDiffLat;

    return [roundPrecision(centerLon - halfDiffLon * factor, maxDigits),
        roundPrecision(centerLat - halfDiffLat * factor, maxDigits),
        roundPrecision(centerLon + halfDiffLon * factor, maxDigits),
        roundPrecision(centerLat + halfDiffLat * factor, maxDigits)];
}

//endregion


//region UNIT CONVERSION

function m2ft(height_m)
{
	return height_m * 3.2808;
}


function ft2m(height_ft)
{
	return height_ft / 3.2808;
}


function nautmile2m(distance_nm)
{
    return distance_nm * 1852;
}


function kmh2kt(speed_kmh)
{
    return speed_kmh / 1.852;
}


function deg2rad(deg)
{
	return deg / 360 * 2 * Math.PI;
}


function rad2deg(rad)
{
	return rad / (2 * Math.PI) * 360;
}


function lph2gph(fuel_lph) {
    return fuel_lph * 0.264172;
}


function roundPrecision(value, decimals)
{
    value = value * Math.pow(10, decimals);
    value = Math.round(value);
    value = value / Math.pow(10, decimals);

    return value;
}


/*function dmsToDec(posDms)
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
 }
*/

//endregion


//region HTML CANVAS


function createCanvas(widthPx, heightPx)
{
    var canvas = document.createElement('canvas');
    canvas.width = widthPx;
    canvas.height = heightPx;
    canvas.displayScale = 1.0;

    var ctx = getCanvasContext(canvas);

    // determine pixel ratio
    var devicePixelRatio = window.devicePixelRatio || 1;
    var backingStoreRatio =
        ctx.webkitBackingStorePixelRatio ||
        ctx.mozBackingStorePixelRatio ||
        ctx.msBackingStorePixelRatio ||
        ctx.oBackingStorePixelRatio ||
        ctx.backingStorePixelRatio || 1;

    // upscale the canvas if the two ratios don't match
    if (devicePixelRatio !== backingStoreRatio)
    {
        var ratio = devicePixelRatio / backingStoreRatio;

        canvas.width = widthPx * ratio;
        canvas.height = heightPx * ratio;
        canvas.displayScale = 1 / ratio;

        // now scale the context to counter
        // the fact that we've manually scaled
        // our canvas element
        ctx.scale(ratio, ratio);
    }

    return canvas;
}


function getCanvasContext(canvas)
{
    return canvas.getContext("2d");
}


function drawText(canvasContext, x, y, text, fillColor, borderColor, borderWidth)
{
    if (borderColor && borderWidth && borderWidth > 0)
    {
        canvasContext.strokeStyle = borderColor;
        canvasContext.lineWidth = borderWidth;
        canvasContext.strokeText(text, x, y);
    }

    canvasContext.fillStyle = fillColor;
    canvasContext.fillText(text, x, y);
}


function drawRectangle(canvasContext, x, y, widthPx, heightPx, fillColor, borderColor, borderWidth)
{
    canvasContext.fillStyle = fillColor;
    canvasContext.fillRect(x, y, widthPx, heightPx);

    if (borderColor && borderWidth && borderWidth > 0)
    {
        canvasContext.strokeStyle = borderColor;
        canvasContext.lineWidth = borderWidth;
        canvasContext.strokeRect(x, y, widthPx, heightPx);
    }
}


function drawFillBox(canvasContext, x, y, width, height, borderWidth, color, levelFactor)
{
    canvasContext.lineWidth = borderWidth;
    canvasContext.strokeStyle = color;
    canvasContext.fillStyle = color;
    canvasContext.strokeRect(x, y, width, height);
    canvasContext.fillRect(x, y + height - height * levelFactor, width, height * levelFactor);
}


//endregion


//region HTML FULL SCREEN

function startFullScreenMode(element)
{
    if (element.requestFullScreen)
        element.requestFullScreen();
    else if (element.mozRequestFullScreen)
        element.mozRequestFullScreen();
    else if (element.webkitRequestFullScreen)
        element.webkitRequestFullScreen();
    else if (element.msRequestFullscreen)
        element.msRequestFullscreen();
}


function stopFullScreenMode()
{
    if (document.cancelFullScreen)
        document.cancelFullScreen();
    else if (document.mozCancelFullScreen)
        document.mozCancelFullScreen();
    else if (document.webkitCancelFullScreen)
        document.webkitCancelFullScreen();
    else if (document.msExitFullscreen)
        document.msExitFullscreen();
}


function isInFullScreenMode()
{
    return document.fullscreen || document.mozFullScreen || document.webkitIsFullScreen;
}


function isFullScreenEnabled2()
{
    return document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled;
}

//endregion


//region MISC


function isBranch2()
{
    return (location.href.indexOf("branch") >= 0);
}


function isSelf2(email)
{
    return (email == "armand@tschanz.com");
}


function isLocalhost()
{
    return (window.location.hostname === "localhost");
}


function getMorseString(text)
{
    var morse = {
        "A": ".-", "B": "-...", "C": "-.-.", "D": "-..", "E": ".", "F": "..-.", "G": "--.", "H": "....", "I": "..", "J": ".---", "K": "-.-", "L": ".-..", "M": "--",
        "N": "-.", "O": "---", "P": ".--.", "Q": "--.-", "R": ".-.", "S": "...", "T": "-", "U": "..-", "V": "...-", "W": ".--", "X": "-..-", "Y": "-.--", "Z": "--..",
        "1": ".----", "2": "..---", "3": "...--", "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.", "0": "-----" };

    var out = "";

    for (var i = 0; i < text.length; i++)
    {
        if (i > 0)
            out += " ";

        var code = morse[text.substring(i, i + 1).toUpperCase()];

        if (code && code.length > 0)
            out += code;
    }

    return out;
}


function airspaceListToggle()
{
    var asContainerFull = document.getElementById("airspace-popup");
    var asContainerSimple = document.getElementById("airspace-popup-simplified");

    if (!asContainerFull || !asContainerSimple)
        return;

    if (asContainerFull.style.display == 'block')
    {
        asContainerFull.style.display = 'none';
        asContainerSimple.style.display = 'block';
    }
    else
    {
        asContainerFull.style.display = 'block';
        asContainerSimple.style.display = 'none';
    }
}


function regexMatchAll(regex, text)
{
    if (regex.constructor !== RegExp)
        throw new Error('not RegExp');

    var res = [];
    var match = null;

    if (regex.global) {
        while (match = regex.exec(text)) {
            res.push(match);
        }
    }
    else {
        if (match = regex.exec(text)) {
            res.push(match);
        }
    }

    return res;
}

//endregion
