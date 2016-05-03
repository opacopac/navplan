<?php
	include "helper.php";

    $dumpfiles[0] = './ognlistener/ogndump0.txt';
    $dumpfiles[1] = './ognlistener/ogndump1.txt';
    $dumpfileMaxAgeSec = 5 * 60;

	$raw_input = file_get_contents('php://input');
	$input = json_decode($raw_input, true);

	switch($input["action"])
	{
		case "read":
			read();
			break;
		default:
			die("missing or unknown action!");
	}


	function read()
	{
		global $input, $dumpfiles, $dumpfileMaxAgeSec;

		$minlat = floatval($input["minlat"]);
		$maxlat = floatval($input["maxlat"]);
		$minlon = floatval($input["minlon"]);
		$maxlon = floatval($input["maxlon"]);
		$maxagesec = intval($input["maxagesec"]);

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

                $position = array("time" => $msg["time"], "latitude" => $msg["latitude"], "longitude" => $msg["longitude"], "altitude" => round($msg["altitude"]));

                $poscount = count($aclist[$msg["id"]]["positions"]);
                if ($poscount > 1)
                {
                    $lastpos = $aclist[$msg["id"]]["positions"][$poscount - 1];

                    // skip time inversions
                    if ($lastpos["time"] >= $position["time"])
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
	}


	function timecompare($posa, $posb)
	{
	    return strcmp($posa["time"], $posb["time"]);
	}


	function removeDuplicate($messages)
	{
	}


	function tryRestartListener()
	{
	    shell_exec("cd ./ognlistener; ./start_listener");
	}
?>