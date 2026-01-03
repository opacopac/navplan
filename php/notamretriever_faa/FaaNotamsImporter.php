<?php

require_once __DIR__ . '/FaaNotamXmlParser.php';
require_once __DIR__ . '/FaaToIcaoNotamConverter.php';
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../helper.php';


use notamretriever_faa\IcaoNotam;
use notamretriever_faa\FaaToIcaoNotamConverter;


/**
 * Importer for FAA NOTAMs
 * Handles file system operations: reading directory, processing files with stream-based parsing
 * Converts FAA NOTAMs to ICAO format and outputs logs
 */
class FaaNotamsImporter
{
    private const DEFAULT_NOTAM_DIRECTORY = __DIR__ . '/../../tmp/faa_notams';

    private string $notamDirectory;
    private FaaNotamXmlParser $parser;
    private bool $deleteAfterProcessing;
    private mysqli $conn; // db connection


    /**
     * Constructor
     *
     * @param string|null $notamDirectory Optional custom NOTAM directory path
     * @param bool $deleteAfterProcessing Whether to delete files after successful processing (default: false)
     */
    public function __construct(?string $notamDirectory = null, bool $deleteAfterProcessing = false)
    {
        if ($notamDirectory === null) {
            $this->notamDirectory = self::DEFAULT_NOTAM_DIRECTORY;
        } else {
            $this->notamDirectory = $notamDirectory;
        }

        $this->parser = new FaaNotamXmlParser();
        $this->deleteAfterProcessing = $deleteAfterProcessing;

        // Open database connection
        $this->conn = openDb();
    }

    /**
     * Process all XML files in the NOTAM directory and convert to ICAO format
     *
     * @return array{processed: int, failed: int, totalNotams: int, icaoNotams: IcaoNotam[]} Statistics about processing
     */
    public function processAllFiles(): array
    {
        $xmlFiles = $this->getXmlFiles();
        $stats = [
            'processed' => 0,
            'failed' => 0,
            'totalNotams' => 0,
            'icaoNotams' => []
        ];

        if (empty($xmlFiles)) {
            echo "No XML files found in {$this->notamDirectory}\n";
            return $stats;
        }

        echo "Found " . count($xmlFiles) . " XML file(s) to process\n";
        echo "Processing directory: {$this->notamDirectory}\n\n";

        // Clear the faa_notam table before processing
        echo "Clearing faa_notam table...\n";
        $query = "DELETE FROM faa_notam";
        $result = $this->conn->query($query);

        if ($result === FALSE) {
            die("Error deleting FAA notams: " . $this->conn->error . " query:" . $query);
        }
        echo "Table cleared successfully\n\n";

        foreach ($xmlFiles as $xmlFile) {
            $result = $this->processFile($xmlFile);
            if ($result['success']) {
                $stats['processed']++;
                $stats['totalNotams'] += $result['notamCount'];
                $stats['icaoNotams'] = array_merge($stats['icaoNotams'], $result['icaoNotams']);
            } else {
                $stats['failed']++;
            }
        }

        echo "\n=== Processing Summary ===\n";
        echo "Processed: {$stats['processed']} file(s)\n";
        echo "Failed: {$stats['failed']} file(s)\n";
        echo "Total NOTAMs extracted: {$stats['totalNotams']}\n";
        echo "Total ICAO NOTAMs converted: " . count($stats['icaoNotams']) . "\n";

        return $stats;
    }


    /**
     * Get all XML files from the NOTAM directory
     *
     * @return string[] Array of full file paths to XML files
     */
    private function getXmlFiles(): array
    {
        $xmlFiles = [];

        if (!is_dir($this->notamDirectory)) {
            echo "Directory not found: {$this->notamDirectory}\n";
            return $xmlFiles;
        }

        $files = scandir($this->notamDirectory);

        foreach ($files as $file) {
            if (pathinfo($file, PATHINFO_EXTENSION) === 'xml') {
                $xmlFiles[] = $this->notamDirectory . '/' . $file;
            }
        }

        return $xmlFiles;
    }


