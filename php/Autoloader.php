<?php
spl_autoload_register(function($className) {
    $file = str_replace('\\', '/', $className) . ".php";
    $filePathOwn = __DIR__ . "/" . $file;
    $filePathVendor = __DIR__ . "/vendor/" . $file;

    if (file_exists($filePathOwn))
        require_once $filePathOwn;
    else if (file_exists($filePathVendor))
        require_once $filePathVendor;
});
