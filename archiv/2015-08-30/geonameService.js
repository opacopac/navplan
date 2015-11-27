/**
 * Geoname Service
 */

navplanApp
	.factory('geonameService', geonameService, '$resource');

function geonameService($resource)
{
	// init
	var base_url = 'http://tschanz.com/navplan/geoname.php';
	var resource = $resource(base_url);

	
	// return api reference
	return {
		resource: resource,
		searchGeonamesByValue: searchGeonamesByValue
	};


	// search by name
	function searchGeonamesByValue($http, val)
	{
		return $http.get(base_url, { params: { search: val } })
			.then(function(response)
			{
				return response.data.geonames.map(function(item)
				{
					return item;
				});
			});
	}
}
