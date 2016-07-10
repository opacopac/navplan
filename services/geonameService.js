/**
 * Geoname Service
 */

navplanApp
	.factory('geonameService', geonameService);

geonameService.$inject = ['$http'];

function geonameService($http)
{
	// init
	var base_url = 'php/geoname.php';

	
	// return api reference
	return {
		searchGeonamesByValue: searchGeonamesByValue,
		searchGeonamesByPosition: searchGeonamesByPosition
	};


	// search by name
	function searchGeonamesByValue(search)
	{
		var gradMinSecPattern = /^(\d+)\D+(\d+)\D+([\d\.]+)(\D+)(\d+)\D+(\d+)\D+([\d\.]+)(\D*)$/i;
		var decGradPattern = /^([+-]?\d+\.\d+)[^\d\.+-]+([+-]?\d+\.\d+)$/i;
		var matchGradMinSec = gradMinSecPattern.exec(search);
		var matchDecGrad = decGradPattern.exec(search);
		
		if (matchGradMinSec != null || matchDecGrad != null)
		{
			var lonLat;

			if (matchGradMinSec != null)
				lonLat = getLonLatFromGradMinSec(matchGradMinSec);
				
			if (matchDecGrad != null)
				lonLat = getLonLatFromDecGrad(matchDecGrad);
				
			return getCoordinateGeoPoint(lonLat, search);
		}
		
		return $http.get(base_url + "?action=searchByName&search=" + search)
			.then(
				function(response) // success
				{
					if (response.data && response.data.geonames) {
						return response.data.geonames.map(function (item) {
							return item;
						});
					}
					else {
						console.error("ERROR searchung geopoints", response);
					}
				},
				function(response) // error
				{
					console.error("ERROR searchung geopoints", response.status, response.data);
				}
			);
	}
	

	// search by pos
	function searchGeonamesByPosition(lat, lon, rad)
	{
		return $http.get(base_url + "?action=searchByPosition&lat=" + lat + "&lon=" + lon + "&rad=" + rad);
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
	
	
	function getLonLatFromGradMinSec(matchGradMinSec)
	{
		var latG = parseInt(matchGradMinSec[1]);
		var latM = parseInt(matchGradMinSec[2]);
		var latS = parseFloat(matchGradMinSec[3]);
		var latDir = matchGradMinSec[4];
		var lat = latG + latM / 60 + latS / 3600;
		if (latDir.toUpperCase().indexOf("S") >= 0)
			lat = -lat;
		
		var lonG = parseInt(matchGradMinSec[5]);
		var lonM = parseInt(matchGradMinSec[6]);
		var lonS = parseFloat(matchGradMinSec[7]);
		var lonDir = matchGradMinSec[8];
		var lon = lonG + lonM / 60 + lonS / 3600;
		if (lonDir.toUpperCase().indexOf("W") >= 0)
			lon = -lon;

		return [ lon, lat ];
	}

	
	function getLonLatFromDecGrad(matchDecGrad)
	{
		var lat = parseFloat(matchDecGrad[1]);
		var lon = parseFloat(matchDecGrad[2]);
		
		return [ lon, lat ];
	}
}
