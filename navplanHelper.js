/**
 * helper functions
 */

function setCookie(cname, cvalue, exdays)
{
	if (exdays > 0)
	{
		var d = new Date();
		d.setTime(d.getTime() + (exdays*24*60*60*1000));
		var expires = "expires="+d.toUTCString();
		document.cookie = cname + "=" + cvalue + "; " + expires;
	}
	else
		document.cookie = cname + "=" + cvalue;
	
}


function getCookie(cname)
{
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}


function deleteCookie(cname)
{
	document.cookie = cname + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
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
	 return JSON.stringify(obj, undef2null)
}


function removeFromArray(array, value)
{
	var idx = array.indexOf(value);

	if (idx !== -1)
		array.splice(idx, 1);

	return array;
}


function deg2rad(deg)
{
	return deg / 360 * 2 * Math.PI;
}


/*function rad2deg(rad)
{
	return rad / (2 * Math.PI) * 360;
}


function dmsToDec(posDms)
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