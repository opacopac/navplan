<?php
include("helper.php");
require('phpexcel/PHPExcel.php');

$postData = json_decode(file_get_contents('php://input'), true);

if (!$postData || !$postData["userFileName"] || !$postData["data"])
    die("ERROR: data parameters missing!");

$data = $postData["data"];
$waypoints = $data["waypoints"];
$alternate = $data["alternate"];
$fuel = $data["fuel"];
$pilot = $data["pilot"];
$aircraft = $data["aircraft"];
$comments = $data["comments"];


$sfc = 0.142822265625;
$sheetColWidth = array("A" => 42 * $sfc, "B" => 33 * $sfc, "C" => 112 * $sfc, "D" => 32 * $sfc, "E" => 32 * $sfc, "F" => 32 * $sfc, "G" => 0 * $sfc, "H" => 32 * $sfc, "I" => 32 * $sfc, "J" => 32 * $sfc, "K" => 52 * $sfc, "L" => 52 * $sfc );
$sfr = 0.75;
$sheetRowHeight = array("Title" => 45 * $sfr,  "Rest" => 22 * $sfr);
$sheetRowCount = 33;
$sheetRowHide = [23, 26];
$planTitle = array("A1" => "NAV-FLIGHTPLAN");
$genColTitle = array("A2" => "ACFT IDENT:", "D2" => "Date:", "H2" => "Off Bl.:", "K2" => "QNH:", "A3" => "Pilot:", "D3" => "GS:", "H3" => "Bl. on:", "K3" => "RWY:");
$ckpColTitle = array("A4" => "Freq.", "B4" => "C/S", "C4" => "Checkpoint", "D4" => "MT", "E4" => "Dist.", "F4" => "Alt.", "H4" => "EET", "I4" => "ETO", "J4" => "ATO", "K4" => "Remarks");
$mergeCells = [ "A1:L1", "A2:C2", "D2:F2", "H2:J2", "K2:L2", "A3:C3", "E3:F3", "H3:J3", "K3:L3", "K4:L4" ];
$borderCellsTitle = [ "A1:L1", "A2:C2", "D2:F2", "H2:J2", "K2:L2", "A3:C3", "D3:F3", "H3:J3", "K3:L3", "K4:L4" ];
$ckpKeys = array("freq" => "A", "callsign" => "B", "checkpoint" => "C", "mtText" => "D", "distText" => "E", "alt" => "F", "remark" => "K");


//  text/cell styles
$styleBorderThin = array(
    'borders' => array(
        'outline' => array(
            'style' => PHPExcel_Style_Border::BORDER_THIN,
        )
    )
);

$styleBorderThick = array(
    'borders' => array(
        'outline' => array(
            'style' => PHPExcel_Style_Border::BORDER_MEDIUM,
        )
    )
);

$styleAllBorder = array(
    'borders' => array(
        'allborders' => array(
            'style' => PHPExcel_Style_Border::BORDER_THIN,
            'color' => array('argb' => 'FF000000')
        )
    )
);

$styleNotUse = array(
    'borders' => array(
        'allborders' => array(
            'style' => PHPExcel_Style_Border::BORDER_THIN,
            'color' => array('argb' => 'FF000000')
        ),
        'diagonal' => array(
            'style' => PHPExcel_Style_Border::BORDER_THIN,
            'color' => array('argb' => 'FF000000')
        )
    ),
    'fill' => array(
        'type' => PHPExcel_Style_Fill::FILL_PATTERN_LIGHTGRAY,
        'color' => array('rgb' => '000000'),
        'endcolor' => array('rgb' => 'ffffff')
    )
);

$styleTitle = array(
    'font'  => array(
        'bold'  => true,
        'size'  => 16,
        'name'  => 'Arial'
    ),
    'alignment' => array(
        'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_CENTER,
        'vertical' => PHPExcel_Style_Alignment::VERTICAL_CENTER
    )
);

$styleGenTitle = array(
    'font'  => array(
        'bold'  => true,
        'size'  => 10,
        'name'  => 'Arial'
    ),
    'alignment' => array(
        'vertical' => PHPExcel_Style_Alignment::VERTICAL_CENTER
    )
);

