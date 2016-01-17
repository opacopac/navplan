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
	function searchGeonamesByValue(search, email, token)
	{
		var gradMinSecPattern = /^(\d+)°\s*(\d+)('|’|`|\xB4)\s*(\d+)("|”|''|’’|``|\xB4\xB4)\s*([NS]?)[^\d\w]*(\d+)°\s*(\d+)('|’|`|\xB4)\s*(\d+)("|”|''|’’|``|\xB4\xB4)\s*([EOW]?)$/i;
		var decGradPattern = /^([+-]?\d+\.\d+)[^\d\.+-]+([+-]?\d+\.\d+)$/i;
		var matchGradMinSec = gradMinSecPattern.exec(search);
		var matchDecGrad = decGradPattern.exec(search);
		
		if (matchGradMinSec != null || matchDecGrad != null)
		{
			if (matchGradMinSec != null)
				lonLat = getLonLatFromGradMinSec(matchGradMinSec);
				
			if (matchDecGrad != null)
				lonLat = getLonLatFromDecGrad(matchDecGrad);
				
			return getCoordinateGeoPoint(lonLat, search);
		}
		
		return $http.post(base_url, obj2json({ action: 'searchByName', search: search, email: email, token: token }))
			.then(function(response)
			{
				return response.data.geonames.map(function(item)
				{
					return item;
				});
			});
	}
	

	// search by pos
	function searchGeonamesByPosition(lat, lon, rad, email, token)
	{
		return $http.post(base_url, obj2json({ action: 'searchByPosition', lat: lat, lon: lon, rad: rad, email: email, token: token }));
	}
	
	
	function getCoordinateGeoPoint(lonLat, text)
	{
		var results = {
			geonames : [ {
				name: text,
				latitude: lonLat[1],
				longitude: lonLat[0]
			} ]
		}
		
		return results.geonames.map(function(item)
		{
			return item;
		});	
	}
	
	
	function getLonLatFromGradMinSec(matchGradMinSec)
	{
		var latG = parseInt(matchGradMinSec[1]);
		var latM = parseInt(matchGradMinSec[2]);
		var latS = parseInt(matchGradMinSec[4]);
		var latDir = matchGradMinSec[6];
		var lat = latG + latM / 60 + latS / 3600;
		if (latDir.toUpperCase() == "S")
			lat = -lat;
		
		var lonG = parseInt(matchGradMinSec[7]);
		var lonM = parseInt(matchGradMinSec[8]);
		var lonS = parseInt(matchGradMinSec[10]);
		var lonDir = matchGradMinSec[12];
		var lon = lonG + lonM / 60 + lonS / 3600;
		if (lonDir.toUpperCase() == "W")
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
