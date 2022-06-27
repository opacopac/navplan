<?php
require_once "config.php";
require_once "helper.php";

class TerrainHelper
{
    //region FIELDS

    const TERRAIN_TILE_BASE_DIR = '../terraintiles/';
    const TERRAIN_TILE_SUFFIX = '.hgt';
    const LINE_SIZE = 1201;
    const MAX_LINES = 1201;
    const RESOLUTION_M = 100;
    const MAX_STEPS = 1000;
    const MAX_AIRSPACES_PER_LEG = 100;

    private $openTileFiles;
    private $conn;

    //endregion


    //region CONSTRUCTOR / DESTRUCTOR

    function __construct($existing_connection = null)
    {
        $this->openTileFiles = array();

        if ($existing_connection) {
            $this->conn = $existing_connection;
        } else {
            $this->conn = openDb();
        }
    }


    function __destruct()
    {
        $this->closeFiles();
        $this->conn->close();
    }

    //endregion


    //region PUBLIC FUNCTIONS

    public function getElevationMeters($position)
    {
        $filepath = $this->getTerrainFilePath($position);
        $file = $this->getFile($filepath);

        if ($file == null) // empty values => assume 0m
            return 0;

        $seekPos = $this->getSeekPos($position);
        fseek($file, $seekPos);
        $value = fread($file, 2);
        $elevation = $this->getElevationFromFileValue($value);

        return $elevation;
    }


    public function getTerrainInfo($positions)
    {
        if (count($positions) < 2)
            die("ERROR: min. 2 positions necessary ");

        // calc distances & step size
        $routeDist = 0;
        $legDist = [];
        for ($i = 0; $i < count($positions) - 1; $i++)
        {
            $dist = calcDistanceMeters($positions[$i][1], $positions[$i][0], $positions[$i + 1][1], $positions[$i + 1][0]);
            $legDist[] = $dist;
            $routeDist += $dist;
        }

        $stepSize = max(self::RESOLUTION_M, $routeDist / self::MAX_STEPS);


        $terrainInfo = array();
        $terrainInfo["legs"] = [];

        $currentAirspaceHeights = array();
        $routeAirspaces = [];
        $routeElevations = [];
        $currentRouteDist = 0;
        $routeMaxElevation = -10000;

        for ($legNum = 0; $legNum < count($positions) - 1; $legNum++) // iterate over legs
        {
            $pos1 = $positions[$legNum];
            $pos2 = $positions[$legNum + 1];

            // get airspace intersections for leg
            $legAirspaces = $this->getLegAirspaces($pos1, $pos2);
            $legAirspaceIsections = array();
            foreach ($legAirspaces as $airspace)
            {
                $legAirspaceIsections[$airspace->id] = getLinePolygonIntersections($pos1, $pos2, $airspace->polygon);
                $legAirspaceIsWithin[$airspace->id] = isPointInPolygon($pos1, $airspace->polygon);
            }

            $legMaxElevation = -10000;
            $deltaLat = ($pos2[1] - $pos1[1]) / $legDist[$legNum] * $stepSize;
            $deltaLon = ($pos2[0] - $pos1[0]) / $legDist[$legNum] * $stepSize;

            for ($i = 0; $i < $legDist[$legNum] / $stepSize; $i++) // iterate over steps
            {
                // get step coordinates & current distance
                $lat = $pos1[1] + $deltaLat * $i;
                $lon = $pos1[0] + $deltaLon * $i;
                $nextLat = $lat + $deltaLat;
                $nextLon = $lon + $deltaLon;
                $currentDist = round($currentRouteDist + $stepSize * $i, 0);

                // get step elevation
                $elevation = $this->getElevationMeters([$lon, $lat]);
                $routeElevations[] = [$currentDist, $elevation];
                $routeMaxElevation = max($routeMaxElevation, $elevation);
                $legMaxElevation = max($legMaxElevation, $elevation);


                // get step heigths per airspace
                foreach ($legAirspaces as $airspace)
                {
                    if ($legAirspaceIsWithin[$airspace->id])
                    {
                        if (!isset($currentAirspaceHeights[$airspace->id]))
                            $currentAirspaceHeights[$airspace->id] = array("category" => $airspace->category, "name" => $airspace->name, "heights" => []);

                        $currentAirspaceHeights[$airspace->id]["heights"][] = $this->getAirspaceHeights($airspace, $elevation, $currentDist);
                    }
                    else if (isset($currentAirspaceHeights[$airspace->id])) // "close" airspace
                    {
                        $currentAirspaceHeights[$airspace->id]["heights"][] = $this->getAirspaceHeights($airspace, $elevation, $currentDist);
                        $routeAirspaces[] = $currentAirspaceHeights[$airspace->id];
                        $currentAirspaceHeights[$airspace->id] = NULL;
                    }

                    // check if next step will be crossing airspace
                    foreach ($legAirspaceIsections[$airspace->id] as $point)
                    {
                        if (isWithinRectangle([$lon, $lat], [$nextLon, $nextLat], $point, 0.00000001))
                            $legAirspaceIsWithin[$airspace->id] = !$legAirspaceIsWithin[$airspace->id];
                    }
                }


                // add last point of last leg "manually"
                if ($legNum == count($positions) - 2 && $i + 1 > $legDist[$legNum] / $stepSize)
                {
                    // elevation
                    $pos = $positions[count($positions) - 1];
                    $elevation = $this->getElevationMeters($pos);
                    $routeElevations[] = [$routeDist, $elevation];
                    $routeMaxElevation = max($routeMaxElevation, $elevation);
                    $legMaxElevation = max($legMaxElevation, $elevation);

                    // airspaces
                    foreach ($legAirspaces as $airspace)
                    {
                        if ($legAirspaceIsWithin[$airspace->id] && isset($currentAirspaceHeights[$airspace->id]))
                            $currentAirspaceHeights[$airspace->id]["heights"][] = $this->getAirspaceHeights($airspace, $elevation, $routeDist);
                    }
                }
            }

            // add leg info
            $legInfo = array();
            $legInfo["position1"] = array("longitude" => $pos1[0], "latitude" => $pos1[1]);
            $legInfo["position2"] = array("longitude" => $pos2[0], "latitude" => $pos2[1]);
            $legInfo["distance_m"] = round($legDist[$legNum], 0);
            $legInfo["maxelevation_m"] = round($legMaxElevation, 0);
            $terrainInfo["legs"][] = $legInfo;

            $currentRouteDist += $legDist[$legNum];
        }

        // "close" & add airspaces
        foreach ($currentAirspaceHeights as $asHeight)
        {
            if (isset($asHeight))
                $routeAirspaces[] = $asHeight;
        }

        // add terrain info
        $terrainInfo["elevations_m"] = $routeElevations;
        $terrainInfo["totaldistance_m"] = round($routeDist, 0);
        $terrainInfo["maxelevation_m"] = round($routeMaxElevation, 0);
        $terrainInfo["airspaces"] = $routeAirspaces;

        return $terrainInfo;
    }