$styleCkpTitle = array(
    'font'  => array(
        'bold'  => true,
        'size'  => 10,
        'name'  => 'Arial'
    ),
    'alignment' => array(
        'vertical' => PHPExcel_Style_Alignment::VERTICAL_CENTER
    ),
    'fill' => array(
        'type' => PHPExcel_Style_Fill::FILL_PATTERN_LIGHTGRAY,
        'color' => array('rgb' => '000000'),
        'endcolor' => array('rgb' => 'ffffff')
    )
);

$styleInputField = array(
    'font'  => array(
        'size'  => 10,
        'name'  => 'Arial'
    ),
    'alignment' => array(
        'vertical' => PHPExcel_Style_Alignment::VERTICAL_CENTER,
        'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_CENTER
    ),
    'fill' => array(
        'type' => PHPExcel_Style_Fill::FILL_SOLID,
        'color' => array('rgb' => 'ccffff')
    )
);

$styleInputBackground = array(
    'fill' => array(
        'type' => PHPExcel_Style_Fill::FILL_SOLID,
        'color' => array('rgb' => 'ccffff')
    )
);

$styleTextWps = array(
    'font'  => array(
        'size'  => 10,
        'name'  => 'Arial Narrow'
    ),
    'alignment' => array(
        'vertical' => PHPExcel_Style_Alignment::VERTICAL_CENTER
    )
);

$styleTextMtDist = array(
    'font'  => array(
        'size'  => 10,
        'name'  => 'Arial'
    ),
    'alignment' => array(
        'vertical' => PHPExcel_Style_Alignment::VERTICAL_CENTER,
        'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_CENTER
    )
);

$styleTextAltEet = array(
    'font'  => array(
        'size'  => 10,
        'name'  => 'Arial Narrow'
    ),
    'alignment' => array(
        'vertical' => PHPExcel_Style_Alignment::VERTICAL_CENTER,
        'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_CENTER
    )
);

$styleTextAlternateTitle = array(
    'font'  => array(
        'underline'  => true,
        'size'  => 10,
        'name'  => 'Arial Narrow'
    ),
    'alignment' => array(
        'vertical' => PHPExcel_Style_Alignment::VERTICAL_CENTER
    )
);

$styleFuelTitle = array(
    'font'  => array(
        'bold'  => true,
        'size'  => 11,
        'name'  => 'Arial'
    ),
    'alignment' => array(
        'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_CENTER,
        'vertical' => PHPExcel_Style_Alignment::VERTICAL_CENTER
    ),
    'borders' => array(
        'allborders' => array(
            'style' => PHPExcel_Style_Border::BORDER_THIN,
            'color' => array('argb' => 'FF000000')
        )
    ),
    'fill' => array(
        'type' => PHPExcel_Style_Fill::FILL_PATTERN_LIGHTGRAY,
        'color' => array('rgb' => '000000'),
        'endcolor' => array('rgb' => 'ffffff')
    )
);

$styleFuelColTitle = array(
    'font'  => array(
        'bold'  => true,
        'size'  => 10,
        'name'  => 'Arial'
    ),
    'alignment' => array(
        'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_CENTER,
        'vertical' => PHPExcel_Style_Alignment::VERTICAL_CENTER
    ),
    'borders' => array(
        'allborders' => array(
            'style' => PHPExcel_Style_Border::BORDER_THIN,
            'color' => array('argb' => 'FF000000')
        )
    ),
    'fill' => array(
        'type' => PHPExcel_Style_Fill::FILL_PATTERN_LIGHTGRAY,
        'color' => array('rgb' => '000000'),
        'endcolor' => array('rgb' => 'ffffff')
    )
);

$styleFuelConsumptionTitle = array(
    'font'  => array(
        'bold'  => true,
        'size'  => 10,
        'name'  => 'Arial'
    ),
    'alignment' => array(
        'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_CENTER,
        'vertical' => PHPExcel_Style_Alignment::VERTICAL_CENTER
    )
);

