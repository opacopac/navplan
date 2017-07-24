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


function zeroPad(number)
{
    if (number < 10)
        return "0" + number;
    else
        return "" + number;
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
    var halfDiffLon = (extent[2] - extent[0]) / 2;
    var halfDiffLat = (extent[3] - extent[1]) / 2;
    var centerLon = extent[0] + halfDiffLon;
    var centerLat = extent[1] + halfDiffLat;

    return [centerLon - halfDiffLon * factor,
        centerLat - halfDiffLat * factor,
        centerLon + halfDiffLon * factor,
        centerLat + halfDiffLat * factor];
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


function deg2rad(deg)
{
	return deg / 360 * 2 * Math.PI;
}


function rad2deg(rad)
{
	return rad / (2 * Math.PI) * 360;
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


//region MISC

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
