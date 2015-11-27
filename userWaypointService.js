/**
 * User Waypoint Service
 */

navplanApp
	.factory('userWaypointService', userWaypointService, '$http');

function userWaypointService($http)
{
	// init
	var base_url = 'userWaypoint.php';

	
	// return api reference
	return {
		saveUserWaypoint: saveUserWaypoint
	};


	// search by name
	function saveUserWaypoint(wp)
	{
		$http.post(base_url + "?action=save", wp)
			.success(
				function(data, status, headers, config) {
//					alert("Saved");
				}
			);
	}
}
