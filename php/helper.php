<?php

//region CONSTANTS

const TMP_DIR_BASE = '../tmp/';
const TMP_DIR_PREFIX = 'tmpdl_';
const TMP_DIR_TIMEOUT_SEC = 300;

//endregion


//region DATABASE

function openDb()
{
    global $db_host, $db_user, $db_pw, $db_name;

    // open db connection
    $conn = new mysqli($db_host, $db_user, $db_pw, $db_name);
    $conn->set_charset("utf8");

    return $conn;
}


function getDbTimeString($timestamp)
{
    return date("Y-m-d H:i:s", $timestamp);
}


function getDbPolygonString($lonLatList)
{
    $lonLatStrings = [];

    foreach ($lonLatList as $lonLat)
        $lonLatStrings[] = join(" ", $lonLat);

    if ($lonLatStrings[0] != $lonLatStrings[count($lonLatStrings) - 1]) // close polygon if necessary
        $lonLatStrings[] = $lonLatStrings[0];

    $polyString = "ST_GeomFromText('POLYGON((" . join(",", $lonLatStrings) . "))')";

    return $polyString;
}


function getDbMultiPolygonString($polygonList)
{
    $polyStrings = [];
    foreach ($polygonList as $polygon)
    {
        $lonLatStrings = [];
        foreach ($polygon as $lonLat)
            $lonLatStrings[] = join(" ", $lonLat);

        if ($lonLatStrings[0] != $lonLatStrings[count($lonLatStrings) - 1]) // close polygon if necessary
            $lonLatStrings[] = $lonLatStrings[0];

        $polyStrings[] = "((" . join(",", $lonLatStrings) . "))";
    }

    $multiPolyString = "ST_GeomFromText('MULTIPOLYGON(" . join(",", $polyStrings) . ")')";

    return $multiPolyString;
}


// retrieve lon lat from the format: POINT(-76.867 38.8108)
function parseLonLatFromDbPoint($dbPointString)
{
    $decimalRegExpPart = '([\-\+]?\d+\.?\d*)';
    $dbPointRegexp = '/POINT\(\s*' . $decimalRegExpPart . '\s+' . $decimalRegExpPart . '\s*\)/im';

    $result = preg_match($dbPointRegexp, $dbPointString, $matches);

    if (!$result)
        return null;

    $lonLat = [ floatval($matches[1]), floatval($matches[2]) ];

    return $lonLat;
}


function getDbPointStringFromLonLat($lonLat)
{
    return "ST_GeomFromText('POINT(" . $lonLat[0]  . " " . $lonLat[1] . ")')";
}


//endregion


//region TEMP FILES

function createTempDir()
{
    cleanUpTempDirs();

    $tmpDir = TMP_DIR_PREFIX . createRandomString(20);
    mkdir(TMP_DIR_BASE . $tmpDir);

    return $tmpDir;
}


function cleanUpTempDirs()
{
    $tmpDirEntries = scandir(TMP_DIR_BASE);

    // iterate trough tmp dirs
    foreach ($tmpDirEntries as $tmpDir)
    {
        $tmpDirPath = TMP_DIR_BASE . $tmpDir;

        if (!is_dir($tmpDirPath) || strpos($tmpDir, TMP_DIR_PREFIX) !== 0)
            continue;

        // check if too old
        if (filemtime($tmpDirPath) > time() - TMP_DIR_TIMEOUT_SEC)
            continue;

        // iterate trough files of temp dir
        $innerDirEntries = scandir($tmpDirPath);

        foreach ($innerDirEntries as $tmpFile)
        {
            if ($tmpFile == '.' || $tmpFile == '..')
                continue;

            $tmpFilePath = $tmpDirPath . "/" . $tmpFile;

            if (!unlink($tmpFilePath))
                die("ERROR: while deleting temp file '" . $tmpFilePath . "'");
        }

        // remove tmp dir
        if (!rmdir($tmpDirPath))
            die("ERROR: while deleting temp dir '" . $tmpDirPath . "'");
    }
}

//endregion


//region VALIDATORS

