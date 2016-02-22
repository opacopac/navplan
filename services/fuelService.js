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
		return Math.ceil(time / 60 * consumption);
	}
	
	
	function updateFuelCalc(fuel, wps, alternate, aircraft)
	{
		fuel.tripTime = 0;
		fuel.alternateTime = 0;
		
		for (i = 0; i < wps.length; i++)
			fuel.tripTime += getEet(wps[i], aircraft.speed);

		if (alternate)
			fuel.alternateTime = getEet(alternate, aircraft.speed);
	}
	
	
	function getEet(wp, speed)
	{
		if (!wp || !wp.dist || wp.dist <= 0 || !speed || speed <= 0)
			return 0;

		var dist_num = parseFloat(wp.dist);
		
		if (isNaN(dist_num))
			return 0;

		var eet = Math.ceil(dist_num / speed * 60);
		
		if (wp.vacTime > 0)
			return eet + wp.vacTime;
		else
			return eet;
	}
}
