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
	var trafficBaseUrl = 'php/ogntraffic.php?v=' + navplanVersion;
	var adsbExchangeBaseUrl = 'https://public-api.adsbexchange.com/VirtualRadar/AircraftList.json'; //?fAltL=0&fAltU=15000&fSBnd=45.7656&fEBnd=10.7281&fNBnd=47.8556&fWBnd=5.4382';
    var acCache = new AircraftCache();
    var lastExtent = undefined;


	// return api reference
	return {
        requestTraffic: requestTraffic
	};
	
	
	// region CLASSES
    
    function AircraftCache()
    {
        this.acList = {};
    }


    function Aircraft()
    {
        this.acaddress = undefined;
        this.addresstype = undefined;
        this.actype = undefined;
        this.registration = undefined;
        this.callsign = undefined;
        this.opCallsign = undefined;
        this.aircraftModelType = undefined;
        this.positions = [];
    }


    function AircraftPosition()
    {
        this.latitude = undefined;
        this.longitude = undefined;
        this.altitude = undefined;
        this.timestamp = undefined;
        this.method = undefined;
        this.receiver = undefined;
        this.receivedTimestamp = undefined;
    }

    // endregion


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
                        var receivedTimestampMs = response.data.timestamp * 1000;

                        for (var acAddress in acListOgn)
                        {
                            var ac = acListOgn[acAddress];

                            addOrUpdateAc(
                                dataSources.ogn,
                                ac.id,
                                ac.addresstype,
                                ac.actype,
                                ac.registration,
                                null, // callsign
                                null, // operator callsign
                                ac.aircraftModelType,
                                parseOgnPositions(ac, receivedTimestampMs));
                        }

                        compactAcList(maxagesec, receivedTimestampMs);

                        if (successCallback)
                            successCallback(acCache.acList, receivedTimestampMs);
                    }
                },
                function (response) // error
                {
                    logResponseError("ERROR reading ac traffic from ognlistener", response);
                    
                    if (errorCallback)
                        errorCallback(acCache.acList, Date.now()); // TODO
                }
            );


        function parseOgnPositions(ac, receivedTimestamp)
        {
            var positionList = [];

            for (var i = 0; i < ac.positions.length; i++)
            {
                var position = new AircraftPosition();
                position.latitude = ac.positions[i].latitude;
                position.longitude = ac.positions[i].longitude;
                position.altitude = ac.positions[i].altitude;
                position.timestamp = Math.min(getMs(ac.positions[i].time), receivedTimestamp);
                position.receivedTimestamp = receivedTimestamp;
                position.receiver = "Open Glider Network (" + ac.positions[i].receiver + ")";
                position.method = positionMethod.flarm;
                positionList.push(position);
            }

            return positionList;
        }


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
        //url += "&callback=JSON_CALLBACK";

        $http.jsonp(url, {jsonpCallbackParam: 'callback'})
            .then(
                function (response) // success
                {
                    if (response && response.data && response.data.acList)
                    {
                        var acListAx = response.data.acList;
                        var receivedTimestampMs = response.data.stm;

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
                                parseAdsbExchangePositions(acListAx[i], receivedTimestampMs));

                        compactAcList(maxagesec, receivedTimestampMs);

                        if (successCallback)
                            successCallback(acCache.acList, receivedTimestampMs);
                    }
                },
                function (response) // error
                {
                    logResponseError("ERROR reading ac traffic from ADSBExchange", response);
                    
                    if (errorCallback)
                        errorCallback(acCache.acList, Date.now()); // TODO
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


        function parseAdsbExchangePositions(ac, receivedTimestamp)
        {
            var pos = new AircraftPosition();
            var positionList = []; // will contain only one entry

            pos.latitude = ac.Lat;
            pos.longitude = ac.Long;
            pos.method = ac.Mlat ? positionMethod.mlat : positionMethod.adsb;
            pos.altitude = ac.Gnd ? undefined : ft2m(ac.GAlt);
            pos.timestamp = Math.min(ac.PosTime, receivedTimestamp);
            pos.receivedTimestamp = receivedTimestamp;
            pos.receiver = ac.Mlat ? "ADSBExchange (MLAT)" : "ADSBExchange (ADS-B)";

            positionList.push(pos);

            return positionList;
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


    function addOrUpdateAc(source, acaddress, addresstype, actype, registration, callsign, opCallsign, aircraftModelType, positionList)
    {
        var ac = new Aircraft();

        if (!acCache.acList.hasOwnProperty(acaddress)) // add new ac to list
        {
            ac.acaddress = acaddress;
            ac.addresstype = addresstype;
            ac.actype = actype;
            ac.registration = registration;
            ac.callsign = callsign;
            ac.opCallsign = opCallsign;
            ac.aircraftModelType = aircraftModelType;
            ac.positions = [];
            acCache.acList[acaddress] = ac;
        }
        else
        {
            ac = acCache.acList[acaddress];

            if (source == dataSources.adsbexchange) // overwrite ac info if data source is adsbexchange
            {
                ac.actype = (actype != "UNKNOWN" && ac.actype != "DROP_PLANE") ? actype : ac.actype; // don't overwrite drop plane type
                ac.registration = (registration && registration != "") ? registration : ac.registration;
                ac.callsign = (callsign && callsign != "") ? callsign : ac.callsign;
                ac.opCallsign = (opCallsign && opCallsign != "") ? opCallsign : ac.opCallsign;
                ac.aircraftModelType = (aircraftModelType && aircraftModelType != "") ? aircraftModelType : ac.aircraftModelType;
            }
            else if (source == dataSources.ogn) // overwrite ac info by ogn data only if previously empty
            {
                ac.actype = (ac.actype == "UNKNOWN" || actype == "DROP_PLANE") ? actype : ac.actype; // overwrite drop plane type
                ac.registration = (!ac.registration || ac.registration == "") ? registration : ac.registration;
                ac.callsign = (!ac.callsign || ac.callsign == "") ? callsign : ac.callsign;
                ac.opCallsign = (!ac.opCallsign || ac.opCallsign == "") ? opCallsign : ac.opCallsign;
                ac.aircraftModelType = (!ac.aircraftModelType || ac.aircraftModelType == "") ? aircraftModelType : ac.aircraftModelType;
            }
        }

        // add new positions
        for (var i = 0; i < positionList.length; i++)
            ac.positions.push(positionList[i]);
    }


    function compactAcList(maxagesec, currentTimestamp)
    {
        var lastWp;

        for (var acAddress in acCache.acList)
        {
            var ac = acCache.acList[acAddress];

            // sort positions by time DESC
            ac.positions.sort(function (a, b) {
                return a.timestamp - b.timestamp;
            });


            // remove expired or identical entries
            var newPositions = [];
            var lastWp = undefined;

            for (var i = 0; i < ac.positions.length; i++)
            {
                // mark expired entries
                if (ac.positions[i].timestamp < currentTimestamp - maxagesec * 1000)
                    continue;

                // check for points to skip
                if (lastWp)
                {
                    // skip identical positions
                    if (ac.positions[i].latitude == lastWp.latitude && ac.positions[i].longitude == lastWp.longitude)
                        continue;

                    // skip identical timestamps
                    if (ac.positions[i].timestamp == lastWp.timestamp)
                        continue;

                    // skip adsb-exchange positions within 30 sec after more reliable ogn position
                    if (lastWp.method == positionMethod.flarm && ac.positions[i].method != positionMethod.flarm && ac.positions[i].timestamp < lastWp.timestamp + 30000)
                        continue;
                }

                lastWp =ac.positions[i];
                newPositions.push(lastWp);
            }


            // remove aircrafts without positions
            if (newPositions.length == 0)
                delete acCache.acList[acAddress];


            ac.positions = newPositions;
        }
    }
}