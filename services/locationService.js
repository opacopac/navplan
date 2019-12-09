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
			// only update positions after >=2 sec
			lastPos = lastPositions.length > 0 ? lastPositions[lastPositions.length - 1] : undefined;
			if (lastPos && position.timestamp - lastPos.timestamp < 2000) {
				return;
			}

			lastPositions.push({
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
				altitude: position.coords.altitude,
				timestamp: position.timestamp
			});


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
