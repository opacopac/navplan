<?php
	function getAdCharts($airport_icao, $conn)
	{
        $query = "SELECT id, type, filename FROM ad_charts WHERE airport_icao = '" . $airport_icao . "'";
        $result = $conn->query($query);

        if ($result === FALSE)
            die("error reading charts: " . $conn->error . " query:" . $query);

        $charts = [];

        while ($rs = $result->fetch_array(MYSQLI_ASSOC))
        {
            $charts[] = array(
                id => $rs["id"],
                type => $rs["type"],
                filename => $rs["filename"]
            );
        }

        return $charts;
    }


	function getAdWebcams($airport_icao, $conn)
	{
        $query = "SELECT id, name, url FROM webcams WHERE airport_icao = '" . $airport_icao . "'";
        $result = $conn->query($query);

        if ($result === FALSE)
            die("error reading webcams: " . $conn->error . " query:" . $query);

        $webcams= [];

        while ($rs = $result->fetch_array(MYSQLI_ASSOC))
        {
            $webcams[] = array(
                id => $rs["id"],
                name => $rs["name"],
                url => $rs["url"]
            );
        }

        return $webcams;
    }
?>