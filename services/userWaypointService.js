/**
 * User Waypoint Service
 */

navplanApp
	.factory('userWaypointService', userWaypointService);

userWaypointService.$inject = ['$http'];
	
function userWaypointService($http)
{
	// init
	var base_url = 'php/userWaypoint.php';

	
	// return api reference
	return {
		saveUserWaypoint: saveUserWaypoint,
		deleteUserWaypoint: deleteUserWaypoint
	};


	// save user wp
	function saveUserWaypoint(wp)
	{
		$http.post(base_url + "?action=save", wp)
			.success(
				function(data, status, headers, config) {
//					alert("Saved");
				}
			);
	}
	
	
	// delete user wp
	function deleteUserWaypoint(wp)
	{
	}
}
