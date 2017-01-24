#!/usr/bin/env php
<?php

$lockfile = './ognlistener2.lock';
$dumpfiles[0] = './ogndump20.txt';
$dumpfiles[1] = './ogndump21.txt';
//$commlogfiles[0] = './comlog20.' . getmypid() . '.txt';
//$commlogfiles[1] = './comlog21.' . getmypid() . '.txt';
$commlogfiles[0] = './comlog20.txt';
$commlogfiles[1] = './comlog21.txt';
$areafiltersfile = './areafilters.txt';

$ogn_host = 'aprs.glidernet.org';
$ogn_port = 14580;
$ogn_user_prefix = 'NAVPLN';
$ogn_software = 'navplan.ch';
$ogn_software_version = '1.0';
//$ogn_filter = "r/46.80/8.23/250"; // center of CH
//$ogn_filter = "r/46.95/7.45/20"; // bern
//$ogn_filter = "r/53.56/10.00/50"; // hamburg
$ogn_max_filter = 9;
$ogn_filter_timeout_sec = 15;
$ogn_pingSeconds = 60;
$lastPing = (new DateTime())->getTimestamp();

$minsleepsec = 2;
$logrotatesec = 120;
$lastrotation = 0;
$lastloop = 0;
$dumpindex = 1;
$commlogindex = 1;
$connections = [];
$clientfilters = array();
$lastfilterfilechanged = 0;
$curr_dumpfile = null;
$curr_commlog = null;


// main start
writelog("INFO", "starting ognlistener");

createLockFile();

foreach ($dumpfiles as $dumpfile)
{
    if (file_exists($dumpfile))
        touch($dumpfile);
}

// loop while filters are present
do
{
    // file rotation
    $currentTimestamp = (new DateTime())->getTimestamp();

    if ($currentTimestamp - $lastrotation > $logrotatesec)
    {
        $curr_dumpfile = switchDumpFile($curr_dumpfile);
        $curr_commlog = switchcommlogfile($curr_commlog);
        $lastrotation = $currentTimestamp;
    }


    // get filters
    $filterResults = getFilters();

    if ($filterResults["result"] == "NOFILE")
    {
        writelog("INFO", "filter file not found, exiting");
        break;
    }
    elseif ($filterResults["result"] == "NOFILTERS")
    {
        writelog("INFO", "no active filters found, exiting");
        break;
    }


    // process streams
    $streamfilters = $filterResults["filters"];

    for ($c = 0; $c < count($streamfilters); $c++)
    {
        if ($c < count($connections) && $connections[$c]) // use existing connection
        {
            $fp = $connections[$c];

            if ($filterResults["result"] == "NEWFILTERS")
            {
                writelog("INFO", "updating filters of stream " . $c . ":" . $streamfilters[$c]);
                writeFilter($fp, $streamfilters[$c]);
            }
        }
        else // create new connection
        {
            writelog("INFO", "opening new stream " . $c);

            $fp = connect($c, $streamfilters[$c]);
            $connections[] = $fp;
        }

        readMessages($fp);
    }


    // close unused streams
    while (count($streamfilters) < count($connections))
    {
        writelog("INFO", "closing 1 unused stream");

        $fp = array_pop($connections);
        disconnect($fp);
    }

    // sleep if necessary
    if ($currentTimestamp - $lastloop <= $minsleepsec)
        sleep($minsleepsec);

    $lastloop = $currentTimestamp;
}
while (count($streamfilters) > 0);


// close all connections
while (count($connections) > 0)
{
    $fp = array_pop($connections);
    disconnect($fp);
}

unlink($lockfile); // remove lock file

writelog("INFO", "closing ognlistener");

// main end


function writelog($loglevel, $message)
{
    echo date("Y-m-d H:i:s") . " " . $loglevel . ": " . $message . "\n";
}


function writeCommLog($message)
{
    global $curr_commlog;

    fputs($curr_commlog, $message);
}


