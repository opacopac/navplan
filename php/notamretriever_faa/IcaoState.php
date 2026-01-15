<?php declare(strict_types=1);

namespace notamretriever_faa;


/**
 * Helper class for converting ICAO location prefixes to state codes and names
 */
class IcaoState
{
    /**
     * Convert ICAO prefix to state code (ISO 3166-1 alpha-3)
     *
     * @param string $prefix The ICAO location prefix (1-2 characters)
     * @return string The ISO 3166-1 alpha-3 state code, or empty string if not found
     */
    public static function getStateCode(string $prefix): string
    {
        $prefix = strtoupper($prefix);

        $map = [
            'K' => 'USA',  // United States (continental)
            'PA' => 'USA', // Alaska
            'PH' => 'USA', // Hawaii
            'PG' => 'USA', // Guam
            'PJ' => 'USA', // Johnston Atoll
            'PK' => 'USA', // Marshall Islands (US associated)
            'PW' => 'USA', // Wake Island
            'LT' => 'TUR', // Turkey
            'ED' => 'DEU', // Germany
            'EG' => 'GBR', // United Kingdom
            'EI' => 'IRL', // Ireland
            'LF' => 'FRA', // France
            'LS' => 'CHE', // Switzerland
            'EB' => 'BEL', // Belgium
            'EH' => 'NLD', // Netherlands
            'EP' => 'POL', // Poland
            'LO' => 'AUT', // Austria
            'LI' => 'ITA', // Italy
            'LE' => 'ESP', // Spain
            'LP' => 'PRT', // Portugal
            'LR' => 'ROU', // Romania
            'LB' => 'BGR', // Bulgaria
            'LG' => 'GRC', // Greece
            'EY' => 'LTU', // Lithuania
            'EV' => 'LVA', // Latvia
            'EE' => 'EST', // Estonia
            'LZ' => 'SVK', // Slovakia
            'LK' => 'CZE', // Czech Republic
            'LH' => 'HUN', // Hungary
            'LJ' => 'SVN', // Slovenia
            'LD' => 'HRV', // Croatia
            'LY' => 'SRB', // Serbia
            'LW' => 'MKD', // North Macedonia
            'LA' => 'ALB', // Albania
            'LM' => 'MLT', // Malta
            'LC' => 'CYP', // Cyprus
            'U' => 'RUS',  // Russia
            'C' => 'CAN',  // Canada
            'M' => 'MEX',  // Mexico (most codes)
            'S' => 'BRA',  // South America (varies)
            'Y' => 'AUS',  // Australia
            'N' => 'NZL',  // New Zealand (most)
            'R' => 'JPN',  // Japan (most)
            'RK' => 'KOR', // South Korea
            'Z' => 'CHN',  // China
            'V' => 'IND',  // India (most)
            'O' => 'AFG',  // Middle East region (varies)
            'H' => 'EGY',  // East Africa region (varies)
            'F' => 'ZAF',  // Southern Africa region (varies)
        ];

        // Try 2-letter match first
        if (isset($map[$prefix])) {
            return $map[$prefix];
        }

        // Try 1-letter match
        $firstLetter = $prefix[0] ?? '';
        if (isset($map[$firstLetter])) {
            return $map[$firstLetter];
        }

        return '';
    }

    /**
     * Convert ICAO prefix to state name
     *
     * @param string $prefix The ICAO location prefix (1-2 characters)
     * @return string The state/country name, or empty string if not found
     */
    public static function getStateName(string $prefix): string
    {
        $prefix = strtoupper($prefix);

        $map = [
            'K' => 'United States',
            'PA' => 'United States',
            'PH' => 'United States',
            'PG' => 'United States',
            'PJ' => 'United States',
            'PK' => 'United States',
            'PW' => 'United States',
            'LT' => 'Turkey',
            'ED' => 'Germany',
            'EG' => 'United Kingdom',
            'EI' => 'Ireland',
            'LF' => 'France',
            'LS' => 'Switzerland',
            'EB' => 'Belgium',
            'EH' => 'Netherlands',
            'EP' => 'Poland',
            'LO' => 'Austria',
            'LI' => 'Italy',
            'LE' => 'Spain',
            'LP' => 'Portugal',
            'LR' => 'Romania',
            'LB' => 'Bulgaria',
            'LG' => 'Greece',
            'EY' => 'Lithuania',
            'EV' => 'Latvia',
            'EE' => 'Estonia',
            'LZ' => 'Slovakia',
            'LK' => 'Czech Republic',
            'LH' => 'Hungary',
            'LJ' => 'Slovenia',
            'LD' => 'Croatia',
            'LY' => 'Serbia',
            'LW' => 'North Macedonia',
            'LA' => 'Albania',
            'LM' => 'Malta',
            'LC' => 'Cyprus',
            'U' => 'Russia',
            'C' => 'Canada',
            'M' => 'Mexico',
            'S' => 'South America',
            'Y' => 'Australia',
            'N' => 'New Zealand',
            'R' => 'Japan',
            'RK' => 'Republic of Korea',
            'Z' => 'China',
            'V' => 'India',
            'O' => 'Middle East',
            'H' => 'East Africa',
            'F' => 'Southern Africa',
        ];

        // Try 2-letter match first
        if (isset($map[$prefix])) {
            return $map[$prefix];
        }

        // Try 1-letter match
        $firstLetter = $prefix[0] ?? '';
        if (isset($map[$firstLetter])) {
            return $map[$firstLetter];
        }

        return '';
    }
}

