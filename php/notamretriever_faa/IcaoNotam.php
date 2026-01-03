<?php declare(strict_types=1);

namespace notamretriever_faa;


class IcaoNotam
{
    /*
    JSON example:
    {
        "id": "E1816/25",
        "entity": "RT",
        "status": "CA",
        "Qcode": "RTCA",
        "Area": "Navigation Warnings",
        "SubArea": "Airspace restrictions",
        "Condition": "Changes",
        "Subject": "Temporary restricted area",
        "Modifier": "Activated",
        "message": "TEMPO RESTRICTED AREA ACT AS FLW\nA CIRCLE RADIUS 3.5NM CENTERED ON 364844N1264748E",
        "startdate": "2025-06-30T15:00:00.000Z",
        "enddate": "2025-09-30T14:59:00.000Z",
        "all": "E1816/25 NOTAMN  \nQ) RKRR/QRTCA/IV/BO/W/020/040/3649N12648E004\nA) RKRR B) 2506301500 C) 2509301459\nE) TEMPO RESTRICTED AREA ACT AS FLW\nA CIRCLE RADIUS 3.5NM CENTERED ON 364844N1264748E\nF) 2000FT AMSL G) 4000FT AMSL\nCREATED: 10 Jun 2025 11:24:00 \nSOURCE: RKRRYNYX",
        "location": "RKRR",
        "isICAO": true,
        "Created": "2025-09-01T12:38:00.000Z",
        "key": "E1816/25-RKRR",
        "type": "airspace",
        "StateCode": "KOR",
        "StateName": "Republic of Korea"
    }
     */

    public function __construct(
        public string $id,
        public string $entity,
        public string $status,
        public string $Qcode,
        public string $Area,
        public string $SubArea,
        public string $Condition,
        public string $Subject,
        public string $Modifier,
        public string $message,
        public string $startdate,
        public string $enddate,
        public string $all,
        public string $location,
        public bool $isICAO,
        public string $Created,
        public string $key,
        public string $type,
        public string $StateCode,
        public string $StateName
    )
    {
    }

    /**
     * Convert NOTAM to JSON string
     */
    public function getJson(): string
    {
        return json_encode([
            'id' => $this->id,
            'entity' => $this->entity,
            'status' => $this->status,
            'Qcode' => $this->Qcode,
            'Area' => $this->Area,
            'SubArea' => $this->SubArea,
            'Condition' => $this->Condition,
            'Subject' => $this->Subject,
            'Modifier' => $this->Modifier,
            'message' => $this->message,
            'startdate' => $this->startdate,
            'enddate' => $this->enddate,
            'all' => $this->all,
            'location' => $this->location,
            'isICAO' => $this->isICAO,
            'Created' => $this->Created,
            'key' => $this->key,
            'type' => $this->type,
            'StateCode' => $this->StateCode,
            'StateName' => $this->StateName
        ], JSON_NUMERIC_CHECK);
    }
}

