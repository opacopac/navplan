<?php
include_once "../config.php";
include_once "../helper.php";
include_once "../logger.php";

// TODO
$parser = new NotamGeometryParser();

if ($_GET["testnotamid"])
    $parser->test($_GET["testnotamid"]);
else
    $parser->go();


class NotamGeometryParser
{
    //region FIELDS

    const REGEXP_PART_COORDPAIR = '(\d{2})\D?(\d{2})\D?(\d{2}|\d{2}\.\d+)\D?(N|S)\s?(\d{2,3})\D?(\d{2})\D?(\d{2}|\d{2}\.\d+)\D?(E|W)';
    const REGEXP_PART_RADIUS = '(RADIUS|AROUND|CENTERED)';
    const REGEXP_PART_RADVAL = '(\d+[\.\,]?\d*)\s?(NM|KM|M)(?=\W)';
    const REGEXP_PART_NOBRACKETS_NUMS = '[^\(\)0-9]+?';
    const PROCESS_CHUNK_SIZE = 100;

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


    public function test($testNotamId)
    {
        $this->logger->addOutputLogLevel("DEBUG");

        $testNotamId = checkEscapeString($this->conn, $testNotamId, 1, 20);
        $this->logger->writelog("INFO", "loading test notam '" . $testNotamId . "'...");
        $notamList = $this->loadNotams($testNotamId);

        if (count($notamList) == 0)
        {
            $this->logger->writelog("WARNING", "notam not found, exiting.");
            return;
        }


        $this->logger->writelog("DEBUG", count($notamList) . " notams found");

        foreach ($notamList as $notam)
        {
            $this->logger->writelog("DEBUG", "id: " . $notam["id"]);
            $this->logger->writelog("DEBUG", "icao: " . $notam["icao"]);
            $this->logger->writelog("DEBUG", "notam: " . $notam["notam"]);

            $this->logger->writelog("INFO", "loading extent list...");
        }

        $extentList = $this->loadExtentList($notamList);


        $this->logger->writelog("INFO", "parse geometry from notam texts...");
        foreach ($notamList as &$notam)
        {
            $this->logger->writelog("DEBUG", "notam id:" . $notam["id"]);
            $notamContent = json_decode($notam["notam"], JSON_NUMERIC_CHECK);
            $notam["geometry"] = $this->parseNotamGeometry($notamContent);
            $notam["dbExtent"] = $this->getNotamDbExtent($notamContent, $extentList[$notam["icao"]]);
        }

        // try match with airspace name
        $this->logger->writelog("INFO", "try to find matching airspace...");
        $this->tryFindMatchingAirspace($notamList);

        foreach ($notamList as $notam)
        {
            // print notam geometries
            if ($notam["geometry"]["center"])
                $this->logger->writelog("DEBUG", "geometry.center:" . implode(",", $notam["geometry"]["center"]));

            if ($notam["geometry"]["radius"])
                $this->logger->writelog("DEBUG", "geometry.radius:" . $notam["geometry"]["radius"]);

            if ($notam["geometry"]["polygon"])
                $this->logger->writelog("DEBUG", "geometry.polygon:" . array_implode(",", " ", $notam["geometry"]["polygon"]));

            if ($notam["geometry"]["top"])
                $this->logger->writelog("DEBUG", "geometry.top:" . $notam["geometry"]["top"]);

            if ($notam["geometry"]["bottom"])
                $this->logger->writelog("DEBUG", "geometry.bottom:" . $notam["geometry"]["bottom"]);

            if ($notam["geometry"]["dbExtent"])
                $this->logger->writelog("DEBUG", "dbExtent:" . $notam["dbExtent"]);
        }

        $this->logger->writelog("INFO", "done.");
    }