$styleFuelRowTitle = array(
    'font'  => array(
        'size'  => 10,
        'name'  => 'Arial Narrow'
    ),
    'alignment' => array(
        'vertical' => PHPExcel_Style_Alignment::VERTICAL_CENTER
    ),
    'borders' => array(
        'allborders' => array(
            'style' => PHPExcel_Style_Border::BORDER_THIN,
            'color' => array('argb' => 'FF000000')
        )
    )
);

$styleBlockFuelTitle = array(
    'font'  => array(
        'bold'  => true,
        'size'  => 10,
        'name'  => 'Arial Narrow'
    ),
    'alignment' => array(
        'vertical' => PHPExcel_Style_Alignment::VERTICAL_CENTER
    ),
    'borders' => array(
        'allborders' => array(
            'style' => PHPExcel_Style_Border::BORDER_THIN,
            'color' => array('argb' => 'FF000000')
        )
    )
);

$styleFuelText = array(
    'font'  => array(
        'size'  => 10,
        'name'  => 'Arial'
    ),
    'alignment' => array(
        'vertical' => PHPExcel_Style_Alignment::VERTICAL_CENTER,
        'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_CENTER
    ),
    'borders' => array(
        'allborders' => array(
            'style' => PHPExcel_Style_Border::BORDER_THIN,
            'color' => array('argb' => 'FF000000')
        )
    )
);


// create new excel
$objPHPExcel = new PHPExcel();

// set doc title
$objPHPExcel->getProperties()->setTitle("NAV-Flightplan");

// select active sheet
$objPHPExcel->setActiveSheetIndex(0);

// Set page orientation and size
$objPHPExcel->getActiveSheet()->getPageSetup()->setOrientation(PHPExcel_Worksheet_PageSetup::ORIENTATION_LANDSCAPE);
$objPHPExcel->getActiveSheet()->getPageSetup()->setPaperSize(PHPExcel_Worksheet_PageSetup::PAPERSIZE_A4);
$objPHPExcel->getActiveSheet()->getPageMargins()->setTop(0.394);
$objPHPExcel->getActiveSheet()->getPageMargins()->setLeft(0.315);
$objPHPExcel->getActiveSheet()->getPageMargins()->setRight(0.236);
$objPHPExcel->getActiveSheet()->getPageMargins()->setBottom(0.394);

// set sheet title
$objPHPExcel->getActiveSheet()->setTitle('NAV-Flightplan');

// set default font
$objPHPExcel->getActiveSheet()->getDefaultStyle()->getFont()->setName('Arial')->setSize(10);

// set column widths
foreach($sheetColWidth as $colName => $colWidth)
{
    if ($colWidth > 0)
        $objPHPExcel->getActiveSheet()->getColumnDimension($colName)->setWidth($colWidth);
    else
        $objPHPExcel->getActiveSheet()->getColumnDimension($colName)->setVisible(false);
}

// set row heights
for ($i = 0; $i < $sheetRowCount; $i++)
{
    if ($i == 0)
        $h = $sheetRowHeight["Title"];
    else if (in_array($i + 1, $sheetRowHide))
        $h = 0;
    else
        $h = $sheetRowHeight["Rest"];

    if ($h > 0)
        $objPHPExcel->getActiveSheet()->getRowDimension(($i + 1) . '')->setRowHeight($h);
    else
        $objPHPExcel->getActiveSheet()->getRowDimension(($i + 1) . '')->setVisible(false);
}

// merge cells
foreach($mergeCells as $cellRange)
    $objPHPExcel->getActiveSheet()->mergeCells($cellRange);

// title borders
foreach($borderCellsTitle as $cellRange)
    $objPHPExcel->getActiveSheet()->getStyle($cellRange)->applyFromArray($styleBorderThin);

// plan title
foreach($planTitle as $cellName => $text)
{
    $objPHPExcel->getActiveSheet()->setCellValue($cellName, $text);
    $objPHPExcel->getActiveSheet()->getStyle($cellName)->applyFromArray($styleTitle);
}

// general data titles
foreach($genColTitle as $cellName => $text)
{
    $objPHPExcel->getActiveSheet()->setCellValue($cellName, $text);
    $objPHPExcel->getActiveSheet()->getStyle($cellName)->applyFromArray($styleGenTitle);
}


