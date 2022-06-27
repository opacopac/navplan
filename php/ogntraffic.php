<?php
    include "config.php";
	include "helper.php";

    $minLat = checkNumeric($_GET["minlat"]);
    $maxLat = checkNumeric($_GET["maxlat"]);
    $minLon = checkNumeric($_GET["minlon"]);
    $maxLon = checkNumeric($_GET["maxlon"]);
    $maxAgeSec = checkNumeric($_GET["maxagesec"]);
    $sessionId = checkNumeric($_GET["sessionid"]);
    $waitDataSec = checkNumeric($_GET["waitDataSec"]);

    $dumpFiles[0] = '../tmp/ognlistener_' . $sessionId . '.dump0';
    $dumpFiles[1] = '../tmp/ognlistener_' . $sessionId . '.dump1';
    $lockFile = '../tmp/ognlistener_' . $sessionId . '.lock';
    $filterFile = '../tmp/ognlistener_' . $sessionId . '.filter';

    $dumpFileMaxAgeSec = 5 * 60;


    // write filter
    $filter = "a/" . $maxLat . "/" . $minLon . "/" . $minLat . "/" . $maxLon;
    file_put_contents($filterFile, $filter, LOCK_EX);


    // start listener if lockfile not found
    if (!file_exists($lockFile))
    {
        startListener($sessionId);
        sleep(1);
    }

    if ($waitDataSec > 0)
        sleep($waitDataSec);


    // open db connection
    $conn = openDb();

    $aclist = array();

    foreach ($dumpFiles as $dumpFile)
    {
        if (!file_exists($dumpFile))
            continue;

        // open dumpfile
        $file = fopen($dumpFile, "r");

        // iterate trough all entries in dumpfile
        while (!feof($file))
        {
            // parse single line
            $line = fgets($file);
            $msg = json_decode($line, true);

            // skip line if out of lat/lon/time
            if ($msg["latitude"] > $maxLat || $msg["latitude"] < $minLat)
                continue;

            if ($msg["longitude"] > $maxLon || $msg["longitude"] < $minLon)
                continue;

            if (time() - strtotime($msg["time"] . " UTC") > $maxAgeSec)
                continue;

            // add new aircrafts to list
            if (!$aclist[$msg["id"]]) {
                $ac = array("id" => $msg["id"], "addresstype" => $msg["addresstype"], "actype" => $msg["actype"], "positions" => array());
                $aclist[$msg["id"]] = $ac;
            }

            // get position data
            $position = array("time" => $msg["time"], "latitude" => $msg["latitude"], "longitude" => $msg["longitude"], "altitude" => round($msg["altitude"]), "receiver" => $msg["receiver"]);

            // filter identical positions/times
            $poscount = count($aclist[$msg["id"]]["positions"]);
            if ($poscount > 1) {
                $lastpos = $aclist[$msg["id"]]["positions"][$poscount - 1];

                // skip identical times
                if ($lastpos["time"] == $position["time"])
                    continue;

                // skip identical positions
                if ($lastpos["latitude"] == $position["latitude"] && $lastpos["longitude"] == $position["longitude"])
                    continue;
            }

            array_push($aclist[$msg["id"]]["positions"], $position);
        }
    }


    // iterate trough aircraft list
    foreach ($aclist as $ac)
    {
        // sort positions by time
        usort($aclist[$ac["id"]]["positions"], "timecompare");
    }

    // load additional aircraft info (HB only)
    $aclist = getAircraftDetails($aclist);

    // create json response
    echo json_encode(array(
        "timestamp" => time(),
        "aclist" => $aclist
    ), JSON_NUMERIC_CHECK);

    // close db
    $conn->close();

    // end main


    function startListener($sessionId)
    {
        shell_exec("cd ./ognlistener; ./start_listener " . $sessionId);
    }


    function timecompare($posa, $posb)
	{
	    return strcmp($posa["time"], $posb["time"]);
	}


	function getAircraftDetails($aclist)
    {
        global $conn;

        // get and escape all icao hex ac identifiers
        $icaolist = array();

        foreach ($aclist as $ac)
        {
            $icaohex = checkEscapeString($conn, strtoupper($ac["id"]), 1, 6);
            array_push($icaolist, $icaohex);
        }

        // exec query
        $query = "SELECT * FROM lfr_ch WHERE icaohex IN ('" . join("','", $icaolist) . "')";  // 4B28FA 4B43C1
        //$query = "SELECT * FROM lfr_ch WHERE icaohex IN ('4B43C1')";
        $result = $conn->query($query);

        while ($rs = $result->fetch_array(MYSQLI_ASSOC))
        {
            $ac = $aclist[$rs["icaohex"]];
            //$ac = $aclist["DF07D3"];

            if ($ac) {
                $ac["registration"] = $rs["registration"];
                $ac["aircraftModelType"] = $rs["aircraftModelType"];
                $ac["aircraftCategoryId"] = $rs["aircraftCategoryId"];

                $aclist[$rs["icaohex"]] = $ac;
                //$aclist["DF07D3"] = $ac;
            }
        }

        return $aclist;
    }
?>