function checkNumeric($num)
{
    if (!is_numeric($num))
        die("format error: '" . $num . "' is not numeric");

    return $num;
}


function checkString($string, $minlen, $maxlen)
{
    if (isset($maxlen) && strlen($string) > $maxlen)
        die("format error: string '" . $string . "' too long");

    if (isset($minlen) && strlen($string) < $minlen)
        die("format error: string '" . $string . "' too short");

    return $string;
}


function checkAlphaNumeric($string, $minlen, $maxlen)
{
    $pattern = "/[a-zA-Z0-9]/";

    if (!$string)
        die("format error: string is null");

    if (!preg_match($pattern, $string))
        die("format error: string '" . $string . "' is not alphanumeric");

    return checkString($string, $minlen, $maxlen);
}


function checkFilename($string)
{
    $pattern = '/^[a-zA-Z0-9]+[a-zA-Z0-9_\-]*\.[a-zA-Z0-9]+$/';

    if (!$string)
        die("format error: empty string");

    if (!preg_match($pattern, $string))
        die("format error: string '" . $string . "' is not a filename");

    return checkString($string, 1, 50);
}



function checkEmail($email)
{
    if (!$email)
        die("email is null");

    // TODO: check email format with regexp
    return checkString($email, 1, 100);
}


function checkToken($token)
{
    if (!$token)
        die("token is null");

    return checkString($token, 1, 100);
}


function checkId($id)
{
    if (!is_numeric($id))
        die("format error");

    if ($id < 0 || $id > 4294967295)
        die("format error");

    return $id;
}


function checkEscapeString($conn, $string, $minlen, $maxlen)
{
    return mysqli_real_escape_string($conn, checkString($string, $minlen, $maxlen));
}


function checkEscapeAlphaNumeric($conn, $string, $minlen, $maxlen)
{
    return mysqli_real_escape_string($conn, checkAlphaNumeric($string, $minlen, $maxlen));
}


function checkEscapeEmail($conn, $email)
{
    return mysqli_real_escape_string($conn, checkEmail($email));
}


function checkEscapeToken($conn, $token)
{
    return mysqli_real_escape_string($conn, checkToken($token));
}

//endregion


//region TIME

function getIsoTimeString($timestamp = null)
{
    if (!$timestamp)
        $timestamp = time();

    return gmdate('Ymd\Th:i:s\Z', $timestamp);
}

//endregion


//region GEO & TRIGO


function getMeterFactor($unit)
{
    switch (trim(strtoupper($unit)))
    {
        case "NM" : return 1852;
        case "KM" : return 1000;
        case "M" : return 1;
        default : return null;
    }
}


function getLonLatFromGradMinSec($latGrad, $latMin, $latSec, $latDir, $lonGrad, $lonMin, $lonSec, $lonDir)
{
    $latG = intval($latGrad);
    $latM = intval($latMin);
    $latS = floatval($latSec);
    $lat = $latG + $latM / 60 + $latS / 3600;
    if (substr(strtoupper($latDir), 0, 1) == "S")
        $lat = -$lat;

    $lonG = intval($lonGrad);
    $lonM = intval($lonMin);
    $lonS = floatval($lonSec);
    $lon = $lonG + $lonM / 60 + $lonS / 3600;
    if (substr(strtoupper($lonDir), 0, 1) == "W")
        $lon = -$lon;

    return [ $lon, $lat ];
}


function convertDbPolygonToArray($polygonDbText)
{
    // prepare coordinates
    $polygon = [];
    $coord_pairs = explode(",", $polygonDbText);

    foreach ($coord_pairs as $latlon)
    {
        $coords = explode(" ", trim($latlon));
        $coords[0] = reduceDegAccuracy($coords[0], "AIRSPACE");
        $coords[1] = reduceDegAccuracy($coords[1], "AIRSPACE");
        $polygon[] = $coords;
    }

    return $polygon;
}


function reduceDegAccuracy($value, $type)
{
    switch ($type)
    {
        case "AIRSPACE":
            $digits = 4;
            break;
        default:
            $digits = 6;
            break;
    }

    return round($value, $digits);
}