function createLockFile()
{
    global $lockfile;

    if (file_exists($lockfile))
    {
        $pid = file_get_contents($lockfile);

        if (posix_kill($pid, 0))
        {
            writelog("ERROR", "process already running");
            die;
        }
    }

    $file = fopen($lockfile, "w");
    fwrite($file, getmypid());
    fclose($file);
}


function switchDumpFile($file)
{
    global $dumpfiles, $dumpindex;

    if ($file)
        fclose($file);

    $dumpindex = ($dumpindex + 1) % count($dumpfiles);

    $file = fopen($dumpfiles[$dumpindex], "w");

    return $file;
}


function switchcommlogfile($file)
{
    global $commlogfiles, $commlogindex;

    if ($file)
        fclose($file);

    $commlogindex = ($commlogindex + 1) % count($commlogfiles);

    $file = fopen($commlogfiles[$commlogindex], "w");

    return $file;
}


function getFilters()
{
    global $areafiltersfile, $ogn_filter_timeout_sec, $lastfilterfilechanged, $clientfilters;

    $currenttimestamp = (new DateTime())->getTimestamp();
    $filterResults = array();

    clearstatcache();

    if (!file_exists($areafiltersfile))
    {
        $filterResults["result"] = "NOFILE";
        return $filterResults;
    }

    $filetime = filemtime($areafiltersfile);

    if ($filetime != $lastfilterfilechanged) // filter file changed -> read filters from file
    {
        $chksum = getFilterChecksum($clientfilters);
        $clientfilters = [];

        $filterlines = file($areafiltersfile);
        foreach ($filterlines as $line)
        {
            list($timestamp, $clientid, $latN, $lonW, $latS, $lonE) = explode(",", trim($line), 6);

            if ($currenttimestamp > $timestamp + $ogn_filter_timeout_sec)
                continue;

            $clientfilters[$clientid]["filter"] = 'a/' . $latN . '/' . $lonW . '/' . $latS . '/' . $lonE;
            $clientfilters[$clientid]["timestamp"] = $timestamp;
        }

        $lastfilterfilechanged = $filetime;

        if ($chksum == getFilterChecksum($clientfilters))
            $filterResults["result"] = "OLDFILTERS";
        else
            $filterResults["result"] = "NEWFILTERS";
    }
    else // filter file unchanged -> check for expired filters
    {
        $filterResults["result"] = "OLDFILTERS";

        foreach ($clientfilters as $clientid => $filter)
        {
            if ($currenttimestamp > $filter["timestamp"] + $ogn_filter_timeout_sec)
            {
                unset($clientfilters[$clientid]);
                $filterResults["result"] = "NEWFILTERS";
            }
        }
    }

    if (count($clientfilters) == 0)
    {
        $filterResults["result"] = "NOFILTERS";
        return $filterResults;
    }

    $filterResults["filters"] = createStreamFilters($clientfilters);

    return $filterResults;
}


function getFilterChecksum($clientfilters)
{
    $instr = "";

    foreach ($clientfilters as $filter)
        $instr .= $filter["filter"] . "_";

    return md5($instr);
}


function createStreamFilters($clientfilters)
{
    global $ogn_max_filter, $ogn_filter_timeout_sec;

    $filterlist = [];
    $currenttimestamp = (new DateTime())->getTimestamp();

    foreach ($clientfilters as $filter)
    {
        if ($currenttimestamp <= $filter["timestamp"] + $ogn_filter_timeout_sec)
        $filterlist[] = $filter["filter"];
    }

    if (count($filterlist) == 0)
        return null;

    // The filter command may be set as part of the login line, as an APRS message to SERVER, or as a separate comment line (#filter r/33/-97/200). The prefered method is to set the command as part of the login which is supported by most current APRS software.
    // a/latN/lonW/latS/lonE   The area filter works the same as rang filter but the filter is defined as a box of coordinates. The coordinates can also been seen as upper left coordinate and lower right. Lat/lon are decimal degrees. South and west are negative. Up to 9 area filters can be defined at the same time.

    // group max 9 client filters per connections
    $streamfilters = [];

    for ($i = 0; $i < count($filterlist); $i++)
    {
        $conn = (int) floor($i / $ogn_max_filter);

        if (!$streamfilters[$conn])
            $streamfilters[$conn] = "";

        $streamfilters[$conn] .= $filterlist[$i] . " ";
    }


    return $streamfilters;
}


