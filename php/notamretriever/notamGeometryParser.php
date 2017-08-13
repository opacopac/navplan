<?php
include_once "../config.php";
include_once "../helper.php";
include_once "../logger.php";

// TODO
$parser = new NotamGeometryParser();
$parser->go();


class NotamGeometryParser
{
    //region FIELDS

    const REGEXP_PART_COORDPAIR = '(\d{2})\D?(\d{2})\D?(\d{2}|\d{2}\.\d+)\D?(N|S)\s?(\d{2,3})\D?(\d{2})\D?(\d{2}|\d{2}\.\d+)\D?(E|W)';
    const REGEXP_PART_RADIUS = '(RADIUS|AROUND|CENTERED)';
    const REGEXP_PART_RADVAL = '(\d+[\.\,]?\d*)\s?(NM|KM|M)(?=\W)';
    const REGEXP_PART_NOBRACKETS_NUMS = '[^\(\)0-9]+?';
    const PROCESS_CHUNK_SIZE = 2000;

    private $conn;
    private $logger;

    //endregion


    //region CONSTRUCTOR / DESTRUCTOR

    function __construct()
    {
        $this->logger = new Logger(NULL);
        $this->conn = openDb();
    }


    function __destruct()
    {
        $this->conn->close();
        $this->logger->closeLog();
    }

    //endregion


    // region PUBLIC METHODS


    public function go()
    {
        $this->logger->writelog("INFO", "loading notams...");
        $notamList = $this->loadNotams();

        if (count($notamList) == 0)
        {
            $this->logger->writelog("INFO", "notam list empty, exiting.");
            return;
        }

        $this->logger->writelog("INFO", "loading extent list...");
        $extentList = $this->loadExtentList($notamList);

        // parse geometry from notam text
        $this->logger->writelog("INFO", "parse geometry from notam texts...");
        foreach ($notamList as &$notam)
        {
            $notamContent = json_decode($notam["notam"], JSON_NUMERIC_CHECK);
            $notam["geometry"] = $this->parseNotamGeometry($notamContent);
            $notam["dbExtent"] = $this->getNotamDbExtent($notamContent, $extentList[$notam["icao"]]);
        }

        $this->clearNotamGeometries();

        $notamChunkList = array_chunk($notamList, NotamGeometryParser::PROCESS_CHUNK_SIZE);
        $chunkCount = 0;
        foreach ($notamChunkList as $notamChunk)
        {
            $chunkCount++;
            $this->logger->writelog("INFO", "processing chunk " . $chunkCount . "...");

            $this->logger->writelog("INFO", "try to find matching airspace...");
            $this->tryFindMatchingAirspace($notamChunk);

            $this->logger->writelog("INFO", "save geometries to db...");
            $this->saveNotamGeometries($notamChunk);
        }

        $this->logger->writelog("INFO", "done.");
    }


    // endregion


    // region PRIVATE METHODS

    private function loadNotams()
    {
        $query = "SELECT id, icao, notam FROM icao_notam";

        $result = $this->conn->query($query);

        if ($result === FALSE)
            die("error reading notams: " . $this->conn->error . " query:" . $query);


        $notamList = array();

        while ($rs = $result->fetch_array(MYSQLI_ASSOC))
        {
            $notamList[] = array(
                "id" => $rs["id"],
                "icao" => $rs["icao"],
                "notam" => $rs["notam"]
            );
        }

        return $notamList;
    }


    private function loadExtentList($notamList)
    {
        // get distinct ICAOs
        $icaoList = [];

        foreach ($notamList as $notam)
        {
            if (!in_array($notam["icao"], $icaoList))
                $icaoList[] = $notam["icao"];
        }


        // load from db
        $query = "SELECT 'fir' AS type, icao, ST_AsText(polygon) AS polygon, NULL AS lonlat FROM icao_fir WHERE icao IN ('" . join("','", $icaoList) . "')"
            . " UNION "
            . "SELECT 'ad' AS type, icao, NULL AS polygon, ST_AsText(lonlat) as lonlat FROM openaip_airports WHERE icao IN ('" . join("','", $icaoList) . "')";

        $result = $this->conn->query($query);

        if ($result === FALSE)
            die("error reading firs/ads: " . $this->conn->error . " query:" . $query);


        // build return list
        $extentList = array();

        while ($rs = $result->fetch_array(MYSQLI_ASSOC))
        {
            $extentList[$rs["icao"]] = array(
                "type" => $rs["type"],
                "polygon" => $rs["polygon"],
                "lonlat" => $rs["lonlat"]
            );
        }

        return $extentList;
    }


