/**
 * User Service
 */

navplanApp
	.factory('userService', userService);

userService.$inject = ['$http'];

function userService($http)
{
	var api = 
	{
		login: login,
		register: register,
		loadNavplanList: loadNavplanList
	}
	
	return api;

	
	function login(email, password)
	{
		return $http.post('php/users.php', { action: 'login', email: email, password: password });
	}

	
	function register(email, password)
	{
		return $http.post('php/users.php', { action: 'register', email: email, password: password });
	}
	
	
	function loadUser(email, token)
	{
		//TODO
	}
	
	
	function loadNavplanList(email, token)
	{
		return $http.post('php/navplan.php', { action: 'getList', email: email, token: token });
	}


	function loadNavplan(navplan_id, email, token)
	{
		return $http.post('php/navplan.php', { action: 'getDetails', navplan_id: navplan_id, email: email, token: token });
	}
}
