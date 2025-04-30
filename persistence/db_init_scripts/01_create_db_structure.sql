-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: mysql15j11.db.hostpoint.internal
-- Generation Time: Oct 02, 2023 at 09:28 AM
-- Server version: 10.6.15-MariaDB-log
-- PHP Version: 8.2.8

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Database: `tschanz_navplan`
--
CREATE DATABASE IF NOT EXISTS `tschanz_navplan` DEFAULT CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci;
USE `tschanz_navplan`;

-- --------------------------------------------------------

--
-- Table structure for table `ad_charts`
--

CREATE TABLE IF NOT EXISTS `ad_charts` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `airport_icao` varchar(4) NOT NULL,
  `source` varchar(20) NOT NULL DEFAULT 'VFRM',
  `type` varchar(20) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `orig_filename` varchar(255) DEFAULT NULL,
  `orig_page` tinyint(3) UNSIGNED DEFAULT NULL,
  `orig_rot_deg` float DEFAULT NULL,
  `mercator_n` int(11) DEFAULT NULL,
  `mercator_s` int(11) DEFAULT NULL,
  `mercator_e` int(11) DEFAULT NULL,
  `mercator_w` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `airport_icao` (`airport_icao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ad_charts2`
--

CREATE TABLE IF NOT EXISTS `ad_charts2` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ad_icao` varchar(4) NOT NULL,
  `source` varchar(20) NOT NULL,
  `type` varchar(20) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 0,
  `filename` varchar(255) NOT NULL,
  `minlon` float DEFAULT NULL,
  `minlat` float DEFAULT NULL,
  `maxlon` float DEFAULT NULL,
  `maxlat` float DEFAULT NULL,
  `import_filename` varchar(255) DEFAULT NULL,
  `pdf_page` int(11) DEFAULT NULL,
  `pdf_rot_deg` float DEFAULT NULL,
  `registration_type` varchar(20) DEFAULT NULL,
  `pos1_pixel_x` int(11) DEFAULT NULL,
  `pos1_pixel_y` int(11) DEFAULT NULL,
  `pos1_coord_lv03_e` int(11) DEFAULT NULL,
  `pos1_coord_lv03_n` int(11) DEFAULT NULL,
  `chart_scale` int(11) DEFAULT NULL,
  `pos2_pixel_x` int(11) DEFAULT NULL,
  `pos2_pixel_y` int(11) DEFAULT NULL,
  `pos2_coord_lv03_e` int(11) DEFAULT NULL,
  `pos2_coord_lv03_n` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `aircraft`
--

CREATE TABLE `aircraft` (
                            `id` int(10) UNSIGNED NOT NULL,
                            `user_id` int(10) UNSIGNED NOT NULL,
                            `vehicle_type` varchar(20) NOT NULL,
                            `registration` varchar(20) NOT NULL,
                            `icao_type` varchar(20) NOT NULL,
                            `speed` float UNSIGNED NOT NULL,
                            `speed_unit` varchar(5) NOT NULL,
                            `cruise_consumption` float UNSIGNED NOT NULL,
                            `consumption_unit` varchar(10) NOT NULL,
                            `fuel_type` varchar(20) DEFAULT NULL,
                            `bew` float UNSIGNED DEFAULT NULL,
                            `mtow` float UNSIGNED DEFAULT NULL,
                            `weight_unit` varchar(5) DEFAULT NULL,
                            `roc_sealevel` float UNSIGNED DEFAULT NULL,
                            `vertical_speed_unit` varchar(5) DEFAULT NULL,
                            `service_ceiling` float UNSIGNED DEFAULT NULL,
                            `altitude_unit` varchar(5) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `aircraft`
--
ALTER TABLE `aircraft`
    ADD PRIMARY KEY (`id`),
    ADD KEY `registration` (`registration`),
    ADD KEY `type` (`icao_type`),
    ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `aircraft`
--
ALTER TABLE `aircraft`
    MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
COMMIT;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `aircraft_perf_dist`
--

CREATE TABLE `aircraft_perf_dist` (
                                      `id` int(11) UNSIGNED NOT NULL,
                                      `aircraft_id` int(11) UNSIGNED NOT NULL,
                                      `type` varchar(20) NOT NULL,
                                      `profile_name` varchar(255) NOT NULL,
                                      `alt_ref` varchar(20) NOT NULL,
                                      `alt_steps` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
                                      `alt_unit` varchar(5) NOT NULL,
                                      `temp_ref` varchar(20) NOT NULL,
                                      `temp_steps` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
                                      `temp_unit` varchar(5) NOT NULL,
                                      `distances` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
                                      `distance_unit` varchar(5) NOT NULL,
                                      `headwind_dec_perc` float UNSIGNED NOT NULL,
                                      `headwind_dec_per_speed` float UNSIGNED NOT NULL,
                                      `tailwind_inc_perc` float UNSIGNED NOT NULL,
                                      `tailwind_inc_per_speed` float UNSIGNED NOT NULL,
                                      `speed_unit` varchar(5) NOT NULL,
                                      `grass_rwy_inc_perc` float UNSIGNED NOT NULL,
                                      `wet_rwy_inc_perc` float UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;


--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `aircraft_perf_dist`
--
ALTER TABLE `aircraft_perf_dist`
    ADD PRIMARY KEY (`id`),
    ADD KEY `aircraft_id` (`aircraft_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `aircraft_perf_dist`
--
ALTER TABLE `aircraft_perf_dist`
    MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;
COMMIT;


-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `aircraft_weight_items`
--

CREATE TABLE `aircraft_weight_items` (
                                         `id` int(11) UNSIGNED NOT NULL,
                                         `aircraft_id` int(11) UNSIGNED NOT NULL,
                                         `type` varchar(20) NOT NULL,
                                         `name` varchar(100) NOT NULL,
                                         `arm_long` float NOT NULL,
                                         `arm_lat` float NOT NULL,
                                         `arm_unit` varchar(5) NOT NULL,
                                         `max_weight` float UNSIGNED DEFAULT NULL,
                                         `default_weight` float UNSIGNED DEFAULT NULL,
                                         `weight_unit` varchar(5) DEFAULT NULL,
                                         `max_fuel` float UNSIGNED DEFAULT NULL,
                                         `default_fuel` float UNSIGNED DEFAULT NULL,
                                         `fuel_unit` varchar(5) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `aircraft_weight_items`
--
ALTER TABLE `aircraft_weight_items`
    ADD PRIMARY KEY (`id`),
    ADD KEY `aircraft_id` (`aircraft_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `aircraft_weight_items`
--
ALTER TABLE `aircraft_weight_items`
    MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;
COMMIT;


-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `aircraft_wnb_envelopes`
--

CREATE TABLE `aircraft_wnb_envelopes` (
                                          `id` int(11) UNSIGNED NOT NULL,
                                          `aircraft_id` int(11) UNSIGNED NOT NULL,
                                          `name` varchar(100) NOT NULL,
                                          `axis_type` varchar(30) NOT NULL,
                                          `lon_envelope` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
                                          `lat_envelope` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
                                          `arm_unit` varchar(5) NOT NULL,
                                          `weight_unit` varchar(5) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `aircraft_wnb_envelopes`
--
ALTER TABLE `aircraft_wnb_envelopes`
    ADD PRIMARY KEY (`id`),
    ADD KEY `aircraft_id` (`aircraft_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `aircraft_wnb_envelopes`
--
ALTER TABLE `aircraft_wnb_envelopes`
    MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;
COMMIT;


-- --------------------------------------------------------

--
-- Table structure for table `basestation_aircrafts`
--

CREATE TABLE IF NOT EXISTS `basestation_aircrafts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mode_s` varchar(6) NOT NULL,
  `country` varchar(50) NOT NULL,
  `registration` varchar(20) NOT NULL,
  `manufacturer` varchar(100) NOT NULL,
  `icao_type_code` varchar(4) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mode_s` (`mode_s`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `geonames`
--

CREATE TABLE IF NOT EXISTS `geonames` (
  `geonameid` int(10) UNSIGNED NOT NULL,
  `name` varchar(200) NOT NULL,
  `asciiname` varchar(200) NOT NULL,
  `alternatenames` varchar(10000) NOT NULL,
  `latitude` float NOT NULL,
  `longitude` float NOT NULL,
  `feature_class` char(1) NOT NULL,
  `feature_code` varchar(10) NOT NULL,
  `country_code` char(2) NOT NULL,
  `cc2` char(200) NOT NULL,
  `admin1_code` varchar(20) NOT NULL,
  `admin2_code` varchar(80) NOT NULL,
  `admin3_code` varchar(20) NOT NULL,
  `admin4_code` varchar(20) NOT NULL,
  `population` bigint(20) NOT NULL,
  `elevation` int(11) NOT NULL,
  `dem` int(11) NOT NULL,
  `timezone` varchar(40) NOT NULL,
  `modification_date` date NOT NULL,
  PRIMARY KEY (`geonameid`),
  KEY `latitude` (`latitude`),
  KEY `longitude` (`longitude`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `geonames_admin1codes`
--

CREATE TABLE IF NOT EXISTS `geonames_admin1codes` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `geonames_key` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `name_ascii` varchar(100) NOT NULL,
  `geonames_id` int(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `geonames_key` (`geonames_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `geonames_admin2codes`
--

CREATE TABLE IF NOT EXISTS `geonames_admin2codes` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `geonames_key` varchar(120) NOT NULL,
  `name` varchar(100) NOT NULL,
  `name_ascii` varchar(100) NOT NULL,
  `geonames_id` int(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `geonames_key` (`geonames_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `geonames_bak`
--

CREATE TABLE IF NOT EXISTS `geonames_bak` (
  `geonameid` int(10) UNSIGNED NOT NULL,
  `name` varchar(200) NOT NULL,
  `asciiname` varchar(200) NOT NULL,
  `alternatenames` varchar(10000) NOT NULL,
  `latitude` float NOT NULL,
  `longitude` float NOT NULL,
  `feature_class` char(1) NOT NULL,
  `feature_code` varchar(10) NOT NULL,
  `country_code` char(2) NOT NULL,
  `cc2` char(200) NOT NULL,
  `admin1_code` varchar(20) NOT NULL,
  `admin2_code` varchar(80) NOT NULL,
  `admin3_code` varchar(20) NOT NULL,
  `admin4_code` varchar(20) NOT NULL,
  `population` bigint(20) NOT NULL,
  `elevation` int(11) NOT NULL,
  `dem` int(11) NOT NULL,
  `timezone` varchar(40) NOT NULL,
  `modification_date` date NOT NULL,
  PRIMARY KEY (`geonameid`) USING BTREE,
  KEY `name` (`name`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `geonames_eu`
--

CREATE TABLE IF NOT EXISTS `geonames_eu` (
  `geonameid` int(10) UNSIGNED NOT NULL,
  `name` varchar(200) NOT NULL,
  `asciiname` varchar(200) NOT NULL,
  `alternatenames` varchar(10000) NOT NULL,
  `latitude` float NOT NULL,
  `longitude` float NOT NULL,
  `feature_class` char(1) NOT NULL,
  `feature_code` varchar(10) NOT NULL,
  `country_code` char(2) NOT NULL,
  `cc2` char(200) NOT NULL,
  `admin1_code` varchar(20) NOT NULL,
  `admin2_code` varchar(80) NOT NULL,
  `admin3_code` varchar(20) NOT NULL,
  `admin4_code` varchar(20) NOT NULL,
  `population` bigint(20) NOT NULL,
  `elevation` int(11) NOT NULL,
  `dem` int(11) NOT NULL,
  `timezone` varchar(40) NOT NULL,
  `modification_date` date NOT NULL,
  PRIMARY KEY (`geonameid`) USING BTREE,
  KEY `name` (`name`),
  KEY `latitude` (`latitude`),
  KEY `longitude` (`longitude`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `global_waypoints`
--

CREATE TABLE IF NOT EXISTS `global_waypoints` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `type` varchar(15) NOT NULL,
  `name` varchar(30) NOT NULL,
  `latitude` float NOT NULL,
  `longitude` float NOT NULL,
  `remark` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `latitude` (`latitude`),
  KEY `longitude` (`longitude`),
  KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `icao_aircraft_type`
--

CREATE TABLE IF NOT EXISTS `icao_aircraft_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `designator` varchar(4) NOT NULL,
  `model` varchar(100) NOT NULL,
  `manufacturer` varchar(100) NOT NULL,
  `ac_type` varchar(1) NOT NULL,
  `eng_type` varchar(1) NOT NULL,
  `eng_count` tinyint(4) NOT NULL,
  `wtc` varchar(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `designator` (`designator`) USING BTREE,
  KEY `model` (`model`) USING BTREE,
  KEY `manufacturer` (`manufacturer`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `icao_fir`
--

CREATE TABLE IF NOT EXISTS `icao_fir` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `region` varchar(4) NOT NULL,
  `icao` varchar(4) NOT NULL,
  `name` varchar(100) NOT NULL,
  `statecode` varchar(3) NOT NULL,
  `statename` varchar(100) NOT NULL,
  `centerlat` float NOT NULL,
  `centerlon` float NOT NULL,
  `polygon` multipolygon NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `icao` (`icao`),
  SPATIAL KEY `polygon` (`polygon`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `icao_notam`
--

CREATE TABLE IF NOT EXISTS `icao_notam` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `notam_id` varchar(20) NOT NULL,
  `country` varchar(3) NOT NULL,
  `type` varchar(10) NOT NULL,
  `icao` varchar(4) NOT NULL,
  `startdate` datetime NOT NULL,
  `enddate` datetime NOT NULL,
  `notam` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `icao` (`icao`),
  KEY `country` (`country`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `icao_notam_geometry`
--

CREATE TABLE IF NOT EXISTS `icao_notam_geometry` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `icao_notam_id` int(10) UNSIGNED NOT NULL,
  `geometry` mediumtext DEFAULT NULL,
  `extent` geometry NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `icao_notam_id` (`icao_notam_id`),
  SPATIAL KEY `extent` (`extent`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `icao_notam_geometry2`
--

CREATE TABLE IF NOT EXISTS `icao_notam_geometry2` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `icao_notam_id` int(10) UNSIGNED NOT NULL,
  `zoommin` tinyint(3) UNSIGNED DEFAULT NULL,
  `zoommax` tinyint(3) UNSIGNED DEFAULT NULL,
  `geometry` mediumtext DEFAULT NULL,
  `diameter` float NOT NULL,
  `extent` geometry NOT NULL,
  PRIMARY KEY (`id`),
  SPATIAL KEY `extent` (`extent`),
  KEY `zoommin` (`zoommin`),
  KEY `zoommax` (`zoommax`),
  KEY `diameter` (`diameter`),
  KEY `icao_notam_id` (`icao_notam_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `icao_telephony_designator`
--

CREATE TABLE IF NOT EXISTS `icao_telephony_designator` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `designator` varchar(3) NOT NULL,
  `telephony` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `designator` (`designator`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ivao_circuits`
--

CREATE TABLE IF NOT EXISTS `ivao_circuits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `airportIcao` varchar(4) NOT NULL,
  `section` varchar(10) NOT NULL,
  `appendix` varchar(50) NOT NULL,
  `comment` varchar(255) DEFAULT NULL,
  `lines2d` multilinestring NOT NULL,
  PRIMARY KEY (`id`),
  KEY `airportIcao` (`airportIcao`),
  SPATIAL KEY `lines2d` (`lines2d`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lfr_ch`
--

CREATE TABLE IF NOT EXISTS `lfr_ch` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `icaohex` varchar(6) NOT NULL,
  `registration` varchar(20) NOT NULL,
  `aircraftModelType` varchar(50) NOT NULL,
  `manufacturer` varchar(50) NOT NULL,
  `aircraftCategoryId` int(10) UNSIGNED NOT NULL,
  `ownerOperators` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `icaohex` (`icaohex`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `map_features`
--

CREATE TABLE IF NOT EXISTS `map_features` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `type` varchar(20) NOT NULL,
  `name` varchar(50) NOT NULL,
  `airport_icao` varchar(4) DEFAULT NULL,
  `latitude` float DEFAULT NULL,
  `longitude` float DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `airport_icao` (`airport_icao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `meteo_sma_measurements`
--

CREATE TABLE IF NOT EXISTS `meteo_sma_measurements` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `station_id` varchar(3) NOT NULL,
  `measurement_time` datetime NOT NULL,
  `temp_c` float DEFAULT NULL,
  `sun_min` float UNSIGNED DEFAULT NULL,
  `precip_mm` float UNSIGNED DEFAULT NULL,
  `wind_dir` int(10) UNSIGNED DEFAULT NULL,
  `wind_speed_kmh` float UNSIGNED DEFAULT NULL,
  `qnh_hpa` float UNSIGNED DEFAULT NULL,
  `wind_gusts_kmh` float UNSIGNED DEFAULT NULL,
  `humidity_pc` int(10) UNSIGNED DEFAULT NULL,
  `qfe_hpa` float UNSIGNED DEFAULT NULL,
  `qff_hpa` float UNSIGNED DEFAULT NULL,
  `created_time` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `station` (`station_id`),
  KEY `created_time` (`created_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `meteo_sma_stations`
--

CREATE TABLE IF NOT EXISTS `meteo_sma_stations` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `station_id` varchar(5) NOT NULL,
  `name` varchar(50) NOT NULL,
  `latitude` float NOT NULL,
  `longitude` float NOT NULL,
  `altitude_m` int(10) UNSIGNED NOT NULL,
  `created_time` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `station_id` (`station_id`),
  KEY `latitude` (`latitude`),
  KEY `longitude` (`longitude`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `meteo_sma_stations_bak`
--

CREATE TABLE IF NOT EXISTS `meteo_sma_stations_bak` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `station_id` varchar(3) NOT NULL,
  `name` varchar(50) NOT NULL,
  `latitude` float NOT NULL,
  `longitude` float NOT NULL,
  `altitude_m` int(10) UNSIGNED NOT NULL,
  `created_time` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `station_id` (`station_id`),
  KEY `latitude` (`latitude`),
  KEY `longitude` (`longitude`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `navplan`
--

CREATE TABLE IF NOT EXISTS `navplan` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `share_id` varchar(10) DEFAULT NULL,
  `md5_hash` varchar(32) DEFAULT NULL,
  `title` varchar(50) NOT NULL,
  `aircraft_speed` varchar(3) NOT NULL,
  `aircraft_consumption` varchar(3) NOT NULL,
  `extra_fuel` varchar(3) NOT NULL,
  `comments` varchar(2048) DEFAULT NULL,
  `created_time` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `tinyurl` (`share_id`),
  UNIQUE KEY `hash` (`md5_hash`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `navplan_waypoints`
--

CREATE TABLE IF NOT EXISTS `navplan_waypoints` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `navplan_id` int(10) UNSIGNED NOT NULL,
  `sortorder` tinyint(3) UNSIGNED NOT NULL,
  `type` varchar(20) NOT NULL,
  `freq` varchar(7) NOT NULL,
  `callsign` varchar(10) NOT NULL,
  `checkpoint` varchar(30) NOT NULL,
  `alt` varchar(5) NOT NULL,
  `isminalt` tinyint(1) NOT NULL DEFAULT 0,
  `ismaxalt` tinyint(1) NOT NULL DEFAULT 0,
  `isaltatlegstart` tinyint(1) NOT NULL DEFAULT 0,
  `remark` varchar(100) NOT NULL,
  `supp_info` varchar(255) DEFAULT NULL,
  `latitude` float NOT NULL,
  `longitude` float NOT NULL,
  `airport_icao` varchar(4) DEFAULT NULL,
  `is_alternate` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `freq` (`freq`),
  KEY `checkpoint` (`checkpoint`),
  KEY `flightplan_id` (`navplan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ogn_filter`
--

CREATE TABLE IF NOT EXISTS `ogn_filter` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sessionId` int(11) NOT NULL,
  `minLon` float NOT NULL,
  `minLat` float NOT NULL,
  `maxLon` float NOT NULL,
  `maxLat` float NOT NULL,
  `lastModified` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `sessionId` (`sessionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ogn_listener`
--

CREATE TABLE IF NOT EXISTS `ogn_listener` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sessionId` int(11) NOT NULL,
  `lastModified` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `sessionid` (`sessionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ogn_traffic`
--

CREATE TABLE IF NOT EXISTS `ogn_traffic` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sessionId` int(11) NOT NULL,
  `address` varchar(50) NOT NULL,
  `addressType` varchar(50) NOT NULL,
  `acType` varchar(50) NOT NULL,
  `timestampSec` int(11) NOT NULL,
  `longitude` float NOT NULL,
  `latitude` float NOT NULL,
  `altitudeMeter` float NOT NULL,
  `receiver` varchar(50) NOT NULL,
  `lastModified` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `openaip_airports`
--

CREATE TABLE IF NOT EXISTS `openaip_airports` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `type` varchar(20) NOT NULL,
  `country` varchar(2) NOT NULL,
  `name` varchar(50) NOT NULL,
  `icao` varchar(4) NOT NULL,
  `latitude` float NOT NULL,
  `longitude` float NOT NULL,
  `elevation` float NOT NULL,
  `lonlat` point NOT NULL,
  PRIMARY KEY (`id`),
  KEY `latitude` (`latitude`),
  KEY `longitude` (`longitude`),
  KEY `icao` (`icao`),
  SPATIAL KEY `lonlat` (`lonlat`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `openaip_airports2`
--

CREATE TABLE IF NOT EXISTS `openaip_airports2` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `type` varchar(20) NOT NULL,
  `country` varchar(2) NOT NULL,
  `name` varchar(50) NOT NULL,
  `icao` varchar(4) DEFAULT NULL,
  `latitude` float NOT NULL,
  `longitude` float NOT NULL,
  `elevation` float NOT NULL,
  `zoommin` tinyint(3) UNSIGNED DEFAULT NULL,
  `geohash` varchar(20) NOT NULL,
  `lonlat` point NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `latitude` (`latitude`),
  KEY `longitude` (`longitude`),
  KEY `icao` (`icao`),
  SPATIAL KEY `lonlat` (`lonlat`),
  KEY `geohash` (`geohash`),
  KEY `zoommin` (`zoommin`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `openaip_airspace`
--

CREATE TABLE IF NOT EXISTS `openaip_airspace` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `category` varchar(20) NOT NULL,
  `aip_id` int(10) UNSIGNED NOT NULL,
  `country` varchar(2) NOT NULL,
  `name` varchar(100) NOT NULL,
  `alt_top_reference` varchar(10) NOT NULL,
  `alt_top_height` int(10) UNSIGNED NOT NULL,
  `alt_top_unit` varchar(2) NOT NULL,
  `alt_bottom_reference` varchar(10) NOT NULL,
  `alt_bottom_height` int(10) UNSIGNED NOT NULL,
  `alt_bottom_unit` varchar(2) NOT NULL,
  `polygon` mediumtext NOT NULL,
  `extent` geometry NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `aip_id` (`aip_id`),
  SPATIAL KEY `polygon2` (`extent`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `openaip_airspace2`
--

CREATE TABLE IF NOT EXISTS `openaip_airspace2` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `category` varchar(20) NOT NULL,
  `class` varchar(30) DEFAULT NULL,
  `type` varchar(30) DEFAULT NULL,
  `country` varchar(2) NOT NULL,
  `name` varchar(100) NOT NULL,
  `alt_top_reference` varchar(10) NOT NULL,
  `alt_top_height` int(10) UNSIGNED NOT NULL,
  `alt_top_unit` varchar(2) NOT NULL,
  `alt_bottom_reference` varchar(10) NOT NULL,
  `alt_bottom_height` int(10) UNSIGNED NOT NULL,
  `alt_bottom_unit` varchar(2) NOT NULL,
  `diameter` float DEFAULT NULL,
  `polygon` mediumtext NOT NULL,
  `extent` geometry NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  SPATIAL KEY `polygon2` (`extent`),
  KEY `diameter` (`diameter`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `openaip_airspace_detaillevels`
--

CREATE TABLE IF NOT EXISTS `openaip_airspace_detaillevels` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `airspace_id` int(10) UNSIGNED NOT NULL,
  `zoommin` tinyint(3) UNSIGNED NOT NULL,
  `zoommax` tinyint(3) UNSIGNED NOT NULL,
  `polygon` mediumtext NOT NULL,
  PRIMARY KEY (`id`),
  KEY `airspace_id` (`airspace_id`),
  KEY `zoommin` (`zoommin`),
  KEY `zoommax` (`zoommax`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `openaip_navaids`
--

CREATE TABLE IF NOT EXISTS `openaip_navaids` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `type` varchar(20) NOT NULL,
  `country` varchar(2) NOT NULL,
  `name` varchar(20) NOT NULL,
  `kuerzel` varchar(10) NOT NULL,
  `latitude` float NOT NULL,
  `longitude` float NOT NULL,
  `elevation` float NOT NULL,
  `frequency` varchar(7) NOT NULL,
  `declination` float NOT NULL,
  `truenorth` tinyint(1) NOT NULL,
  `lonlat` point NOT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `kuerzel` (`kuerzel`),
  KEY `latitude` (`latitude`),
  KEY `longitude` (`longitude`),
  SPATIAL KEY `lonlat` (`lonlat`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `openaip_navaids2`
--

CREATE TABLE IF NOT EXISTS `openaip_navaids2` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `type` varchar(20) NOT NULL,
  `country` varchar(2) NOT NULL,
  `name` varchar(20) NOT NULL,
  `kuerzel` varchar(10) NOT NULL,
  `latitude` float NOT NULL,
  `longitude` float NOT NULL,
  `elevation` float NOT NULL,
  `frequency` varchar(7) NOT NULL,
  `declination` float NOT NULL,
  `truenorth` tinyint(1) NOT NULL,
  `zoommin` tinyint(3) UNSIGNED DEFAULT NULL,
  `geohash` varchar(20) NOT NULL,
  `lonlat` point NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `kuerzel` (`kuerzel`),
  KEY `latitude` (`latitude`),
  KEY `longitude` (`longitude`),
  SPATIAL KEY `lonlat` (`lonlat`),
  KEY `geohash` (`geohash`),
  KEY `zoommin` (`zoommin`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `openaip_radios`
--

CREATE TABLE IF NOT EXISTS `openaip_radios` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `airport_id` int(10) UNSIGNED NOT NULL,
  `category` varchar(20) NOT NULL,
  `frequency` varchar(10) NOT NULL,
  `type` varchar(20) NOT NULL,
  `typespec` varchar(20) NOT NULL,
  `description` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `airport_id` (`airport_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `openaip_radios2`
--

CREATE TABLE IF NOT EXISTS `openaip_radios2` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `airport_id` int(10) UNSIGNED NOT NULL,
  `category` varchar(20) NOT NULL,
  `frequency` float NOT NULL,
  `type` varchar(20) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `airport_id` (`airport_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `openaip_runways`
--

CREATE TABLE IF NOT EXISTS `openaip_runways` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `airport_id` int(10) UNSIGNED NOT NULL,
  `operations` varchar(20) NOT NULL,
  `name` varchar(20) NOT NULL,
  `surface` varchar(10) NOT NULL,
  `length` float NOT NULL,
  `width` float NOT NULL,
  `direction1` smallint(5) UNSIGNED NOT NULL,
  `direction2` smallint(5) UNSIGNED NOT NULL,
  `tora1` int(11) DEFAULT NULL,
  `tora2` int(11) DEFAULT NULL,
  `lda1` int(11) DEFAULT NULL,
  `lda2` int(11) DEFAULT NULL,
  `papi1` tinyint(1) DEFAULT NULL,
  `papi2` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `airport_id` (`airport_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `openaip_runways2`
--

CREATE TABLE IF NOT EXISTS `openaip_runways2` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `airport_id` int(10) UNSIGNED NOT NULL,
  `operations` varchar(20) NOT NULL,
  `name` varchar(20) NOT NULL,
  `surface` varchar(10) NOT NULL,
  `length` float NOT NULL,
  `width` float NOT NULL,
  `direction` smallint(5) UNSIGNED NOT NULL,
  `tora` int(11) DEFAULT NULL,
  `lda` int(11) DEFAULT NULL,
  `papi` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `airport_id` (`airport_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pilot`
--

CREATE TABLE IF NOT EXISTS `pilot` (
  `id` int(10) UNSIGNED NOT NULL,
  `forename` varchar(50) NOT NULL,
  `lastname` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `forename` (`forename`),
  KEY `lastname` (`lastname`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reporting_points`
--

CREATE TABLE IF NOT EXISTS `reporting_points` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `type` varchar(20) NOT NULL,
  `airport_icao` varchar(4) NOT NULL,
  `name` varchar(50) NOT NULL,
  `heli` tinyint(1) DEFAULT NULL,
  `inbd_comp` tinyint(1) DEFAULT NULL,
  `outbd_comp` tinyint(1) DEFAULT NULL,
  `min_ft` int(10) UNSIGNED DEFAULT NULL,
  `max_ft` int(10) UNSIGNED DEFAULT NULL,
  `latitude` float DEFAULT NULL,
  `longitude` float DEFAULT NULL,
  `polygon` mediumtext DEFAULT NULL,
  `extent` geometry NOT NULL,
  PRIMARY KEY (`id`),
  KEY `airport_icao` (`airport_icao`),
  KEY `latitude` (`latitude`),
  KEY `longitude` (`longitude`),
  SPATIAL KEY `extent` (`extent`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `token` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `pw_hash` varchar(255) NOT NULL,
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `createdtime` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `signedin_cookie` (`token`),
  KEY `email_2` (`email`),
  KEY `signedin_cookie_2` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_tracks`
--

CREATE TABLE IF NOT EXISTS `user_tracks` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int(11) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `positions` longtext NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_waypoints`
--

CREATE TABLE IF NOT EXISTS `user_waypoints` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int(10) UNSIGNED NOT NULL,
  `type` varchar(15) NOT NULL,
  `name` varchar(30) NOT NULL,
  `latitude` float NOT NULL,
  `longitude` float NOT NULL,
  `remark` varchar(30) DEFAULT NULL,
  `supp_info` varchar(255) DEFAULT NULL,
  `created_time` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `latitude` (`latitude`),
  KEY `longitude` (`longitude`),
  KEY `name` (`name`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `webcams`
--

CREATE TABLE IF NOT EXISTS `webcams` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `url` varchar(500) NOT NULL,
  `latitude` float NOT NULL,
  `longitude` float NOT NULL,
  `airport_icao` varchar(4) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `airport_icao` (`airport_icao`),
  KEY `latitude` (`latitude`),
  KEY `longitude` (`longitude`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `geonames`
--
ALTER TABLE `geonames` ADD FULLTEXT KEY `name_alt_ft` (`name`,`alternatenames`);

--
-- Indexes for table `geonames_bak`
--
ALTER TABLE `geonames_bak` ADD FULLTEXT KEY `name_alt_ft` (`name`,`alternatenames`);

--
-- Indexes for table `geonames_eu`
--
ALTER TABLE `geonames_eu` ADD FULLTEXT KEY `name_alt_ft` (`name`,`alternatenames`);

--
-- Indexes for table `openaip_airports`
--
ALTER TABLE `openaip_airports` ADD FULLTEXT KEY `name` (`name`);

--
-- Indexes for table `openaip_airports2`
--
ALTER TABLE `openaip_airports2` ADD FULLTEXT KEY `name` (`name`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `navplan`
--
ALTER TABLE `navplan`
  ADD CONSTRAINT `navplan_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `navplan_waypoints`
--
ALTER TABLE `navplan_waypoints`
  ADD CONSTRAINT `navplan_waypoints_ibfk_1` FOREIGN KEY (`navplan_id`) REFERENCES `navplan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user_waypoints`
--
ALTER TABLE `user_waypoints`
  ADD CONSTRAINT `user_waypoints_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;