    //endregion


    //region PRIVATE FUNCTIONS

    private function getTerrainFilePath($position)
    {
        $lon = $position[0];
        $lat = $position[1];

        $filename = $lat >= 0 ? "N" : "S";
        $filename .= zeroPad(abs(floor($lat)), 2);
        $filename .= $lon >= 0 ? "E" : "W";
        $filename .= zeroPad(abs(floor($lon)), 3);

        return self::TERRAIN_TILE_BASE_DIR . $filename . self::TERRAIN_TILE_SUFFIX;
    }


    private function getFile($filepath)
    {
        if (isset($this->openTileFiles[$filepath]))
            return $this->openTileFiles[$filepath];

        if (!file_exists($filepath))
            return null;

        $file = fopen($filepath, "r");
        $this->openTileFiles[$filepath] = $file;

        return $file;
    }


    private function closeFiles()
    {
        foreach ($this->openTileFiles as $file)
            fclose($file);
    }


    private function getSeekPos($position)
    {
        $lonProc = $position[0] - floor($position[0]);
        $latProc = $position[1] - floor($position[1]);
        $latProc = 1.00 - $latProc;

        $line = floor($latProc * (self::MAX_LINES - 1));
        $col = floor($lonProc * (self::LINE_SIZE - 1));
        $seekPos = 2 * ($line * self::LINE_SIZE + $col);

        return $seekPos;
    }


    private function getElevationFromFileValue($value)
    {
        $tmpVal = unpack("n", $value);
        $height = $tmpVal[1];
        if ($height >= pow(2, 15))
            $height -= pow(2, 16);

        return $height;
    }


    private function getLegAirspaces($pos1, $pos2)
    {
        $query = "SELECT air.* ";
        $query .= " FROM openaip_airspace AS air";
        $query .= " WHERE";
        $query .= "  air.category NOT IN ('FIR', 'UIR') ";
        $query .= "    AND ";
        $query .= "  ST_INTERSECTS(ST_GEOMFROMTEXT('LINESTRING(" . $pos1[0] . " " . $pos1[1] . "," .  $pos2[0] . " " . $pos2[1] . ")'), extent) LIMIT " . self::MAX_AIRSPACES_PER_LEG;
        $result = $this->conn->query($query);

        $airspaces = [];

        while ($rs = $result->fetch_array(MYSQLI_ASSOC))
            $airspaces[] = new Airspace($rs);

        return $airspaces;
    }


    private function getAirspaceHeights($airspace, $elevation, $distance)
    {
        $bottomHeight = round($airspace->alt_bottom->getAmslHeightMeters($elevation), 0);
        $topHeight = round($airspace->alt_top->getAmslHeightMeters($elevation), 0);
        return [ $distance, $bottomHeight, $topHeight ];
    }

    //endregion
}


class Airspace
{
    public $id;
    public $category;
    public $name;
    public $alt_top;
    public $alt_bottom;
    public $polygon;


    function __construct($rs)
    {
        $this->id = $rs["id"];
        $this->category = $rs["category"];
        $this->name = $rs["name"];
        $this->alt_top = new Height($rs["alt_top_reference"], $rs["alt_top_height"], $rs["alt_top_unit"]);
        $this->alt_bottom = new Height($rs["alt_bottom_reference"], $rs["alt_bottom_height"], $rs["alt_bottom_unit"]);
        $this->setPolygonFromString($rs["polygon"]);
    }


    private function setPolygonFromString($polygonString)
    {
        $this->polygon = [];

        $coordinates = explode(",", $polygonString);

        foreach ($coordinates as $pos)
        {
            $lonLat = explode(" ", trim($pos), 2);
            $this->polygon[] = [floatval($lonLat[0]), floatval($lonLat[1])];
        }
    }
}


class Height
{
    public $reference;
    public $height;
    public $unit;


    function __construct($reference, $height, $unit)
    {
        $this->reference = $reference;
        $this->height = $height;
        $this->unit = $unit;
    }


    public function getAmslHeightMeters($elevation_m)
    {
        switch ($this->reference)
        {
            case "GND":
                return $elevation_m + ft2m($this->height);
            case "STD":
                return max(ft2m($this->height * 100), $elevation_m);
            case "MSL":
                return max(ft2m($this->height), $elevation_m);
            default:
                return null;
        }
    }
}
