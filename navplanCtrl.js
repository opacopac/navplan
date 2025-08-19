/**
 * Main Controller
 */

navplanApp
	.controller('navplanCtrl', navplanCtrl);

navplanCtrl.$inject = ['$scope', '$http', '$timeout', 'globalData', 'userService', 'mapService', 'waypointService', 'fuelService', 'terrainService'];

function navplanCtrl($scope, $http, $timeout, globalData, userService, mapService, waypointService, fuelService)
{
	// init global data object
	$scope.globalData = globalData;


	// globally used functions
	
	$scope.initGlobalData = function()
	{
		var storedGlobalData = window.sessionStorage.getItem("globalData");
		
		if (storedGlobalData) // load session data
		{
			var data = json2obj(storedGlobalData);

			$scope.globalData.initialPositionHasBeenSet = true;
			$scope.globalData.sessionId = $scope.createSessionId();
			$scope.globalData.user = data.user;
			$scope.globalData.pilot = data.pilot;
			$scope.globalData.aircraft = data.aircraft;
			$scope.globalData.fuel = data.fuel;
			$scope.globalData.navplan =  data.navplan;
			$scope.globalData.track =  data.track;
			$scope.globalData.settings = data.settings;
			$scope.globalData.currentMapPos = data.currentMapPos;
			$scope.globalData.selectedWp = data.selectedWp;
			$scope.globalData.wpBackup = data.wpBackup;
			$scope.globalData.trafficTimer = undefined;
			$scope.globalData.showLocation = false; // data.showLocation;
			$scope.globalData.showTraffic = false; // data.showTraffic;
            $scope.globalData.showMeteo = false;
            $scope.globalData.showTerrain = false;
			$scope.globalData.cacheIsActive = data.cacheIsActive;
			$scope.globalData.locationStatus = "off"; // data.locationStatus;
			$scope.globalData.trafficStatus = "off"; // data.trafficStatus;
			$scope.globalData.cacheStatus = data.cacheStatus;
			$scope.globalData.cacheProgress = data.cacheProgress;
			$scope.globalData.clickHistory = []; // internally used only
            $scope.globalData.downloadLink = {}; // internally used only
            $scope.globalData.fitViewLatLon = undefined; // internally used only
            $scope.globalData.lastActivity = undefined;
		}
		else // load default values
		{
			$scope.globalData.initialPositionHasBeenSet = false;
			$scope.globalData.sessionId = $scope.createSessionId();
			$scope.globalData.user =
			{
				email: undefined,
				token: undefined,
				navplanList: [],
				trackList: []
			};
			$scope.globalData.pilot =
			{
				name: ''
			};
			$scope.globalData.aircraft =
			{
				id: '',
				speed: 100,
				consumption: 20
			};
			$scope.globalData.fuel =
			{
				tripTime: 0,
				alternatTime: 0,
				reserveTime: 45,
				extraTime: 0
			};
			$scope.globalData.navplan = 
			{
				id: undefined,
				name: '',
                comments: '',
				waypoints: [ ],
				alternate: undefined,
				selectedWaypoint: undefined
			};
			$scope.globalData.track =
			{
				positions: [ ]
			};
			$scope.globalData.settings =
			{
				variation: 3,
				maxTrafficAltitudeFt: 15000
			};
			$scope.globalData.currentMapPos = 
			{
				center: ol.proj.fromLonLat([7.4971, 46.9141]), // LSZB
				zoom: 11
			};
			$scope.globalData.selectedWp = undefined;
			$scope.globalData.wpBackup = undefined;
			$scope.globalData.trafficTimer = undefined;
			$scope.globalData.clockTimer = undefined;
			$scope.globalData.showLocation = false;
			$scope.globalData.showTraffic = false;
            $scope.globalData.showMeteo = false;
			$scope.globalData.showTerrain = false;
			$scope.globalData.cacheIsActive = false;
			$scope.globalData.locationStatus = "off"; // "off", "waiting", "current", "error"
			$scope.globalData.trafficStatus = "off"; // "off", "waiting", "current", "error"
			$scope.globalData.cacheStatus = "off"; // "off", "updating", "updated", "error"
			$scope.globalData.cacheProgress =  { loaded: 0, total: 100, percent: 0 };
			$scope.globalData.clickHistory = []; // internally used only
            $scope.globalData.downloadLink = {}; // internally used only
            $scope.globalData.fitViewLatLon = undefined; // internally used only
            $scope.globalData.lastActivity = undefined;
		}

		$scope.updateLastActivity();
	};


	$scope.createSessionId = function ()
	{
        return Math.floor((Math.random() * 1000000000));
    };

	
	$scope.showSuccessMessage = function(text)
	{
		$scope.success_alert_message = text;
		
		$timeout(function () { $scope.success_alert_message = ""; }, 3000, true);
	};
	
	
	$scope.showErrorMessage = function(text)
	{
		$scope.error_alert_message = text;
		
		$timeout(function () { $scope.error_alert_message = ""; }, 3000, true);
	};


	$scope.showRuSureMessage = function(title, text, confirmCallback)
    {
        $scope.globalData.ruSureTitle = title;
        $scope.globalData.ruSureMessage = text;
        $scope.globalData.ruSureCallback = confirmCallback;

        $('#ruSureDialog').modal('show');
    };
	
	
	$scope.initUser = function()
	{
		/*var storedUser = window.localStorage.getItem("user");

		if (storedUser)
		{
			$scope.globalData.user = json2obj(storedUser);

			if ($scope.globalData.user.email && $scope.globalData.user.token)
				$scope.loginUser($scope.globalData.user.email, $scope.globalData.user.token, true)
		}*/

		// var user
		var email = getCookie("email");
		var token = getCookie("token");

		if (email && token)
			$scope.loginUser(email, token, true); // TODO: remember-flag korrigieren

		// cached waypoints
		var cachewaypoints = getCookie("cachewaypoints");
		
		if (cachewaypoints)
		{
			$scope.globalData.cacheIsActive = true;
			$scope.globalData.cacheStatus = "updated"; // TODO: check cache
		}
	};
	
	
	$scope.initDisclaimer = function()
	{
		var storedHideDisclaimer = window.localStorage.getItem("hideDisclaimer");

		if (storedHideDisclaimer != "true")
			$('#disclaimerDialog').modal('show');
	};


	$scope.readNavplanList = function()
	{
		userService.readNavplanList()
			.then(
			    function(response) // success
                {
                    if (response && response.data && (response.data.navplanList || response.data.navplanList === null))
                        $scope.globalData.user.navplanList = response.data.navplanList;
                    else
                        logResponseError("ERROR reading navplan list", response);
			    },
			    function(response) // error
                {
                    logResponseError("ERROR reading navplan list", response);
			    }
            );
	};


	$scope.readTrackList = function()
	{
		userService.readUserTrackList()
			.then(
				function (response) {
					if (!response.data || !response.data.tracks)
						logResponseError("ERROR reading tracks", response);
					else
						$scope.globalData.user.trackList = response.data.tracks;
				},
				function (response) {
                    logResponseError("ERROR reading tracks", response);
				}
			);
	};


	$scope.loginUser = function(email, token, remember)
	{
		$scope.globalData.user.email = email;
		$scope.globalData.user.token = token;
		$scope.readNavplanList();
		$scope.readTrackList();

		/*if (remember)
			window.localStorage.setItem("user", obj2json($scope.globalData.user));*/
		
		var rememberDays = 0;
		
		if (remember)
			rememberDays = 90;
		
		setCookie("email", email, rememberDays);
		setCookie("token", token, rememberDays);

		$scope.showSuccessMessage("Welcome " + email + "!");
	};
	
	
	$scope.logoutUser = function()
	{
		$scope.globalData.user.email = undefined;
		$scope.globalData.user.token = undefined;
		$scope.globalData.user.navplanList = [];
		$scope.globalData.user.trackList = [];

		//window.localStorage.removeItem("user");
		deleteCookie("email");
		deleteCookie("token");
		
		$scope.showSuccessMessage("User Logged out successfully!");
	};


	$scope.isLoggedIn = function()
	{
		return ($scope.globalData.user.email && $scope.globalData.user.token);
	};


    $scope.isBranch = function()
    {
        return isBranch2();
    };


    $scope.isSelf = function(email)
    {
        return isSelf2(email);
    };


	$scope.isLocalhost = function()
	{
		return isLocalhost();
	}


	$scope.hasLastTrack = function()
	{
		return (localStorage.getItem('lasttrack') !== null);
	};


    $scope.updateLastActivity = function()
    {
        $scope.globalData.lastActivity = Date.now();
        //console.log("MEEP");
    };


    $scope.onDisclaimerOKClicked = function()
	{
		if ($scope.hideDisclaimer)
			window.localStorage.setItem("hideDisclaimer", "true");
	};


    $scope.onRuSureYesClicked = function()
    {
        if ($scope.globalData.ruSureCallback)
            $scope.globalData.ruSureCallback();
    };

	
	$scope.updateWaypoints = function()
	{
		waypointService.recalcWaypoints($scope.globalData.navplan.waypoints, $scope.globalData.navplan.alternate, $scope.globalData.settings.variation, $scope.globalData.aircraft.speed);
		fuelService.updateFuelCalc($scope.globalData.fuel, $scope.globalData.navplan.waypoints, $scope.globalData.navplan.alternate, $scope.globalData.aircraft);

		$scope.$broadcast("redrawWaypoints");
	};


	$scope.editSelectedWaypoint = function ()
	{
		$scope.backupSelectedWaypoint();
		
		$('#selectedWaypointDialog').modal('show');
	};
	
	
	$scope.onOkEditWpClicked = function()
	{
		$scope.globalData.wpBackup = undefined;
	};
	
	
	$scope.onCancelEditWpClicked = function()
	{
		$scope.restoreSelectedWaypoint();
	};

	
	$scope.editUserWaypoint = function ()
	{
		$scope.backupSelectedWaypoint();
		
		$('#userWaypointDialog').modal('show');
	};
	
	
	$scope.onSaveUserWaypointClicked = function()
	{
		userService.saveUserWaypoint($scope.globalData.selectedWp)
			.then(
			    function(response) // success
                {
                    if (response.data.success == 1)
                    {
                        mapService.loadAndDrawUserPoints();
                        mapService.closeOverlay();

                        $scope.showSuccessMessage("User point successfully saved");
                    }
                    else
                        logResponseError("ERROR saving user point", response);
			    },
                function(response) // error
                {
                    logResponseError("ERROR saving user point", response);
			    }
            );
	};


	$scope.onDeleteUserWaypointClicked = function()
	{
		userService.deleteUserWaypoint($scope.globalData.selectedWp.id)
			.then(
			    function(response) // success
                {
                    if (response.data.success == 1)
                    {
                        mapService.loadAndDrawUserPoints();
                        mapService.closeOverlay();

                        $scope.showSuccessMessage("User Waypoint successfully deleted");
                    }
                    else
                        logResponseError("ERROR deleting user waypoint", response);
			    },
			    function(response) // error
                {
                    logResponseError("ERROR deleting user waypoint", response);
			    }
        );
	};

	
	$scope.onTrashClicked = function()
	{
        $scope.showRuSureMessage(
            "Clear Route & Track?",
            "Do you really want to clear all route waypoints, charts and track from the map? Unsaved changes will be lost!",
            function()
            {
                $scope.globalData.navplan =
                {
                    id: undefined,
                    name: '',
                    waypoints: [],
                    selectedWaypoint: undefined,
                    alternate: undefined
                };
                $scope.globalData.selectedWp = undefined;
                $scope.globalData.track = { positions: [] };
                $scope.globalData.clickHistory = [];
                $scope.globalData.showTerrain = false;

                $scope.updateWaypoints();
                $scope.discardCache();

                $scope.$broadcast("onTrashClicked");

                mapService.clearAllCharts(); // TODO
            }
        );
	};


	$scope.onShareClicked = function(shareType)
	{
		/*var sharerUrl;
		var tinyUrl = "https://www.navplan.ch/branch/";
		var np_title = ($scope.globalData.navplan.name && $scope.globalData.navplan.name.length > 0) ? " " + $scope.globalData.navplan.name : "";
		var text = "Check out my VFR Navigation Log" + np_title + ":";
		var hashtags = "navplan,vfr,flightplan";*/

		switch (shareType)
		{
			/*case "facebook":
				var sharerUrl = "http://www.facebook.com/sharer.php?u=" + encodeURI(tinyUrl);
                startDownload(sharerUrl, "_blank");
				break;
            case "twitter":
                var sharerUrl = "https://twitter.com/share?url=" + encodeURI(tinyUrl) + "&text=" + encodeURI(text) + "&hashtags=" + encodeURI(hashtags);
                startDownload(sharerUrl, "_blank");
                break;
            case "google":
                var sharerUrl = "https://plus.google.com/share?url=" + encodeURI(tinyUrl);
                startDownload(sharerUrl, "_blank");
                break;*/
			case "url":
				$scope.createShareUrl();
				break;
			}
	};


	$scope.exportKml = function()
	{
		const filename = $scope.getExportFilename($scope.globalData.navplan, "navplan_", ".kml", "navplan.kml");
        createTempFile($http, "php/navplanKml.php", "application/vnd.google-earth.kml+xml", filename, { navplan: $scope.globalData.navplan, track: $scope.globalData.track }, $scope.onTempFileCreated);
	};


    $scope.exportGpx = function()
    {
		const filename = $scope.getExportFilename($scope.globalData.navplan, "navplan_", ".gpx", "navplan.gpx");
        createTempFile($http, "php/navplanGpx.php", "application/gpx+xml", filename, { navplan: $scope.globalData.navplan, track: $scope.globalData.track }, $scope.onTempFileCreated);
    };


    $scope.exportFpl = function()
    {
		const filename = $scope.getExportFilename($scope.globalData.navplan, "navplan_", ".fpl", "navplan.fpl");
        createTempFile($http, "php/navplanFpl.php", "application/octet-stream", filename, { navplan: $scope.globalData.navplan }, $scope.onTempFileCreated);
    };


	$scope.exportGarminFpl = function()
	{
		const filename = $scope.getExportFilename($scope.globalData.navplan, "navplan_", ".fpl", "navplan.fpl");
		createTempFile($http, "php/navplanGarminFpl.php", "application/octet-stream", filename, { navplan: $scope.globalData.navplan }, $scope.onTempFileCreated);
	};


	// TODO: include in onShareClicked
    $scope.createPdfNavplan = function()
    {
		const filename = $scope.getExportFilename($scope.globalData.navplan, "navplan_", ".pdf", "navplan.pdf");
        createTempFile($http, "php/navplanPdf.php", "application/pdf", filename, $scope.getNavplanExportData(), $scope.onTempFileCreated);
    };


    // TODO: include in onShareClicked
    $scope.createExcelNavplan = function()
    {
		const filename = $scope.getExportFilename($scope.globalData.navplan, "navplan_", ".xlsx", "navplan.xlsx");
        createTempFile($http, "php/navplanExcel.php", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename, $scope.getNavplanExportData(), $scope.onTempFileCreated);
    };


    $scope.onTempFileCreated = function (tmpFile, mimeType, userFileName)
    {
        $scope.globalData.downloadLink = { href: tmpFile, text: userFileName, filename: userFileName, mimeType: mimeType };

        $('#downloadLinkDialog').modal('show');
    };


    $scope.getNavplanExportData = function ()
    {
        var waypoints = [];

        for (var i = 0; i < $scope.globalData.navplan.waypoints.length; i++)
            waypoints.push(getWaypointData($scope.globalData.navplan.waypoints[i]));


        return {
            waypoints: waypoints,
            alternate: $scope.globalData.navplan.alternate ? getWaypointData($scope.globalData.navplan.alternate) : undefined,
            fuel: $scope.globalData.fuel,
            pilot: $scope.globalData.pilot,
            aircraft: $scope.globalData.aircraft,
            comments: $scope.globalData.navplan.comments
        };


        function getWaypointData(wp)
        {
            return {
                freq: wp.freq,
                callsign: wp.callsign,
                checkpoint: wp.checkpoint,
                mtText: wp.mtText,
                distText: wp.distText,
                alt: wp.alt,
                isminalt: wp.isminalt,
                ismaxalt: wp.ismaxalt,
                isaltatlegstart: wp.isaltatlegstart,
                eetText: wp.eetText,
                remark: wp.remark,
                supp_info: wp.supp_info
            };
        }
    };


    $scope.createShareUrl = function()
	{
		userService.createSharedNavplan($scope.globalData)
			.then(
			    function(response) // success
                {
                    if (response.data.share_id) {
                        $scope.globalData.shareUrl =
                            window.location.protocol
                            + "//" + window.location.host
                            + window.location.pathname
                            + window.location.search
                            + "#/share/" + response.data.share_id;

                        $('#shareUrlDialog').modal('show');
                    }
                    else
                        logResponseError("ERROR creating shared navplan", response);
                },
			    function(response) // error
                {
                    logResponseError("ERROR creating shared navplan", response);
			    }
            );
	};


    $scope.openInApp = function()
    {
        // https://ww8.fltplan.com
        // garminpilot://flightplan?route=KPHL+41.2666/-73.566+KJFK&speed=112&altitude=07500&aircraft=HBCGI&fuelmeasuretype=volume&burnrate=6&fuel=
        var $wpList = waypointService.createAtcWpList($scope.globalData.navplan.waypoints);
        $scope.globalData.openInAppGarminPilotLink = "garminpilot://flightplan"
            + "?route=" + $wpList.join("+")
            + "&speed=" + $scope.globalData.aircraft.speed
            + "&altitude="
            + "&aircraft="
            + "&fuelmeasuretype=volume"
            + "&burnrate=" + Math.ceil($scope.globalData.aircraft.consumption * 0.264172) // convert lph to gph
            + "&fuel=";

        // https://foreflight.com/support/app-urls/
        // foreflightmobile://maps/search?q=KISM+OCF+NITTS+KSRQ+100kts+25lph+8000ft
        $scope.globalData.openInAppForeflightLink = "foreflightmobile://maps/search"
            + "?q=" + $wpList.join("+")
            + "+" + $scope.globalData.aircraft.speed + "kts"
            + "+" + $scope.globalData.aircraft.consumption + "lph";
            //+ "+8000ft";

        $('#openInAppDialog').modal('show');
    }


    $scope.copyWaypoints = function()
    {
        var wpList = waypointService.createAtcWpList($scope.globalData.navplan.waypoints);
        $scope.globalData.copyWaypointsText = wpList.join(" ");
        //$scope.globalData.copyWaypointsText = "LSZB LSGE 4716N/00733E WIL LSGL LSGN";

        $('#copyWaypointsDialog').modal('show');
    }


    $scope.copyWaypointsToClipboard = function() {
        var textarea = document.getElementById('waypointsTextarea');
        textarea.select();
        textarea.setSelectionRange(0, 99999); // For mobile devices

        document.execCommand('copy');
    };


	$scope.backupSelectedWaypoint = function()
	{
		$scope.globalData.wpBackup = {
			checkpoint: $scope.globalData.selectedWp.checkpoint,
			freq: $scope.globalData.selectedWp.freq,
			callsign: $scope.globalData.selectedWp.callsign,
			alt: $scope.globalData.selectedWp.alt,
			isminalt:  $scope.globalData.selectedWp.isminalt,
			ismaxalt:  $scope.globalData.selectedWp.ismaxalt,
            isaltatlegstart:  $scope.globalData.selectedWp.isaltatlegstart,
            remark: $scope.globalData.selectedWp.remark,
            supp_info: $scope.globalData.selectedWp.supp_info
		}
	};
	
	
	$scope.restoreSelectedWaypoint = function()
	{
		$scope.globalData.selectedWp.checkpoint = $scope.globalData.wpBackup.checkpoint;
		$scope.globalData.selectedWp.freq = $scope.globalData.wpBackup.freq;
		$scope.globalData.selectedWp.callsign = $scope.globalData.wpBackup.callsign;
		$scope.globalData.selectedWp.alt = $scope.globalData.wpBackup.alt;
		$scope.globalData.selectedWp.isminalt = $scope.globalData.wpBackup.isminalt;
		$scope.globalData.selectedWp.ismaxalt = $scope.globalData.wpBackup.ismaxalt;
        $scope.globalData.selectedWp.isaltatlegstart = $scope.globalData.wpBackup.isaltatlegstart;
        $scope.globalData.selectedWp.remark = $scope.globalData.wpBackup.remark;
        $scope.globalData.selectedWp.supp_info = $scope.globalData.wpBackup.supp_info;
	};


	$scope.discardCache = function()
	{
		$scope.globalData.cacheIsActive = false;

		deleteCookie("cachewaypoints");
		deleteCookie("cachecharts");
        deleteCookie("mapfeaturesextent");

        window.sessionStorage.removeItem("notamCache");

		if ($scope.appCache && $scope.appCache.status == $scope.appCache.DOWNLOADING)
		{
			$scope.appCache.abort();
		}
		else if ($scope.appCache && $scope.appCache.status != $scope.appCache.UNCACHED)
		{
			$scope.globalData.cacheStatus = "updating";
			$scope.globalData.cacheProgress = {loaded: 0, total: 100, percent: 0};

			$scope.appCache.update();
		}
		else
		{
			$scope.globalData.cacheStatus = "off";
		}
	};


	$scope.onCacheProgress = function(e)
	{
		if ($scope.globalData.cacheIsActive == false && $scope.globalData.cacheStatus == "off")
			return;

		if (!e.loaded || !e.total) // hack for firefox
		{
			e.loaded = $scope.globalData.cacheProgress.loaded + 1;
			e.total = $scope.globalData.cacheProgress.total;

			if (e.loaded > e.total)
				e.total += 100;
		}

		$scope.globalData.cacheProgress = { loaded: e.loaded, total: e.total, percent: Math.round(e.loaded / e.total * 100) };
		$scope.$apply();
	};


	$scope.onCacheReady = function(e)
	{
		if ($scope.appCache && $scope.appCache.status == $scope.appCache.UPDATEREADY)
			$scope.appCache.swapCache();

		if ($scope.globalData.cacheIsActive)
			$scope.globalData.cacheStatus = "updated";
		else
			$scope.globalData.cacheStatus = "off";

		$scope.$apply();
	};


	$scope.onCacheError = function(e)
	{
		if ($scope.globalData.cacheIsActive == false && $scope.globalData.cacheStatus == "off")
			return;

		$scope.globalData.cacheStatus = "error";
		$scope.$apply();
	};


	$scope.onLeaving = function()
	{
		window.sessionStorage.setItem("globalData", obj2json($scope.globalData));
	};


	$scope.onVisibilityChange = function()
    {
        // TODO
    };


	$scope.onCollapseNavbarTriggered = function()
    {
        $("#navbarcontent").collapse("toggle");
    };


	$scope.onNavbarCollapsed = function()
    {
        $scope.$broadcast("onNavbarCollapsed");
    };


	$scope.onClockTimer = function()
	{
		var timer = $scope.globalData.timer;

		if (!timer)
			return;

		// current time
		var d = new Date();
		d.setMilliseconds(0);
		timer.currentTime =  d;
		timer.currentTimeString = getHourMinSecString(d);

		// elapsed time
		if (timer.stopTime)
			timer.elapsedTimeString = "+" + getMinSecString(timer.currentTime - timer.stopTime);

		$scope.$apply();
	};

	
	$scope.loadNavplanToGlobalData = function(navplanData)
	{
		// general data
		$scope.globalData.navplan.id = navplanData.id;
		$scope.globalData.navplan.title = navplanData.title;
		$scope.globalData.aircraft.speed = navplanData.aircraft_speed;
		$scope.globalData.aircraft.consumption = navplanData.aircraft_consumption;
		$scope.globalData.fuel.extraTime = navplanData.extra_fuel;
		$scope.globalData.navplan.comments = navplanData.comments;

		// waypoints
		$scope.globalData.navplan.waypoints = [ ];
		var wp;

		if (navplanData.waypoints)
		{
			for (var i = 0; i < navplanData.waypoints.length; i++)
			{
				wp = $scope.getWaypointFromData(navplanData.waypoints[i]);
				$scope.globalData.navplan.waypoints.push(wp);
			}
		}

		// alternate
		$scope.globalData.navplan.alternate = undefined;

		if (navplanData.alternate)
		{
			wp = $scope.getWaypointFromData(navplanData.alternate);
			$scope.globalData.navplan.alternate = wp;
		}

        $scope.updateWaypoints();
		$scope.globalData.fitViewLatLon = $scope.getNavplanExtentLatLon();
		$scope.discardCache();
	};
	
	
	$scope.getWaypointFromData = function(wp_data)
	{
		var ap = undefined;

		if (wp_data.airport_icao)
			ap = mapService.getAirport(wp_data.airport_icao);

		return {
			type: wp_data.type,
			freq: wp_data.freq,
			callsign: wp_data.callsign,
			checkpoint: wp_data.checkpoint,
			airport_icao: wp_data.airport_icao,
			latitude: wp_data.latitude,
			longitude: wp_data.longitude,
			charts: wp_data.charts,
			webcams: wp_data.webcams,
			mt: '',
			dist: '',
			alt: wp_data.alt,
			isminalt: wp_data.isminalt,
			ismaxalt: wp_data.ismaxalt,
            isaltatlegstart: wp_data.isaltatlegstart,
			remark: wp_data.remark,
            supp_info: wp_data.supp_info,
			airport: ap
		};
	};


    $scope.getNavplanExtentLatLon = function()
    {
        var navplan = $scope.globalData.navplan;

        if (!navplan || !navplan.waypoints)
            return undefined;

        // create list with all wps (including alternate)
        var allWps = [];

        for (var i = 0; i < navplan.waypoints.length; i++)
            allWps.push(navplan.waypoints[i]);

        if (navplan.alternate)
            allWps.push(navplan.alternate);

        var minLon = 1000;
        var minLat = 1000;
        var maxLon = -1000;
        var maxLat = -1000;

        // find min/max values
        for (i = 0; i < allWps.length; i++)
        {
            minLon = Math.min(minLon, allWps[i].longitude);
            maxLon = Math.max(maxLon, allWps[i].longitude);
            minLat = Math.min(minLat, allWps[i].latitude);
            maxLat = Math.max(maxLat, allWps[i].latitude);
        }

        return [minLon, minLat, maxLon, maxLat];
    };

	// init stuff
	$scope.initGlobalData();
	$scope.initUser();
	$scope.initDisclaimer();

	// event listeners
	window.addEventListener("beforeunload", $scope.onLeaving);
	window.addEventListener("pagehide", $scope.onLeaving);
	window.addEventListener("visibilitychange", $scope.onVisibilityChange);
    window.addEventListener("mousemove", $scope.updateLastActivity);
    document.addEventListener("click", $scope.updateLastActivity);
    window.addEventListener("keypress", $scope.updateLastActivity);

	// init collapse handlers
    $(document).on("click","#navbarcontent.in", $scope.onCollapseNavbarTriggered);
    $("#navbarcontent").on('hidden.bs.collapse', $scope.onNavbarCollapsed);

	// init application cache
	window.frames[0].onload = function()
	{
		$scope.appCache = window.frames[0].applicationCache;

		if ($scope.appCache && $scope.appCache.addEventListener)
		{
			$scope.appCache.addEventListener('progress', $scope.onCacheProgress, false);
			$scope.appCache.addEventListener('noupdate', $scope.onCacheReady, false);
			$scope.appCache.addEventListener('cached', $scope.onCacheReady, false);
			$scope.appCache.addEventListener('updateready', $scope.onCacheReady, false);
			$scope.appCache.addEventListener('obsolete', $scope.onCacheReady, false);
			$scope.appCache.addEventListener('error', $scope.onCacheError, false);
		}
	};


	$scope.getExportFilename = function (navplan, prefix, suffix, fallbackName) {
		if (!navplan || !navplan.waypoints || navplan.waypoints.length < 2) {
			return fallbackName;
		}

		const wpFirst = navplan.waypoints[0];
		const wpLast = navplan.waypoints[navplan.waypoints.length - 1];
		if (wpFirst.type !== 'airport' || wpLast.type !== 'airport') {
			return fallbackName;
		}

		if (!wpFirst.checkpoint.match(/^[A-Z]{4}$/) || !wpLast.checkpoint.match(/^[A-Z]{4}$/)) {
			return fallbackName;
		}

		return prefix + wpFirst.checkpoint + '-' + wpLast.checkpoint + suffix;
	}
}