function connect($num, $filter)
{
    // telnet aprs.glidernet.org 14580
    // user NAVPLNCH1 pass -1 vers navplan.ch 1.0 filter r/46.80/8.23/250

    global $ogn_host, $ogn_port, $ogn_user_prefix, $ogn_software, $ogn_software_version, $lockfile;

    $fp = fsockopen($ogn_host, $ogn_port, $errno, $errstr, 30);
    if (!$fp)
	{
		unlink($lockfile); // remove lock file
        writelog("ERROR", "unable to connect: $errstr ($errno)");
        die;
	}

    stream_set_blocking($fp, false);

    // login
    $loginStr = "user " . $ogn_user_prefix . $num;
    $loginStr .= " pass -1";
    $loginStr .= " vers " . $ogn_software . " " . $ogn_software_version;
    $loginStr .= " filter " . $filter . "\r\n";
    fwrite($fp, $loginStr);

    writeCommLog($loginStr);

    return $fp;
}


function disconnect($fp)
{
    fclose($fp);

    unset($fp);
}


function writePing($fp)
{
    $pingstr = "# keepalive ping\r\n";
    fputs($fp, $pingstr);

    writeCommLog($pingstr);
}


function writeFilter($fp, $filter)
{
    $filterstring = "#filter " . $filter . "\r\n";
    fputs($fp, $filterstring);

    writeCommLog($filterstring);
}


function readMessages($fp)
{
    global $curr_dumpfile;

    //Prisdorf>APRS,TCPIP*,qAC,GLIDERN1:/220102h5340.77NI00945.97E&000/000/A=000075 v0.2.4.ARM CPU:0.5 RAM:771.5/972.2MB NTP:0.8ms/-7.0ppm +37.4C RF:+0.35dB
    //FLRDD95E5>APRS,qAS,BOBERG:/220043h5330.69N/01009.30E'000/000/A=000016 !W47! id06DD95E5 -019fpm +0.0rot 36.2dB 0e +0.4kHz gps3x4

    // $stealthflag_mask = 0b10000000;
    // $notrackingflag_mask = 0b01000000;

    $pattern_aprs = "^(?P<callsign>.+?)>APRS,.+,"
        . "(?P<receiver>.+?):\/"
        . "(?P<time>\d{6})+h"
        . "(?P<latitude>\d{4}\.\d{2})"
        . "(?P<latitude_sign>N|S)"
        . "(?P<symbol_table>.)"
        . "(?P<longitude>\d{5}\.\d{2})"
        . "(?P<longitude_sign>E|W)"
        . "(?P<symbol>.)"
        . "(?P<course_extension>"
        . "(?P<course>\d{3})\/"
        . "(?P<ground_speed>\d{3}))?\/"
        . "A=(?P<altitude>\d{6})"
        . "(?P<pos_extension>\s"
        . "!W((?P<latitude_enhancement>\d)"
        . "(?P<longitude_enhancement>\d))!)?\s"
        . "(?P<comment>.*)$";

    $pattern_aircraft = "id(?P<details>\w{2})(?P<id>\w+?)\s"
        . "(?P<climb_rate>[+-]\d+?)fpm\s"
        . "(?P<turn_rate>[+-][\d.]+?)rot\s"
        . "(?:FL(?P<flight_level>[\d.]+)\s)?"
        . "(?P<signal>[\d.]+?)dB\s"
        . "(?P<errors>\d+)e\s"
        . "(?P<frequency_offset>[+-][\d.]+?)kHz\s?"
        . "(?:gps(?P<gps_accuracy>\d+x\d+)\s?)?"
        . "(?:s(?P<flarm_software_version>[\d.]+)\s?)?"
        . "(?:h(?P<flarm_hardware_version>[\dA-F]{2})\s?)?"
        . "(?:r(?P<flarm_id>[\dA-F]+)\s?)?"
        . "(?:hear(?P<proximity>.+))?";


    // read messages
    do {
        $line = fgets($fp);

        writeCommLog($line);

        if (substr($line, 0, 1) != "#") {
            preg_match('/' . $pattern_aprs . '/', $line, $matches);

            if (preg_match('/' . $pattern_aircraft . '/', $matches["comment"], $matches2)) {
                $lat = convertToDec("0" . $matches["latitude"] . $matches["latitude_enhancement"], $matches["latitude_sign"]);
                $lon = convertToDec($matches["longitude"] . $matches["longitude_enhancement"], $matches["longitude_sign"]);
                $alt_m = intval($matches["altitude"]) / 3.2808;
                $time_utc = strtotime($matches["time"]);

                $ognmessage = array(
                    "id" => $matches2["id"],
                    "addresstype" => getAddressType($matches2["details"]),
                    "actype" => getAcType($matches2["details"]),
                    //"notracking" => getFlag($matches2["details"], $notrackingflag_mask),
                    "time" => date("H:i:s", $time_utc),
                    "latitude" => $lat,
                    "longitude" => $lon,
                    "altitude" => $alt_m,
                    "receiver" => $matches["receiver"]
                );

                fwrite($curr_dumpfile, json_encode($ognmessage, JSON_NUMERIC_CHECK) . "\n");
            }
        }
    }
    while (!feof($fp) && $line);
}


