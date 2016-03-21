#!/usr/bin/env php
<?php

Class OgnListener
{
    private $ogn_host = 'aprs.glidernet.org';
    private $ogn_port = 14580;

    private $ogn_user = 'NAVPLNCH1';
    private $ogn_software = 'navplan.ch';
    private $ogn_software_version = '1.0';
    private $ogn_filter = "r/46.80/8.23/250"; // center of CH
    //private $ogn_filter = "r/46.95/7.45/20"; // bern
    //private $ogn_filter = "r/53.56/10.00/50"; // hamburg

    private static $address_mask = 0b00000011;
    private static $address_type = array(
        "RANDOM" => 0b00000000,
        "ICAO" => 0b00000001,
        "FLARM" => 0b00000010,
        "OGN" => 0b00000011
    );

    //UNKNOWN(0), GLIDER(1), TOW_PLANE(2), HELICOPTER_ROTORCRAFT(3), PARACHUTE(4), DROP_PLANE(5), HANG_GLIDER(6), PARA_GLIDER(7), POWERED_AIRCRAFT(8), JET_AIRCRAFT(9), UFO(10), BALLOON(11), AIRSHIP(12), UAV(13), STATIC_OBJECT(15);
    private static $ac_mask = 0b00111100;
    private static $ac_type = array(
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


    //Prisdorf>APRS,TCPIP*,qAC,GLIDERN1:/220102h5340.77NI00945.97E&000/000/A=000075 v0.2.4.ARM CPU:0.5 RAM:771.5/972.2MB NTP:0.8ms/-7.0ppm +37.4C RF:+0.35dB
    //FLRDD95E5>APRS,qAS,BOBERG:/220043h5330.69N/01009.30E'000/000/A=000016 !W47! id06DD95E5 -019fpm +0.0rot 36.2dB 0e +0.4kHz gps3x4

    private static $pattern_aprs = "^(?P<callsign>.+?)>APRS,.+,"
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

    private static $pattern_aircraft = "id(?P<details>\w{2})(?P<id>\w+?)\s"
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


    private $fp;
    private $lastPing;
    private $pingSeconds = 60;


    public function connect()
    {
        $this->fp = fsockopen($this->ogn_host, $this->ogn_port, $errno, $errstr, 30);
        if (!$this->fp)
        {
            die("$errstr ($errno)<br />\n");
        }

        // login
        $loginStr = "user " . $this->ogn_user;
        $loginStr .= " pass -1";
        $loginStr .= " vers " . $this->ogn_software . " " . $this->ogn_software_version;
        $loginStr .= " filter " . $this->ogn_filter . "\r\n";
        fwrite($this->fp, $loginStr);

        stream_set_blocking($this->fp, false);

        $this->lastPing = (new DateTime())->getTimestamp();
    }


    public function disconnect()
    {
        fclose($this->fp);

        unset($this->fp);
    }


    public function read()
    {
        if (!$this->fp)
            dir("no connection"); // TODO

        if (feof($this->fp))
        {
            $this->disconnect();
            die("connection lost"); // TODO
        }

        $this->keepAlive();

        $line = fgets($this->fp);

        if ($line == '')
            return false;

        if (substr($line, 0, 1) != "#")
        {
            preg_match('/' . self::$pattern_aprs . '/', $line, $matches);

            if (preg_match('/' . self::$pattern_aircraft . '/', $matches["comment"], $matches2))
            {
                $lat = $this->convertToDec("0" . $matches["latitude"] . $matches["latitude_enhancement"], $matches["latitude_sign"]);
                $lon = $this->convertToDec($matches["longitude"] . $matches["longitude_enhancement"], $matches["longitude_sign"]);
                $alt_m = intval($matches["altitude"]) / 3.2808;
                $time_utc = strtotime($matches["time"]);

                return array(
                    "id" => $matches2["id"],
                    "addresstype" => $this->getAddressType($matches2["details"]),
                    "actype" => $this->getAcType($matches2["details"]),
                    "time" => date("H:i:s", $time_utc),
                    "latitude" => $lat,
                    "longitude" => $lon,
                    "altitude" => $alt_m
                );
            }
        }

        return false;
    }


    private function keepAlive()
    {
        $time = (new DateTime())->getTimestamp();

        if ($time - $this->lastPing > $this->pingSeconds)
        {
            fputs($this->fp, "# keepalive ping\r\n");
            $this->lastPing = $time;
        }
    }


    private function convertToDec($dddmm, $sign)
    {
        $dd = substr($dddmm, 0, 3);
        $mm = substr($dddmm, 3);

        $dec = intval($dd) + (floatval($mm) / 60);

        if (strtoupper($sign) == "W" || strtoupper($sign) == "S")
            $dec = -$dec;

        return $dec;
    }


    private function getAcType($details)
    {
        foreach(self::$ac_type as $type => $bitmask)
        {
            if ((hexdec($details) & self::$ac_mask) == $bitmask)
                return $type;
        }
    }


    private function getAddressType($details)
    {
        foreach(self::$address_type as $type => $bitmask)
        {
            if ((hexdec($details) & self::$address_mask) == $bitmask)
                return $type;
        }
    }
}