    private function clearNotamGeometries()
    {
        $this->logger->writelog("INFO", "clear geometry table...");

        $query = "TRUNCATE TABLE icao_notam_geometry";
        $result = $this->conn->query($query);

        if ($result === FALSE)
            die("error truncating notam geometry table: " . $this->conn->error . " query:" . $query);
    }


    private function saveNotamGeometries($notamList)
    {
        $queryParts = [];
        foreach ($notamList as $notam)
        {
            if (!$notam["dbExtent"])
                continue;

            $geometryString = $notam["geometry"] ? "'" . checkEscapeString($this->conn, json_encode($notam["geometry"], JSON_NUMERIC_CHECK), 0, 999999999) . "'" : "NULL";

            $queryParts[] = "('"
                . checkNumeric($notam["id"]) . "',"
                . $geometryString . ","
                . $notam["dbExtent"] . ")";
        }

        if (count($queryParts) > 0) {
            $query = "INSERT INTO icao_notam_geometry (icao_notam_id, geometry, extent) VALUES " . join(",", $queryParts);
            $result = $this->conn->query($query);

            if ($result === FALSE)
                die("error adding notam geometries: " . $this->conn->error . " query:" . $query);
        }
    }


    private function parseNotamGeometry($notam)
    {
        $geometry = array();

        if ($notam["isICAO"])
        {
            $bottomTop = $this->tryParseQlineAlt($notam["all"]);
            if ($bottomTop)
            {
                $geometry["bottom"] = $bottomTop[0];
                $geometry["top"] = $bottomTop[1];
            }

            $polygon = $this->tryParsePolygon($notam["message"]);
            if ($polygon)
            {
                $geometry["polygon"] = $polygon;
                return $geometry;
            }

            $circle = $this->tryParseCircleVariant1($notam["message"]);
            if ($circle)
            {
                $geometry["center"] = $circle["center"];
                $geometry["radius"] = $circle["radius"];
                return $geometry;
            }

            $circle = $this->tryParseCircleVariant2($notam["message"]);
            if ($circle)
            {
                $geometry["center"] = $circle["center"];
                $geometry["radius"] = $circle["radius"];
                return $geometry;
            }

            $circle = $this->tryParseCircleVariant3($notam["message"]);
            if ($circle)
            {
                $geometry["center"] = $circle["center"];
                $geometry["radius"] = $circle["radius"];
                return $geometry;
            }

            $circle = $this->tryParseQlineCircle($notam["all"]);
            if ($circle)
            {
                $geometry["center"] = $circle["center"];
                $geometry["radius"] = $circle["radius"];
                return $geometry;
            }
        }
        else
        {
            $polygon = $this->tryParsePolygon($notam["all"]);
            if ($polygon)
            {
                $geometry["polygon"] = $polygon;
                return $geometry;
            }

            $circle = $this->tryParseCircleVariant1($notam["all"]);
            if ($circle)
            {
                $geometry["center"] = $circle["center"];
                $geometry["radius"] = $circle["radius"];
                return $geometry;
            }

            $circle = $this->tryParseCircleVariant2($notam["all"]);
            if ($circle)
            {
                $geometry["center"] = $circle["center"];
                $geometry["radius"] = $circle["radius"];
                return $geometry;
            }

            $circle = $this->tryParseCircleVariant3($notam["all"]);
            if ($circle)
            {
                $geometry["center"] = $circle["center"];
                $geometry["radius"] = $circle["radius"];
                return $geometry;
            }
        }

        // no match
        return null;
    }


