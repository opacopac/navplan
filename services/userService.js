/**
 * User Service
 */

navplanApp
	.factory('userService', userService);

userService.$inject = ['$http'];

function userService($http)
{
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
		createUserTrack: createUserTrack,
		readUserTrackList: readUserTrackList,
		readUserTrack: readUserTrack,
		deleteUserTrack: deleteUserTrack
	};
	

	function login(email, password)
	{
		return $http.post('php/users.php', obj2json({ action: 'login', email: email, password: password }));
	}

	
	function register(email, password)
	{
		return $http.post('php/users.php', obj2json({ action: 'register', email: email, password: password }));
	}
	
	
	function forgotPassword(email)
	{
		return $http.post('php/users.php', obj2json({ action: 'forgotpassword', email: email }));
	}

	
	function updatePassword(email, oldpassword, newpassword)
	{
		return $http.post('php/users.php', obj2json({ action: 'updatepassword', email: email, oldpassword: oldpassword, newpassword: newpassword }));
	}
	
	
	function readNavplanList()
	{
		return $http.get('php/navplan.php');
	}


	function readNavplan(navplan_id)
	{
		return $http.get('php/navplan.php?id=' + navplan_id);
	}
	
	
	function createNavplan(globalData)
	{
		return $http.post('php/navplan.php', obj2json({ globalData: globalData }));
	}

	
	function updateNavplan(globalData)
	{
		return $http.put('php/navplan.php', obj2json({ globalData: globalData }));
	}


	function deleteNavplan(navplan_id)
	{
		return $http.delete('php/navplan.php?id=' + navplan_id);
	}

	
	function saveUserWaypoint(wp)
	{
		if (wp.id > 0)
			return $http.put('php/userWaypoint.php', obj2json({ wp: wp }));
		else
			return $http.post('php/userWaypoint.php', obj2json({ wp: wp }));
	}

	
	function deleteUserWaypoint(id)
	{
		return $http.delete('php/userWaypoint.php?id=' + id);
	}


	function createUserTrack(name, positions)
	{
		return $http.post('php/userTrack.php', obj2json({ name: name, positions: positions }));
	}


	function readUserTrackList()
	{
		return $http.get('php/userTrack.php');
	}


	function readUserTrack(trackid)
	{
		return $http.get('php/userTrack.php?id=' + encodeURI(trackid));
	}


	function deleteUserTrack(trackid)
	{
		return $http.delete('php/userTrack.php?id=' + encodeURI(trackid));
	}
}
