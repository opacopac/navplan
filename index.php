<?php
	include "version.php";

	$host = "www.navplan.ch";

    // skip redirect for localhost
    if (!str_starts_with($_SERVER['HTTP_HOST'], 'localhost')) {
        if (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] == "off" || $_SERVER['HTTP_HOST'] != $host) {
            $redirect = 'https://' . $host . $_SERVER['REQUEST_URI'];
            header('HTTP/1.1 301 Moved Permanently');
            header('Location: ' . $redirect);
        } else {
            header("Cache-Control: public, max-age=60"); // max 1 min (must be public for appcache to work)
        }
    }
?><!DOCTYPE HTML>
<html lang="de" data-ng-app="navplanApp" data-ng-controller="navplanCtrl">
<head>
	<title>navplan.ch</title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1">
    <meta name="description" content="VFR flight planning online. Open-source, non-commercial hobbyist project with a main focus on Switzerland." />
    <!-- twitter -->
    <meta name="twitter:card" value="summary">
    <meta name="twitter:title" content="NAVPLAN.CH" />
    <meta name="twitter:description" content="VFR flight planning online. Open-source, non-commercial hobbyist project with a main focus on Switzerland." />
    <meta name="twitter:image" content="http://www.navplan.ch/branch/about/navplan_example.png" />
    <!-- facebook -->
    <meta property="og:title" content="NAVPLAN.CH" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://www.navplan.ch/branch/" />
    <meta property="og:image" content="http://www.navplan.ch/branch/about/navplan_example.png" />
    <meta property="og:description" content="VFR flight planning online. Open-source, non-commercial hobbyist project with a main focus on Switzerland." />
    <!-- favicon -->
	<link rel="icon" type="image/png" href="icon/favicon.png" />
	<!-- css -->
	<link rel="stylesheet" href="bootstrap/3.3.7/bootstrap.min.css">
    <link rel="stylesheet" href="openlayers/4.6.5/ol.css">
	<link rel="stylesheet" href="css/arial-narrow.css" type="text/css" />
    <link rel="stylesheet" href="font-awesome/css/font-awesome.min.css">
	<link rel="stylesheet" href="css/navplan.css?v=<?php echo $ver ?>">
	<!-- version -->
	<script>var indexVersion = "<?php echo $ver ?>";</script>
	<!-- js -->
	<script src="js/jquery-1.12.3.min.js"></script>
	<script src="js/jquery-ui.min.js"></script>
	<script src="js/jquery.ui.touch-punch.min.js"></script>
	<script src="angularjs/1.6.3/angular.min.js"></script>
	<script src="angularjs/1.6.3/angular-route.min.js"></script>
	<script src="angularjs/1.6.3/angular-resource.min.js"></script>
	<script src="bootstrap/3.3.7/bootstrap.min.js"></script>
	<script src="js/ui-bootstrap-tpls-1.3.2.min.js"></script>
    <script src="js/sortable.min.js"></script>
    <script src="openlayers/4.6.5/ol.js"></script>
    <!--<script src="openlayers/4.6.5/ol-debug.js"></script>-->
	<script src="js/turf.min.js"></script>
    <script src="js/WorldMagneticModel.js?v=<?php echo $ver ?>"></script>
    <script src="js/telephony.js?v=<?php echo $ver ?>"></script>
	<script src="navplanHelper.js?v=<?php echo $ver ?>"></script>
	<script src="navplanApp.js?v=<?php echo $ver ?>"></script>
	<script src="navplanCtrl.js?v=<?php echo $ver ?>"></script>
	<script src="map/mapCtrl.js?v=<?php echo $ver ?>"></script>
	<script src="login/loginCtrl.js?v=<?php echo $ver ?>"></script>
	<script src="forgotpw/forgotpwCtrl.js?v=<?php echo $ver ?>"></script>
	<script src="edituser/edituserCtrl.js?v=<?php echo $ver ?>"></script>
	<script src="waypoints/waypointCtrl.js?v=<?php echo $ver ?>"></script>
	<script src="tracks/trackCtrl.js?v=<?php echo $ver ?>"></script>
	<script src="settings/settingsCtrl.js?v=<?php echo $ver ?>"></script>
	<script src="services/mapService.js?v=<?php echo $ver ?>"></script>
    <script src="services/mapFeatureService.js?v=<?php echo $ver ?>"></script>
	<script src="services/locationService.js?v=<?php echo $ver ?>"></script>
	<script src="services/trafficService.js?v=<?php echo $ver ?>"></script>
	<script src="services/geopointService.js?v=<?php echo $ver ?>"></script>
	<script src="services/waypointService.js?v=<?php echo $ver ?>"></script>
	<script src="services/fuelService.js?v=<?php echo $ver ?>"></script>
	<script src="services/userService.js?v=<?php echo $ver ?>"></script>
	<script src="services/metarTafNotamService.js?v=<?php echo $ver ?>"></script>
    <script src="services/terrainService.js?v=<?php echo $ver ?>"></script>
    <script src="services/meteoService.js?v=<?php echo $ver ?>"></script>
