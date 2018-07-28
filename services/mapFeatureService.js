/**
 * Map Features Service
 */

navplanApp
    .factory('mapFeatureService', mapFeatureService );

mapFeatureService.$inject = ['$http'];

function mapFeatureService($http) {
    var OVERSIZE_FACTOR = 1.2;
    var featureCache = new FeatureCache(undefined, undefined);
    var airportCache = new AirportCache();
    var mapFeaturesBaseUrl = 'php/mapFeatures.php?v=' + navplanVersion;
    var userWpBaseUrl = 'php/userWaypoint.php?v=' + navplanVersion;

    // return api reference
    return {
        OVERSIZE_FACTOR: OVERSIZE_FACTOR,
        getMapFeatures: getMapFeatures,
        getAirportByIcao: getAirportByIcao,
        getAirspacesAtLatLon: getAirspacesAtLatLon,
        addFeatureByTypeAndId: addFeatureByTypeAndId,
        addFeatureByTypeAndPos: addFeatureByTypeAndPos,
        loadAllUserPoints: loadAllUserPoints
    };


    // region CLASSES

    function FeatureCache(extent, features)
    {
        this.extent = extent;
        this.features = features;
    }


    function AirportCache()
    {
        this.apByIcao = {};
    }

    // endregion


    function getMapFeatures(extent, successCallback, errorCallback) {
        if (containsExtent(featureCache.extent, extent))
            successCallback(featureCache.features); // return from cache
        else
            loadMapFeatures(calcOversizeExtent(extent, OVERSIZE_FACTOR), successCallback, tryLoadAppCachedFeatures); // load from server


        function tryLoadAppCachedFeatures()
        {
            var mfCookie = getCookie("mapfeaturesextent");
            if (mfCookie)
            {
                var extent = json2obj(mfCookie);
                loadMapFeatures(extent, successCallback, errorCallback); // try to load from app cache
            }
        }
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

        featureCache = new FeatureCache(extent, featureList);
        airportCache = new AirportCache();

        for (var i = 0; i < featureList.airports.length; i++)
        {
            var ap = featureList.airports[i];

            if (ap.icao)
                airportCache.apByIcao[ap.icao] = ap;
        }
    }


    function getAirportByIcao(icao)
    {
        return airportCache.apByIcao[icao];
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


    function addFeatureByTypeAndId(type, id, parentObject)
    {
        switch (type) {
            case 'airport':
            {
                var ap = getAirportById(id);
                if (ap)
                    parentObject.airport = ap;
                break;
            }
            case 'navaid':
            {
                var nav = getNavaidById(id);
                if (nav)
                    parentObject.navaid = nav;
                break;
            }
            case 'report':
            {
                var rp = getReportingPointById(id);
                if (rp)
                    parentObject.reportingpoint = rp;
                break;
            }
            case 'user':
            {
                var uwp = getUserPointById(id);
                if (uwp)
                    parentObject.userWaypoint = uwp;
                break;
            }
        }
    }


    function addFeatureByTypeAndPos(type, latitude, longitude, parentObject)
    {
        var features = undefined;

        switch (type)
        {
            case "airport" :
                features = featureCache.features.airports;
                break;
            case "navaid" :
                features = featureCache.features.navaids;
                break;
            case "report" :
                features = featureCache.features.reportingPoints;
                break;
            case "user" :
                features = featureCache.features.userPoints;
                break;
        }

        if (features == undefined)
            return;

        for (var key in features)
        {
            var feature = features[key];
            if (feature.latitude == latitude && feature.longitude == longitude)
            {
                switch (type)
                {
                    case "airport" :
                        parentObject.airport = feature;
                        break;
                    case "navaid" :
                        parentObject.navaid = feature;
                        break;
                    case "report" :
                        parentObject.reportingpoint = feature;
                        break;
                    case "user" :
                        parentObject.userWaypoint = feature;
                        break;
                }

                break;
            }
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