    /**
     * Process a single XML file: parse NOTAMs, convert to ICAO format, log output
     *
     * @param string $filePath Full path to the XML file to process
     * @return array{success: bool, notamCount: int, icaoNotams: IcaoNotam[]} Processing result
     */
    private function processFile(string $filePath): array
    {
        $result = [
            'success' => false,
            'notamCount' => 0,
            'icaoNotams' => []
        ];

        echo "Processing: " . basename($filePath) . "\n";
        $startTime = microtime(true);

        try {
            // Parse XML file using stream-based XMLReader
            $faaNotams = $this->parser->parseXmlFile($filePath);
            $result['notamCount'] = count($faaNotams);

            if (empty($faaNotams)) {
                echo "  No NOTAMs found in this file\n";
            } else {
                echo "  Found " . count($faaNotams) . " NOTAM(s)\n";
                echo "  Converting to ICAO format...\n";

                foreach ($faaNotams as $faaNotam) {
                    try {
                        // Convert FAA NOTAM to ICAO format
                        $icaoNotam = FaaToIcaoNotamConverter::convert($faaNotam);
                        $result['icaoNotams'][] = $icaoNotam;
                    } catch (Exception $e) {
                        echo "  [ERROR] Failed to convert " . $faaNotam->getIdentifier() . ": " . $e->getMessage() . "\n";
                    }
                }

                // Save converted NOTAMs to database
                $this->saveNotamsToDatabase($result['icaoNotams']);
            }

            $result['success'] = true;
            $duration = round(microtime(true) - $startTime, 2);
            echo "  ✓ File processed successfully in {$duration}s\n";

            // Delete the file after successful processing if enabled
            if ($this->deleteAfterProcessing) {
                if (unlink($filePath)) {
                    echo "  ✓ File deleted successfully\n";
                } else {
                    echo "  ⚠ Warning: Could not delete file\n";
                }
            }

        } catch (Exception $e) {
            echo "  ✗ Error processing file: " . $e->getMessage() . "\n";
            $result['success'] = false;
        }

        echo "\n";

        return $result;
    }


    /**
     * Save converted NOTAMs to the database
     *
     * @param IcaoNotam[] $icaoNotams Array of ICAO NOTAMs to save
     * @return void
     * @throws Exception If database operation fails
     */
    private function saveNotamsToDatabase(array $icaoNotams): void
    {
        if (empty($icaoNotams)) {
            return;
        }

        $totalNotams = count($icaoNotams);
        echo "  Writing {$totalNotams} NOTAM(s) to database...\n";

        // Process in batches to avoid "MySQL server has gone away" error
        $batchSize = 100; // Small batch size to handle large NOTAM JSON data
        $batches = array_chunk($icaoNotams, $batchSize);
        $batchCount = count($batches);

        foreach ($batches as $batchIndex => $batch) {
            // Check if connection is still alive, reconnect if necessary
            if (!$this->conn->ping()) {
                echo "    Reconnecting to database...\n";
                $this->conn = openDb();
                $this->conn->query("SET SESSION max_allowed_packet=1073741824");
            }

            $queryParts = [];
            foreach ($batch as $icaoNotam) {
                $queryParts[] = "('"
                    . checkEscapeString($this->conn, $icaoNotam->id, 0, 20) . "','"
                    . checkEscapeString($this->conn, $icaoNotam->StateCode, 0, 10) . "','"
                    . checkEscapeString($this->conn, $icaoNotam->type, 0, 10) . "','"
                    . checkEscapeString($this->conn, $icaoNotam->location, 0, 10) . "','"
                    . getDbTimeString(strtotime($icaoNotam->startdate)) . "','"
                    . getDbTimeString(strtotime($icaoNotam->enddate)) . "','"
                    . checkEscapeString($this->conn, $icaoNotam->getJson(), 0, 999999) . "')";
            }

            $query = "INSERT INTO faa_notam (notam_id, country, type, icao, startdate, enddate, notam) VALUES " . join(",", $queryParts);
            $result = $this->conn->query($query);

            if ($result === FALSE) {
                throw new Exception("Error adding FAA notams to database (batch " . ($batchIndex + 1) . "): " . $this->conn->error);
            }

            // Show progress for large datasets
            if ($batchCount > 1) {
                $processed = min(($batchIndex + 1) * $batchSize, $totalNotams);
                echo "    Progress: {$processed}/{$totalNotams} NOTAMs written\n";
            }
        }

        echo "  ✓ NOTAMs written to database successfully\n";
    }
}


// If run directly from command line
if (php_sapi_name() === 'cli' && basename(__FILE__) === basename($_SERVER['PHP_SELF'])) {
    echo "=== FAA NOTAMs Importer ===\n";
    echo "Started: " . date('Y-m-d H:i:s') . "\n\n";

    $importer = new FaaNotamsImporter();
    $result = $importer->processAllFiles();

    echo "\n=== Done ===\n";
    echo "Finished: " . date('Y-m-d H:i:s') . "\n";
    exit($result['failed'] > 0 ? 1 : 0);
}


