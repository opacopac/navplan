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
    var adsbExchangeBaseUrl = 'https://www.navplan.ch/v2/php/Navplan/Traffic/TrafficService.php?action=readadsbextrafficwithdetails'; // &minlon=6.921691064453124&minlat=46.61094866382615&maxlon=7.922820214843749&maxlat=47.20901611815029
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
        var url = adsbExchangeBaseUrl + '&minlon=' + extent[0] + '&minlat=' + extent[1] + '&maxlon=' + extent[2] + '&maxlat=' + extent[3];

        $http.get(url)
            .then(
                function (response) // success
                {
                    if (response && response.data && response.data.aclist)
                    {
                        var acListAx = response.data.aclist;
                        var receivedTimestampMs = Date.now();

                        for (var i = 0; i < acListAx.length; i++)
                            addOrUpdateAc(
                                dataSources.adsbexchange,
                                acListAx[i].addr[0],
                                acListAx[i].addr[1],
                                parseAdsbExchangeAcType(acListAx[i]),
                                acListAx[i].reg,
                                getCallsign(acListAx[i]),
                                getOperatorCallsign(acListAx[i]),
                                acListAx[i].icaotype,
                                parseAdsbExchangePositions(acListAx[i].poslist[0])
                            );

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
            if (!ac.call)
                return undefined;

            if (!ac.reg) // no registration -> use call sign
                return ac.call;

            if (ac.call.match(/^\d.*/)) // only numbers -> skip
                return undefined;

            if (ac.call.match(/^.{1,3}$/)) // only 3 letters -> skip
                return undefined;

            return ac.call;
        }


        function getOperatorCallsign(ac)
        {
            var opCallsign, icaoCode;

            if (!ac.call)
                return undefined;

            if (ac.mil && !ac.opicao) // if military but no opcode -> assume tactical call sign
                return undefined;

            if (ac.call.toUpperCase().match(/^[A-Z]{3}\d[A-Z0-9]{0,3}/)) // check for default format (3 letters + 1 digit + 1-3x digit/letter)
            {
                icaoCode = ac.call.substring(0, 3);
                opCallsign = telephony[icaoCode];

                if (opCallsign)
                    return opCallsign + " " + ac.call.substring(3);
                else
                    return undefined;
            }
            else if (ac.opicao && ac.call.match(/^\d{1,4}$/)) // digits only but opcode present-> assume opcode as operator
            {
                icaoCode = ac.opicao;
                opCallsign = telephony[icaoCode];

                if (opCallsign)
                    return opCallsign + " " + ac.call;
                else
                    return undefined;
            }
            else
                return undefined;
        }


        function parseAdsbExchangePositions(acPos) {
            var pos = new AircraftPosition();
            pos.longitude = acPos.position.pos[0];
            pos.latitude = acPos.position.pos[1];
            pos.method = acPos.method;
            pos.altitude = acPos.position.alt[0] ? ft2m(acPos.position.alt[0]) : undefined;
            pos.timestamp = acPos.position.time;
            pos.receivedTimestamp = acPos.timestamp;
            pos.receiver = acPos.receiver;

            return [pos];
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

            switch (ac.icaotype)
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

            switch (ac.acclass)
            {
                case 'L': // LANDPLANE
                case 'S': // SEAPLANE
                case 'A': // AMPHIBIAN
                case 'T': // TILTROTOR
                    if (ac.engclass === 'J') // JET
                        return "JET_AIRCRAFT";
                    else
                        return "POWERED_AIRCRAFT";
                case 'H': // HELICOPTER
                case 'G': // GYROCOPTER
                    return "HELICOPTER_ROTORCRAFT";
                    break;
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
