/**
 * Map Features Service
 */

navplanApp
    .factory('mapFeatureService', mapFeatureService );

mapFeatureService.$inject = ['$http'];

function mapFeatureService($http) {
    var OVERSIZE_FACTOR = 1.2;
    var featureCache = {extent: undefined, features: undefined};
    var airportsByIcao = {};
    var mapFeaturesBaseUrl = 'php/mapFeatures.php?v=' + navplanVersion;
    var userWpBaseUrl = 'php/userWaypoint.php?v=' + navplanVersion;

    // return api reference
    return {
        getMapFeatures: getMapFeatures,
        getAirportByIcao: getAirportByIcao,
        getAirportById: getAirportById,
        getNavaidById: getNavaidById,
        getReportingPointById: getReportingPointById,
        getUserPointById: getUserPointById,
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
                    if (response && response.data && response.data.airports && response.data.navaids && response.data.reportingPoints && response.data.userPoints && response.data.airspaces && response.data.webcams)
                    {
                        cacheFeatures(extent, response.data);

                        if (successCallback)
                            successCallback(response.data);
                    }
                    else {
                        logResponseError("ERROR reading map features", response);

                        if (errorCallback)
                            errorCallback();
                    }
                },
                function (response) // error
                {
                    // try loading from app cache
                    var mapFeatureList = window.sessionStorage.getItem("mapFeatureCache");

                    if (mapFeatureList && successCallback)
                    {
                        successCallback(json2obj(mapFeatureList));
                        return;
                    }

                    logResponseError("ERROR reading map features", response);

                    if (errorCallback)
                        errorCallback();
                }
            )
    }


    function loadAllUserPoints(successCallback)
    {
        $http.get(userWpBaseUrl)
            .then(
                function (response) // success
                {
                    if (response && response.data && response.data.userWaypoints)
                        successCallback(response.data.userWaypoints);
                    else
                        logResponseError("ERROR reading user waypoints", response);
                },
                function (response) // error
                {
                    logResponseError("ERROR reading user waypoints", response);
                }
            );
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
    }


    function getAirportByIcao(icao)
    {
        return airportsByIcao[icao];
    }


    function getAirportById(id)
    {
        if (!featureCache.features || !featureCache.features.airports)
            return;

        for (var i = 0; i < featureCache.features.airports.length; i++)
        {
            if (featureCache.features.airports[i].id == id)
                return featureCache.features.airports[i];
        }
    }


    function getNavaidById(id)
    {
        if (!featureCache.features || !featureCache.features.navaids)
            return;

        for (var i = 0; i < featureCache.features.navaids.length; i++)
        {
            if (featureCache.features.navaids[i].id == id)
                return featureCache.features.navaids[i];
        }
    }


    function getReportingPointById(id)
    {
        if (!featureCache.features || !featureCache.features.reportingPoints)
            return;

        for (var i = 0; i < featureCache.features.reportingPoints.length; i++)
        {
            if (featureCache.features.reportingPoints[i].id == id)
                return featureCache.features.reportingPoints[i];
        }
    }


    function getUserPointById(id)
    {
        if (!featureCache.features || !featureCache.features.userPoints)
            return;

        for (var i = 0; i < featureCache.features.userPoints.length; i++)
        {
            if (featureCache.features.userPoints[i].id == id)
                return featureCache.features.userPoints[i];
        }
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

            /*if (lonLat[0] < airspace.lonLatExtent[0][0] || lonLat[0] > airspace.lonLatExtent[0][1] || lonLat[1] < airspace.lonLatExtent[1][0] || lonLat[1] > airspace.lonLatExtent[1][1])
                continue;*/

            var poly = turf.polygon([airspace.polygon]);

            if (turf.inside(pt, poly))
                asList.push(airspace);
        }

        return asList;
    }
}
