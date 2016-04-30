/**
 * Weather Service
 */

navplanApp
	.factory('weatherService', weatherService );

trafficService.$inject = ['$http'];

function weatherService($http)
{
	// init
	var weatherinfolist = [];
	var lastUpdated = 0;
	const MAXAGE = 5 * 60 * 1000; // 5 min

	updateWeatherInfos();

	// return api reference
	return {
		getAirportWeatherInfo: getAirportWeatherInfo,
		getAllWeatherInfos: getAllWeatherInfo,
		getWorstSkyCondition: getWorstSkyCondition
	};
	
	
	function getAirportWeatherInfo(airport_icao)
	{
		return weatherinfolist[airport_icao];
	}


	function getAllWeatherInfo(callback)
	{
		if (Date.now() > lastUpdated + MAXAGE)
			updateWeatherInfos(callback);
		else if (callback)
			callback(weatherinfolist);
	}


	function updateWeatherInfos(onUpdatedCallback)
	{
		// get metars
		$http.get('php/weather.php')
			.then(
				function(response)
				{
					if (!response.data) {
						console.error("ERROR reading METAR/TAF");
					}
					else {
						weatherinfolist = response.data.weatherinfolist;
						lastUpdated = Date.now();
					}
				},
				function(response)
				{
					console.error("ERROR reading METAR/TAF", response.status, response.data);
				}
			)
			.then(
				function () {
					if (onUpdatedCallback)
						onUpdatedCallback(weatherinfolist);
				}
			)
	}


	function getWorstSkyCondition(metar)
	{
		var condRank = { "CAVOK": 1, "SKC" : 1, "CLR" : 1, "NSC" : 1, "FEW" : 2, "SCT" : 3, "BKN" : 4, "OVC" : 5 };
		var worstRank = 0;
		var worstSkyCond;

		if (!metar || !metar.sky_condition)
			return undefined;

		for (var i = 0; i < metar.sky_condition.length; i++)
		{
			var cond = metar.sky_condition[i].sky_cover;

			if (worstRank < condRank[cond])
			{
				worstRank = condRank[cond];
				worstSkyCond = cond;
			}
		}

		return worstSkyCond;
	}
}
