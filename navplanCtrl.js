/**
 * Global Data
 */
navplanApp
	.factory('globalData', globalData);

function globalData()
{
	return {}; // return empty object
}


/**
 * Main Controller
 */

navplanApp
	.controller('navplanCtrl', [ '$scope', 'globalData', navplanCtrl ]);


function navplanCtrl($scope, globalData)
{
	$scope.globalData = globalData;
	
	// init user
	var uid = getCookie("uid");

	if (uid == "")
	{
		uid = getUid();
		setCookie("uid", uid, 90);
	}
	
	$scope.globalData.user = { uid: uid };

	// init disclaimer
	var hideDisclaimer = getCookie("hideDisclaimer");

	if (hideDisclaimer != "1")
		$('#disclaimerDialog').modal('show');
	

	// init pilot
	$scope.globalData.pilot = { name: 'Armand' };
	
	// init aircraft
	$scope.globalData.aircraft = { id: 'HB-SRA', speed: 100, consumption: 20 };
	
	// init waypoints
	$scope.globalData.waypoints = [ ];
	$scope.globalData.currentIdx = -1;
	$scope.globalData.eetSum = '';

	// init fuel
	$scope.globalData.fuel = { tripTime: 0, alternatTime: 0, reserveTime: 45, extraTime: 0 };
	
	// init settings
	$scope.globalData.settings = { variation: 2 };
	
	// initial map position
	$scope.globalData.currentMapPos =
	{
		//center: ol.proj.fromLonLat([8.3333, 46.8333]), // center of CH
		//zoom: 9
		center: ol.proj.fromLonLat([7.4971, 46.9141]), // LSZB
		zoom: 11
	};
	
	// waypoint input field
	$scope.globalData.selectedWaypoint = undefined;
	
	
	$scope.onDisclaimerOKClicked = function()
	{
		if ($scope.hideDisclaimer)
			setCookie("hideDisclaimer", "1", 90);
	}
}


function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}


function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}

function getUid()
{
	return Math.floor((Math.random() * 100000000000) + 1); 
}