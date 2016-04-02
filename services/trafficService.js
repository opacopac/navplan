/**
 * Traffix Service
 */

navplanApp
	.factory('trafficService', trafficService);

trafficService.$inject = ['$http'];

function trafficService($http)
{
	var callsignCache = {};

	// return api reference
	return {
		readTraffic: readTraffic,
		readAcDetails: readAcDetails,
		tryReadAcCallsign: tryReadAcCallsign
	};


	function readTraffic(extent, maxagesec)
	{
		return $http.post('php/ogntraffic.php', obj2json({ action: 'read', minlon: extent[0], minlat: extent[1], maxlon: extent[2], maxlat: extent[3], maxagesec: maxagesec }));
	}
	
	
	function readAcDetails(icaoCode)
	{
		return $http.get('php/lfr_ch.php?icaohex=' + icaoCode);
	}


	function tryReadAcCallsign(icaoCode)
	{
		if (callsignCache.hasOwnProperty(icaoCode))
			return callsignCache[icaoCode];

		// add to cache asynchronously (for next try)
		$http.get('php/lfr_ch.php?icaohex=' + icaoCode)
			.then(
				function(response)
				{
					if (!response.data || !response.data.aircrafts || response.data.aircrafts.length > 1) {
						console.error("ERROR reading callsign");
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
					console.error("ERROR", response.status, response.data);
				}
			)


		return undefined;
	}
}