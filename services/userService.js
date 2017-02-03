/**
 * User Service
 */

navplanApp
	.factory('userService', userService);

userService.$inject = ['$http'];

function userService($http)
{
	var userBaseUrl = 'php/users.php';
	var navplanBaseUrl = 'php/navplan.php';
	var navplanBaseUrlGet = navplanBaseUrl + '?v=' + navplanVersion;
	var userWpBaseUrl = 'php/userWaypoint.php';
	var userWpBaseUrlGet = userWpBaseUrl + '?v=' + navplanVersion;
	var userTrackBaseUrl = 'php/userTrack.php';
	var userTrackBaseUrlGet = userTrackBaseUrl + '?v=' + navplanVersion;


	// service api
	return {
		login: login,
		register: register,
		forgotPassword: forgotPassword,
		updatePassword: updatePassword,
		readNavplanList: readNavplanList,
		readNavplan: readNavplan,
		createNavplan: createNavplan,
		updateNavplan: updateNavplan,
		deleteNavplan: deleteNavplan,
		saveUserWaypoint: saveUserWaypoint,
		deleteUserWaypoint: deleteUserWaypoint,
		readUserTrackList: readUserTrackList,
		readUserTrack: readUserTrack,
		createUserTrack: createUserTrack,
		updateUserTrack: updateUserTrack,
		deleteUserTrack: deleteUserTrack
	};
	

	function login(email, password)
	{
		return $http.post(userBaseUrl, obj2json({ action: 'login', email: email, password: password }));
	}

	
	function register(email, password)
	{
		return $http.post(userBaseUrl, obj2json({ action: 'register', email: email, password: password }));
	}
	
	
	function forgotPassword(email)
	{
		return $http.post(userBaseUrl, obj2json({ action: 'forgotpassword', email: email }));
	}

	
	function updatePassword(email, oldpassword, newpassword)
	{
		return $http.post(userBaseUrl, obj2json({ action: 'updatepassword', email: email, oldpassword: oldpassword, newpassword: newpassword }));
	}
	
	
	function readNavplanList()
	{
		return $http.get(navplanBaseUrlGet);
	}


	function readNavplan(navplan_id)
	{
		return $http.get(navplanBaseUrlGet + '&id=' + navplan_id);
	}
	
	
	function createNavplan(globalData)
	{
		return $http.post(navplanBaseUrl, obj2json({ globalData: globalData }));
	}

	
	function updateNavplan(globalData)
	{
		return $http.put(navplanBaseUrl, obj2json({ globalData: globalData }));
	}


	function deleteNavplan(navplan_id)
	{
		return $http.delete(navplanBaseUrlGet + '&id=' + navplan_id);
	}

	
	function saveUserWaypoint(wp)
	{
		if (wp.userWaypoint && wp.userWaypoint.id > 0)
			return $http.put(userWpBaseUrl, obj2json({ id: wp.userWaypoint.id, wp: wp }));
		else
			return $http.post(userWpBaseUrl, obj2json({ wp: wp }));
	}

	
	function deleteUserWaypoint(id)
	{
		return $http.delete(userWpBaseUrlGet + '&id=' + id);
	}


	function createUserTrack(timestamp, name, positions)
	{
		return $http.post(userTrackBaseUrl, obj2json({ timestamp: timestamp, name: name, positions: positions }));
	}


	function updateUserTrack(id, name)
	{
		return $http.put(userTrackBaseUrl, obj2json({ id: id, name: name }));
	}


	function readUserTrackList()
	{
		return $http.get(userTrackBaseUrlGet);
	}


	function readUserTrack(trackid)
	{
		return $http.get(userTrackBaseUrlGet + '&id=' + encodeURI(trackid));
	}


	function deleteUserTrack(trackid)
	{
		return $http.delete(userTrackBaseUrlGet + '&id=' + encodeURI(trackid));
	}
}
