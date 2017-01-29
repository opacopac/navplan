#!/usr/bin/env php
<?php
    $sessionId = $argv[1];

    if (!$sessionId || !is_numeric($sessionId))
        die("invalid or missing sessionId");

    $lockFile = './ognlistener_' .$sessionId . '.lock';
    $dumpFiles[0] = './ognlistener_' . $sessionId . '.dump0';
    $dumpFiles[1] = './ognlistener_' . $sessionId . '.dump1';
    $dumpIndex = 1;
    $commLogFile = './ognlistener_' . $sessionId . '.commlog';
    $filterFile = './ognlistener_' . $sessionId . '.filter';

    $ognHost = 'aprs.glidernet.org';
    $ognPort = 14580;
    $ognUserPrefix = 'NAVPLN';
    $ognSoftware = 'navplan.ch';
    $ognSoftwareVersion = '1.0';
    $ognPingSeconds = 60;
    $ognLastPing = currentTimestamp();

    $filterTimeoutSec = 15;
    $filterLoopSleepSec = 2;
    $dumpRotateSec = 120;


    // main start
    writelog("INFO", "starting ognlistener");

    createLockFile();

    // init dump files
    $currentDumpfile = null;

    // read initial filter
    $currentFilter = getFilter();
    if (!$currentFilter)
    {
        writelog("ERROR", "filter(file) not found");
        unlink($lockFile); // remove lock file
        die;
    }

    // open comm log
    $commLog = fopen($commLogFile, "w");

    // connect to ogn stream
    writelog("INFO", "opening new stream for session " . $sessionId);
    $connection = connect($sessionId, $currentFilter);

    // fork -> 1) filter reader 2) ogn stream reader
    $pid = pcntl_fork();
    if ($pid == -1)
    {
        writelog("ERROR", "could not fork");
        unlink($lockFile); // remove lock file
        die;
    }
    else if ($pid) // filter reader (parent)
    {
        while (true)
        {
            $newFilter = getFilter();
            $filterTime = getFilterTime();

            if (!$newFilter || !$filterTime)
            {
                writelog("ERROR", "filter(file) not found");
                disconnect($connection);
                break;
            }

            if ($filterTime + $filterTimeoutSec < currentTimestamp())
            {
                writelog("INFO", "filter timed out");
                disconnect($connection);
                break;
            }

            if (!$connection)
            {
                writelog("ERROR", "connection lost");
                break;
            }

            if ($newFilter != $currentFilter) // filter changed
            {
                writelog("INFO", "updating filters for stream " . $sessionId . ":" . $newFilter);
                writeFilter($connection, $newFilter);

                $currentFilter = $newFilter;
            }

            sleep($filterLoopSleepSec);
        }

        writelog("INFO", "closing ognlistener");

        pcntl_wait($status); //Protect against Zombie children

        // remove files
        unlink($lockFile);
        unlink($commLogFile);
        unlink($filterFile);

        foreach ($dumpFiles as $dumpFile)
            unlink ($dumpFile);
    }
    else // ogn stream reader (child)
    {
        readMessages($connection);

        unset($connection);

        writelog("INFO", "stream closed for session " . $sessionId);
    }

    // main end


    function writelog($loglevel, $message)
    {
        echo date("Y-m-d H:i:s") . " " . $loglevel . ": " . $message . "\n";
    }


    function writeCommLog($message)
    {
        global $commLog;

        fputs($commLog, $message);
    }


    function createLockFile()
    {
        global $lockFile;

        if (file_exists($lockFile))
        {
            $pid = file_get_contents($lockFile);

            if (posix_kill($pid, 0))
            {
                writelog("ERROR", "process already running");
                die;
            }
        }

        $file = fopen($lockFile, "w");
        fwrite($file, getmypid());
        fclose($file);
    }


    function switchDumpFile($file)
    {
        global $dumpFiles, $dumpIndex;

        if ($file)
            fclose($file);

        $dumpIndex = ($dumpIndex + 1) % count($dumpFiles);
        $file = fopen($dumpFiles[$dumpIndex], "w");

        return $file;
    }


    function getFilter()
    {
        global $filterFile;

        if (!file_exists($filterFile))
            return null;

        return file_get_contents($filterFile);
    }


    function getFilterTime()
    {
        global $filterFile;

        if (!file_exists($filterFile))
            return null;

        clearstatcache($filterFile);

        return filemtime($filterFile);
    }


    function connect($num, $filter)
    {
        // telnet aprs.glidernet.org 14580
        // user NAVPLNCH1 pass -1 vers navplan.ch 1.0 filter a/47.78917089079263/8.11271667480469/46.590956573124544/10.231704711914062 r/46.80/8.23/250

        global $ognHost, $ognPort, $ognUserPrefix, $ognSoftware, $ognSoftwareVersion, $lockFile;

        $fp = fsockopen($ognHost, $ognPort, $errno, $errstr, 30);
        if (!$fp)
        {
            unlink($lockFile); // remove lock file
            writelog("ERROR", "unable to connect: $errstr ($errno)");
            die;
        }

        stream_set_blocking($fp, true);

        // TODO
        $num = "01";

        // login
        $loginStr = "user " . $ognUserPrefix . $num;
        $loginStr .= " pass -1";
        $loginStr .= " vers " . $ognSoftware . " " . $ognSoftwareVersion;
        $loginStr .= " filter " . $filter . "\r\n";
        fwrite($fp, $loginStr);

        writeCommLog($loginStr);

        return $fp;
    }


    function disconnect($fp)
    {
        stream_socket_shutdown($fp, STREAM_SHUT_RDWR);
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
        global $currentDumpfile, $dumpRotateSec;

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


        $lastDumpRotation = 0;

        // read messages
        while (!feof($fp))
        {
            if ($lastDumpRotation + $dumpRotateSec < currentTimestamp())
            {
                $currentDumpfile = switchDumpFile($currentDumpfile);
                $lastDumpRotation = currentTimestamp();
            }

            $line = fgets($fp);

            writeCommLog($line);

            if (substr($line, 0, 1) != "#")
            {
                preg_match('/' . $pattern_aprs . '/', $line, $matches);

                if (preg_match('/' . $pattern_aircraft . '/', $matches["comment"], $matches2))
                {
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

                    fwrite($currentDumpfile, json_encode($ognmessage, JSON_NUMERIC_CHECK) . "\n");
                }
            }
        }
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
            "UNKNOWN" => 0b000000,
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


    function currentTimestamp()
    {
        return (new DateTime())->getTimestamp();
    }
?>