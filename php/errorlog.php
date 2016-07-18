<?php
    $logfile = './errorlog/error.log';

	//$input = json_decode(file_get_contents('php://input'), true);
	$errorMsg = date("Y-m-d H:i:s") . " - " . $_SERVER['REMOTE_ADDR'] . " - " . $_SERVER['HTTP_USER_AGENT'] . "\n";
	$errorMsg .= file_get_contents('php://input') . "\n\n";

    file_put_contents($logfile, $errorMsg, FILE_APPEND);
?>