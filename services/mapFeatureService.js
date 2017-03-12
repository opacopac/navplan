/**
 * Map Features Service
 */

navplanApp
    .factory('mapFeatureService', mapFeatureService );

mapFeatureService.$inject = ['$http'];

function mapFeatureService($http) {
    const OVERSIZE_FACTOR = 1.2;
    var featureCache = {extent: undefined, features: undefined};
    var airportsByIcao = {};
    var airports = [];
    var navaids = [];
    var reportingPoints = [];
    var userPoints = [];

    var mapFeaturesBaseUrl = 'php/mapFeatures.php?v=' + navplanVersion;
    var userWpBaseUrl = 'php/userWaypoint.php?v=' + navplanVersion;

    // return api reference
    return {
        getMapFeatures: getMapFeatures,
        getAirportByIcao: getAirportByIcao,
        getNavaid: getNavaid,
        getReportingPoint: getReportingPoint,
        getUserPoint: getUserPoint,
        getAirspacesAtLatLon: getAirspacesAtLatLon,
        loadAllUserPoints: loadAllUserPoints
    };


    function getMapFeatures(extent, successCallback, errorCallback) {
        if (containsExtent(featureCache.extent, extent))
            successCallback(featureCache.features); // return from cache
        else
            loadMapFeatures(calcOversizeExtent(extent, OVERSIZE_FACTOR), successCallback, errorCallback); // load from server
    }


    function loadMapFeatures(extent, successCallback, errorCallback) {
        var url = mapFeaturesBaseUrl + '&minlon=' + extent[0] + '&minlat=' + extent[1] + '&maxlon=' + extent[2] + '&maxlat=' + extent[3];

        $http.get(url)
            .then(
                function (response) // success
                {
                    if (response && response.data && response.data.airports && response.data.navaids && response.data.reportingPoints && response.data.userPoints && response.data.airspaces && response.data.webcams) {
                        featureCache = {extent: extent, features: response.data};

                        cacheFeatures(extent, response.data);

                        if (successCallback)
                            successCallback(response.data);
                    }
                    else {
                        console.error("ERROR reading map features", response);

                        if (errorCallback)
                            errorCallback();
                    }
                },
                function (response) // error
                {
                    console.error("ERROR reading map features", response.status, response.data);

                    if (errorCallback)
                        errorCallback();
                }
            )
    }


    function loadAllUserPoints(successCallback)
    {
        $http.get(userWpBaseUrl)
            .success(function (data) {
                if (data.userWaypoints)
                    successCallback(data.userWaypoints);
                else
                    console.error("ERROR reading user waypoints", data);
            })
            .error(function (data, status) {
                console.error("ERROR reading user waypoints", status, data);
            });
    }


    function cacheFeatures(extent, featureList)
    {
        if (!featureList || !extent)
            return;

        featureCache = {extent: extent, features: featureList};

        airportsByIcao = {};

        for (var i = 0; i < featureList.airports.length; i++)
        {
            var ap = featureList.airports[i];

            if (ap.icao)
                airportsByIcao[ap.icao] = ap;
        }

        airports = []; // TODO
        navaids = [];
        reportingPoints = [];
        userPoints = [];


    }


    function getAirportByIcao(icao)
    {
        return airportsByIcao[icao];
    }


    function getNavaid(id)
    {
        return featureCache.features.navaids[id]; // TODO: wrong
    }


    function getReportingPoint(id)
    {
        return featureCache.features.reportingPoints[id];
    }


    function getUserPoint(id)
    {
        return featureCache.features.userPoints[id];
    }


    function getAirspacesAtLatLon(lonLat)
    {
        if (!lonLat || !featureCache.features)
            return [];

        var asList = [];
        var pt = turf.point(lonLat);

        for (var key in featureCache.features.airspaces)
        {
            var airspace = featureCache.features.airspaces[key];

            if (lonLat[0] < airspace.lonLatExtent[0][0] || lonLat[0] > airspace.lonLatExtent[0][1] || lonLat[1] < airspace.lonLatExtent[1][0] || lonLat[1] > airspace.lonLatExtent[1][1])
                continue;

            var poly = turf.polygon([airspace.polygon]);

            if (turf.inside(pt, poly))
                asList.push(airspace);
        }

        return asList;
    }
}
