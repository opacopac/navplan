/**
 * Traffix Service
 */

navplanApp
	.factory('trafficService', trafficService);

trafficService.$inject = ['$http'];

function trafficService($http)
{
	var callsignCache = {};
	var acInfoBaseUrl = 'php/acinfo.php?v=' + navplanVersion;
	var trafficBaseUrl = window.location.pathname.includes("branch") ? 'php/ogntraffic.php?v=' + navplanVersion  : 'branch/php/ogntraffic.php?v=' + navplanVersion; // hack: only point to one trafficlistener

	// return api reference
	return {
		readTraffic: readTraffic,
		calcTimestamps: calcTimestamps, // TODO: temp => ms direkt in php
		readAcDetails: readAcDetails,
		tryReadAcCallsign: tryReadAcCallsign
	};


	function readTraffic(extent, maxagesec)
	{
		return $http.get(trafficBaseUrl + '&minlon=' + extent[0] + '&minlat=' + extent[1] + '&maxlon=' + extent[2] + '&maxlat=' + extent[3] + '&maxagesec=' + maxagesec);
	}
	
	
	function readAcDetails(icaoCode)
	{
		return $http.get(acInfoBaseUrl + '&icaohex=' + icaoCode);
	}


	function tryReadAcCallsign(icaoCode)
	{
		if (callsignCache.hasOwnProperty(icaoCode))
			return callsignCache[icaoCode];

		// add to cache asynchronously (for next try)
		$http.get(acInfoBaseUrl + '&icaohex=' + icaoCode)
			.then(
				function(response)
				{
					if (!response.data || !response.data.aircrafts || response.data.aircrafts.length > 1) {
						console.error("ERROR reading ac info");
					}
					else {
						if (response.data.aircrafts.length == 1)
							callsignCache[icaoCode] = response.data.aircrafts[0].registration;
						else
							callsignCache[icaoCode] = undefined;
					}
				},
				function(response)
				{
					console.error("ERROR reading ac info", response.status, response.data);
				}
			);


		return undefined;
	}


	function calcTimestamps(acList)
	{
		for (var acAddress in acList)
		{
			var ac = acList[acAddress];

			for (var j = 0; j < ac.positions.length; j++)
				ac.positions[j].timestamp = getMs(ac.positions[j].time);
		}


		function getMs(timeString)
		{
			var timeParts = timeString.split(":", 3);
			var today = new Date();
			return Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), timeParts[0], timeParts[1], timeParts[2]);
		}
	}
}