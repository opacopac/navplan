/**
 * Weather Service
 */

navplanApp
	.factory('weatherService', weatherService );

trafficService.$inject = ['$http'];

function weatherService($http)
{
	// init
	var metarlist = [];
	var taflist = [];
	var lastUpdated = 0;
	const MAXAGE = 5 * 60 * 1000; // 5 min

	updateWeatherInfos();

	// return api reference
	return {
		getAirportMetar: getAirportMetar,
		getAirportTaf: getAirportTaf,
		getWeatherInfos: getWeatherInfo,
		getWorstSkyCondition: getWorstSkyCondition
	};
	
	
	function getAirportMetar(airport_icao)
	{
		return metarlist[airport_icao];
	}


	function getAirportTaf(airport_icao)
	{
		return taflist[airport_icao];
	}


	function getWeatherInfo(callback)
	{
		if (Date.now() > lastUpdated + MAXAGE)
			updateWeatherInfos(callback);
		else if (callback)
			callback(metarlist, taflist);
	}


	function updateWeatherInfos(onUpdatedCallback)
	{
		// get metars
		$http.get('php/weather.php?allWeather=1')
			.then(
				function(response)
				{
					if (!response.data) {
						console.error("ERROR reading METAR");
					}
					else {
						metarlist = response.data.metarlist;
						taflist = response.data.taflist;
						lastUpdated = Date.now();
					}
				},
				function(response)
				{
					console.error("ERROR reading METAR", response.status, response.data);
				}
			)
			.then(
				function () {
					if (onUpdatedCallback)
						onUpdatedCallback(metarlist, taflist);
				}
			)
	}


	function getWorstSkyCondition(metar)
	{
		var condRank = { "CAVOK": 1, "SKC" : 1, "CLR" : 1, "NSC" : 1, "FEW" : 2, "SCT" : 3, "BKN" : 4, "OVC" : 5 };
		var worstRank = 0;
		var worstSkyCond;


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