    private function getNotamDbExtent($notam, $locationExtent)
    {
        // polygon geometry
        if ($notam["geometry"] && $notam["geometry"]["polygon"])
            return getDbPolygonString($notam["geometry"]["polygon"]);


        // circle geometry
        if ($notam["geometry"] && $notam["geometry"]["center"]) {
            $center = $notam["geometry"]["center"];
            $radius = $notam["geometry"]["radius"];
            $polygon = getCircleExtent($center[1], $center[0], $radius);

            return getDbPolygonString($polygon);
        }


        // circle from qline
        if ($notam["isICAO"])
        {
            $geometry = $this->tryParseQlineCircle($notam["all"]);

            if ($geometry)
            {
                $polygon = getCircleExtent($geometry["center"][1], $geometry["center"][0], $geometry["radius"]);
                return getDbPolygonString($polygon);
            }
        }


        // ad notam
        if ($locationExtent["type"] == "ad")
        {
            $lonLat = parseLonLatFromDbPoint($locationExtent["lonlat"]);
            $polygon = getCircleExtent($lonLat[1], $lonLat[0], 1852 * 5);

            return getDbPolygonString($polygon);
        }


        // fir notam
        if ($locationExtent["type"] == "fir")
            return "ST_GeomFromText('" . $locationExtent["polygon"] . "')";


        // no extent found
        return null;
    }


    // detect polygon in notam text: 463447N0062121E, 341640N0992240W, without coordinates in brackets
    private function tryParsePolygon($text)
    {
        $regExp = "/(" . NotamGeometryParser::REGEXP_PART_NOBRACKETS_NUMS . "(" . NotamGeometryParser::REGEXP_PART_COORDPAIR . "))+?/im";
        $result = preg_match_all($regExp, $text, $matches, PREG_SET_ORDER);

        if ($result && count($matches) >= 3)
        {
            $polygon = [];

            foreach ($matches as $match)
            {
                $coord = getLonLatFromGradMinSec($match[3], $match[4], $match[5], $match[6], $match[7], $match[8], $match[9], $match[10]);
                $polygon[] = $coord;
            }

            return $polygon;
        }

        // no match
        return null;
    }


    // detect circle in notam text: 462340N0070230E RADIUS 3.0 NM
    private function tryParseCircleVariant1($text)
    {
        $regExp = "/" . NotamGeometryParser::REGEXP_PART_COORDPAIR . NotamGeometryParser::REGEXP_PART_NOBRACKETS_NUMS . NotamGeometryParser::REGEXP_PART_RADIUS . NotamGeometryParser::REGEXP_PART_NOBRACKETS_NUMS . NotamGeometryParser::REGEXP_PART_RADVAL . "/im";
        $result = preg_match($regExp, $text, $matches);

        if ($result)
        {
            $center = getLonLatFromGradMinSec($matches[1], $matches[2], $matches[3], $matches[4], $matches[5], $matches[6], $matches[7], $matches[8]);
            $meterFactor = getMeterFactor($matches[11]);
            $radius = floatval(str_replace(",", ".", $matches[10])) * $meterFactor;

            $geometry["center"] = $center;
            $geometry["radius"] = $radius;

            return $geometry;
        }

        // no match
        return null;
    }


    // detect circle in notam text: 3NM RADIUS OF 522140N 0023246W
    private function tryParseCircleVariant2($text)
    {
        $regExp = "/" . NotamGeometryParser::REGEXP_PART_RADVAL . NotamGeometryParser::REGEXP_PART_NOBRACKETS_NUMS . NotamGeometryParser::REGEXP_PART_RADIUS . NotamGeometryParser::REGEXP_PART_NOBRACKETS_NUMS . NotamGeometryParser::REGEXP_PART_COORDPAIR . "/im";
        $result = preg_match($regExp, $text, $matches);

        if ($result)
        {
            $center = getLonLatFromGradMinSec($matches[4], $matches[5], $matches[6], $matches[7], $matches[8], $matches[9], $matches[10], $matches[11]);
            $meterFactor = getMeterFactor($matches[2]);
            $radius = floatval(str_replace(",", ".", $matches[1])) * $meterFactor;

            $geometry["center"] = $center;
            $geometry["radius"] = $radius;

            return $geometry;
        }

        // no match
        return null;
    }


