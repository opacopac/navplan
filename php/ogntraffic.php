<?php
	include "helper.php";

    $dumpfiles[0] = './ognlistener/ogndump0.txt';
    $dumpfiles[1] = './ognlistener/ogndump1.txt';
    $dumpfileMaxAgeSec = 5 * 60;

    $minlat = checkNumeric($_GET["minlat"]);
    $maxlat = checkNumeric($_GET["maxlat"]);
    $minlon = checkNumeric($_GET["minlon"]);
    $maxlon = checkNumeric($_GET["maxlon"]);
    $maxagesec = checkNumeric($_GET["maxagesec"]);

    $aclist = array();

    foreach ($dumpfiles as $dumpfile)
    {
        if(!file_exists($dumpfile))
        {
            tryRestartListener();
            die("ERROR: dump file not found, trying to restart ogn listener");
        }

        if (time() > filemtime($dumpfile) + $dumpfileMaxAgeSec)
        {
            tryRestartListener();
            die("ERROR: dumpfile too old, trying to restarting ogn listener");
        }

        $file = fopen($dumpfile, "r");

        while (!feof($file))
        {
            $line = fgets($file);
            $msg = json_decode($line, true);

            if ($msg["latitude"] > $maxlat || $msg["latitude"] < $minlat)
                continue;

            if ($msg["longitude"] > $maxlon || $msg["longitude"] < $minlon)
                continue;

            if (gmmktime() - strtotime($msg["time"] . " UTC") > $maxagesec)
                continue;

            if (!$aclist[$msg["id"]])
            {
                $ac = array("id" => $msg["id"], "addresstype" => $msg["addresstype"], "actype" => $msg["actype"], "positions" => array());
                $aclist[$msg["id"]] = $ac;
            }

            $position = array("time" => $msg["time"], "latitude" => $msg["latitude"], "longitude" => $msg["longitude"], "altitude" => round($msg["altitude"]), "receiver" => $msg["receiver"]);

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

    foreach ($aclist as $ac)
    {
        usort($aclist[$ac["id"]]["positions"], "timecompare");
    }

    echo json_encode(array("aclist" => $aclist), JSON_NUMERIC_CHECK);


	function timecompare($posa, $posb)
	{
	    return strcmp($posa["time"], $posb["time"]);
	}


	function tryRestartListener()
	{
	    shell_exec("cd ./ognlistener; ./start_listener");
	}
?>