function convertToDec($dddmm, $sign)
{
    $dd = substr($dddmm, 0, 3);
    $mm = substr($dddmm, 3);

    $dec = intval($dd) + (floatval($mm) / 60);

    if (strtoupper($sign) == "W" || strtoupper($sign) == "S")
        $dec = -$dec;

    return $dec;
}


function getAcType($details)
{
    //UNKNOWN(0), GLIDER(1), TOW_PLANE(2), HELICOPTER_ROTORCRAFT(3), PARACHUTE(4), DROP_PLANE(5), HANG_GLIDER(6), PARA_GLIDER(7), POWERED_AIRCRAFT(8), JET_AIRCRAFT(9), UFO(10), BALLOON(11), AIRSHIP(12), UAV(13), STATIC_OBJECT(15);
    $ac_mask = 0b00111100;
    $ac_type = array(
        "UKNOWN" => 0b000000,
        "GLIDER" => 0b000100,
        "TOW_PLANE" => 0b001000,
        "HELICOPTER_ROTORCRAFT" => 0b001100,
        "PARACHUTE" => 0b010000,
        "DROP_PLANE" => 0b010100,
        "HANG_GLIDER" => 0b011000,
        "PARA_GLIDER" => 0b011100,
        "POWERED_AIRCRAFT" => 0b100000,
        "JET_AIRCRAFT" => 0b100100,
        "UFO" => 0b101000,
        "BALLOON" => 0b101100,
        "AIRSHIP" => 0b110100,
        "UAV" => 0b111000,
        "STATIC_OBJECT" => 0b111100
    );


    foreach($ac_type as $type => $bitmask)
    {
        if ((hexdec($details) & $ac_mask) == $bitmask)
            return $type;
    }

    return "UNKNOWN";
}


function getAddressType($details)
{
    $address_mask = 0b00000011;
    $address_type = array(
        "RANDOM" => 0b00000000,
        "ICAO" => 0b00000001,
        "FLARM" => 0b00000010,
        "OGN" => 0b00000011
    );


    foreach($address_type as $type => $bitmask)
    {
        if ((hexdec($details) & $address_mask) == $bitmask)
            return $type;
    }

    return "RANDOM";
}


function getFlag($details, $flag_mask)
{
    if ((hexdec($details) & $flag_mask) == $flag_mask)
        return true;
    else
        return false;
}


?>