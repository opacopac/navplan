<?php declare(strict_types=1);

namespace notamretriever_faa;

use DateTime;
use DateTimeZone;
use Exception;

require_once __DIR__ . '/FaaNotam.php';
require_once __DIR__ . '/IcaoNotam.php';
require_once __DIR__ . '/NotamQCodeText.php';
require_once __DIR__ . '/IcaoState.php';
require_once __DIR__ . '/IcaoFir.php';


/**
 * Converts FAA SWIM NOTAMs to ICAO NOTAM format
 */
class FaaToIcaoNotamConverter
{
    /**
     * Convert a FAA SWIM NOTAM to ICAO NOTAM format
     *
     * @param FaaNotam $faaNotam The FAA SWIM NOTAM to convert
     * @return IcaoNotam The converted ICAO NOTAM
     */
    public static function convert(FaaNotam $faaNotam): IcaoNotam
    {
        return new IcaoNotam(
            id: $faaNotam->getIdentifier() ?? '',
            entity: self::extractEntity($faaNotam),
            status: self::extractStatus($faaNotam),
            Qcode: self::extractQcode($faaNotam),
            Area: self::getArea($faaNotam),
            SubArea: self::getSubArea($faaNotam),
            Condition: self::getCondition($faaNotam), // TODO
            Subject: self::getSubject($faaNotam),
            Modifier: self::getModifier($faaNotam),
            message: $faaNotam->text ?? '',
            startdate: self::convertToIsoDate($faaNotam->effectiveStart),
            enddate: self::convertToIsoDate($faaNotam->effectiveEnd),
            all: $faaNotam->fullText ?? '',
            location: $faaNotam->icaoLocation ?? 'XXXX',
            isICAO: $faaNotam->isIcao ?? false,
            Created: $faaNotam->issued ?? '',
            key: self::buildKey($faaNotam),
            type: self::determineType($faaNotam),
            StateCode: self::getStateCode($faaNotam),
            StateName: self::getStateName($faaNotam)
        );
    }

    /**
     * Convert FAA NOTAM ID to ICAO format
     */
    private static function convertId(FaaNotam $faaNotam): string
    {
        return $faaNotam->getIdentifier();
    }

    /**
     * Extract entity code (first 2 chars of Q-code)
     */
    private static function extractEntity(FaaNotam $faaNotam): string
    {
        if ($faaNotam->selectionCode && strlen($faaNotam->selectionCode) >= 2) {
            return substr($faaNotam->selectionCode, 0, 2);
        }
        return '';
    }

    /**
     * Extract Q-code without the Q prefix (last 4 chars)
     * Example: QFMXX -> FMXX
     */
    private static function extractQcode(FaaNotam $faaNotam): string
    {
        if ($faaNotam->selectionCode && strlen($faaNotam->selectionCode) >= 5) {
            return substr($faaNotam->selectionCode, 1, 4);
        }
        return '';
    }

    /**
     * Extract status code (chars 3-4 of Q-code)
     */
    private static function extractStatus(FaaNotam $faaNotam): string
    {
        if ($faaNotam->selectionCode && strlen($faaNotam->selectionCode) >= 4) {
            return substr($faaNotam->selectionCode, 2, 2);
        }
        return '';
    }

    /**
     * Get Area description from Q-code
     */
    private static function getArea(FaaNotam $faaNotam): string
    {
        return NotamQCodeText::getAreaText($faaNotam->selectionCode ?? '') ?? '';
    }

    /**
     * Get SubArea description
     */
    private static function getSubArea(FaaNotam $faaNotam): string
    {
        return NotamQCodeText::getSubAreaText($faaNotam->selectionCode ?? '') ?? '';
    }

    /**
     * Get Condition description
     */
    private static function getCondition(FaaNotam $faaNotam): string
    {
        return 'TODO';
    }

    /**
     * Get Subject description
     */
    private static function getSubject(FaaNotam $faaNotam): string
    {
        return NotamQCodeText::getSubjectText($faaNotam->selectionCode ?? '') ?? '';
    }