    // detect circle in notam text: RADIUS 2NM CENTERED ON 473814N 0101548E
    private function tryParseCircleVariant3($text)
    {
        $regExp = "/" . NotamGeometryParser::REGEXP_PART_RADIUS . NotamGeometryParser::REGEXP_PART_NOBRACKETS_NUMS . NotamGeometryParser::REGEXP_PART_RADVAL . NotamGeometryParser::REGEXP_PART_NOBRACKETS_NUMS . NotamGeometryParser::REGEXP_PART_COORDPAIR . "/im";
        $result = preg_match($regExp, $text, $matches);

        if ($result)
        {
            $center = getLonLatFromGradMinSec($matches[4], $matches[5], $matches[6], $matches[7], $matches[8], $matches[9], $matches[10], $matches[11]);
            $meterFactor = getMeterFactor($matches[3]);
            $radius = floatval(str_replace(",", ".", $matches[2])) * $meterFactor;

            $geometry["center"] = $center;
            $geometry["radius"] = $radius;

            return $geometry;
        }

        // no match
        return null;
    }


    // detect circle in q-line: Q) EGTT/QWZLW/IV/M  /W /000/024/5222N00233W003\nA)
    private function tryParseQlineCircle($text)
    {
        //$regExp = '/Q\)\s*(\w{4})\/Q(\w{2}\w{2})\/(\w*)\s*\/(\w*)\s*\/\d{3}\/\d{3}\/';
        $regExp = '/Q\).+?((\d{2})(\d{2})([NS])\s?(\d{3})(\d{2})([EW])(\d{3}))\s+A\)/im';
        $result = preg_match($regExp, $text, $matches);

        if ($result && $matches[8] < 999)
        {
            $center = getLonLatFromGradMinSec($matches[2], $matches[3], "00", $matches[4], $matches[5], $matches[6], "00", $matches[7]);
            $meterFactor = getMeterFactor("NM");
            $radius = intval($matches[8]) * $meterFactor;

            $geometry["center"] = $center;
            $geometry["radius"] = $radius;

            return $geometry;
        }

        // no match
        return null;
    }


    // detect min / max height in q-line: Q) EGTT/QWZLW/IV/M  /W /000/024/5222N00233W003\nA)
    private function tryParseQlineAlt($text)
    {
        $regExp = '/\s+F\)\s*(\S+.*)\s+G\)\s*(\S+.*)\s+/im';
        $result = preg_match($regExp, $text, $matches);

        if (!$result || count($matches) != 3)
            return null;

        $bottom = $this->parseFlightLevel($matches[1]);
        $top = $this->parseFlightLevel($matches[2]);

        return [$bottom, $top];
    }


    private function parseFlightLevel($altText) // TODO
    {
        $altText = preg_replace("/[^\w\d]/im", "", strtoupper(trim($altText)));
        $regExpAmsl = "/^(\d+)(FT|M)(AMSL|MSL)$/";
        $regExpAgl = "/^(\d+)(FT|M)(AGL|ASFC)$/";
        $regExpFl = "/^FL(\d+)$/";

        if ($altText == "SFC" || $altText == "GND")
            return 0;

        if ($altText == "UNL")
            return 999;

        if (preg_match($regExpFl, $altText, $matches))
            return intval($matches[1]);

        if (preg_match($regExpAmsl, $altText, $matches))
            return $matches[2] == "FT" ? round(intval($matches[1]) / 100) : round(m2ft(intval($matches[1])) / 100);

        if (preg_match($regExpAgl, $altText, $matches))
            return $matches[2] == "FT" ? round(intval($matches[1]) / 100) : round(m2ft(intval($matches[1])) / 100);

        return 0;
    }


