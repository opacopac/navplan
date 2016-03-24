<?php
	include "helper.php";

    $dumpfiles[0] = './ognlistener/ogndump0.txt';
    $dumpfiles[1] = './ognlistener/ogndump1.txt';

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
		global $input, $dumpfiles;

		$minlat = floatval($input["minlat"]);
		$maxlat = floatval($input["maxlat"]);
		$minlon = floatval($input["minlon"]);
		$maxlon = floatval($input["maxlon"]);
		$maxagesec = intval($input["maxagesec"]);

		$aclist = array();

	    foreach ($dumpfiles as $dumpfile)
	    {
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
?>