    /**
     * Get Modifier description
     */
    private static function getModifier(FaaNotam $faaNotam): string
    {
        return NotamQCodeText::getStatusText($faaNotam->selectionCode ?? '') ?? '';
    }

    /**
     * Convert date string from NOTAM format to ISO 8601 format
     * Input format: YYYYMMDDHHmm (e.g., "202601012329") or ISO 8601
     * Output format: ISO 8601 (e.g., "2026-01-01T23:29:00.000Z")
     */
    private static function convertToIsoDate(?string $dateString): string
    {
        if (!$dateString) {
            return '';
        }

        // If already in ISO 8601 format (e.g., "2099-12-31T23:59:59Z" or "2024-02-14T00:00:00.000Z"), return as-is
        if (preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/', $dateString)) {
            // Ensure it ends with .000Z format
            if (preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/', $dateString)) {
                return $dateString;
            }
            // Convert Z to .000Z format
            if (preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/', $dateString)) {
                return str_replace('Z', '.000Z', $dateString);
            }
        }

        // Handle NOTAM format: YYYYMMDDHHmm (e.g., 202601012329)
        if (preg_match('/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/', $dateString, $matches)) {
            $year = $matches[1];
            $month = $matches[2];
            $day = $matches[3];
            $hour = $matches[4];
            $minute = $matches[5];

            try {
                $date = new DateTime("{$year}-{$month}-{$day} {$hour}:{$minute}:00", new DateTimeZone('UTC'));
                return $date->format('Y-m-d\TH:i:s.000\Z');
            } catch (Exception $e) {
                return '';
            }
        }

        return '';
    }

    /**
     * Get state code from FIR or location
     */
    private static function getStateCode(FaaNotam $faaNotam): string
    {
        $fir = $faaNotam->affectedFIR;

        if (!$fir) {
            // Try to derive from ICAO location
            $icao = $faaNotam->icaoLocation ?? $faaNotam->location;
            if ($icao && strlen($icao) >= 2) {
                return IcaoState::getStateCode(substr($icao, 0, 2));
            }
            return '';
        }

        // FIR codes are typically 4 letters, use first 2 for state identification
        if (strlen($fir) >= 2) {
            return IcaoState::getStateCode(substr($fir, 0, 2));
        }

        return '';
    }

    /**
     * Get state name from FIR or location
     */
    private static function getStateName(FaaNotam $faaNotam): string
    {
        $fir = $faaNotam->affectedFIR;

        if (!$fir) {
            // Try to derive from ICAO location
            $icao = $faaNotam->icaoLocation ?? $faaNotam->location;
            if ($icao && strlen($icao) >= 2) {
                return IcaoState::getStateName(substr($icao, 0, 2));
            }
            return '';
        }

        // FIR codes are typically 4 letters, use first 2 for state identification
        if (strlen($fir) >= 2) {
            return IcaoState::getStateName(substr($fir, 0, 2));
        }

        return '';
    }


    /**
     * Build unique key for the NOTAM
     */
    private static function buildKey(FaaNotam $faaNotam): string
    {
        $id = $faaNotam->getIdentifier();
        $location = $faaNotam->icaoLocation ?? $faaNotam->location ?? 'XXXX';
        return $id . '-' . $location;
    }

    /**
     * Determine NOTAM type based on whether the location is a FIR or airport
     *
     * Logic:
     * 1. If affectedFIR is set and equals icaoLocation, it's a FIR (airspace)
     * 2. If icaoLocation/location is a known FIR code, it's a FIR (airspace)
     * 3. Otherwise it's an airport
     *
     * @param FaaNotam $faaNotam The FAA NOTAM to analyze
     * @return string Returns "airspace" for FIR, "airport" for airport location
     */
    private static function determineType(FaaNotam $faaNotam): string
    {
        if ($faaNotam->icaoLocation && IcaoFir::isFir($faaNotam->icaoLocation)) {
            return 'airspace';
        } else {
            return 'airport';
        }
    }
}
