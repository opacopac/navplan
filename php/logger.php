<?php

class Logger
{
    //region FIELDS

    private $logfilename;
    private $logfile;
    private $outputLogLevels;
    private $newLine;

    //endregion


    //region CONSTRUCTOR / DESTRUCTOR

    /**
     * Logger constructor.
     * @param string $logfilename Path to log file or null for screen logging.
     */
    function __construct($logfilename)
    {
        if ($logfilename)
            $this->openLog($logfilename);

        $this->outputLogLevels = ["ERROR", "WARNING", "INFO"];
        $this->newLine = "\n";

        if (strpos(php_sapi_name(), "cgi") !== false)
            $this->newLine = "<br />\n";
    }


    function __destruct()
    {
        $this->closeLog();
    }

    //endregion


    // region PUBLIC METHODS

    public function isLogReady()
    {
        if ($this->logfile)
            return true;
        else
            return false;
    }


    public function setOutputLogLevels($logLevelList)
    {
        if (!is_array($logLevelList))
            die("parameter logLevelList must be an array");

        $this->outputLogLevels = $logLevelList;
    }


    public function addOutputLogLevel($logLevel)
    {
        $this->outputLogLevels[] = $logLevel;
    }


    public function writelog($loglevel, $message)
    {
        if (!in_array($loglevel, $this->outputLogLevels))
            return;

        $message = date("Y-m-d H:i:s") . " " . $loglevel . ": " . $message . $this->newLine;

        if ($this->logfile)
            fputs($this->logfile, $message);
        else
            echo($message);
    }


    public function openLog($logfilename)
    {
        $this->logfilename = $logfilename;
        $this->logfile = fopen($logfilename, "a");

        return $this->isLogReady();
    }


    public function closeLog()
    {
        if ($this->logfile)
            fclose($this->logfile);

        $this->logfilename = NULL;
    }

    //endregion
}
