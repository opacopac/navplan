/**
 * Traffix Service
 */

navplanApp
	.factory('trafficService', trafficService);

trafficService.$inject = ['$http'];

function trafficService($http)
{
    var dataSources = { "ogn": "OGN", "adsbexchange": "ADSBX" };
    var positionMethod = { "flarm": "FLARM", "adsb": "ADSB", "mlat" : "MLAT" };
	var trafficBaseUrl = 'php/ogntraffic2.php?v=' + navplanVersion;
	var adsbExchangeBaseUrl = 'https://public-api.adsbexchange.com/VirtualRadar/AircraftList.json'; //?fAltL=0&fAltU=15000&fSBnd=45.7656&fEBnd=10.7281&fNBnd=47.8556&fWBnd=5.4382';
    var acList = {};
    var lastExtent = undefined;


	// return api reference
	return {
        requestTraffic: requestTraffic
	};


	function requestTraffic(extent, maxAgeSec, maxAltitude, sessionId, successCallback, errorCallback)
    {
        readTrafficOgnListener(extent, maxAgeSec, sessionId, successCallback, errorCallback);
        readTrafficAdsbExchange(extent, maxAgeSec, maxAltitude, successCallback, errorCallback);
    }


	function readTrafficOgnListener(extent, maxagesec, sessionId, successCallback, errorCallback)
	{
        var waitDataSec = 1;

        if (lastExtent && lastExtent[0] == extent[0] && lastExtent[1] == extent[1] && lastExtent[2] == extent[2] && lastExtent[3] == extent[3])
            waitDataSec = 0;

        lastExtent = extent;

        var url = trafficBaseUrl + '&minlon=' + extent[0] + '&minlat=' + extent[1] + '&maxlon=' + extent[2] + '&maxlat=' + extent[3] + '&maxagesec=' + maxagesec + '&sessionid=' + sessionId + '&waitDataSec=' + waitDataSec;
        $http.get(url)
            .then(
                function (response) // success
                {
                    if (response && response.data && response.data.aclist)
                    {
                        var acListOgn = response.data.aclist;

                        for (var acAddress in acListOgn)
                        {
                            var ac = acListOgn[acAddress];

                            for (var j = 0; j < ac.positions.length; j++)
                            {
                                ac.positions[j].timestamp = getMs(ac.positions[j].time);
                                ac.positions[j].receiver = "Open Glider Network (" + ac.positions[j].receiver + ")";
                                ac.positions[j].method = positionMethod.flarm;
                            }

                            addOrUpdateAc(
                                dataSources.ogn,
                                ac.id,
                                ac.addresstype,
                                ac.actype,
                                ac.registration,
                                null, // callsign
                                null, // operator callsign
                                ac.aircraftModelType,
                                ac.positions);
                        }

                        compactAcList(maxagesec);

                        if (successCallback)
                            successCallback(acList);
                    }
                },
                function (response) // error
                {
                    console.error("ERROR reading ac traffic from ognlistener", response.status, response.data);
                    
                    if (errorCallback)
                        errorCallback(acList);
                }
            );


        function getMs(timeString)
        {
            var timeParts = timeString.split(":", 3);
            var today = new Date();
            return Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), timeParts[0], timeParts[1], timeParts[2]);
        }
    }


	function readTrafficAdsbExchange(extent, maxagesec, maxHeight, successCallback, errorCallback)
    {
        var url = adsbExchangeBaseUrl + '?fAltL=0&fAltU=' + maxHeight; //+ '&trFmt=sa';
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
                                dataSources.adsbexchange,
                                acListAx[i].Icao,
                                "ICAO",
                                parseAdsbExchangeAcType(acListAx[i]),
                                acListAx[i].Reg,
                                getCallsign(acListAx[i]),
                                getOperatorCallsign(acListAx[i]),
                                acListAx[i].Mdl,
                                parseAdsbExchangePositions(acListAx[i]));

                        compactAcList(maxagesec);

                        if (successCallback)
                            successCallback(acList);
                    }
                },
                function (response) // error
                {
                    console.error("ERROR reading ac traffic from ADSBExchange", response.status, response.data);
                    
                    if (errorCallback)
                        errorCallback(acList);
                }
            );


        function getCallsign(ac)
        {
            if (!ac.Call)
                return undefined;

            if (!ac.Reg) // no registration -> use call sign
                return ac.Call;

            if (ac.Call.match(/^\d.*/)) // only numbers -> skip
                return undefined;

            if (ac.Call.match(/^.{1,3}$/)) // only 3 letters -> skip
                return undefined;

            return ac.Call;
        }


        function getOperatorCallsign(ac)
        {
            var opCallsign, icaoCode;

            if (!ac.Call)
                return undefined;

            if (ac.Mil && !ac.OpIcao) // if military but no opcode -> assume tactical call sign
                return undefined;

            if (ac.Call.toUpperCase().match(/^[A-Z]{3}\d[A-Z0-9]{0,3}/)) // check for default format (3 letters + 1 digit + 1-3x digit/letter)
            {
                icaoCode = ac.Call.substring(0, 3);
                opCallsign = telephony[icaoCode];

                if (opCallsign)
                    return opCallsign + " " + ac.Call.substring(3);
                else
                    return undefined;
            }
            else if (ac.OpIcao && ac.Call.match(/^\d{1,4}$/)) // digits only but opcode present-> assume opcode as operator
            {
                icaoCode = ac.OpIcao;
                opCallsign = telephony[icaoCode];

                if (opCallsign)
                    return opCallsign + " " + ac.Call;
                else
                    return undefined;
            }
            else
                return undefined;
        }


        function parseAdsbExchangePositions(ac)
        {
            var pos = {};
            var positions = [];

            pos.latitude = ac.Lat;
            pos.longitude = ac.Long;
            pos.method = ac.Mlat ? positionMethod.mlat : positionMethod.adsb;
            pos.altitude = ac.Gnd ? undefined : ft2m(ac.GAlt);
            pos.timestamp = ac.PosTime;
            pos.receiver = ac.Mlat ? "ADSBExchange (MLAT)" : "ADSBExchange (ADS-B)";

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


    function addOrUpdateAc(source, acaddress, addresstype, actype, registration, callsign, opCallsign, aircraftModelType, positions)
    {
        var ac = {};

        if (!acList.hasOwnProperty(acaddress)) // add new ac to list
        {
            ac.acaddress = acaddress;
            ac.addresstype = addresstype;
            ac.actype = actype;
            ac.registration = registration;
            ac.callsign = callsign;
            ac.opCallsign = opCallsign;
            ac.aircraftModelType = aircraftModelType;
            ac.positions = [];
            acList[acaddress] = ac;
        }
        else
        {
            ac = acList[acaddress];

            if (source == dataSources.adsbexchange) // overwrite ac info if data source is adsbexchange
            {
                ac.actype = actype;
                ac.registration = registration;
                ac.callsign = callsign;
                ac.opCallsign = opCallsign;
                ac.aircraftModelType = aircraftModelType;
            }
        }

        // add new positions
        for (var i = 0; i < positions.length; i++)
            ac.positions.push(positions[i]);
    }


    function compactAcList(maxagesec)
    {
        var d = new Date();
        var oldestTimestamp = d.getTime() - maxagesec * 1000;

        for (var acAddress in acList)
        {
            var ac = acList[acAddress];

            // sort positions by time DESC
            ac.positions.sort(function (a, b) {
                return a.timestamp - b.timestamp;
            });


            // remove expired or identical entries
            var newPositions = [];

            for (var i = 0; i < ac.positions.length; i++)
            {
                // mark expired entries
                if (ac.positions[i].timestamp < oldestTimestamp)
                    continue;

                // mark identical positions (lat/lon and/or time)
                if (i > 0)
                {
                    if (ac.positions[i].latitude == ac.positions[i - 1].latitude && ac.positions[i].longitude == ac.positions[i - 1].longitude)
                        continue;

                    if (ac.positions[i].timestamp == ac.positions[i - 1].timestamp)
                        continue;

                    // skip mlat-positions within 30 sec after more accurate position
                    if (ac.positions[i].method == positionMethod.mlat && ac.positions[i - 1].method != positionMethod.mlat && ac.positions[i].timestamp < ac.positions[i - 1].timestamp + 30000)
                        continue;
                }

                newPositions.push(ac.positions[i]);
            }


            // remove aircrafts without positions
            if (newPositions.length == 0)
                delete acList[acAddress];


            ac.positions = newPositions;
        }
    }
}