<?php
require_once("helper.php");

class TerrainHelper
{
    //region FIELDS

    const TERRAIN_TILE_BASE_DIR = '../terraintiles/';
    const TERRAIN_TILE_SUFFIX = '.hgt';
    const LINE_SIZE = 1201;
    const MAX_LINES = 1201;
    const RESOLUTION_M = 100;
    const MAX_STEPS_PER_LEG = 500;

    private $openTileFiles;

    //endregion


    //region CONSTRUCTOR / DESTRUCTOR

    function __construct()
    {
        $this->openTileFiles = array();
    }


    function __destruct()
    {
        $this->closeFiles();
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
        $terrainInfo = array();
        $terrainInfo["legs"] = [];

        if (count($positions) == 1) // single position
        {
            $elevations = [];
            $elevations[] = $this->getElevationMeters($positions[0]);
            $legInfo = $this->createLegInfo($positions[0], $positions[0], $elevations);
            $terrainInfo["legs"][] = $legInfo;
            $terrainInfo["totaldistance_m"] = $legInfo["distance_m"];
            $terrainInfo["maxelevation_m"] = $legInfo["maxelevation_m"];
        }
        else // multiple positions
        {
            $totaldistance = 0;
            $maxelevation_m = -10000;
            for ($i = 0; $i < count($positions) - 1; $i++)
            {
                $elevations = $this->getLegElevations($positions[$i], $positions[$i + 1]);
                $legInfo = $this->createLegInfo($positions[$i], $positions[$i + 1], $elevations);
                $totaldistance += $legInfo["distance_m"];
                $maxelevation_m = max($maxelevation_m, $legInfo["maxelevation_m"]);
                $terrainInfo["legs"][] = $legInfo;
            }
            $terrainInfo["totaldistance_m"] = $totaldistance;
            $terrainInfo["maxelevation_m"] = $maxelevation_m;
        }

        return $terrainInfo;
    }

    //endregion


    //region PRIVATE FUNCTIONS

    private function getLegElevations($pos1, $pos2)
    {
        $dist_m = calcDistanceMeters($pos1[1], $pos1[0], $pos2[1], $pos2[0]);
        $resolution = max(self::RESOLUTION_M, $dist_m / self::MAX_STEPS_PER_LEG);

        $elevations = [];
        for ($i = 0; $i < $dist_m; $i += $resolution) {
            $lat = $pos1[1] + ($pos2[1] - $pos1[1]) / $dist_m * $i;
            $lon = $pos1[0] + ($pos2[0] - $pos1[0]) / $dist_m * $i;
            $elevations[] = $this->getElevationMeters([$lon, $lat]);
        }

        return $elevations;
    }


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
        if ($this->openTileFiles[$filepath])
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


    private function createLegInfo($pos1, $pos2, $elevations)
    {
        $leg = array();
        $leg["position1"] = array("longitude" => $pos1[0], "latitude" => $pos1[1]);
        $leg["position2"] = array("longitude" => $pos2[0], "latitude" => $pos2[1]);
        $leg["distance_m"] = calcDistanceMeters($pos1[1], $pos1[0], $pos2[1], $pos2[0]);
        $leg["maxelevation_m"] = max($elevations);
        $leg["elevations_m"] = $elevations;

        return $leg;
    }

    //endregion
}