    public function go()
    {
        $this->logger->writelog("INFO", "loading notams...");
        $notamList = $this->loadNotams();

        if (count($notamList) == 0)
        {
            $this->logger->writelog("WARNING", "notam list empty, exiting.");
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
            $notam["dbExtent"] = $this->getNotamDbExtent($notam, $extentList[$notam["icao"]]);
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

    private function loadNotams($notamId = NULL) // id optional (returns all notams if empty)
    {
        $query = "SELECT id, icao, notam FROM icao_notam";

        if ($notamId)
            $query .= " WHERE notam_id='" . $notamId . "'";

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
            $this->logger->writelog("DEBUG", "notam format: icao");

            $bottomTop = $this->tryParseQlineAlt($notam["all"]);
            if ($bottomTop)
            {
                $this->logger->writelog("DEBUG", "qline top/bottom found: " . $bottomTop[0] . ", " . $bottomTop[1]);

                $geometry["bottom"] = $bottomTop[0];
                $geometry["top"] = $bottomTop[1];
            }

            $isMixedPolyCircle = false;
            $polygon = $this->tryParsePolygon2($notam["message"]);
            if ($polygon)
            {
                if (strpos($notam["message"], "CIRCLE") === FALSE)
                {
                    $this->logger->writelog("DEBUG", "pure polygon geometry in message found: " . array_implode(",", " ", $polygon));

                    $geometry["polygon"] = $polygon;
                    return $geometry;
                }
                else
                {
                    $this->logger->writelog("DEBUG", "mixed polygon+circle geometry in message found");

                    $isMixedPolyCircle = true;
                }
            }

            if (!$isMixedPolyCircle)
            {
                $circle = $this->tryParseCircleVariant1($notam["message"]);
                if ($circle)
                {
                    $this->logger->writelog("DEBUG", "circle geometry v1 in message found: " . implode(",", $circle["center"]) . " radius: " . $circle["radius"]);

                    $geometry["center"] = $circle["center"];
                    $geometry["radius"] = $circle["radius"];
                    return $geometry;
                }

                $circle = $this->tryParseCircleVariant2($notam["message"]);
                if ($circle)
                {
                    $this->logger->writelog("DEBUG", "circle geometry v2 in message found: " . implode(",", $circle["center"]) . " radius: " . $circle["radius"]);

                    $geometry["center"] = $circle["center"];
                    $geometry["radius"] = $circle["radius"];
                    return $geometry;
                }

                $circle = $this->tryParseCircleVariant3($notam["message"]);
                if ($circle)
                {
                    $this->logger->writelog("DEBUG", "circle geometry v3 in message found: " . implode(",", $circle["center"]) . " radius: " . $circle["radius"]);

                    $geometry["center"] = $circle["center"];
                    $geometry["radius"] = $circle["radius"];
                    return $geometry;
                }
            }

            $circle = $this->tryParseQlineCircle($notam["all"]);
            if ($circle)
            {
                $this->logger->writelog("DEBUG", "circle geometry in qline found: " . implode(",", $circle["center"]) . " radius: " . $circle["radius"]);

                $geometry["center"] = $circle["center"];
                $geometry["radius"] = $circle["radius"];
                return $geometry;
            }
        }
        else
        {
            $this->logger->writelog("DEBUG", "notam format: non-icao");

            $polygon = $this->tryParsePolygon2($notam["all"]);
            if ($polygon)
            {
                $this->logger->writelog("DEBUG", "pure polygon geometry in message found: " . implode(",", $polygon));

                $geometry["polygon"] = $polygon;
                return $geometry;
            }

            $circle = $this->tryParseCircleVariant1($notam["all"]);
            if ($circle)
            {
                $this->logger->writelog("DEBUG", "circle geometry v1 in message found: " . implode(",", $circle["center"]) . " radius: " . $circle["radius"]);

                $geometry["center"] = $circle["center"];
                $geometry["radius"] = $circle["radius"];
                return $geometry;
            }

            $circle = $this->tryParseCircleVariant2($notam["all"]);
            if ($circle)
            {
                $this->logger->writelog("DEBUG", "circle geometry v2 in message found: " . implode(",", $circle["center"]) . " radius: " . $circle["radius"]);

                $geometry["center"] = $circle["center"];
                $geometry["radius"] = $circle["radius"];
                return $geometry;
            }

            $circle = $this->tryParseCircleVariant3($notam["all"]);
            if ($circle)
            {
                $this->logger->writelog("DEBUG", "circle geometry v3 in message found: " . implode(",", $circle["center"]) . " radius: " . $circle["radius"]);

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
        {
            $this->logger->writelog("DEBUG", "using polygon geometry as db extent");

            return getDbPolygonString($notam["geometry"]["polygon"]);
        }


        // circle geometry
        if ($notam["geometry"] && $notam["geometry"]["center"])
        {
            $this->logger->writelog("DEBUG", "using circle geometry as db extent");

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
                $this->logger->writelog("DEBUG", "using q-line circle geometry as db extent");

                $polygon = getCircleExtent($geometry["center"][1], $geometry["center"][0], $geometry["radius"]);
                return getDbPolygonString($polygon);
            }
        }


        // ad notam
        if ($locationExtent["type"] == "ad")
        {
            $this->logger->writelog("DEBUG", "using ad coordinates + 5nm as db extent");

            $lonLat = parseLonLatFromDbPoint($locationExtent["lonlat"]);
            $polygon = getCircleExtent($lonLat[1], $lonLat[0], 1852 * 5);

            return getDbPolygonString($polygon);
        }


        // fir notam
        if ($locationExtent["type"] == "fir")
        {
            $this->logger->writelog("DEBUG", "using fir polygon geometry as db extent");

            return "ST_GeomFromText('" . $locationExtent["polygon"] . "')";
        }


        // no extent found
        $this->logger->writelog("DEBUG", "no geometry found as db extent");

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


    // detect polygon in notam text: 463447N0062121E, 341640N0992240W, 1st: without coordinates in brackets, 2nd: including coordinates in brackets
    // e.g. ... 472401N0083320E 472315N0082918E 471935N0083439E 472103N0083855E 472119N0083657E 472137N0083602E 472215N0083450E (CENTER POINT 472209N0083406E RADIUS 3.5 NM) ...
    private function tryParsePolygon2($text)
    {
        $regExp = "/" . NotamGeometryParser::REGEXP_PART_COORDPAIR . "/im";

        // try without text in brackets
        $textNoBrackets = $this->getNonBracketText($text);
        $this->logger->writelog("DEBUG", "text: " . $text);
        $this->logger->writelog("DEBUG", "non bracket text: " . $textNoBrackets);

        $result = preg_match_all($regExp, $textNoBrackets, $matches, PREG_SET_ORDER);

        if ($result && count($matches) >= 3)
        {
            $polygon = [];

            foreach ($matches as $match)
            {
                $coord = getLonLatFromGradMinSec($match[1], $match[2], $match[3], $match[4], $match[5], $match[6], $match[7], $match[8]);
                $polygon[] = $coord;
            }

            return $polygon;
        }

        // try with text in brackets
        $result = preg_match_all($regExp, $text, $matches, PREG_SET_ORDER);
        if ($result && count($matches) >= 3)
        {
            $polygon = [];

            foreach ($matches as $match)
            {
                $coord = getLonLatFromGradMinSec($match[1], $match[2], $match[3], $match[4], $match[5], $match[6], $match[7], $match[8]);
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
        $typeCatDict = array("RP" => ["PROHIBITED"], "RR" => ["RESTRICTED"], "RT" => ["RESTRICTED"], "RD" => ["DANGER", "PROHIBITED"], "RM" => ["DANGER", "RESTRICTED", "PROHIBITED"]);

        $queryParts = [];
        foreach ($notamList as $index=>$notam)
        {
            $notamContent = json_decode($notam["notam"], JSON_NUMERIC_CHECK);
            $notamType = strtoupper(substr($notamContent["Qcode"], 0, 2));

            if (array_key_exists($notamType, $typeCatDict) && $notam["dbExtent"])
            {
                $query = "SELECT '" . $index . "' AS notamindex, asp.name AS name, asp.polygon AS polygon FROM openaip_airspace AS asp"
                    . " LEFT JOIN icao_fir AS fir ON fir.icao = '" . $notam["icao"] . "'"
                    . " WHERE ST_INTERSECTS(" . $notam["dbExtent"] . ", asp.extent) AND asp.category IN('" . join("','", $typeCatDict[$notamType]) . "')"
                    . " AND (ST_INTERSECTS(asp.extent, fir.polygon) OR fir.icao IS NULL)";

                $queryParts[] = $query;
            }
            else {
                $this->logger->writelog("DEBUG", "no matching airspace type for notam type '" . $notamType . "'");
                $this->logger->writelog("DEBUG", "or db extent is null: '" . $notam["dbExtent"] . "'");
            }
        }

        if (count($queryParts) == 0)
        {
            return;
        }

        $query = join(" UNION ", $queryParts);
        $result = $this->conn->query($query);

        if ($result === FALSE)
            die("error searching airspace: " . $this->conn->error . " query:" . $query);

        if ($result->num_rows == 0)
        {
            $this->logger->writelog("DEBUG", "no intersecting airspaces found");
            return;
        }
        else
            $this->logger->writelog("DEBUG", $result->num_rows . " intersecting airspaces found");



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

            $this->logger->writelog("DEBUG", "numeric airspace id found, search for '" . $areaName . "' in simplifyed notam text...");

            if (strpos($simpleNotamText, $areaName) !== false)
            {
                $this->logger->writelog("DEBUG", "...found");
                return true;
            }
            else
                $this->logger->writelog("DEBUG", "...not found");
        }


        // TODO: plain text area names
        // try format XXX YYY (124.245)
        $regExpAreaName = '/^([^\(\)\:]{4,})/i';
        $result = preg_match($regExpAreaName, $airspaceName, $matches);

        if ($result && count($matches) > 0)
        {
            $areaName = $this->simplifyText($matches[1]);
            $simpleNotamText = $this->simplifyText($notamText);

            $this->logger->writelog("DEBUG", "text airspace name found, search for '" . $areaName . "' in simplifyed notam text...");

            if (strpos($simpleNotamText, $areaName) !== false)
            {
                $this->logger->writelog("DEBUG", "...found");
                return true;
            }
            else
                $this->logger->writelog("DEBUG", "...not found");
        }

        return false;
    }


    // simplyfy text (remove all non-word and non-digits
    private function simplifyText($text)
    {
        $pattern = "/[^\w\d]/im";
        return strtoupper(preg_replace($pattern, "", $text));
    }


    private function getNonBracketText($text)
    {
        $pattern = "/\(.+?\)/ims";
        //$pattern = '/\(.*\)/im';
        return preg_replace($pattern, "", $text);
    }


    private function normalizeCoordinates($text)
    {
        // switzerland, holland, sweden, finland, russia, turkey, greece, egypt, saudi arabia:
        // 465214N0090638E

        // germany, france, england, ukraine, iran, irak
        // 462600N 0022630E, 483441N 101110E

        // uae
        // 255002.25N 0535024.74E

        // oman
        // 1850.85N05217.50E (= 185085N 0521750E)

        // austria:
        // N475145.00 E0141828.00

        // brasil:
        // 033617N/0502606W or 335928S/0514745W

        //const REGEXP_PART_COORDPAIR = '(\d{2})\D?(\d{2})\D?(\d{2}|\d{2}\.\d+)\D?(N|S)\s?(\d{2,3})\D?(\d{2})\D?(\d{2}|\d{2}\.\d+)\D?(E|W)';
        //TODO
    }


    // endregion
}

