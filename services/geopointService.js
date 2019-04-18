/**
 * Geopoint Service
 */

navplanApp
	.factory('geopointService', geopointService);

geopointService.$inject = ['$http'];

function geopointService($http)
{
	var baseUrl = 'php/geopoint.php?v=' + navplanVersion + '&';

	// return api reference
	return {
		searchGeonamesByValue: searchGeonamesByValue,
		searchGeonamesByPosition: searchGeopointsByPosition
	};


	// search by name
	function searchGeonamesByValue(search)
	{
		var gradMinSecPattern = /^(\d+)\D+(\d+)\D+([\d\.]+)(\D+)(\d+)\D+(\d+)\D+([\d\.]+)(\D*)$/i;
		var decGradPattern = /^([+-]?\d+\.\d+)[^\d\.+-]+([+-]?\d+\.\d+)$/i;
		var notamPattern = /^(\d{2})(\d{2})(\d{2})([NS])\s?(\d{2,3})(\d{2})(\d{2})([EW])$/i; // 463447N0062121E, 341640N0992240W
		var matchGradMinSec = gradMinSecPattern.exec(search);
		var matchDecGrad = decGradPattern.exec(search);
		var matchNotam = notamPattern.exec(search);

		if (matchGradMinSec != null || matchDecGrad != null || matchNotam != null)
		{
			var lonLat;

			if (matchGradMinSec != null)
				lonLat = getLonLatFromGradMinSec(matchGradMinSec[1],matchGradMinSec[2],matchGradMinSec[3],matchGradMinSec[4],matchGradMinSec[5],matchGradMinSec[6],matchGradMinSec[7],matchGradMinSec[8]);
			else if (matchDecGrad != null)
				lonLat = getLonLatFromDecGrad(matchDecGrad);
			else if (matchNotam != null)
			    lonLat = getLonLatFromGradMinSec(matchNotam[1],matchNotam[2],matchNotam[3],matchNotam[4],matchNotam[5],matchNotam[6],matchNotam[7],matchNotam[8]);
				
			return getCoordinateGeoPoint(lonLat, search);
		}
		
		return $http.get(baseUrl + "action=searchByName&search=" + search)
			.then(
				function(response) // success
				{
					if (response.data && response.data.geonames) {
						return response.data.geonames.map(function (item) {
							return item;
						});
					}
				},
				function(response) // error
				{
                    logResponseError("ERROR searching geopoints", response);
				}
			);
	}
	

	// search by pos
	function searchGeopointsByPosition(lat, lon, rad, minNotamTime, maxNotamTime)
	{
		return $http.get(baseUrl + "action=searchByPosition&lat=" + lat + "&lon=" + lon + "&rad=" + rad + "&minnotamtime=" + minNotamTime + "&maxnotamtime=" + maxNotamTime);
	}
	
	
	function getCoordinateGeoPoint(lonLat, text)
	{
		var results = {
			geonames : [ {
				name: text,
				latitude: lonLat[1],
				longitude: lonLat[0]
			} ]
		};
		
		return results.geonames.map(function(item)
		{
			return item;
		});	
	}

	
	function getLonLatFromDecGrad(matchDecGrad)
	{
		var lat = parseFloat(matchDecGrad[1]);
		var lon = parseFloat(matchDecGrad[2]);
		
		return [ lon, lat ];
	}
}
