#!/usr/bin/env php
<?php

require_once('./websockets.php');
require_once('./ognlistener.php');


class trafficServer extends WebSocketServer
{
    private $userList;
    private $ognListener;
    private $acList;


    public function __construct($server, $port, $ognListener)
    {
        parent::__construct($server, $port);

        $this->ognListener = $ognListener;
        $this->userList = array();
    }


    protected function process($user, $message)
    {
        // TODO: subscribe user region
    }


    protected function connected($user)
    {
        $this->userList[$user->id] = $user;
    }


    protected function closed($user)
    {
        unset($this->userList[$user->id]);
    }


    protected function tick()
    {
        $messageList = [];

        do
        {
            $ac_message = $this->ognListener->read();

            if ($ac_message !== false)
            {
                /*if (!$this->acList[$ac_message->id])
                    $this->acList[$ac_message->id] = array*/

                $messageList[] = $ac_message;
            }
        }
        while ($ac_message !== false);

        if (count($messageList) > 0)
        {
            foreach ($this->userList as $user)
                $this->send($user, json_encode(array("messagelist" => $messageList), JSON_NUMERIC_CHECK));
        }
    }
}


$ognListener = new OgnListener();
$ognListener->connect();


$trafficServer = new trafficServer("0.0.0.0","8080", $ognListener);

try
{
    $trafficServer->run();
}
catch (Exception $e)
{
    $trafficServer->stdout($e->getMessage());
}

$ognListener->disconnect();
