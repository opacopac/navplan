<?php
    if(empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] == "off")
    {
        $redirect = 'https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
        header('HTTP/1.1 301 Moved Permanently');
        header('Location: ' . $redirect);
    }
?><!DOCTYPE HTML>
<html manifest='manifest.php' lang="de" data-ng-app="navplanApp" data-ng-controller="navplanCtrl">
<head>
	<title>NAV-Flightplan</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1">
	<meta charset="utf-8">
	<link rel="stylesheet" href = "css/bootstrap.min.css">
	<link rel="stylesheet" href = "css/ol.css">
	<link rel="stylesheet" href = "css/arial-narrow.css" type="text/css" />
	<link rel="stylesheet" href = "css/navplan.css">
	<script src="js/jquery-1.12.3.min.js"></script>
	<script src="js/jquery-ui.min.js"></script>
	<script src="js/jquery.ui.touch-punch.min.js"></script>
	<script src="js/angular.min.js"></script>
	<script src="js/angular-route.min.js"></script>
	<script src="js/angular-resource.min.js"></script>
	<script src="js/bootstrap.min.js"></script>
	<script src="js/ui-bootstrap-tpls-1.3.2.min.js"></script>
	<script src="js/ol.js"></script>
	<script src="navplanHelper.js"></script>
	<script src="navplanApp.js"></script>
	<script src="navplanCtrl.js"></script>
	<script src="map/mapCtrl.js"></script>
	<script src="login/loginCtrl.js"></script>
	<script src="forgotpw/forgotpwCtrl.js"></script>
	<script src="edituser/edituserCtrl.js"></script>
	<script src="waypoints/waypointCtrl.js"></script>
	<script src="settings/settingsCtrl.js"></script>
	<script src="services/mapService.js"></script>
	<script src="services/locationService.js"></script>
	<script src="services/trafficService.js"></script>
	<script src="services/geonameService.js"></script>
	<script src="services/waypointService.js"></script>
	<script src="services/fuelService.js"></script>
	<script src="services/userService.js"></script>
	<script src="services/weatherService.js"></script>
