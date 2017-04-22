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


function zeroPad($number, $digits)
{
    $numstr = '' . $number;

    while(strlen($numstr) < $digits)
        $numstr = "0" . $numstr;

    return $numstr;
}

//endregion


function printLine($text)
{
    if ($text)
        print $text;

    print "<br>\n";
    ob_flush();
}
