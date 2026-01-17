# Navplan

http://www.navplan.ch


## Overview

VFR flight planning online. Open-source, non-commercial hobbyist project with a main focus on Switzerland.

The goal of this project is to show the possibilities of VFR flight planning in a modern web browser, integrating different data sources and using current web technologies and frameworks like HTML5, Javascript, AngularJS, Openlayers and Bootstrap. It's a personal, non-commercial project written out of passion for aviation and information technology in general.

## Contact Info

    Contact: Armand Tschanz (info@navplan.ch)
    Facebook: https://www.facebook.com/navplan.ch (comments or feature requests are always welcome!)
    Source Code: https://github.com/opacopac/navplan

## Disclaimer

NOT FOR OPERATIONAL USE!

The information contained on this website is for informational purposes only. Do not use for actual navigation!

The data used on this website could be outdated, inaccurate, or contain errors. Always use up-to-date official sources for your flight planning.


## Attributions

    Map Data: © OpenStreetMap contributors (CC-BY-SA)
    Elevation Data: SRTM
    Map Visualization: © Mapbox, Improve this map
    Aviation Data: openAIP (BY-NC-SA)
    Traffic Data: Open Glider Network | ADSBexchange
    Aerodrome Charts: Avare.ch
    Weather Data: NOAA - Aviation Weather Center
    Geographical Data: GeoNames (CC-BY)
    NOTAM Data: ICAO - iSTARS API Data Service
    Links to Webcams: all images are digital property of the webcam owners. check the reference for details.


## Setup Instructions for Developers

* Install Docker (e.g. use Docker Desktop: https://www.docker.com/get-started/)
* Clone the navplan repository from Github:
  * git clone https://github.com/opacopac/navplan.git
* In your working directory create a sub-directory './secrets/' with two files containing the db password string (no newline!) for the db users:
  * ./secrets/db_root_pw.txt
  * ./secrets/db_navplan_pw.txt
* Create the file ./php/config.php (e.g. copy from ./php/config_sample.php) and set the correct db host, user and password, e.g.
  * $db_host = "navplan1_persistence";
  * $db_name = "tschanz_navplan";
  * $db_user = "tschanz_navfpl";
  * $db_pw = "your_password_from_the_secret_file";
* run `docker-compose up --build` to build and start the containers
* open browser and go to http://localhost:8080
* opt. use http://localhost:8081 for the phpmyadmin interface to access the db
