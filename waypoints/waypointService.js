/**
 * Waypoint Service
 */

navplanApp
	.factory('waypointService', [ 'mapService', waypointService] );

function waypointService(mapService)
{
	// init
	var mapService = mapService;
	
	// return api reference
	return {
		updateWpList: updateWpList,
	};


	function updateWpList(wps, magvar, speed)
	{
		// set alternate flag
		for (i = 0; i < wps.length; i++)
		{
			if (i > 1 && i == wps.length - 1 && wps[i].type == 'airport' && wps[i - 1].type == 'airport')
				wps[i].isAlternate = true;
			else
				wps[i].isAlternate = false;
		}


		for (i = 0; i < wps.length; i++)
		{
			// check vac time +5 (first, last, second last if before alternate)
			if ((i == 1 && wps[0].type == 'airport') || (i == wps.length - 1 && wps[i].type == 'airport') || (i == wps.length - 2 && wps[i + 1].isAlternate && wps[i].type == 'airport'))
				wps[i].vacTime = 5;
			else
				wps[i].vacTime = 0;

				
			// recalc distance & bearing
			if (i > 0)
			{
				wps[i].dist = mapService.getDistance(wps[i - 1].latitude, wps[i - 1].longitude, wps[i].latitude, wps[i].longitude);
				wps[i].mt = mapService.getBearing(wps[i - 1].latitude, wps[i - 1].longitude, wps[i].latitude, wps[i].longitude, magvar);
			}
			
			// format mt / dist / eet
			wps[i].mtText = formatMt(wps[i]);
			wps[i].distText = formatDist(wps[i]);
			wps[i].eetText = formatEet(wps[i], speed);
		}
	}
	
	
	function formatMt(wp)
	{
		if (!wp || !wp.mt || wp.mt.length > 3)
			return '';
		
		if (wp.vacTime > 0 && !wp.isAlternate)
			return 'VAC';
			
		var mt_num = parseInt(wp.mt);
		
		if (isNaN(mt_num))
			return '';
		else
			mt_num += '';

		return Array(4-mt_num.length).join("0") + mt_num;
	}

	
	function formatDist(wp)
	{
		if (!wp || !wp.dist)
			return;
		
		var dist_num = parseFloat(wp.dist);
		
		if (isNaN(dist_num))
			return '';
		else
			return (Math.round(dist_num));
	}


	function formatEet(wp, speed)
	{
		if (!wp || !wp.dist || wp.dist <= 0 || !speed || speed <= 0)
			return '';

		var dist_num = parseFloat(wp.dist);
		
		if (isNaN(dist_num))
			return '';

		eet = Math.round(Math.round(dist_num) / speed * 60);
		
		if (wp.vacTime > 0)
			return eet + '/+' + wp.vacTime;
		else
			return eet;
	}
}
