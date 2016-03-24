/**
 * Location Service
 */

navplanApp
	.factory('locationService', locationService);

function locationService() {
	// init
	var geolocationWatch;
	var locationChangedCallback = undefined;
	var lastPositions = [];
	var maxPositions = 20;


	// return api reference
	return {
		init: init,
		startWatching: startWatching,
		stopWatching: stopWatching,
		lastPositions: lastPositions
	};


	function init(callback)
	{
		locationChangedCallback = callback;
	}


	function startWatching() {
		if (navigator.geolocation) {
			geolocationWatch = navigator.geolocation.watchPosition(
				function (position) {
					lastPositions.push({
						latitude: position.coords.latitude,
						longitude: position.coords.longitude,
						altitude: position.coords.altitude
					});

					if (lastPositions.length > maxPositions)
						lastPositions.shift();

					if (locationChangedCallback)
						locationChangedCallback(lastPositions);
				},
				function (error) {
					console.log("ERROR: " + error.code);
				}
			)
		}
		else
			console.log("ERROR: Geolocation is not supported!");
	}

	function stopWatching()
	{
		navigator.geolocation.clearWatch(geolocationWatch);
	}
}