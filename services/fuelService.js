/**
 * Fuel Service
 */

navplanApp
	.factory('fuelService', fuelService );

function fuelService()
{
	// init

	
	// return api reference
	return {
		updateFuelCalc: updateFuelCalc,
		getFuelByTime: getFuelByTime
	};
	
	
	function getFuelByTime(consumption, time)
	{
		return Math.round(time / 60 * consumption);
	}
	
	
	function updateFuelCalc(fuel, wps, aircraft)
	{
		fuel.tripTime = 0;
		fuel.alternateTime = 0;
		
		for (i = 0; i < wps.length; i++)
		{
			var eet = getEet(wps[i], aircraft.speed);
		
			if (!wps[i].isAlternate)
				fuel.tripTime += eet;
			else
				fuel.alternateTime += eet;
		}
	}
	
	
	function getEet(wp, speed)
	{
		if (!wp || !wp.dist || wp.dist <= 0 || !speed || speed <= 0)
			return 0;

		var dist_num = parseFloat(wp.dist);
		
		if (isNaN(dist_num))
			return 0;

		var eet = Math.round(Math.round(dist_num) / speed * 60);
		
		if (wp.vacTime > 0)
			return eet + wp.vacTime;
		else
			return eet;
	}
}
