<?php declare(strict_types=1);

namespace notamretriever_faa;

require_once __DIR__ . '/NotamQCodeText.php';

/**
 * Represents a FAA SWIM NOTAM with all relevant fields
 * Only includes fields that are used in the FAA to ICAO NOTAM conversion
 */
class FaaNotam
{
    // Fields used for NOTAM identification (getIdentifier)
    public ?string $series = null;
    public ?string $number = null;
    public ?string $year = null;
    public ?string $type = null; // N = New, R = Replace, C = Cancel
    public ?string $simpleText = null; // For LOCAL_FORMAT NOTAMs

    // Fields used for Q-code and classification
    public ?string $selectionCode = null;
    public ?string $affectedFIR = null;

    // Fields used for location
    public ?string $icaoLocation = null;
    public ?string $location = null;

    // Fields used for time information
    public ?string $issued = null;
    public ?string $effectiveStart = null;
    public ?string $effectiveEnd = null;

    // Fields used for NOTAM content
    public ?string $text = null;
    public ?string $fullText = null;
    public ?bool $isIcao = null;

    public function __construct()
    {
        // Initialize with null values
    }

    /**
     * Get a string representation of the NOTAM identifier
     * Handles both ICAO format (with series) and LOCAL_FORMAT (without series)
     */
    public function getIdentifier(): string
    {
        // If series is present, it's an ICAO format NOTAM (e.g., "A1811/25")
        if ($this->series !== null && $this->number !== null && $this->year !== null) {
            return sprintf("%s%04d/%s", $this->series, $this->number, substr($this->year, -2));
        }

        // If no series but we have simpleText, try to extract from LOCAL_FORMAT
        if ($this->simpleText !== null) {
            // Extract identifier from simpleText format: "!CNM 12/017 ..."
            if (preg_match('/^(!?[A-Z0-9]+\s+\d+\/\d+)/', $this->simpleText, $matches)) {
                return $matches[1];
            }
        }

        return '';
    }
}

