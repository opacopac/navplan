/**
 * METAR, TAF, NOTAM Service
 */

navplanApp
	.factory('metarTafNotamService', metarTafNotamService );

trafficService.$inject = ['$http', '$sce'];

function metarTafNotamService($http, $sce)
{
    var OVERSIZE_FACTOR = 1.3;
    var MAXAGE = 5 * 60 * 1000; // 5 min
    var metarTafBaseUrl = 'https://www.aviationweather.gov/gis/scripts/MetarJSON.php?taf=true&density=all&bbox='; //6.0,44.0,10.0,48.0';
    var notamBaseUrl = 'https://v4p4sz5ijk.execute-api.us-east-1.amazonaws.com/anbdata/states/notams/notams-list?api_key=2a9daa70-2604-11e7-a2b8-e55a51cc8ef0&format=json&locations=';
	var weatherInfoCache = { extent: undefined, timestamp: undefined, weatherInfos: undefined };


	// return api reference
	return {
        getAreaWeatherInfos: getAreaWeatherInfos,
        getTafAgeString: getTafAgeString,
        getAgeString: getAgeString
	};


    function getAreaWeatherInfos(extent, successCallback, errorCallback)
    {
        if (containsExtent(weatherInfoCache.extent, extent) && !isCacheExpired())
            successCallback(weatherInfoCache.weatherInfos); // return from cache
        else
            loadAreaWeatherInfos(calcOversizeExtent(extent, OVERSIZE_FACTOR), successCallback, errorCallback); // load from server

    }


    function loadAreaWeatherInfos(extent, successCallback, errorCallback)
    {
        var url = metarTafBaseUrl + extent[0] + "," + extent[1] + "," + extent[2] + "," + extent[3];

        $sce.trustAsResourceUrl(url);

        $http.jsonp(url, {jsonpCallbackParam: 'jsonp'})
            .then(
                function (response) // success
                {
                    if (response && response.data && response.data.features)
                    {
                        cacheWeatherInfos(extent, response.data.features);

                        if (successCallback)
                            successCallback(response.data.features);
                    }
                    else
                    {
                        logResponseError("ERROR reading weather info ", response);

                        if (errorCallback)
                            errorCallback();
                    }
                },
                function (response) // error
                {
                    logResponseError("ERROR reading weather info ", response);

                    if (errorCallback)
                        errorCallback();
                }
            );
    }


    function loadNotams(airportIcaos, successCallback, errorCallback)
    {
        if (!airportIcaos || !airportIcaos.length || !airportIcaos.length == 0)
            return;

        var url = notamBaseUrl + airportIcaos.join(",");
    }


    function cacheWeatherInfos(extent, weatherInfoList)
    {
        if (!weatherInfoList || !extent)
            return;

        weatherInfoCache = {extent: extent, timestamp: Date.now(), weatherInfos: weatherInfoList};
    }


	function isCacheExpired()
    {
        if (weatherInfoCache.timestamp && weatherInfoCache.timestamp + MAXAGE > Date.now())
            return false;

        return true;
    }


	function getTafAgeString(weatherInfo)
    {
        if (!weatherInfo || !weatherInfo.properties || !weatherInfo.properties.rawTaf)
            return;

        var matches = weatherInfo.properties.rawTaf.match(/^TAF( [A-Z]{3})? [A-Z]{4} (\d\d)(\d\d)(\d\d)Z.*$/);

        if (!matches || matches.length != 5)
            return;

        var d = new Date();
        var datestring = d.getFullYear() + "-" + zeroPad(d.getMonth() + 1) + "-" + matches[2] + "T" + matches[3] + ":" + matches[4] + ":00Z";

        return getAgeString(datestring);
    }


    function getAgeString(datestring)
    {
        if (!datestring)
            return;

        var ms = Date.now() - Date.parse(datestring);
        var h = Math.floor(ms / 1000 / 3600);
        var m = Math.floor(ms / 1000 / 60 - h * 60);

        if (h > 0)
            return h + "h " + m + "min";
        else
            return m + "min";
    }


    function getNotamString()
    {

    }
}
