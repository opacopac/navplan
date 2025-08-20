/**
 * Waypoint Service
 */

navplanApp
	.factory('waypointService', waypointService);

waypointService.$inject = ['mapService'];

function waypointService(mapService)
{
    var wmm = new WorldMagneticModel();
    //wmm.declination(alt, lat, lon, decyear);

    // service api
	return {
		recalcWaypoints: recalcWaypoints,
        createIcaoFlightPlanWpList: createIcaoFlightPlanWpList,
        createGarminPilotWpList: createGarminPilotWpList
	};


    function recalcWaypoints(wps, altWp, magvar, speed)
	{
		var prevWp;

		// waypoints
		for (var i = 0; i < wps.length; i++)
		{
			// vac time for start/end +5
			if ((i == 1 && wps[0].type == 'airport') || (i == wps.length - 1 && wps[i].type == 'airport'))
				wps[i].vacTime = 5;
			else
				wps[i].vacTime = 0;

				
			// recalc distance & bearing
			if (i > 0)
				prevWp = wps[i - 1];
			else
				prevWp = undefined;

			recalcWp(wps[i], prevWp, false, magvar, speed);
		}

		// alternate
		if (altWp)
		{
			// vac time +5
			altWp.vacTime = 5;
		
			if (wps.length > 0)
				prevWp = wps[wps.length - 1];
			else
				prevWp = undefined;
				
			recalcWp(altWp, prevWp, true, magvar, speed);
		}
	}
	
	
	function recalcWp(wp, prevWp, isAlternate, magvar, speed)
	{
		// recalc distance & bearing
		if (prevWp)
		{
			wp.dist = Math.ceil(mapService.getDistance(wp.latitude, wp.longitude, prevWp.latitude, prevWp.longitude));
			wp.mt = Math.round(mapService.getBearing(prevWp.latitude, prevWp.longitude, wp.latitude, wp.longitude, magvar));
		}
		else
		{
			wp.dist = undefined;
			wp.mt = undefined;
		}

		// format mt / dist / eet
		wp.mtText = formatMt(wp, isAlternate);
		wp.distText = formatDist(wp);
		wp.eetText = formatEet(wp, speed);
	}
	
	
	function formatMt(wp, isAlternate)
	{
		if (!wp || !wp.mt || wp.mt.length > 3)
			return '';
		
		if (wp.vacTime > 0 && !isAlternate)
			return 'VAC';
			
		var mt_num = parseInt(wp.mt);
		
		if (isNaN(mt_num))
			return '';
		else
			mt_num += '';

		return new Array(4-mt_num.length).join("0") + mt_num;
	}

	
	function formatDist(wp)
	{
		if (!wp || !wp.dist)
			return '';
		
		var dist_num = parseFloat(wp.dist);
		
		if (isNaN(dist_num))
			return '';
		else
			return Math.ceil(dist_num);
	}


	function formatEet(wp, speed)
	{
		if (!wp || !wp.dist || wp.dist <= 0 || !speed || speed <= 0)
			return '';

		var dist_num = parseFloat(wp.dist);
		
		if (isNaN(dist_num))
			return '';

		var eet = Math.ceil(dist_num / speed * 60);
		
		if (wp.vacTime > 0)
			return eet + '/+' + wp.vacTime;
		else
			return eet;
	}


    function createIcaoFlightPlanWpList(wps) {
        var atcWpList = [];

        for (var i = 0; i < wps.length; i++) {
            var wp = wps[i];
            if (wp.type === 'airport' && wp.airport_icao) {
                atcWpList.push(wp.airport_icao);
            } else if (wp.type === 'navaid' && wp.callsign.length === 3 && wp.checkpoint.indexOf("VOR") >= 0) {
                atcWpList.push(wp.callsign);
            } else {
                var absLat = Math.abs(wp.latitude);
                var latDeg = Math.floor(absLat);
                var latMin = Math.floor((absLat - latDeg) * 60);
                var latSign = wp.latitude < 0 ? 'S' : 'N';
                var latDegText = zeroPad(latDeg, 2);
                var latMinText = zeroPad(latMin, 2);

                var absLon = Math.abs(wp.longitude);
                var lonDeg = Math.floor(absLon);
                var lonMin = Math.floor((absLon - lonDeg) * 60);
                var lonSign = wp.longitude < 0 ? 'W' : 'E';
                var lonDegText = zeroPad(lonDeg, 3);
                var lonMinText = zeroPad(lonMin, 2);

                var wpText = latDegText + latMinText + latSign
                    + lonDegText + lonMinText + lonSign;

                atcWpList.push(wpText);
            }
        }

        return atcWpList;
    }


    function createGarminPilotWpList(wps) {
        var atcWpList = [];

        for (var i = 0; i < wps.length; i++) {
            var wp = wps[i];
            if (wp.type === 'airport' && wp.airport_icao) {
                atcWpList.push(wp.airport_icao);
            /*} else if (wp.type === 'navaid' && wp.callsign.length === 3 && wp.checkpoint.indexOf("VOR") >= 0) {
                atcWpList.push(wp.callsign);*/ // TODO: routes with coordinate wps after a VOR are not imported into garmin pilot...
            } else {
                var wpText = roundToDigits(wp.latitude, 4) + '/' + roundToDigits(wp.longitude, 4);
                atcWpList.push(wpText);
            }
        }

        return atcWpList;
    }
}
