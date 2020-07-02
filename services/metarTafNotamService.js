/**
 * METAR, TAF, NOTAM Service
 */

navplanApp
	.factory('metarTafNotamService', metarTafNotamService );

trafficService.$inject = ['$http', '$sce'];

function metarTafNotamService($http, $sce)
{
    var EXTENT_OVERSIZE_FACTOR = 1.3;
    var WEATHER_MAXAGE = 5 * 60 * 1000; // 5 min
    var metarTafBaseUrl = 'https://www.aviationweather.gov/cgi-bin/json/MetarJSON.php?taf=true&density=all&bbox='; //6.0,44.0,10.0,48.0';
    var notamBaseUrl2 = 'php/notam.php?v=' + navplanVersion;
	var weatherInfoCache = new WeatherInfoCache(undefined, undefined, undefined);
	var areaNotamCache = new AreaNotamCache(undefined, []);
	var locationNotamCache = new LocationNotamCache();
	var isLoading = false;


	// return api reference
	return {
        getAreaWeatherInfos: getAreaWeatherInfos,
        getTafAgeString: getTafAgeString,
        getAgeString: getAgeString,
        getNotams: getNotams,
        getNotamTitle: getNotamTitle,
        getNotamValidityLt: getNotamValidityLt,
        getDefaultNotamTimeslot : getDefaultNotamTimeslot
	};


    // region CLASSES

    function WeatherInfoCache(extent, timestamp, weatherInfos)
    {
        this.extent = extent;
        this.timestamp = timestamp;
        this.weatherInfos = weatherInfos;
    }


    function WeatherInfo(weatherInfoJson)
    {
        this.properties = weatherInfoJson.properties;
        this.geometry = weatherInfoJson.geometry;
        this.type = weatherInfoJson.type;
    }


    function AreaNotamCache(extent, notamList)
    {
        this.extent = extent;
        this.notamList = notamList;
    }


    function LocationNotamCache()
    {
        this.notamByIcao = {};
    }


    function Notam(notamJson)
    {
        // icao fields
        this.id = notamJson.id;
        this.all = notamJson.all;
        this.startdate = notamJson.startdate;
        this.enddate = notamJson.enddate;
        this.Created = notamJson.Created;
        this.location = notamJson.location;
        this.isICAO = notamJson.isICAO;
        this.key = notamJson.key;
        this.type = notamJson.type;
        this.StateCode = notamJson.StateCode;
        this.StateName = notamJson.StateName;
        this.entity = notamJson.entity ? notamJson.entity : undefined;
        this.status = notamJson.status ? notamJson.status : undefined;
        this.Qcode = notamJson.Qcode ? notamJson.Qcode : undefined;
        this.Area = notamJson.Area ? notamJson.Area : undefined;
        this.SubArea = notamJson.SubArea ? notamJson.SubArea : undefined;
        this.Condition = notamJson.Condition ? notamJson.Condition : undefined;
        this.Subject = notamJson.Subject ? notamJson.Subject : undefined;
        this.Modifier = notamJson.Modifier ? notamJson.Modifier : undefined;
        this.message = notamJson.message ? notamJson.message : undefined;

        // own fields
        this.geometry = notamJson.geometry ? notamJson.geometry : undefined;
    }


    // endregion


    //region METAR / TAF

    function getAreaWeatherInfos(extent, successCallback, errorCallback)
    {
        if (containsExtent(weatherInfoCache.extent, extent) && !isWeatherCacheExpired())
            successCallback(weatherInfoCache.weatherInfos); // return from cache
        else
            loadAreaWeatherInfos(calcOversizeExtent(extent, EXTENT_OVERSIZE_FACTOR), successCallback, errorCallback); // load from server


        function isWeatherCacheExpired()
        {
            if (weatherInfoCache.timestamp && weatherInfoCache.timestamp + WEATHER_MAXAGE > Date.now())
                return false;

            return true;
        }
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


    function cacheWeatherInfos(extent, WeatherInfoListJson)
    {
        if (!WeatherInfoListJson || !extent)
            return;

        var weatherInfoList = [];

        for (var i = 0; i < WeatherInfoListJson.length; i++)
            weatherInfoList.push(new WeatherInfo(WeatherInfoListJson[i]));

        weatherInfoCache = new WeatherInfoCache(extent, Date.now(), weatherInfoList);
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

        return getHourMinAgeString(Date.parse(datestring));
    }


    //endregion


    //region NOTAM


    function getDefaultNotamTimeslot()
    {
        var now = new Date();
        //var minTime = Math.floor(now.getTime() / 1000);
        //var minTime = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()) / 1000;
        //var minTime = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0) / 1000;
        var minTime = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000); // beginning of today LT (notam timestamps from icao have day granularity...)
        var maxTime = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2).getTime() / 1000); // end of tomorrow LT

        return [minTime, maxTime];
    }


    function getNotams(extent, adList, successCallback, errorCallback)
    {
        // determine extent for loading (or none, if already chached)
        var loadExtent = undefined;
        if (!containsExtent(areaNotamCache.extent, extent))
            loadExtent = calcOversizeExtent(extent, EXTENT_OVERSIZE_FACTOR);

        // determine airports for loading
        var uncachedAdList = getUncachedAdNotamList(adList);

        // everything already cached => just return areanotamlist
        if (!loadExtent && uncachedAdList.length == 0)
        {
            addAirportNotams();

            if (successCallback)
                successCallback(areaNotamCache.notamList);
        }
        else
        {
            var minMaxTime = getDefaultNotamTimeslot();

            loadNotams(loadExtent, uncachedAdList, minMaxTime[0], minMaxTime[1], onNotamsLoaded, onNotamLoadError);
        }


        function getUncachedAdNotamList(adList)
        {
            var uncachedAdList = [];

            for (var i = 0; i < adList.length; i++)
            {
                var ad = adList[i];

                if (!ad.icao || ad.icao == "")
                    continue;

                if (!locationNotamCache.notamByIcao[ad.icao])
                    uncachedAdList.push(ad.icao);
            }

            return uncachedAdList;
        }


        function onNotamsLoaded(responseData)
        {
            // add to area chache
            if (responseData.areanotamlist)
            {
                var areaNotamList = [];
                for (var k = 0; k < responseData.areanotamlist.length; k++)
                    areaNotamList.push(new Notam(responseData.areanotamlist[k]));

                areaNotamCache = new AreaNotamCache(loadExtent, areaNotamList);
            }


            // add to location cache
            if (responseData.locationnotamlist)
            {
                // add to lookup cache
                for (var j = 0; j < uncachedAdList.length; j++)
                    locationNotamCache.notamByIcao[uncachedAdList[j]] = [];

                for (var i = 0; i < responseData.locationnotamlist.length; i++)
                {
                    var notam = new Notam(responseData.locationnotamlist[i]);

                    if (!locationNotamCache.notamByIcao[notam.location])
                        locationNotamCache.notamByIcao[notam.location] = [];

                    locationNotamCache.notamByIcao[notam.location].push(notam);
                }
            }

            // add notams to airport objects
            addAirportNotams();

            if (successCallback)
                successCallback(areaNotamList);
        }


        function onNotamLoadError(responseData)
        {
            // on error try loading offline data from app cache
            var notamList = window.sessionStorage.getItem("notamCache");

            if (notamList && successCallback)
            {
                successCallback(json2obj(notamList));
                return;
            }


            if (errorCallback)
                errorCallback();
        }


        function addAirportNotams()
        {
            for (var k = 0; k < adList.length; k++)
            {
                var ad = adList[k];

                if (ad.icao)
                    ad.notams = locationNotamCache.notamByIcao[ad.icao];
            }
        }
    }


    function loadNotams(extent, adList, startTimestamp, endTimestamp, successCallback, errorCallback)
    {
        var url = notamBaseUrl2 + '&starttimestamp=' + startTimestamp + '&endtimestamp=' + endTimestamp;

        if (extent)
            url += '&minlon=' + extent[0] + '&minlat=' + extent[1] + '&maxlon=' + extent[2] + '&maxlat=' + extent[3];

        if (adList.length > 0)
            url += '&icaolist=' + adList.join(",");

        if (isLoading)
            return;

        isLoading = true;

        $http.get(url)
            .then(
                function (response) // success
                {
                    isLoading = false;

                    if (response && response.data)
                    {
                        if (successCallback)
                            successCallback(response.data);
                    }
                    else
                    {
                        logResponseError("ERROR reading notams ", response);

                        if (errorCallback)
                            errorCallback();
                    }
                },
                function (response) // error
                {
                    isLoading = false;

                    logResponseError("ERROR reading notams ", response);

                    if (errorCallback)
                        errorCallback();
                }
            );
    }


    function getNotamTitle(notam)
    {
        if (!notam || !notam["isICAO"])
            return "";

        if (notam.Qcode.indexOf("XX") == 0)
            return "";

        if (notam.Qcode.indexOf("XX") == 2)
            return notam.Subject;

        return notam.Subject + " " + notam.Modifier;
    }


    function getNotamValidityLt(notam)
    {
        if (notam.isICAO)
        {
            var timeRegFrom = /\sB\)\s+((\d\d)(\d\d)(\d\d)(\d\d)(\d\d))\s/im;
            var result1 = notam.all.match(timeRegFrom);

            var timeRegTill = /\sC\)\s+((\d\d)(\d\d)(\d\d)(\d\d)(\d\d)|PERM)\s/im;
            var result2 = notam.all.match(timeRegTill);

            if (result1 && result2)
            {
                var d1 = getUtcDate(result1);
                var fromText = getLtString(d1);

                var tillText;
                if (result2[1] != "PERM")
                {
                    var d2 = getUtcDate(result2);
                    tillText = getLtString(d2);
                }
                else
                    tillText = result2[1];

                return [fromText, tillText];
            }
        }

        var from = new Date(notam.startdate);
        var till = new Date(notam.enddate);

        return [from.toLocaleDateString(), till.toLocaleDateString()];


        function getUtcDate(result)
        {
            var d = new Date(Date.UTC(
                parseInt("20" + result[2]),
                parseInt(result[3]) - 1,
                parseInt(result[4]),
                parseInt(result[5]),
                parseInt(result[6])
            ));

            return d;
        }

        function getLtString(date)
        {
            var datePart = date.toLocaleDateString();
            var timePart = zeroPad(date.getHours()) + ":" + zeroPad(date.getMinutes());
            return datePart + " " + timePart + "LT";
        }
    }


    //endregion
}
