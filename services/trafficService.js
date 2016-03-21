/**
 * Traffix Service
 */

navplanApp
	.factory('trafficService', trafficService);

function trafficService() {
	// init
	var host = "ws://navplan.ch:8080";
	var trafficWebSocket;
	var acList = {};
	var maxTimeSec = 60;


	// return api reference
	return {
		startWatching: startWatching,
		stopWatching: stopWatching,
		getAcList: getAcList
	};


	function startWatching()
	{
		try
		{
			trafficWebSocket = new WebSocket(host);

			trafficWebSocket.onopen = function(msg)
			{
				// TODO
			};
			trafficWebSocket.onmessage = function(msg)
			{
				processTrafficMessage(JSON.parse(msg.data));
			};
			trafficWebSocket.onclose   = function(msg)
			{
				// TODO
			};
		}
		catch(ex){
			console.error("ERROR: connecting to traffic server, " + ex);
		}
	}


	function stopWatching()
	{
		if (trafficWebSocket != null)
		{
			trafficWebSocket.close();
			trafficWebSocket = null;
		}
	}


	function getAcList()
	{
		return acList;
	}


	function processTrafficMessage(data)
	{
		// delete old entries
		removeOldEntries();

		for (var i = 0; i < data.messagelist.length; i++)
		{
			var msg = data.messagelist[i];

			if (!acList[msg.id])
				acList[msg.id] = { id: msg.id, addresstype: msg.addresstype, actype: msg.actype, positions: [] };

			acList[msg.id].positions.push({ time: msg.time, latitude: msg.latitude, longitude: msg.longitude, altitude: msg.altitude });

			// TODO: sort/remove duplicates
		}
	}


	function removeOldEntries()
	{
		for (var i = 0; i < acList.length; i++)
		{
			for (var j = 0; j < acList[i].positions.length; j++)
			{
				var time = acList[i].positions[j];

				// TODO
			}
		}
	}
}