#!/usr/bin/env php
<?php
    $tile_base_urls = [ "https://a.tile.opentopomap.org/", "https://b.tile.opentopomap.org/", "https://c.tile.opentopomap.org/" ];
    //$tile_base_urls = [ "https://opentopomap.org/", "https://opentopomap.org/", "https://opentopomap.org/" ];
    //$tile_base_urls = [ "http://opentopomap.org/", "http://opentopomap.org/", "http://opentopomap.org/" ];
    $tile_dir = "../../maptiles_dl/";
    $minwaitsec = 0;
    /*$zoom = 6;
    $yrange = [33, 33];
    $xrange = [22, 22];*/
    /*$zoom = 7;
    $yrange = [66, 67];
    $xrange = [44, 45];*/
    /*$zoom = 8;
    $yrange = [132, 135];
    $xrange = [88, 91];*/

    $zrange = [14, 14];
    //$zrange = [4, 6];

    writelog("INFO", "starting download...");

    $starttime = time();
    $time = 0;

    for ($z = $zrange[0]; $z <= $zrange[1]; $z++)
    {
        // swiss only
        $zoomfact = pow(2, ($z - 6));
        $yrange = [33 * $zoomfact, 33 * $zoomfact + $zoomfact - 1 ];
        $xrange = [22 * $zoomfact, 22 * $zoomfact + $zoomfact - 1 ];

        // full world
        /*$zoomfact = pow(2, $z);
        $xrange = [0, $zoomfact - 1];
        $yrange = [0, $zoomfact - 1];*/


        writelog("INFO", "z:" . $z);
        writelog("INFO", "y:" . $yrange[0] . "-" . $yrange[1]);
        writelog("INFO", "x:" . $xrange[0] . "-" . $xrange[1]);

        for ($y = $yrange[0]; $y <= $yrange[1]; $y++)
        {
            for ($x = $xrange[0]; $x <= $xrange[1]; $x++)
            {
                while (time() - $time < $minwaitsec)
                    sleep(1);

                $time = time();

                $url = $tile_base_urls[rand(0, count($tile_base_urls) - 1)] . $z . "/" . $y . "/" . $x . ".png";
                $save_path = $tile_dir . $z . "/" . $y . "/";
                $save_file = $save_path . $x . ".png";

                writelog("INFO", "loading tile " . $url);
                $contents = file_get_contents($url);

                writelog("INFO", "saving file " . $save_file);

                if (!file_exists($save_path))
                    mkdir($save_path, 0777, true);

                file_put_contents($save_file, $contents);
            }
        }
    }

    writelog("INFO", "download finished, download time: " . (time() - $starttime) . "s");

    function writelog($loglevel, $message)
    {
        echo date("Y-m-d H:i:s") . " " . $loglevel . ": " . $message . "\n";
    }
?>