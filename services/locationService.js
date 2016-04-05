/**
 * Location Service
 */

navplanApp
	.factory('locationService', locationService);

function locationService()
{
	// init
	var geolocationWatch;
	var lastPositions = [];
	var maxPositions = 20;


	// return api reference
	return {
		startWatching: startWatching,
		stopWatching: stopWatching,
		getLastPositions: getLastPositions
	};


	function getLastPositions()
	{
		return lastPositions;
	}


	function startWatching(successCallback, errorCallback)
	{
		lastPositions = [];

		if (!navigator.geolocation)
		{
			console.log("ERROR: Geolocation is not supported!");

			if (errorCallback)
				errorCallback();

			return;
		}

		var options = {
			enableHighAccuracy: true,
			timeout: 20000,
			maximumAge: 0
		};

		geolocationWatch = navigator.geolocation.watchPosition(onPositionUpdate, onPositionError, options);


		function onPositionUpdate(position)
		{
			// add latest pos
			lastPositions.push({
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
				altitude: position.coords.altitude
			});

			// remove oldest pos
			if (lastPositions.length > maxPositions)
				lastPositions.shift();

			if (successCallback)
				successCallback(position);
		}


		function onPositionError(error)
		{
			console.log("ERROR: no position, error code=" + error.code);

			if (errorCallback)
				errorCallback(error);
		}
	}


	function stopWatching()
	{
		navigator.geolocation.clearWatch(geolocationWatch);
	}
}