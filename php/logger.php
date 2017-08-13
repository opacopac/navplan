<?php

class Logger
{
    //region FIELDS

    private $logfilename;
    private $logfile;

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


    public function writelog($loglevel, $message)
    {
        $message = date("Y-m-d H:i:s") . " " . $loglevel . ": " . $message . "\n";

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
