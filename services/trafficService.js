/**
 * Traffix Service
 */

navplanApp
	.factory('trafficService', trafficService);

trafficService.$inject = ['$http'];

function trafficService($http)
{
	var trafficBaseUrl = window.location.pathname.indexOf("branch") != -1 ? 'php/ogntraffic2.php?v=' + navplanVersion  : 'branch/php/ogntraffic.php?v=' + navplanVersion; // hack: only point to one trafficlistener
	var adsbExchangeBaseUrl = 'https://public-api.adsbexchange.com/VirtualRadar/AircraftList.json'; //?fAltL=0&fAltU=15000&fSBnd=45.7656&fEBnd=10.7281&fNBnd=47.8556&fWBnd=5.4382';
    var acList = {};
    var maxHeight = 15000; // TODO => config tab


	// return api reference
	return {
        requestTraffic: requestTraffic
	};


	function requestTraffic(extent, maxagesec, callback)
    {
        readTrafficOgnListener(extent, maxagesec, callback);
        readTrafficAdsbExchange(extent, maxagesec, callback);
    }


	function readTrafficOgnListener(extent, maxagesec, callback)
	{
		var url = trafficBaseUrl + '&minlon=' + extent[0] + '&minlat=' + extent[1] + '&maxlon=' + extent[2] + '&maxlat=' + extent[3] + '&maxagesec=' + maxagesec;
        $http.get(url)
            .then(
                function (response) // success
                {
                    if (response && response.data && response.data.aclist)
                    {
                        var acListOgn = response.data.aclist;

                        calcTimestamps(acListOgn); // TODO: temp => calc ms in php

                        for (var acAddress in acListOgn)
                        {
                            var ac = acListOgn[acAddress];
                            addOrUpdateAc(
                                ac.id,
                                ac.addresstype,
                                ac.actype,
                                ac.registration,
                                ac.aircraftModelType,
                                ac.manufacturer,
                                ac.positions);
                        }

                        compactAcList(maxagesec);

                        if (callback)
                            callback(acList);
                    }
                },
                function (response) // error
                {
                    console.error("ERROR reading ac traffic from ognlistener", response.status, response.data);
                }
            );
	}


	function readTrafficAdsbExchange(extent, maxagesec, callback)
    {
        var url = adsbExchangeBaseUrl + '?fAltL=0&fAltU=' + maxHeight + '&trFmt=sa';
        url += '&fWBnd=' + extent[0] + '&fSBnd=' + extent[1] + '&fEBnd=' + extent[2] + '&fNBnd=' + extent[3];
        url += "&callback=JSON_CALLBACK";

        $http.jsonp(url)
            .then(
                function (response) // success
                {
                    if (response && response.data && response.data.acList)
                    {
                        var acListAx = response.data.acList;

                        for (var i = 0; i < acListAx.length; i++)
                            addOrUpdateAc(
                                acListAx[i].Icao,
                                "ICAO",
                                parseAdsbExchangeAcType(acListAx[i]),
                                acListAx[i].Reg,
                                acListAx[i].Mdl,
                                acListAx[i].Man,
                                parseAdsbExchangePositions(acListAx[i]));

                        compactAcList(maxagesec);

                        if (callback)
                            callback(acList);
                    }
                },
                function (response) // error
                {
                    console.error("ERROR reading ac traffic from ADSBExchange", response.status, response.data);
                }
            );


        function parseAdsbExchangePositions(ac)
        {
            var pos = {};
            var positions = [];

            if (ac.Cos && ac.Cos.length > 0)
            {
                var numEntries = ac.Cos.length / 4;

                for (var i = 0; i < numEntries; i += 4)
                {
                    pos.latitude = ac.Cos[i];
                    pos.longitude = ac.Cos[i + 1];
                    pos.timestamp = ac.Cos[i + 2];
                    pos.altitude = Math.round(ac.Cos[i + 3] / 3.2808);
                    pos.receiver = "ADSBExchange";

                    positions.push(pos);
                }
            }

            pos.latitude = ac.Lat;
            pos.longitude = ac.Long;
            pos.altitude = Math.round(ac.GAlt / 3.2808);
            pos.timestamp = ac.PosTime;
            pos.receiver = "ADSBExchange";

            positions.push(pos);

            return positions;
        }


        function parseAdsbExchangeAcType(ac)
        {
            /* ICAO Special Designators:
            ZZZZ
            Airship 	SHIP
            Balloon 	BALL
            Glider 	GLID
            Microlight aircraft 	ULAC
            Microlight autogyro 	GYRO
            Microlight helicopter 	UHEL
            Sailplane 	GLID
            Ultralight aircraft 	ULAC
            Ultralight autogyro 	GYRO
            Ultralight helicopter 	UHEL
            */

            switch (ac.Type)
            {
                case 'SHIP':
                case 'BALL':
                    return "BALLOON";
                    break;
                case 'GLID':
                    return "GLIDER";
                    break;
                case 'ULAC':
                    return "POWERED_AIRCRAFT";
                    break;
                case 'UHEL':
                case 'GYRO':
                    return "HELICOPTER_ROTORCRAFT";
                    break;
            }

            /* ADSB Exchange Enums
             VRS.EngineType =
             None: 0,
             Piston: 1,
             Turbo: 2,
             Jet: 3,
             Electric: 4

             VRS.Species =
             None: 0,
             LandPlane: 1,
             SeaPlane: 2,
             Amphibian: 3,
             Helicopter: 4,
             Gyrocopter: 5,
             Tiltwing: 6,
             GroundVehicle: 7,
             Tower: 8 */

            switch (ac.Species)
            {
                case 1:
                case 2:
                case 3:
                case 6:
                    if (ac.EngType == 3)
                        return "JET_AIRCRAFT";
                    else
                        return "POWERED_AIRCRAFT";
                case 4:
                case 5:
                    return "HELICOPTER_ROTORCRAFT";
                    break;
                case 8:
                    return "STATIC_OBJECT";
                default:
                    return "UNKNOWN";
            }
        }
    }


    function addOrUpdateAc(acaddress, addresstype, actype, registration, aircraftModelType, manufacturer, positions)
    {
        var ac = {};

        if (acList.hasOwnProperty(acaddress))
            ac = acList[acaddress];
        else
        {
            ac.acaddress = acaddress;
            ac.positions = [];
            acList[acaddress] = ac;
        }

        ac.addresstype = addresstype;
        ac.actype = actype;
        ac.registration = registration;
        ac.aircraftModelType = aircraftModelType;
        ac.manufacturer = manufacturer;

        for (var i = 0; i < positions.length; i++)
        {
            if (ac.positions.length == 0 || positions[i].timestamp > ac.positions[ac.positions.length - 1].timestamp)
                ac.positions.push(positions[i]);
        }
    }


    function compactAcList(maxagesec)
    {
        var d = new Date();
        var oldestTimestamp = d.getTime() - maxagesec * 1000;

        for (var acAddress in acList)
        {
            var ac = acList[acAddress];

            var i = 0;
            while (i < ac.positions.length && ac.positions[i].timestamp < oldestTimestamp)
                i++;

            if (i > 0)
            {
                if (i >= ac.positions.length)
                    delete acList[acAddress];
                else
                    ac.positions.splice(0, i);
            }
        }
    }


	function calcTimestamps(acList)
	{
		for (var acAddress in acList)
		{
			var ac = acList[acAddress];

			for (var j = 0; j < ac.positions.length; j++)
				ac.positions[j].timestamp = getMs(ac.positions[j].time);
		}


		function getMs(timeString)
		{
			var timeParts = timeString.split(":", 3);
			var today = new Date();
			return Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), timeParts[0], timeParts[1], timeParts[2]);
		}
	}
}