function calcDistanceMeters($lat1, $lon1, $lat2, $lon2)
{
    $theta = $lon1 - $lon2;
    $dist = sin(deg2rad($lat1)) * sin(deg2rad($lat2)) +  cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * cos(deg2rad($theta));
    $dist = acos($dist);
    $dist = rad2deg($dist);
    $miles = $dist * 60 * 1.1515;

    return $miles * 1.609344 * 1000;
}


function moveBearDist($lat, $lon, $brngDeg, $distM)
{
    $lat1 = deg2rad($lat);
    $lon1 = deg2rad($lon);
    $distNm = $distM / 1000.0 / 1.852;
    $angDist = ($distNm * 1.852) / 6378.1;

    $lat2 = asin(sin($lat1) * cos($angDist) + cos($lat1) * sin($angDist) * cos(deg2rad($brngDeg)));
    $lon2 = $lon1 + atan2(sin(deg2rad($brngDeg)) * sin($angDist) * cos($lat1), cos($angDist) - sin($lat1) * sin($lat2));

    return array(rad2deg($lon2), rad2deg($lat2));
}


function getCircleExtent($lat, $lon, $radiusM)
{
    $dlat = (moveBearDist($lat, $lon, 0, $radiusM)[1] - $lat);
    $dlon = (moveBearDist($lat, $lon, 90, $radiusM)[0] - $lon);

    $extent = [
        [$lon - $dlon, $lat - $dlat],
        [$lon - $dlon, $lat + $dlat],
        [$lon + $dlon, $lat + $dlat],
        [$lon + $dlon, $lat - $dlat],
        [$lon - $dlon, $lat - $dlat]
    ];

    return $extent;
}


function isPointInPolygon($point, $polygon)
{
    $c = 0;
    $p1 = $polygon[0];
    $n = count($polygon);

    for ($i = 1; $i <= $n; $i++)
    {
        $p2 = $polygon[$i % $n];
        if ($point[0] > min($p1[0], $p2[0])
            && $point[0] <= max($p1[0], $p2[0])
            && $point[1] <= max($p1[1], $p2[1])
            && $p1[0] != $p2[0])
        {
            $xinters = ($point[0] - $p1[0]) * ($p2[1] - $p1[1]) / ($p2[0] - $p1[0]) + $p1[1];
            if ($p1[1] == $p2[1] || $point[1] <= $xinters)
                $c++;
        }
        $p1 = $p2;
    }

    // if the number of edges we passed through is even, then it's not in the poly.
    return $c % 2 != 0;
}


function getLinePolygonIntersections($pos1, $pos2, $polygon)
{
    $intersections = [];

    for ($i = 0; $i < count($polygon) - 1; $i++)
    {
        if (lineSegmentsIntersect($pos1, $pos2, $polygon[$i], $polygon[$i + 1]))
            $intersections[] = getLineLineIntersection($pos1, $pos2, $polygon[$i], $polygon[$i + 1]);
    }

    usort($intersections, "cmpLatLon");

    // reverse if flying E->W or N->S on same longitude
    if ($pos2[0] < $pos1[0] || ($pos2[0] == $pos1[0] && $pos2[1] > $pos1[1]))
        return array_reverse($intersections);
    else
        return $intersections;
}


function cmpLatLon($a, $b)
{
    if ($a[0] == $b[0] && $a[1] == $b[1])
        return 0;
    else if ($a[0] == $b[0])
        return ($a[1] < $b[1] ? -1 : 1); // prio2: by latitude asc
    else
        return ($a[0] < $b[0] ? -1 : 1); // prio1: by longitude asc
}


function isWithinRectangle($corner1, $corner2, $point, $tolerance = 0)
{
    if ($point[0] < min($corner1[0], $corner2[0]) - $tolerance || $point[0] > max($corner1[0], $corner2[0]) + $tolerance)
        return false;

    if ($point[1] < min($corner1[1], $corner2[1]) - $tolerance || $point[1] > max($corner1[1], $corner2[1]) + $tolerance)
        return false;

    return true;
}


