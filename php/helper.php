<?php

//region CONSTANTS

const TMP_DIR_BASE = '../tmp/';

//endregion


//region DB

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
    $tmpDir = createRandomString(20);
    mkdir(TMP_DIR_BASE . $tmpDir);

    return $tmpDir;
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
    $pattern = '/[a-zA-Z0-9_\-\.]/';

    if (!$string)
        die("format error: string contains not allowed characters");

    if (!preg_match($pattern, $string))
        die("format error: string '" . $string . "' is not alphanumeric");

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


function getIsoTimeString($timestamp = null)
{
    if (!$timestamp)
        $timestamp = time();

    return gmdate('Ymd\Th:i:s\Z', $timestamp);
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


function printLine($text)
{
    if ($text)
        print $text;

    print "<br>\n";
    ob_flush();
}