// groundspeed cell
$objPHPExcel->getActiveSheet()->setCellValue("E3", getSpeedString());
$objPHPExcel->getActiveSheet()->getStyle("E3")->applyFromArray($styleInputField);
$objPHPExcel->addNamedRange(
    new PHPExcel_NamedRange('groundspeed1', $objPHPExcel->getActiveSheet(), 'E3')
);

// checkpoint titles
foreach($ckpColTitle as $cellName => $text)
{
    $objPHPExcel->getActiveSheet()->setCellValue($cellName, $text);
    $objPHPExcel->getActiveSheet()->getStyle($cellName)
        ->applyFromArray($styleCkpTitle)
        ->applyFromArray($styleBorderThin);
}

// checkpoint title border
$objPHPExcel->getActiveSheet()->getStyle("A4:L4")->applyFromArray($styleBorderThick);

// checkpoint grid
$objPHPExcel->getActiveSheet()->getStyle("A5:L25")->applyFromArray($styleAllBorder);

// do-not-use-cells (1st row)
$objPHPExcel->getActiveSheet()->getStyle("D5:I5")->applyFromArray($styleNotUse);

// checkpoint cell/text styles
for ($i = 5; $i < 26; $i++)
{
    // merge remark cells
    $objPHPExcel->getActiveSheet()->mergeCells("K" . $i . ":L" . $i);

    // cell/text styles
    $objPHPExcel->getActiveSheet()->getStyle("A" . $i . ":C" . $i)->applyFromArray($styleTextWps); // freq, c/s, checkpoint
    $objPHPExcel->getActiveSheet()->getStyle("D" . $i . ":E" . $i)->applyFromArray($styleTextMtDist); // mt, dist
    $objPHPExcel->getActiveSheet()->getStyle("F" . $i . ":H" . $i)->applyFromArray($styleTextAltEet); // alt, eet
    $objPHPExcel->getActiveSheet()->getStyle("K" . $i)->applyFromArray($styleTextWps); // remarks

}

// input background
$objPHPExcel->getActiveSheet()->getStyle("A5:C5")->applyFromArray($styleInputBackground);
$objPHPExcel->getActiveSheet()->getStyle("A6:F22")->applyFromArray($styleInputBackground);
$objPHPExcel->getActiveSheet()->getStyle("K5:L22")->applyFromArray($styleInputBackground);
$objPHPExcel->getActiveSheet()->getStyle("A25:F25")->applyFromArray($styleInputBackground);
$objPHPExcel->getActiveSheet()->getStyle("K25:L25")->applyFromArray($styleInputBackground);

// add eet-formulas
for ($i = 6; $i < 22; $i++)
{
    $objPHPExcel->getActiveSheet()->setCellValue("G" . $i, getPreEetFormula($i));
    $objPHPExcel->getActiveSheet()->setCellValue("H" . $i, getEetFormula($i));
}

// checkpoint values
for ($i = 0; $i < 18; $i++)
{
    foreach($ckpKeys as $key => $col)
        $objPHPExcel->getActiveSheet()->setCellValueExplicit($col . ($i + 5), getWaypointString($i, $key), PHPExcel_Cell_DataType::TYPE_STRING);
}

// pre-eet/dist sums
$objPHPExcel->getActiveSheet()->setCellValue("E23", "=SUM(E6:E22)");
$objPHPExcel->getActiveSheet()->setCellValue("G23", "=SUM(G6:G22)");

// triptime cell
$objPHPExcel->addNamedRange(new PHPExcel_NamedRange('triptime1', $objPHPExcel->getActiveSheet(), 'H23'));
$objPHPExcel->getActiveSheet()->setCellValue("H23", "=IF(G23>0, G23+COUNTIF(D6:D22, \"VAC\")*5, \"\")");

// alternate title
$objPHPExcel->getActiveSheet()->getStyle("C24")->applyFromArray($styleTextAlternateTitle);
$objPHPExcel->getActiveSheet()->setCellValue("C24", "Alternate:");

// alternate values
foreach($ckpKeys as $key => $col)
{
    if (isset($alternate) && isset($alternate[$key]))
        $text = $alternate[$key];
    else
        $text = "";

    $objPHPExcel->getActiveSheet()->setCellValue($col . "25", $text);
}

