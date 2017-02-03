/**
 * helper functions
 */


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


function sendPostForm(action, target, varName, varData)
{
	var form = document.createElement("form");
	form.target = target;
	form.method = "POST";
	form.action = action;

	var input = document.createElement("input");
	input.type = "hidden";
	input.name = varName;
	input.value = encodeURIComponent(varData);

	form.appendChild(input);

	document.body.appendChild(form);

	form.submit();

	//document.body.removeChild(form);
}


function createAndClickLink(href, target)
{
	var a = document.createElement("a");
	a.href = href;
	a.target = target;
	a.style = "display: none";

	document.body.appendChild(a);

	a.click();

    // doesn't work with firefox
    //document.body.removeChild(a);
}


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
		var d = Math.floor(coord);
		var m = Math.floor((coord - d) * 60);
		var s = Math.floor((coord - d - m/60) * 3600);

		return d + "° " + zeroPad(m) + "' " + zeroPad(s) + '"';
	}
}


function zeroPad(number)
{
	if (number < 10)
		return "0" + number;
	else
		return "" + number;
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


function roundToDigits(num, digits)
{
	return Math.round(num * Math.pow(10, digits)) / Math.pow(10, digits);
}


function m2ft(height_m)
{
	return height_m * 3.2808;
}


function ft2m(height_ft)
{
	return height_ft / 3.2808;
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