</head>
<body>
	<nav id="navbar" class="navbar navbar-default">
		<div class="container-fluid">
			<div id="navbarheader" class="navbar-header">
				<button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbarcontent" aria-expanded="false">
					<span class="sr-only">Toggle navigation</span>
					<span class="icon-bar"></span>
					<span class="icon-bar"></span>
					<span class="icon-bar"></span>
				</button>
				<a class="navbar-brand" href="#/">NAV-FLIGHTPLAN</a>
			</div>
			<div id="navbarcontent" class="collapse navbar-collapse">
				<ul class="nav navbar-nav">
					<li><a href="#/map" title="Show Map" data-toggle="collapse" data-target="#navbarcontent">Map</a></li>
					<li><a href="#/waypoints" title="Show Waypoint List" data-toggle="collapse" data-target="#navbarcontent">Waypoints</a></li>
					<li><a href="#/map" title="Clear All Waypoints" data-toggle="collapse" data-target="#navbarcontent" ng-click="onClearAllWaypointsClicked()"><i class="glyphicon glyphicon-trash"></i></a></li>
				</ul>
				<ul class="nav navbar-nav navbar-right">
					<li ng-hide="isLoggedIn()"><a href="#/login" title="Login or Register" data-toggle="collapse" data-target="#navbarcontent">Login</a></li>
					<li ng-show="isLoggedIn()"><a href="#/edituser" title="Edit User" data-toggle="collapse" data-target="#navbarcontent">{{ globalData.user.email }}</a></li>
					<li><a href="#/settings" title="Edit Settings" data-toggle="collapse" data-target="#navbarcontent"><i class="glyphicon glyphicon-cog"></i></a></li>
					<li><a href="#/about" data-toggle="collapse" data-target="#navbarcontent">About</a></li>
				</ul>
			</div>
		</div>
	</nav>
	<!-- success messages -->
	<div class="container messages">
		<div id="success_alert_box" class="alert alert-success" role="alert" ng-show="success_alert_message">{{ success_alert_message }}</div>
	</div>
	<!-- error messages -->
	<div class="container messages">
		<div id="error_alert_box" class="alert alert-danger" role="alert" ng-show="error_alert_message">{{ error_alert_message }}</div>
	</div>
	<!-- content -->
	<div ng-view style="position: relative" width="100%" height="100%"></div>
	<!-- disclaimer -->
	<div class="modal fade" id="disclaimerDialog" tabindex="-1" role="dialog" aria-labelledby="disclaimerModalLabel">
		<div class="modal-dialog" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
					<h4 class="modal-title" id="disclaimerModalLabel">Disclaimer</h4>
				</div>
				<div class="modal-body">
					<p>The information contained on this website is for informational purposes only. <b>Do not use for actual navigation!</b></p>
					<p>The data used on this website could be outdated, inaccurate, or contain errors. Always use up-to-date official sources for your flight planning.</p>
				</div>
				<div class="modal-footer">
					<input type="checkbox" ng-model="hideDisclaimer" title="Don't show again">Don't show this message again
					<button type="button" class="btn btn-primary" data-dismiss="modal" ng-click="onDisclaimerOKClicked()">I agree</button>
				</div>
			</div>
		</div>
	</div>
	<!-- selected waypoint -->
	<div class="modal fade" id="selectedWaypointDialog" tabindex="-1" role="dialog" aria-labelledby="selectedWaypointModalLabel">
		<div class="modal-dialog" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
					<h4 class="modal-title" id="selectedWaypointModalLabel">Selected Waypoint</h4>
				</div>
				<div class="modal-body">
					Checkpoint:
					<input type="text" class="form-control" ng-model="globalData.selectedWp.checkpoint" />
					Frequency:
					<input type="text" class="form-control" ng-model="globalData.selectedWp.freq" />
					Callsign:
					<input type="text" class="form-control" ng-model="globalData.selectedWp.callsign" />
					Altitude:
					<div class="input-group">
						<input type="text" class="form-control" ng-model="globalData.selectedWp.alt" />
						<div class="input-group-btn">
							<button type="button" class="btn btn-default {{ globalData.selectedWp.isminalt ? 'active' : ''}}" ng-click="globalData.selectedWp.isminalt = !globalData.selectedWp.isminalt" >min</button>
							<button type="button" class="btn btn-default {{ globalData.selectedWp.ismaxalt ? 'active' : ''}}" ng-click="globalData.selectedWp.ismaxalt = !globalData.selectedWp.ismaxalt" >max</button>
						</div>
					</div>
					Remarks:
					<input type="text" class="form-control" ng-model="globalData.selectedWp.remark" />
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-default" data-dismiss="modal" ng-click="onCancelEditWpClicked()">Cancel</button>
					<button type="button" class="btn btn-primary" data-dismiss="modal" ng-click="onOkEditWpClicked()">OK</button>
				</div>
			</div>
		</div>
	</div>
	<!-- user waypoint -->
	<div class="modal fade" id="userWaypointDialog" tabindex="-1" role="dialog" aria-labelledby="userWpModalLabel">
		<div class="modal-dialog" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
					<h4 class="modal-title" id="userWpModalLabel">User Waypoint</h4>
				</div>
				<div class="modal-body">
					Checkpoint: <input type="text" class="form-control" ng-model="globalData.selectedWp.checkpoint" />
					Remarks: <input type="text" class="form-control" ng-model="globalData.selectedWp.remark" />
					<hr />
					<p><button type="button" class="btn btn-primary btn-circle" data-dismiss="modal" ng-click="onSaveUserWaypointClicked()"><i class="glyphicon glyphicon-save"></i></button> Save my User Waypoint</p>
					<p ng-show="globalData.selectedWp.type == 'user' && globalData.selectedWp.id > 0"><button type="button" class="btn btn-danger btn-circle" data-dismiss="modal" ng-click="onDeleteUserWaypointClicked()"><i class="glyphicon glyphicon-remove"></i></button> Delete from my User Waypoints</p>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-default" data-dismiss="modal" ng-click="onCancelEditWpClicked()">Cancel</button>
				</div>
			</div>
		</div>
	</div>
</body>
</html>