// alternate eet-formulas
$objPHPExcel->getActiveSheet()->setCellValue("G25", getPreEetFormula(25));
$objPHPExcel->getActiveSheet()->setCellValue("H25", "=IF(G25>0,G25 & \"/+5\",\"\")");

// alternate time cell
$objPHPExcel->addNamedRange(new PHPExcel_NamedRange('alternatetime1', $objPHPExcel->getActiveSheet(), 'H26'));
$objPHPExcel->getActiveSheet()->setCellValue("H26", "=IF(G25>0,G25+5,0)");

// comment cells
$commentLines = explode("\n", $comments);
for ($i = 27; $i <= 33; $i++)
{
    $objPHPExcel->getActiveSheet()->mergeCells("A" . $i . ":F" . $i);
    $objPHPExcel->getActiveSheet()->getStyle("K" . $i)->applyFromArray($styleTextWps);

    if (count($commentLines) > $i - 27)
        $objPHPExcel->getActiveSheet()->setCellValue("A" . $i, $commentLines[$i - 27]);
}

// comment grid
$objPHPExcel->getActiveSheet()->getStyle("A27:F33")->applyFromArray($styleAllBorder);

// fuel title
$objPHPExcel->getActiveSheet()->mergeCells("H27:H33");
$objPHPExcel->getActiveSheet()->getStyle("H27:H33")->applyFromArray($styleFuelTitle);
$objPHPExcel->getActiveSheet()->getStyle("H27")->getAlignment()->setTextRotation(90);
$objPHPExcel->getActiveSheet()->setCellValue("H27", "Fuel calc.");

// merge row title cells
for ($i = 28; $i <= 33; $i++)
    $objPHPExcel->getActiveSheet()->mergeCells("I" . $i . ":J" . $i);

// col titles
$objPHPExcel->getActiveSheet()->setCellValue("I27", "l/h:");
$objPHPExcel->getActiveSheet()->getStyle("I27")->applyFromArray($styleFuelConsumptionTitle);
$objPHPExcel->getActiveSheet()->setCellValue("K27", "Time");
$objPHPExcel->getActiveSheet()->setCellValue("L27", "Fuel");
$objPHPExcel->getActiveSheet()->getStyle("K27:L27")->applyFromArray($styleFuelColTitle);


// row titles
for ($i = 28; $i <= 33; $i++)
    $objPHPExcel->getActiveSheet()->getStyle("H27:H33")->applyFromArray($styleFuelTitle);

$objPHPExcel->getActiveSheet()->setCellValue("I28", "Trip");
$objPHPExcel->getActiveSheet()->setCellValue("I29", "Alternate");
$objPHPExcel->getActiveSheet()->setCellValue("I30", "Reserve");
$objPHPExcel->getActiveSheet()->setCellValue("I31", "Minimum");
$objPHPExcel->getActiveSheet()->setCellValue("I32", "Extra fuel");
$objPHPExcel->getActiveSheet()->setCellValue("I33", "Block fuel");
$objPHPExcel->getActiveSheet()->getStyle("I28:J32")->applyFromArray($styleFuelRowTitle);
$objPHPExcel->getActiveSheet()->getStyle("I33:J33")->applyFromArray($styleBlockFuelTitle);

// consumption cell
$objPHPExcel->addNamedRange(new PHPExcel_NamedRange('fuelconsumption1', $objPHPExcel->getActiveSheet(), "J27"));
$objPHPExcel->getActiveSheet()->setCellValue("J27", getFuelConsumptionString());
$objPHPExcel->getActiveSheet()->getStyle("J27")->applyFromArray($styleInputField);

// time formulas
for ($i = 28; $i <= 33; $i++)
{
    $objPHPExcel->getActiveSheet()->getStyle("K" . $i)->getNumberFormat()->setFormatCode('hh:mm');
}

