<?php

require_once __DIR__ . '/FaaNotam.php';

use notamretriever_faa\FaaNotam;

/**
 * Parser for FAA SWIM NOTAM XML files
 * Handles only the XML parsing logic without file system operations
 * Uses XMLReader for efficient stream-based parsing of large files
 */
class FaaNotamXmlParser
{
    /**
     * Parse XML file and extract NOTAM data using stream-based XMLReader
     *
     * @param string $filePath Full path to the XML file to parse
     * @return FaaNotam[] Array of parsed FaaSwimNotam objects
     * @throws Exception If XML parsing fails
     */
    public function parseXmlFile(string $filePath): array
    {
        // Increase memory limit for large XML files
        $currentLimit = ini_get('memory_limit');
        if ($currentLimit !== '-1') {
            ini_set('memory_limit', '512M');
        }

        $notams = [];

        if (!file_exists($filePath)) {
            throw new Exception("File not found: {$filePath}");
        }

        $reader = new XMLReader();
        if (!$reader->open($filePath)) {
            throw new Exception("Failed to open XML file: {$filePath}");
        }

        // Stream through the XML file looking for aixm:member elements
        while ($reader->read()) {
            // Look for aixm:member elements
            if ($reader->nodeType === XMLReader::ELEMENT &&
                $reader->localName === 'member' &&
                $reader->namespaceURI === 'http://www.aixm.aero/schema/5.1') {

                // Read the entire member element into a SimpleXML object
                $memberXml = $reader->readOuterXml();

                if ($memberXml) {
                    try {
                        // Parse this member fragment
                        $memberNotams = $this->parseMemberXml($memberXml);
                        // Use array_push with spread operator instead of array_merge for better performance
                        array_push($notams, ...$memberNotams);
                    } catch (Exception $e) {
                        // Log error but continue processing other members
                        error_log("Error parsing member element: " . $e->getMessage());
                    }
                }
            }
        }

        $reader->close();
        return $notams;
    }

    /**
     * Parse a single aixm:member XML fragment
     *
     * @param string $memberXml XML string of the member element
     * @return FaaNotam[] Array of parsed NOTAMs from this member
     * @throws Exception If XML parsing fails
     */
    private function parseMemberXml(string $memberXml): array
    {
        $notams = [];

        // Parse the member XML fragment
        $xml = simplexml_load_string($memberXml);
        if ($xml === false) {
            throw new Exception("Failed to parse member XML fragment");
        }

        // Register namespaces
        $xml->registerXPathNamespace('event', 'http://www.aixm.aero/schema/5.1/event');
        $xml->registerXPathNamespace('aixm', 'http://www.aixm.aero/schema/5.1');
        $xml->registerXPathNamespace('gml', 'http://www.opengis.net/gml/3.2');
        $xml->registerXPathNamespace('fnse', 'http://www.aixm.aero/schema/5.1/extensions/FAA/FNSE');

        // Find all Event elements in this member
        $events = $xml->xpath('.//event:Event');

        if (!empty($events)) {
            foreach ($events as $event) {
                $event->registerXPathNamespace('event', 'http://www.aixm.aero/schema/5.1/event');
                $event->registerXPathNamespace('aixm', 'http://www.aixm.aero/schema/5.1');
                $event->registerXPathNamespace('gml', 'http://www.opengis.net/gml/3.2');
                $event->registerXPathNamespace('fnse', 'http://www.aixm.aero/schema/5.1/extensions/FAA/FNSE');

                $notamElements = $event->xpath('.//event:NOTAM');

                if (!empty($notamElements)) {
                    foreach ($notamElements as $notamElement) {
                        $notam = $this->parseNotamElement($notamElement, $event);
                        if ($notam !== null) {
                            $notams[] = $notam;
                        }
                    }
                }
            }
        }

        return $notams;
    }

    /**
     * Parse a single NOTAM element
     *
     * @param SimpleXMLElement $notamElement The NOTAM XML element to parse
     * @param SimpleXMLElement $eventElement The parent Event XML element
     * @return FaaNotam|null Parsed FaaSwimNotam object or null if parsing fails
     */
    private function parseNotamElement(SimpleXMLElement $notamElement, SimpleXMLElement $eventElement): ?FaaNotam
    {
        $notam = new FaaNotam();

        // Register namespaces for the NOTAM element
        $notamElement->registerXPathNamespace('event', 'http://www.aixm.aero/schema/5.1/event');
        $eventElement->registerXPathNamespace('event', 'http://www.aixm.aero/schema/5.1/event');
        $eventElement->registerXPathNamespace('aixm', 'http://www.aixm.aero/schema/5.1');
        $eventElement->registerXPathNamespace('gml', 'http://www.opengis.net/gml/3.2');
        $eventElement->registerXPathNamespace('fnse', 'http://www.aixm.aero/schema/5.1/extensions/FAA/FNSE');

        // Extract NOTAM fields (only fields used in FAA to ICAO conversion)
        // Identification fields
        $notam->series = $this->getElementValue($notamElement, 'event:series');
        $notam->number = $this->getElementValue($notamElement, 'event:number');
        $notam->year = $this->getElementValue($notamElement, 'event:year');

        // Classification and location fields
        $notam->issued = $this->getElementValue($notamElement, 'event:issued');
        $notam->affectedFIR = $this->getElementValue($notamElement, 'event:affectedFIR');
        $notam->selectionCode = $this->getElementValue($notamElement, 'event:selectionCode');
        $notam->location = $this->getElementValue($notamElement, 'event:location');

        // Content field
        $notam->text = $this->getElementValue($notamElement, 'event:text');

        // Extract translation type and full text
        $translationData = $this->extractTranslationData($notamElement);
        $notam->isIcao = $translationData['isIcao'];
        $notam->fullText = $translationData['fullText'];
        $notam->simpleText = $translationData['simpleText'];

        // Extract EventTimeSlice fields (time fields and icaoLocation)
        $timeSlice = $eventElement->xpath('.//event:EventTimeSlice');
        if (!empty($timeSlice)) {
            $timeSlice = $timeSlice[0];
            $timeSlice->registerXPathNamespace('gml', 'http://www.opengis.net/gml/3.2');
            $timeSlice->registerXPathNamespace('fnse', 'http://www.aixm.aero/schema/5.1/extensions/FAA/FNSE');

            // Extract time fields from gml:validTime/gml:TimePeriod
            $notam->effectiveStart = $this->getElementValue($timeSlice, './/gml:validTime//gml:beginPosition');
            $notam->effectiveEnd = $this->extractEndPosition($timeSlice);

            // Extract extension fields - only icaoLocation is used
            $extension = $timeSlice->xpath('.//fnse:EventExtension');
            if (!empty($extension)) {
                $extension = $extension[0];
                $extension->registerXPathNamespace('fnse', 'http://www.aixm.aero/schema/5.1/extensions/FAA/FNSE');

                $notam->icaoLocation = $this->getElementValue($extension, 'fnse:icaoLocation');
            }
        }

        return $notam;
    }

