<?php
	// add rotation support
	require('fpdf/rotation.php');
		
	
	if (isset($_GET["data"]))
	{
		$data = json_decode($_GET["data"], true);
		$waypoints = $data["waypoints"];
		$fuel = $data["fuel"];
		$pilot = $data["pilot"];
		$airplane = $data["airplane"];
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
	$ckpKeys = [ "freq", "callsign", "checkpoint", "mt", "dist", "alt", "eet", "eto", "ato", "remark" ];
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
		$pdf->Cell($genColWidth[$i], $rowHeight, $gen2ColTitle[$i], "LTRB", 0);

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
			if ($j == 0 && ($i >= 3 && $i <= 7))
				$pdf->Cell($ckpColWidth[$i], $rowHeight, getWaypointString($j, $ckpKeys[$i]), "LTRB", 0, "", true);
			else
				$pdf->Cell($ckpColWidth[$i], $rowHeight, getWaypointString($j, $ckpKeys[$i]), "LTRB", 0);

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
		$pdf->Cell($ckpColWidth[$i], $rowHeight, "", "LTRB", 0);

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
	$pdf->Cell($fuelColWidth[0], $rowHeight, $fuelColTitle[0], "LTRB", 0, "L"); // l/h
	$pdf->Cell($fuelColWidth[1], $rowHeight, $fuelColTitle[1], "LTRB", 0, "C", true); // time title
	$pdf->Cell($fuelColWidth[2], $rowHeight, $fuelColTitle[2], "LTRB", 0, "C", true); // fuel title

	
	// fuel entries
	for ($j = 0; $j < count($fuelRowTitle); $j++)
	{
		$pdf->SetXY($fuelLeft, $pdf->GetY() + $rowHeight); // new line

		$pdf->SetFont('Arial-Narrow', '', 10);
		$pdf->Cell($fuelColWidth[0], $rowHeight, $fuelRowTitle[$j], "LTRB", 0, "L");

		$pdf->SetFont('Arial', '', 10);
		$pdf->Cell($fuelColWidth[1], $rowHeight, "", "LTRB", 0, "C"); // time
		$pdf->Cell($fuelColWidth[2], $rowHeight, "", "LTRB", 0, "C"); // fuel
	}

	
	// fuel border
	$pdf->SetXY($cmtColWidth + $x0, $fuelTop);
	$pdf->SetLineWidth(0.3);
	$pdf->Cell($planWidth - $cmtColWidth, $rowHeight * $cmtNum, "", "LTRB");
		
		
	// output pdf
	$pdf->Output();
	
	
	function getWaypointString($index, $key)
	{
		global $waypoints;
	
		if (!isset($waypoints))
			return "";
			
		if (!isset($waypoints[$index]))
			return "";
			
		if (!isset($waypoints[$index][$key]))
			return "";
			
		return $waypoints[$index][$key];
	}
?> 