$objPHPExcel->getActiveSheet()->setCellValue("K28", "=IF(triptime1<>\"\",1/24/60*triptime1,\"\")"); // trip
$objPHPExcel->getActiveSheet()->setCellValue("K29", "=IF(alternatetime1>0,1/24/60*alternatetime1,\"\")"); // alternate
$objPHPExcel->getActiveSheet()->setCellValue("K30", "=1/24/60*45"); // reserve
$objPHPExcel->getActiveSheet()->setCellValue("K31", "=IF(AND(K28<>\"\",K29<>\"\"),SUM(K28:K30),\"\")"); // minimum
$objPHPExcel->getActiveSheet()->setCellValue("K32", getExtraFuelString()); // extra
$objPHPExcel->getActiveSheet()->setCellValue("K33", "=IF(K31<>\"\",SUM(K31:K32),\"\")"); // block


// fuel formulas
$objPHPExcel->getActiveSheet()->setCellValue("L28", getFuelFormula(28)); // trip
$objPHPExcel->getActiveSheet()->setCellValue("L29", getFuelFormula(29)); // alternate
$objPHPExcel->getActiveSheet()->setCellValue("L30", getFuelFormula(30)); // reserve
$objPHPExcel->getActiveSheet()->setCellValue("L31", "=IF(AND(L28<>\"\",L29<>\"\"),SUM(L28:L30),\"\")"); // minimum
$objPHPExcel->getActiveSheet()->setCellValue("L32", getFuelFormula(32)); // extra
$objPHPExcel->getActiveSheet()->setCellValue("L33", "=IF(L31<>\"\",SUM(L31:L32),\"\")"); // block

// fuel time/fuel style
$objPHPExcel->getActiveSheet()->getStyle("K28:L33")->applyFromArray($styleFuelText);
$objPHPExcel->getActiveSheet()->getStyle("K32")->applyFromArray($styleInputBackground);

// fuel border
$objPHPExcel->getActiveSheet()->getStyle("H27:L33")->applyFromArray($styleBorderThick);


// create temp file
$userFileName = checkFilename($postData["userFileName"]);
$tmpDir = createTempDir();
$tmpFile = $tmpDir . "/" . $userFileName;

// output pdf
$objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel2007');
$objWriter->setPreCalculateFormulas(true);
$objWriter->save(TMP_DIR_BASE . $tmpFile);

// return tempfile
echo json_encode(array("tmpFile" => $tmpFile), JSON_NUMERIC_CHECK);
exit;


function getWaypointString($index, $key)
{
    global $waypoints;

    if (!isset($waypoints) || !isset($waypoints[$index]) || !isset($waypoints[$index][$key]))
        return "";

    //return utf8_decode($waypoints[$index][$key]);
    return $waypoints[$index][$key];
}


function getPreEetFormula($row)
{
    return "=IF(groundspeed1>0, ROUNDUP((E" . $row . "/groundspeed1)*60, 0), 0)";
}


function getEetFormula($row)
{
    return "=IF(G" . $row . " > 0, IF(D" . $row . " = \"VAC\", G" . $row . " & \"/+5\", G" . $row . "), IF((COUNTIF(G" . $row . ":G$22, \">0\")=0)*(G" . ($row - 1) . ">0), triptime1, \"\"))";
}


function getFuelFormula($row)
{
    return "=IF(AND(fuelconsumption1>0,K" . $row . "<>\"\"), ROUNDUP(fuelconsumption1*K" . $row . "*24,0),\"\")";
}


function getSpeedString()
{
    global $aircraft;

    if (!isset($aircraft) || !isset($aircraft["speed"]) || $aircraft["speed"] <= 0)
        return "";

    return $aircraft["speed"];
}


function getFuelConsumptionString()
{
    global $aircraft;

    if (!isset($aircraft) || !isset($aircraft["consumption"]) || $aircraft["consumption"] <= 0)
        return "";

    return $aircraft["consumption"];
}


function getExtraFuelString()
{
    global $fuel;

    if (!isset($fuel) || !isset($fuel["extraTime"]) || $fuel["extraTime"] <= 0)
        return "";

    $hours = floor($fuel["extraTime"] / 60);
    $minutes = $fuel["extraTime"] % 60;

    if ($hours < 10)
        $hours = "0" . $hours;

    if ($minutes < 10)
        $minutes = "0" . $minutes;

    return  $hours . ":" . $minutes;
}
