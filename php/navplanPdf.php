<?php
	// add rotation support
	require('fpdf/rotation.php');

	if (isset($_POST["data"]))
	{
		$data = json_decode(urldecode($_POST["data"]), true);
		$waypoints = $data["waypoints"];
		$alternate = $data["alternate"];
		$fuel = $data["fuel"];
		$pilot = $data["pilot"];
		$aircraft = $data["aircraft"];
	}

	$x0 = 8;
	$y0 = 10;
	$rowHeight = 5.82;
	$planWidth = 136.56;
	$planTitle = "NAV-FLIGHTPLAN";
	$genColWidth = [ 52.92, 27, 27, 29.64 ];
	$gen1ColTitle = [ "ACFT IDENT:", "Date:", "Off Bl.:", "QNH:" ];
	$gen2ColTitle = [ "Pilot:", "GS:", "Bl. on:", "RWY:" ];
	$ckpColWidth = [ 11.91, 9.26, 31.75, 9, 9, 9, 9, 9, 9, 29.64 ];
	$ckpColTitle = [ "Freq.", "C/S", "Checkpoint", "MT", "Dist.", "Alt.", "EET", "ETO", "ATO", "Remarks" ];
	$ckpKeys = [ "freq", "callsign", "checkpoint", "mtText", "distText", "alt", "eetText", "eto", "ato", "remark" ];
	$ckpNum = 18;
	$cmtColWidth = 79.92;
	$cmtNum = 7;
	$fuelTitle = "Fuel calc.";
	$fuelTitleColWidth = 9;
	$fuelColWidth = [ 18, 14.82, 14.82 ];
	$fuelColTitle = [ "l/h:", "Time", "Fuel" ];
	$fuelRowTitle = [ "Trip", "Alternate", "Reserve", "Minimum", "Extra fuel", "Block fuel" ];

	
	$pdf = new PDF_Rotate('L', 'mm', 'A4');
	$pdf->SetTitle($planTitle);
	$pdf->AddFont('Arial-Narrow', '', 'arial-narrow.php');
	$pdf->AddPage();
	$pdf->SetAutoPageBreak(false);
	$pdf->SetMargins($x0, $y0);
	$pdf->SetLineWidth(0.1);
	
	// title
	$pdf->SetY($pdf->GetY()); // move to right margin
	$pdf->SetFont('Arial', 'B', 16);
	$pdf->Cell($planWidth, $rowHeight * 2, $planTitle, "LTRB", 2, "C", false);

	
	// general data
	$pdf->SetFont('Arial', 'B', 10);
	
	for ($i = 0; $i < count($genColWidth); $i++)
		$pdf->Cell($genColWidth[$i], $rowHeight, $gen1ColTitle[$i], "LTRB", 0);
		
	$pdf->SetY($pdf->GetY() + $rowHeight); // new line
	
	for ($i = 0; $i < count($genColWidth); $i++)
	{
		$text = $gen2ColTitle[$i];
		
		if ($i == 1) // speed
			$text .= getSpeedString();
	
		$pdf->Cell($genColWidth[$i], $rowHeight, $text, "LTRB", 0);
	}

	$pdf->SetY($pdf->GetY() + $rowHeight); // new line
	
		
	// checkpoints headers
	$pdf->SetLineWidth(0.3);
	$pdf->SetFillColor(160, 160, 160);
	
	for ($i = 0; $i < count($ckpColWidth); $i++)
		$pdf->Cell($ckpColWidth[$i], $rowHeight, $ckpColTitle[$i], "LTRB", 0, "", true);
	
	$pdf->SetY($pdf->GetY() + $rowHeight); // new line

	
	// checkpoints
	$pdf->SetLineWidth(0.1);
	$pdf->SetFont('Arial-Narrow', '', 10);
	
	for ($j = 0; $j < $ckpNum; $j++)
	{
		for ($i = 0; $i < count($ckpColWidth); $i++)
		{
			if ($i >= 3 && $i <= 8)
				$align = "C"; // align center
			else
				$align = "L"; // align left
			
			if ($j == 0 && ($i >= 3 && $i <= 7))  // grey filled cells in first row
				$pdf->Cell($ckpColWidth[$i], $rowHeight, "", "LTRB", 0, $align, true);
			else
			{
			    $pos_x0 = $pdf->GetX();
			    $pos_y0 = $pdf->GetY();
				$pdf->Cell($ckpColWidth[$i], $rowHeight, getWaypointString($j, $ckpKeys[$i]), "LTRB", 0, $align);
			    $pos_x1 = $pdf->GetX();
			    $pos_y1 = $pdf->GetY();

			    if ($ckpKeys[$i] == "alt")
			        drawMinMaxLines($j, $pos_x0, $pos_y0, $pos_x1, $pos_y1);
			}
		}

		$pdf->SetY($pdf->GetY() + $rowHeight); // new line
	}

	// alternate
	for ($i = 0; $i < count($ckpColWidth); $i++)
	{
		$pdf->SetFont('Arial-Narrow', 'U', 10);

		if ($i == 2)
			$pdf->Cell($ckpColWidth[$i], $rowHeight, "Alternate:", "LTRB", 0);
		else
			$pdf->Cell($ckpColWidth[$i], $rowHeight, "", "LTRB", 0);
	}

	$pdf->SetY($pdf->GetY() + $rowHeight); // new line
	
	$pdf->SetFont('Arial-Narrow', '', 10);
	
	for ($i = 0; $i < count($ckpColWidth); $i++)
	{
		if ($i >= 3 && $i <= 8)
			$align = "C"; // align center
		else
			$align = "L"; // align left

		if (isset($alternate) && isset($alternate[$ckpKeys[$i]]))
			$pdf->Cell($ckpColWidth[$i], $rowHeight, utf8_decode($alternate[$ckpKeys[$i]]), "LTRB", 0, $align);
		else
			$pdf->Cell($ckpColWidth[$i], $rowHeight, "", "LTRB", 0);
	}

	$pdf->SetY($pdf->GetY() + $rowHeight); // new line
		
	$fuelTop = $pdf->GetY();

	
	// comments lines
	for ($i = 0; $i < $cmtNum; $i++)
		$pdf->Cell($cmtColWidth, $rowHeight, "", "LTRB", 2);

		
	// fuel title
	$pdf->SetXY($cmtColWidth + $x0, $fuelTop);
	$pdf->Cell($fuelTitleColWidth, $rowHeight * $cmtNum, "", 0, 0, "", true);
	$pdf->SetFont('Arial', 'B', 11);
	$pdf->RotatedText(94, 185, $fuelTitle, 90);
	
	$fuelLeft = $pdf->GetX();
	
	
	// fuel headers
	$pdf->SetFont('Arial', 'B', 10);
	$pdf->Cell($fuelColWidth[0], $rowHeight, $fuelColTitle[0] . getFuelConsumptionString(), "LTRB", 0, "L"); // l/h
	$pdf->Cell($fuelColWidth[1], $rowHeight, $fuelColTitle[1], "LTRB", 0, "C", true); // time title
	$pdf->Cell($fuelColWidth[2], $rowHeight, $fuelColTitle[2], "LTRB", 0, "C", true); // fuel title


	// fuel entries
	for ($j = 0; $j < count($fuelRowTitle); $j++)
	{
		$pdf->SetXY($fuelLeft, $pdf->GetY() + $rowHeight); // new line

		$pdf->SetFont('Arial-Narrow', '', 10);
		$pdf->Cell($fuelColWidth[0], $rowHeight, $fuelRowTitle[$j], "LTRB", 0, "L"); // row title

		$pdf->SetFont('Arial', '', 10);
		$pdf->Cell($fuelColWidth[1], $rowHeight, getFuelTimeString($j), "LTRB", 0, "C"); // time
		$pdf->Cell($fuelColWidth[2], $rowHeight, getFuelAmountString($j), "LTRB", 0, "C"); // fuel
	}

	
	// fuel border
	$pdf->SetXY($cmtColWidth + $x0, $fuelTop);
	$pdf->SetLineWidth(0.3);
	$pdf->Cell($planWidth - $cmtColWidth, $rowHeight * $cmtNum, "", "LTRB");
		
		
	// output pdf
	$pdf->Output();
	
	
	function drawMinMaxLines($index, $pos_x0, $pos_y0, $pos_x1, $pos_y1)
	{
		global $pdf, $waypoints, $rowHeight;

		if (!isset($waypoints))
			return;

		if (!isset($waypoints[$index]))
			return;

		if ($waypoints[$index]["isminalt"])
		    $pdf->Line($pos_x0 + 1, $pos_y0 + 4.9, $pos_x1 - 1, $pos_y1 + 4.9);

		if ($waypoints[$index]["ismaxalt"])
		    $pdf->Line($pos_x0 + 1, $pos_y0 + 0.75, $pos_x1 - 1, $pos_y1 + 0.75);
	}
	
	
	function getWaypointString($index, $key)
	{
		global $waypoints;
	
		if (!isset($waypoints))
			return "";
			
		if (!isset($waypoints[$index]))
			return "";
			
		if (!isset($waypoints[$index][$key]))
			return "";
			
		return utf8_decode($waypoints[$index][$key]);
	}
	
	
	function getSpeedString()
	{
		global $aircraft;
		
		if (!isset($aircraft) || !isset($aircraft["speed"]) || $aircraft["speed"] <= 0)
			return "";
			
		return " " . $aircraft["speed"] . "kt";
	}

	
	function getFuelConsumptionString()
	{
		global $aircraft;
		
		if (!isset($aircraft) || !isset($aircraft["consumption"]) || $aircraft["consumption"] <= 0)
			return "";
			
		return " " . $aircraft["consumption"];
	}

	
	function getFuelTime($index)
	{
		global $fuel;
		
		$time = 0;
		
		switch ($index)
		{
			case 0: // trip time
				$time = $fuel["tripTime"];
				break;
			case 1: // alternate time
				$time = $fuel["alternateTime"];
				break;
			case 2: // reserve time
				$time = $fuel["reserveTime"];
				break;
			case 3: // minimum time
				if ($fuel["tripTime"] > 0 || $fuel["alternateTime"] > 0)
					$time = $fuel["tripTime"] + $fuel["alternateTime"] + $fuel["reserveTime"];
				else
					$time = 0;
				break;
			case 4: // extra time
				$time = $fuel["extraTime"];
				break;
			case 5: // block time
				if ($fuel["tripTime"] > 0 || $fuel["alternateTime"] > 0)
					$time = $fuel["tripTime"] + $fuel["alternateTime"] + $fuel["reserveTime"] + $fuel["extraTime"];
				else
					$time = 0;
				break;
			default:
				$time = 0;
		}
		
		return $time;
	}
	
	
	function getFuelTimeString($index)
	{
		$time = getFuelTime($index);
	
		if ($time <= 0)
			return "";

		$hours = floor($time / 60);
		$minutes = $time % 60;
		
		if ($hours < 10)
			$hours = "0" . $hours;
		
		if ($minutes < 10)
			$minutes = "0" . $minutes;
			
		return $hours . ":" . $minutes;
	}
	
	
	function getFuelAmountString($index)
	{
		global $aircraft;
		
		if (!isset($aircraft) || !isset($aircraft["consumption"]) || $aircraft["consumption"] <= 0)
			return "";
		
		$time = getFuelTime($index);
	
		if ($time > 0)
			return ceil($time / 60 * $aircraft["consumption"]);
		else
			return "";
	}
?> 