/**
 * Login Service
 */

navplanApp
	.factory('loginService', loginService);

loginService.$inject = ['$http'];

function loginService($http)
{
	var api = {};
	api.login = login;
	api.register = register;
	
	return api;

	
	function login(email, password)
	{
		return $http.post('php/users.php', { action: 'login', email: email, password: password });
	}
	
	function register(email, password)
	{
		return $http.post('php/users.php', { action: 'register', email: email, password: password });
	}
}