    /**
     * Helper function to extract element value
     *
     * @param SimpleXMLElement $element The XML element to search within
     * @param string $path XPath expression to locate the desired element
     * @return string|null The element value as string, or null if not found
     */
    private function getElementValue(SimpleXMLElement $element, string $path): ?string
    {
        $result = $element->xpath($path);
        if (!empty($result)) {
            return (string) $result[0];
        }
        return null;
    }

    /**
     * Extract end position from gml:validTime, handling indeterminatePosition attribute
     *
     * If indeterminatePosition="unknown", use a far future date (2099-12-31T23:59:59.000Z)
     * Otherwise return the actual endPosition value
     *
     * @param SimpleXMLElement $timeSlice The EventTimeSlice element
     * @return string|null The end date string or null if not found
     */
    private function extractEndPosition(SimpleXMLElement $timeSlice): ?string
    {
        $timeSlice->registerXPathNamespace('gml', 'http://www.opengis.net/gml/3.2');

        // Find the endPosition element
        $endPositions = $timeSlice->xpath('.//gml:validTime//gml:endPosition');

        if (empty($endPositions)) {
            return null;
        }

        $endPosition = $endPositions[0];

        // Check for indeterminatePosition attribute
        $attributes = $endPosition->attributes();
        if (isset($attributes['indeterminatePosition']) &&
            (string)$attributes['indeterminatePosition'] === 'unknown') {
            // Return far future date for unknown/indeterminate end dates
            return '2099-12-31T23:59:59.000Z';
        }

        // Return the actual value
        $value = trim((string)$endPosition);
        return !empty($value) ? $value : null;
    }

    /**
     * Extract translation data: determine if ICAO format and extract appropriate text
     *
     * @param SimpleXMLElement $notamElement The NOTAM XML element to extract translation data from
     * @return array{isIcao: bool, fullText: string|null, simpleText: string|null} Array with isIcao flag, fullText, and simpleText
     */
    private function extractTranslationData(SimpleXMLElement $notamElement): array
    {
        $notamElement->registerXPathNamespace('event', 'http://www.aixm.aero/schema/5.1/event');
        $notamElement->registerXPathNamespace('html', 'http://www.w3.org/1999/xhtml');

        // Find all translation elements
        $translations = $notamElement->xpath('.//event:translation//event:NOTAMTranslation');

        $isIcao = false;
        $fullText = null;
        $simpleText = null;

        if (!empty($translations)) {
            foreach ($translations as $translation) {
                $translation->registerXPathNamespace('event', 'http://www.aixm.aero/schema/5.1/event');
                $translation->registerXPathNamespace('html', 'http://www.w3.org/1999/xhtml');

                $typeElements = $translation->xpath('event:type');
                if (!empty($typeElements)) {
                    $type = (string) $typeElements[0];

                    if ($type === 'OTHER:ICAO') {
                        $isIcao = true;
                        // Extract formattedText for ICAO NOTAMs
                        $formattedTextElements = $translation->xpath('.//event:formattedText//html:div');
                        if (!empty($formattedTextElements)) {
                            $rawText = (string) $formattedTextElements[0];
                            $fullText = $this->cleanText($rawText);
                        }
                        break; // ICAO format takes precedence
                    } elseif ($type === 'LOCAL_FORMAT' && $fullText === null) {
                        // Extract simpleText for local NOTAMs (only if no ICAO text found yet)
                        $simpleTextElements = $translation->xpath('event:simpleText');
                        if (!empty($simpleTextElements)) {
                            $simpleText = trim((string) $simpleTextElements[0]);
                            $fullText = $simpleText;
                        }
                    }
                }
            }
        }

        return [
            'isIcao' => $isIcao,
            'fullText' => $fullText,
            'simpleText' => $simpleText
        ];
    }

    /**
     * Clean text by removing HTML entities and tags
     *
     * @param string $rawText Raw text with HTML tags and entities
     * @return string|null Cleaned text or null if empty
     */
    private function cleanText(string $rawText): ?string
    {
        // Remove HTML entities and tags
        $cleanText = html_entity_decode($rawText, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        // Remove <pre> and </pre> tags
        $cleanText = preg_replace('/<\/?pre>/', '', $cleanText);

        // Trim whitespace
        $cleanText = trim($cleanText);

        return $cleanText ?: null;
    }
}