    private function tryFindMatchingAirspace(&$notamList)
    {
        // load intersecting airspaces from db
        $typeCatDict = array("RP" => "PROHIBITED", "RR" => "RESTRICTED", "RT" => "RESTRICTED", "RD" => "DANGER", "RM" => "DANGER");

        $queryParts = [];
        foreach ($notamList as $index=>$notam)
        {
            $notamContent = json_decode($notam["notam"], JSON_NUMERIC_CHECK);
            $notamType = strtoupper(substr($notamContent["Qcode"], 0, 2));

            if (array_key_exists($notamType, $typeCatDict) && $notam["dbExtent"])
            {
                $query = "SELECT '" . $index . "' AS notamindex, asp.name AS name, asp.polygon AS polygon FROM openaip_airspace AS asp"
                    . " LEFT JOIN icao_fir AS fir ON fir.icao = '" . $notam["icao"] . "'"
                    . " WHERE ST_INTERSECTS(" . $notam["dbExtent"] . ", asp.extent) AND asp.category = '" . $typeCatDict[$notamType] . "'"
                    . " AND (ST_INTERSECTS(asp.extent, fir.polygon) OR fir.icao IS NULL)";

                $queryParts[] = $query;
            }
        }

        if (count($queryParts) == 0)
            return;

        $query = join(" UNION ", $queryParts);
        $result = $this->conn->query($query);

        if ($result === FALSE)
            die("error searching airspace: " . $this->conn->error . " query:" . $query);

        if ($result->num_rows == 0)
            return;


        // try to find name of airspace in notam text
        while ($rs = $result->fetch_array(MYSQLI_ASSOC))
        {
            $index = intval($rs["notamindex"]);
            $notam = &$notamList[$index];
            $notamContent = json_decode($notam["notam"], JSON_NUMERIC_CHECK);

            if ($this->isAreaNameMatch($rs["name"], $notamContent["message"]))
            {
                $top = $notam["geometry"] && $notam["geometry"]["top"] ? $notam["geometry"]["top"] : NULL;
                $bottom = $notam["geometry"] && $notam["geometry"]["bottom"] ? $notam["geometry"]["bottom"] : NULL;
                $polygon = convertDbPolygonToArray($rs["polygon"]);

                if (!$notam["airspaceGeometry"])
                    $notam["airspaceGeometry"] = [];

                $notam["airspaceGeometry"][] = array("polygon" => $polygon, "top" => $top, "bottom" => $bottom);
            }
        }

        foreach ($notamList as &$notam)
        {
            if (isset($notam["airspaceGeometry"]) && count($notam["airspaceGeometry"]) > 0)
            {
                if (count($notam["airspaceGeometry"]) == 1)
                {
                    $notam["geometry"] = array(
                        "polygon" => $notam["airspaceGeometry"][0]["polygon"],
                        "bottom" => $notam["airspaceGeometry"][0]["bottom"],
                        "top" => $notam["airspaceGeometry"][0]["top"]
                    );
                    $notam["dbExtent"] = getDbPolygonString($notam["airspaceGeometry"][0]["polygon"]);
                }
                else
                {
                    $multipolygon = [];
                    foreach ($notam["airspaceGeometry"] as $asGeom)
                        $multipolygon[] = $asGeom["polygon"];

                    $notam["geometry"] = array(
                        "multipolygon" => $multipolygon,
                        "bottom" => $notam["airspaceGeometry"][0]["bottom"],
                        "top" => $notam["airspaceGeometry"][0]["top"]
                    );
                    $notam["dbExtent"] = getDbMultiPolygonString($multipolygon);
                }
            }
        }

    }


    private function isAreaNameMatch($airspaceName, $notamText)
    {
        // try formats like LS-D15 Rossboden - Chur  or  LI R108/B-Colico bis (approx confine stato)
        $regExpAreaName = '/^([^\d]+\d+)[^\w\d]*([\w]{0,2}(?=)([^\w]|$))?/i';
        $result = preg_match($regExpAreaName, $airspaceName, $matches);

        if ($result && count($matches) > 0)
        {
            $areaName = $this->simplifyText($matches[1] . $matches[2]);
            $simpleNotamText = $this->simplifyText($notamText);

            if (strpos($simpleNotamText, $areaName) !== false)
                return true;
        }


        // TODO: plain text area names
        // try format XXX YYY (124.245)
        $regExpAreaName = '/^([^\(\)\:]{4,})/i';
        $result = preg_match($regExpAreaName, $airspaceName, $matches);

        if ($result && count($matches) > 0)
        {
            $areaName = $this->simplifyText($matches[1]);
            $simpleNotamText = $this->simplifyText($notamText);
            if (strpos($simpleNotamText, $areaName) !== false)
                return true;
        }

        return false;
    }


    // simplyfy text (remove all non-word and non-digits
    private function simplifyText($text)
    {
        return strtoupper(preg_replace("/[^\w\d]/im", "", $text));
    }

    // endregion
}