</head>
<body>
	<nav id="navbar" class="navbar navbar-default">
		<div class="container-fluid">
			<div id="navbarheader" class="navbar-header">
				<button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbarcontent" data-targetXXX="#navbarcontent" aria-expanded="false">
					<span class="sr-only">Toggle navigation</span>
					<span class="icon-bar"></span>
					<span class="icon-bar"></span>
					<span class="icon-bar"></span>
				</button>
				<a class="navbar-brand" href="#/">NAVPLAN.CH</a>
			</div>
			<div id="navbarcontent" class="collapse navbar-collapse">
				<ul class="nav navbar-nav">
					<li><a href="#/map" title="Map"><i class="fa fa-map-o"></i><span class="hidden-sm">&nbsp;  Map</span></a></li>
					<li><a href="#/waypoints" title="Route & Fuel Calc"><i class="glyphicon glyphicon-list-alt"></i><span class="hidden-sm">&nbsp; Route &amp; Fuel</span></a></li>
					<li ng-show="isLoggedIn() || hasLastTrack()"><a href="#/tracks" title="Recorded Tracks"><i class="fa fa-paw"></i><span class="hidden-sm">&nbsp; Tracks</span></a></li>
					<li><a href="#/map" title="Clear current Route and Track" ng-click="onTrashClicked()"><i class="glyphicon glyphicon-erase"></i><span class="hidden-sm hidden-md">&nbsp; Clear</span></a></li>
					<li class="dropdown" ng-show="globalData.navplan.waypoints.length > 0 || (globalData.track && globalData.track.positions && globalData.track.positions.length > 0)">
					    <a href="#" onclick="return false;" title="Export & Share Route" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"><i class="glyphicon glyphicon-share-alt"></i><span class="hidden-sm hidden-md">&nbsp; Export</span></a>
						<ul class="dropdown-menu">
							<li><a href="#" onclick="return false;" ng-click="createPdfNavplan()"><i class="fa fa-file-pdf-o fa-fw"></i>&nbsp; PDF</a></li>
							<li><a href="#" onclick="return false;" ng-click="createExcelNavplan()"><i class="fa fa-file-excel-o fa-fw"></i>&nbsp; Excel</a></li>
							<li><a href="#" onclick="return false;" ng-click="exportKml()"><i class="fa fa-globe fa-fw"></i>&nbsp; KML (Google Earth)</a></li>
                            <li><a href="#" onclick="return false;" ng-click="exportGpx()"><i class="fa fa-map-marker fa-fw"></i>&nbsp; GPX (Airnav Pro, SkyDemon, etc.)</a></li>
                            <li><a href="#" onclick="return false;" ng-click="exportGarminFpl()"><i class="fa fa-map-marker fa-fw"></i>&nbsp; FPL (Garmin, Foreflight, etc.)</a></li>
                            <li><a href="#" onclick="return false;" ng-click="copyWaypointsExport()"><i class="fa fa-copy fa-fw"></i>&nbsp; Copy-Paste Route (ATC Flight Plan, GarminPilot, etc.)</a></li>
							<!--<li><a>Share current Navplan on...</a></li>
							<li><a href="#" onclick="return false;" ng-click="onShareClicked('facebook')"><i class="fa fa-facebook fa-fw"></i>&nbsp;  Facebook</a></li>
							<li><a href="#" onclick="return false;" ng-click="onShareClicked('twitter')"><i class="fa fa-twitter fa-fw"></i>&nbsp;  Twitter</a></li>
							<li><a href="#" onclick="return false;" ng-click="onShareClicked('google')"><i class="fa fa-google-plus fa-fw"></i>&nbsp;  Google+</a></li>
							<li><a href="#" onclick="return false;" ng-click="onShareClicked('mail')"><i class="fa fa-envelope fa-fw"></i>&nbsp;  E-Mail</a></li>-->
							<li><a href="#" ng-show="globalData.navplan.waypoints.length > 0" onclick="return false;" ng-click="onShareClicked('url')"><i class="fa fa-link fa-fw"></i>&nbsp;  Share URL</a></li>
						</ul>
					</li>
				</ul>
				<ul class="nav navbar-nav navbar-right">
					<li ng-hide="isLoggedIn()"><a href="#/login" title="Login or Register"><i class="glyphicon glyphicon-user"></i><span class="hidden-sm">&nbsp; Login</span></a></li>
					<li ng-show="isLoggedIn()"><a href="#/edituser" title="Edit User"><i class="glyphicon glyphicon-user"></i><span class="hidden-sm hidden-md">&nbsp; {{ globalData.user.email }}</span></a></li>
					<li><a href="#/settings" title="Edit Settings"><i class="glyphicon glyphicon-cog"></i><span class="hidden-md hidden-sm">&nbsp; Settings</span></a></li>
					<li><a href="#/about"><i class="glyphicon glyphicon-info-sign"></i><span class="hidden-md hidden-sm">&nbsp; About</span></a></li>
				</ul>
			</div>
		</div>
	</nav>
    <div id="fullScreenContent">
        <!-- content -->
        <div ng-view style="position: relative" width="100%" height="100%"></div>
        <!-- success messages -->
        <div class="container messages">
            <div id="success_alert_box" class="alert alert-success ng-cloak" role="alert" ng-show="success_alert_message">{{ success_alert_message }}</div>
        </div>
        <!-- error messages -->
        <div class="container messages">
            <div id="error_alert_box" class="alert alert-danger ng-cloak" role="alert" ng-show="error_alert_message">{{ error_alert_message }}</div>
        </div>
        <!-- disclaimer -->
        <div class="modal fade" id="disclaimerDialog" tabindex="-1" role="dialog" aria-labelledby="disclaimerModalLabel">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        <h4 class="modal-title" id="disclaimerModalLabel">Disclaimer</h4>
                    </div>
                    <div class="modal-body">
                        <p><b>NOT FOR OPERATIONAL USE!</b> The information contained on this website is for informational purposes only.</p>
                        <p>The data used on this website could be outdated, inaccurate, or contain errors. Always use up-to-date official sources for your flight planning.</p>
                        <p>This website uses cookies to remember your user settings. If you continue you agree to the storing of cookies on your device.</p>
                    </div>
                    <div class="modal-footer">
                        <input type="checkbox" ng-model="hideDisclaimer" title="Don't show again">Don't show this message again
                        <button type="button" class="btn btn-primary" data-dismiss="modal" ng-click="onDisclaimerOKClicked()">I agree</button>
                    </div>
                </div>
            </div>
        </div>
        <!-- are you sure dialog -->
        <div class="modal fade" id="ruSureDialog" tabindex="-1" role="dialog" aria-labelledby="ruSureDialogLabel">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        <h4 class="modal-title" id="ruSureDialogLabel">{{ globalData.ruSureTitle }}</h4>
                    </div>
                    <div class="modal-body">
                        {{ globalData.ruSureMessage }}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" data-dismiss="modal" ng-click="onRuSureYesClicked()">OK</button>
                    </div>
                </div>
            </div>
        </div>
        <!-- selected waypoint dialog -->
        <div class="modal fade" id="selectedWaypointDialog" tabindex="-1" role="dialog" aria-labelledby="selectedWaypointModalLabel">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        <h4 class="modal-title" id="selectedWaypointModalLabel">Route Waypoint</h4>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="editWpCheckpoint">Checkpoint:</label>
                            <input type="text" class="form-control" id="editWpCheckpoint" ng-model="globalData.selectedWp.checkpoint" maxlength="30" />
                        </div>
                        <div class="form-group">
                            <label for="editWpFrequency">Frequency:</label>
                            <input type="text" class="form-control" id="editWpFrequency" ng-model="globalData.selectedWp.freq" maxlength="7" />
                        </div>
                        <div class="form-group">
                            <label for="editWpCallsign">Callsign:</label>
                            <input type="text" class="form-control" id="editWpCallsign" ng-model="globalData.selectedWp.callsign" maxlength="10" />
                        </div>
                        <div class="form-group">
                            <label for="editWpAltitude">Altitude:</label>
                            <div class="form-inline">
                                <input type="text" class="form-control" id="editWpAltitude" ng-model="globalData.selectedWp.alt" maxlength="5" />
                                <div class="btn-group" role="group">
                                    <button type="button" class="btn btn-default {{ globalData.selectedWp.isminalt ? 'active' : ''}}" ng-click="globalData.selectedWp.isminalt = !globalData.selectedWp.isminalt" >min</button>
                                    <button type="button" class="btn btn-default {{ globalData.selectedWp.ismaxalt ? 'active' : ''}}" ng-click="globalData.selectedWp.ismaxalt = !globalData.selectedWp.ismaxalt" >max</button>
                                </div>
                                @
                                <div class="btn-group" role="group">
                                    <button type="button" class="btn btn-default {{ globalData.selectedWp.isaltatlegstart ? 'active' : ''}}" ng-click="globalData.selectedWp.isaltatlegstart = 1" >leg start</button>
                                    <button type="button" class="btn btn-default {{ !globalData.selectedWp.isaltatlegstart ? 'active' : ''}}" ng-click="globalData.selectedWp.isaltatlegstart = 0" >leg end</button>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="editWpRemarks">Remarks:</label>
                            <input type="text" class="form-control" id="editWpRemarks" ng-model="globalData.selectedWp.remark" maxlength="50" />
                        </div>
                        <div class="form-group">
                            <label for="editWpSuppInfo">Supplemental Info (separate line):</label>
                            <div class="input-group">
                                <input type="text" class="form-control" id="editWpSuppInfo" ng-model="globalData.selectedWp.supp_info" maxlength="255" />
                                <span class="input-group-btn">
                                    <button class="btn btn-default" type="button" ng-click="globalData.selectedWp.supp_info = ''" title="delete supplemental info"><span class="glyphicon glyphicon-erase" aria-hidden="true"></span></button>
                                </span>
                            </div>
                            <!--<input type="text" class="form-control" id="editWpSuppInfo" ng-model="globalData.selectedWp.supp_info" maxlength="255" />-->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" data-dismiss="modal" ng-click="onCancelEditWpClicked()">Cancel</button>
                        <button type="button" class="btn btn-primary" data-dismiss="modal" ng-click="onOkEditWpClicked()">OK</button>
                    </div>
                </div>
            </div>
        </div>
        <!-- user waypoint dialog -->
        <div class="modal fade" id="userWaypointDialog" tabindex="-1" role="dialog" aria-labelledby="userWpModalLabel">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        <h4 class="modal-title" id="userWpModalLabel">User Point</h4>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="userWpCheckpoint">Checkpoint:</label>
                            <input type="text" class="form-control" id="WpCheckpoint" ng-model="globalData.selectedWp.checkpoint" maxlength="30" />
                        </div>
                        <div class="form-group">
                            <label for="userWpRemarks">Remarks:</label>
                            <input type="text" class="form-control" id="userWpRemarks" ng-model="globalData.selectedWp.remark" maxlength="50" />
                        </div>
                        <div class="form-group">
                            <label for="userWpSuppInfo">Supplemental Info (separate line):</label>
                            <input type="text" class="form-control" id="userWpSuppInfo" ng-model="globalData.selectedWp.supp_info" maxlength="255" />
                        </div>
                        <hr />
                        <p><button type="button" class="btn btn-primary btn-circle" data-dismiss="modal" ng-click="onSaveUserWaypointClicked()"><i class="glyphicon glyphicon-save"></i></button> Save User Point</p>
                        <p ng-show="globalData.selectedWp.type == 'user' && globalData.selectedWp.id > 0"><button type="button" class="btn btn-danger btn-circle" data-dismiss="modal" ng-click="onDeleteUserWaypointClicked()"><i class="glyphicon glyphicon-remove"></i></button> Delete User Point</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" data-dismiss="modal" ng-click="onCancelEditWpClicked()">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
        <!-- download link dialog -->
        <div class="modal fade" id="downloadLinkDialog" tabindex="-1" role="dialog" aria-labelledby="downloadLinkModeLabel">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        <h4 class="modal-title" id="downloadLinkModeLabel">Download</h4>
                    </div>
                    <div class="modal-body">
                        File: <a href="{{ globalData.downloadLink.href }}" type="{{ globalData.downloadLink.mimeType }}" download="{{ globalData.downloadLink.filename }}" target="_blank">{{ globalData.downloadLink.text }}</a> (click to download)
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
        <!-- copy waypoints dialog -->
        <div class="modal fade" id="copyWaypointsDialog" tabindex="-1" role="dialog" aria-labelledby="copyWaypointsModeLabel">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        <h4 class="modal-title" id="copyWaypointsModeLabel">Copy Waypoints</h4>
                    </div>
                    <div class="modal-body">
                        <p>
                            Waypoints:
                            <textarea id="waypointsTextarea" class="form-control" rows="3">{{ globalData.copyWaypointsText }}</textarea>
                        </p>
                        <button class="btn btn-primary" ng-click="copyWaypointsToClipboard()">Copy Waypoints to Clipboard</button>
                        <p>&nbsp;&nbsp;&nbsp;<b>OR</b></p>
                        <p>Garmin Pilot: <a href="{{ globalData.garminPilotExportLink.href }}" target="_blank">TBD</a> (click to open in GarminPilot)</p>
                        <p>Foreflight: <a href="{{ globalData.foreflightExportLink.href }}" target="_blank">TBD</a> (click to open in Foreflight)</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
        <!-- share url dialog -->
        <div class="modal fade" id="shareUrlDialog" tabindex="-1" role="dialog" aria-labelledby="shareUrlModeLabel">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        <h4 class="modal-title" id="shareUrlModeLabel">Share URL</h4>
                    </div>
                    <div class="modal-body">
                        URL: <input type="text" class="form-control" ng-model="globalData.shareUrl" />
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <iframe id='manifest_iframe_hack' style='display: none;' src='manifest_iframe.html'></iframe>
</body>
</html>
