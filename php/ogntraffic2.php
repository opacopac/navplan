<?php
    include "config.php";
	include "helper.php";

    $dumpfiles[0] = './ognlistener/ogndump20.txt';
    $dumpfiles[1] = './ognlistener/ogndump21.txt';
    $lockfile = './ognlistener/ognlistener2.lock';
    $areafiltersfile = './ognlistener/areafilters.txt';

    $dumpfileMaxAgeSec = 5 * 60;

    $minlat = checkNumeric($_GET["minlat"]);
    $maxlat = checkNumeric($_GET["maxlat"]);
    $minlon = checkNumeric($_GET["minlon"]);
    $maxlon = checkNumeric($_GET["maxlon"]);
    $maxagesec = checkNumeric($_GET["maxagesec"]);

    // write area filter
    // TODO: temp
    $clientId = md5($minlat . "_" . $maxlat . "_" . $minlon . "_" . $maxlon);
    $filterstring = (new DateTime())->getTimestamp() . "," . $clientId . "," . $maxlat . "," . $minlon . "," . $minlat . "," . $maxlon . "\r\n";
    file_put_contents($areafiltersfile, $filterstring, FILE_APPEND | LOCK_EX);


    // check if ognlistener is running
    if (!file_exists($lockfile))
    {
        tryRestartListener();
        die("ERROR: lock file not found, trying to restart ogn listener");
    }


    $aclist = array();

    // open db connection
    $conn = openDb();

    // iterate over all dumpfiles
    foreach ($dumpfiles as $dumpfile)
    {
        // try to restart listener if no dumpfile found
        if(!file_exists($dumpfile))
        {
            tryRestartListener();
            die("ERROR: dump file not found, trying to restart ogn listener");
        }

        // try to restart listener if dumpfile is too old
        if (time() > filemtime($dumpfile) + $dumpfileMaxAgeSec)
        {
            tryRestartListener();
            die("ERROR: dumpfile too old, trying to restarting ogn listener");
        }

        // open dumpfile
        $file = fopen($dumpfile, "r");

        // iterate trough all entries in dumpfile
        while (!feof($file))
        {
            // parse single line
            $line = fgets($file);
            $msg = json_decode($line, true);

            // skip line if out of lat/lon/time
            if ($msg["latitude"] > $maxlat || $msg["latitude"] < $minlat)
                continue;

            if ($msg["longitude"] > $maxlon || $msg["longitude"] < $minlon)
                continue;

            if (gmmktime() - strtotime($msg["time"] . " UTC") > $maxagesec)
                continue;

            // add new aircrafts to list
            if (!$aclist[$msg["id"]])
            {
                $ac = array("id" => $msg["id"], "addresstype" => $msg["addresstype"], "actype" => $msg["actype"], "positions" => array());
                $aclist[$msg["id"]] = $ac;
            }

            // get position data
            $position = array("time" => $msg["time"], "latitude" => $msg["latitude"], "longitude" => $msg["longitude"], "altitude" => round($msg["altitude"]), "receiver" => $msg["receiver"]);

            // filter identical positions/times
            $poscount = count($aclist[$msg["id"]]["positions"]);
            if ($poscount > 1)
            {
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
    getAircraftDetails($aclist);

    // create json response
    echo json_encode(array("aclist" => $aclist), JSON_NUMERIC_CHECK);

    // close db
    $conn->close();


    function timecompare($posa, $posb)
	{
	    return strcmp($posa["time"], $posb["time"]);
	}


	function tryRestartListener()
	{
	    shell_exec("cd ./ognlistener; ./start_listener2");
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
        $query = "SELECT * FROM lfr_ch WHERE icaohex IN ('" . join("','", $icaolist) . "')";  // 4B28FA
        $result = $conn->query($query);

        while ($rs = $result->fetch_array(MYSQLI_ASSOC))
        {
            $ac = $aclist[$rs["icaohex"]];

            if ($ac) {
                $ac["registration"] = $rs["registration"];
                $ac["aircraftModelType"] = $rs["aircraftModelType"];
                $ac["manufacturer"] = $rs["manufacturer"];
                $ac["aircraftCategoryId"] = $rs["aircraftCategoryId"];

                $aclist[$rs["icaohex"]] = $ac;
            }
        }
    }
?>