function lineSegmentsIntersect($posA1, $posA2, $posB1, $posB2)
{
    $p0_x = $posA1[1];
    $p0_y = $posA1[0];
    $p1_x = $posA2[1];
    $p1_y = $posA2[0];
    $p2_x = $posB1[1];
    $p2_y = $posB1[0];
    $p3_x = $posB2[1];
    $p3_y = $posB2[0];

    $s1_x = $p1_x - $p0_x;
    $s1_y = $p1_y - $p0_y;
    $s2_x = $p3_x - $p2_x;
    $s2_y = $p3_y - $p2_y;
    $fps = (-$s2_x * $s1_y) + ($s1_x * $s2_y);
    $fpt = (-$s2_x * $s1_y) + ($s1_x * $s2_y);

    if ($fps == 0 || $fpt == 0)
        return false;

    $s = (-$s1_y * ($p0_x - $p2_x) + $s1_x * ($p0_y - $p2_y)) / $fps;
    $t = ( $s2_x * ($p0_y - $p2_y) - $s2_y * ($p0_x - $p2_x)) / $fpt;

    if ($s > 0 && $s < 1 && $t > 0 && $t < 1)
        return true;

    return false;
}


function getLineLineIntersection($posA1, $posA2, $posB1, $posB2)
{
    $x1 = $posA1[1];
    $y1 = $posA1[0];
    $x2 = $posA2[1];
    $y2 = $posA2[0];
    $x3 = $posB1[1];
    $y3 = $posB1[0];
    $x4 = $posB2[1];
    $y4 = $posB2[0];

    $det1And2 = det($x1, $y1, $x2, $y2);
    $det3And4 = det($x3, $y3, $x4, $y4);
    $x1LessX2 = $x1 - $x2;
    $y1LessY2 = $y1 - $y2;
    $x3LessX4 = $x3 - $x4;
    $y3LessY4 = $y3 - $y4;
    $det1Less2And3Less4 = det($x1LessX2, $y1LessY2, $x3LessX4, $y3LessY4);

    // the denominator is zero so the lines are parallel and there's either no solution (or multiple solutions if the lines overlap) so return null.
    if ($det1Less2And3Less4 == 0)
        return null;

    $x = (det($det1And2, $x1LessX2, $det3And4, $x3LessX4) / $det1Less2And3Less4);
    $y = (det($det1And2, $y1LessY2, $det3And4, $y3LessY4) / $det1Less2And3Less4);

    return [$y, $x];
}


function det($a, $b, $c, $d)
{
    return $a * $d - $b * $c;
}

//endregion


//region UNIT CONVERSION

function m2ft($height_m)
{
    return $height_m * 3.2808;
}


function ft2m($height_ft)
{
    return $height_ft / 3.2808;
}

//endregion


//region STRINGS

function createRandomString($len)
{
    $result = "";
    $chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    $charArray = str_split($chars);
    for($i = 0; $i < $len; $i++)
	{
	    $randItem = array_rand($charArray);
	    $result .= "" . $charArray[$randItem];
    }
    return $result;
}


function zeroPad($number, $digits): string
{
    $numstr = '' . $number;

    while(strlen($numstr) < $digits)
        $numstr = "0" . $numstr;

    return $numstr;
}


function formatFrequency($number): string
{
    if (!is_numeric($number)) {
        return '';
    }

    $number = floatval($number);
    $numberStr = number_format($number, 3, '.', '');

    return zeroPad($numberStr, 7);
}


function array_implode($glue, $separator, $array)
{
    if (!is_array($array))
        return $array;

    $string = array();
    foreach ($array as $key => $val)
    {
        if (is_array($val))
            $val = implode(',', $val);

        $string[] = "{$key}{$glue}{$val}";
    }

    return implode($separator, $string);
}

//endregion


//region TYPE CONVERSIONS

function intvalOrNull($value) {
    if ($value === NULL) {
        return NULL;
    } else {
        return intval($value);
    }
}


//endregion


function printLine($text)
{
    if ($text)
        print $text;

    print "<br>\n";
    ob_flush();
}


function isBranch()
{
    return (strpos($_SERVER['REQUEST_URI'], "branch") !== false);
}


function isSelf($email)
{
    return ($email == "armand@tschanz.com");
}
