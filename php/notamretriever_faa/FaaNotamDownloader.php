<?php

/**
 * FaaNotamDownloader - Downloads NOTAMs from FAA NMS-API
 *
 * This class handles:
 * 1. OAuth2 authentication to get bearer token
 * 2. Downloading initial load of all NOTAM classifications
 * 3. Unzipping the downloaded file to target directory
 */
class FaaNotamDownloader
{
    // Environment constants
    private const ENV_PRODUCTION = 'production';
    private const ENV_STAGING = 'staging';
    private const ENV_FIT = 'fit';

    // Environment URLs
    private const ENVIRONMENTS = [
        self::ENV_PRODUCTION => [
            'auth' => 'https://api-nms.aim.faa.gov/v1/auth/token',
            'notam' => 'https://api-nms.aim.faa.gov/nmsapi/v1/notams/il'
        ],
        self::ENV_STAGING => [
            'auth' => 'https://api-staging.cgifederal-aim.com/v1/auth/token',
            'notam' => 'https://api-staging.cgifederal-aim.com/nmsapi/v1/notams/il'
        ],
        self::ENV_FIT => [
            'auth' => 'https://api-fit.cgifederal-aim.com/v1/auth/token',
            'notam' => 'https://api-fit.cgifederal-aim.com/nmsapi/v1/notams/il'
        ]
    ];

    private string $clientId;
    private string $clientSecret;
    private string $targetDir;
    private string $environment;
    private ?string $bearerToken = null;
    private int $tokenExpiresAt = 0;

    /**
     * Constructor
     *
     * @param string $clientId The API client ID
     * @param string $clientSecret The API client secret
     * @param string $targetDir Target directory for extracted files (relative or absolute)
     * @param string $environment Environment to use (production, staging, fit)
     */
    public function __construct(
        string $clientId,
        string $clientSecret,
        string $targetDir = '../../tmp/faa_notams',
        string $environment = self::ENV_STAGING
    )
    {
        $this->clientId = $clientId;
        $this->clientSecret = $clientSecret;
        $this->targetDir = $targetDir;

        if (!isset(self::ENVIRONMENTS[$environment])) {
            throw new InvalidArgumentException("Invalid environment: $environment");
        }
        $this->environment = $environment;
    }

    /**
     * Get the auth URL for the current environment
     */
    private function getAuthUrl(): string
    {
        return self::ENVIRONMENTS[$this->environment]['auth'];
    }

    /**
     * Get the NOTAM initial load URL for the current environment
     */
    private function getNotamUrl(): string
    {
        return self::ENVIRONMENTS[$this->environment]['notam'];
    }

    /**
     * Main method to download and extract NOTAMs
     *
     * @return bool Success status
     * @throws Exception on error
     */
    public function downloadAndExtract(): bool
    {
        try {
            // Step 1: Authenticate and get bearer token
            echo "Environment: " . $this->environment . "\n";
            echo "Step 1: Authenticating with FAA NMS-API...\n";
            $this->authenticate();
            echo "Authentication successful. Token expires in " . ($this->tokenExpiresAt - time()) . " seconds.\n";

            // Step 2: Get the signed URL for the zip file
            echo "\nStep 2: Requesting initial load URL...\n";
            $zipUrl = $this->getInitialLoadUrl();
            echo "Received signed URL for download.\n";

            // Step 3: Download the zip file
            echo "\nStep 3: Downloading NOTAM zip file...\n";
            $zipFilePath = $this->downloadZipFile($zipUrl);
            echo "Download complete: $zipFilePath\n";

            // Step 4: Extract the zip file
            echo "\nStep 4: Extracting zip file...\n";
            $this->extractZipFile($zipFilePath);
            echo "Extraction complete to: " . $this->getAbsoluteTargetDir() . "\n";

            // Step 5: Clean up zip file
            if (file_exists($zipFilePath)) {
                unlink($zipFilePath);
                echo "Cleaned up temporary zip file.\n";
            }

            echo "\n✓ Successfully downloaded and extracted FAA NOTAMs!\n";
            return true;

        } catch (Exception $e) {
            echo "\n✗ Error: " . $e->getMessage() . "\n";
            throw $e;
        }
    }

    /**
     * Authenticate with the FAA API and get bearer token
     *
     * @throws Exception on authentication failure
     */
    private function authenticate(): void
    {
        $ch = curl_init($this->getAuthUrl());

        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => 'grant_type=client_credentials',
            CURLOPT_USERPWD => $this->clientId . ':' . $this->clientSecret,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/x-www-form-urlencoded'
            ],
            CURLOPT_SSL_VERIFYPEER => false, // Disable SSL verification for development
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_TIMEOUT => 30
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);

        if ($curlError) {
            throw new Exception("cURL error during authentication: $curlError");
        }

        if ($httpCode !== 200) {
            throw new Exception("Authentication failed with HTTP code $httpCode: $response");
        }

        $data = json_decode($response, true);

        if (!isset($data['access_token'])) {
            throw new Exception("No access token in response: $response");
        }

        $this->bearerToken = $data['access_token'];
        $expiresIn = $data['expires_in'] ?? 1800; // Default to 30 minutes
        $this->tokenExpiresAt = time() + $expiresIn;
    }

    /**
     * Get the signed URL for the initial load zip file
     *
     * @return string The signed URL
     * @throws Exception on failure
     */
    private function getInitialLoadUrl(): string
    {
        if (!$this->bearerToken) {
            throw new Exception("Not authenticated. Call authenticate() first.");
        }

        $ch = curl_init($this->getNotamUrl());

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false, // Don't follow redirects automatically
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $this->bearerToken
            ],
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HEADER => true // Get headers to find redirect location
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $curlError = curl_error($ch);

        if ($curlError) {
            throw new Exception("cURL error during initial load request: $curlError");
        }

        // Parse headers to find Location redirect
        $headers = substr($response, 0, $headerSize);

        if ($httpCode === 302 || $httpCode === 307) {
            // Extract Location header
            if (preg_match('/Location:\s*(.+?)[\r\n]/i', $headers, $matches)) {
                $location = trim($matches[1]);
                return $this->makeAbsoluteUrl($location);
            }
            throw new Exception("Redirect received but no Location header found");
        }

        if ($httpCode !== 200) {
            throw new Exception("Initial load request failed with HTTP code $httpCode");
        }

        // If 200, the body might contain the URL directly
        $body = substr($response, $headerSize);
        return $this->makeAbsoluteUrl(trim($body));
    }

    /**
     * Convert relative URL to absolute URL if needed
     *
     * @param string $url The URL to convert
     * @return string Absolute URL
     */
    private function makeAbsoluteUrl(string $url): string
    {
        // If already absolute, return as is
        if (preg_match('/^https?:\/\//i', $url)) {
            return $url;
        }

        // Get base URL from environment
        $baseUrl = parse_url($this->getNotamUrl());
        $scheme = $baseUrl['scheme'] ?? 'https';
        $host = $baseUrl['host'] ?? '';

        // Handle relative URLs
        if ($url[0] === '/') {
            return $scheme . '://' . $host . $url;
        } else {
            // Relative to current path
            $path = dirname($baseUrl['path'] ?? '/');
            return $scheme . '://' . $host . $path . '/' . $url;
        }
    }

    /**
     * Download the archive file from the signed URL
     *
     * @param string $url The signed URL
     * @return string Path to the downloaded archive file
     * @throws Exception on failure
     */
    private function downloadZipFile(string $url): string
    {
        $tempDir = sys_get_temp_dir();
        // Detect file extension from URL (could be .gz or .zip)
        $extension = (stripos($url, '.gz') !== false) ? '.gz' : '.zip';
        $zipFilePath = $tempDir . DIRECTORY_SEPARATOR . 'faa_notams_' . time() . $extension;

        echo "Download URL: $url\n";

        $ch = curl_init($url);
        $fp = fopen($zipFilePath, 'wb');

        if (!$fp) {
            throw new Exception("Cannot open file for writing: $zipFilePath");
        }

        curl_setopt_array($ch, [
            CURLOPT_FILE => $fp,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_TIMEOUT => 300, // 5 minutes for large file
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $this->bearerToken
            ],
            CURLOPT_NOPROGRESS => false,
            CURLOPT_PROGRESSFUNCTION => function($resource, $downloadSize, $downloaded, $uploadSize, $uploaded) {
                if ($downloadSize > 0) {
                    $percent = ($downloaded / $downloadSize) * 100;
                    echo sprintf("\rProgress: %.1f%% (%s / %s)",
                        $percent,
                        $this->formatBytes($downloaded),
                        $this->formatBytes($downloadSize)
                    );
                }
            }
        ]);

        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        fclose($fp);

        echo "\n"; // New line after progress

        if ($curlError || !$result) {
            // Read error response if file is small
            if (file_exists($zipFilePath) && filesize($zipFilePath) < 1000) {
                $errorContent = file_get_contents($zipFilePath);
                unlink($zipFilePath);
                throw new Exception("cURL error during zip download: $curlError. Response: $errorContent");
            }
            unlink($zipFilePath);
            throw new Exception("cURL error during zip download: $curlError");
        }

        if ($httpCode !== 200) {
            // Read error response if file is small
            if (file_exists($zipFilePath) && filesize($zipFilePath) < 1000) {
                $errorContent = file_get_contents($zipFilePath);
                unlink($zipFilePath);
                throw new Exception("Zip download failed with HTTP code $httpCode. Response: $errorContent");
            }
            unlink($zipFilePath);
            throw new Exception("Zip download failed with HTTP code $httpCode");
        }

        if (!file_exists($zipFilePath) || filesize($zipFilePath) === 0) {
            throw new Exception("Downloaded file is empty or does not exist");
        }

        // Detect actual file type and rename if necessary
        $actualExtension = $this->detectFileType($zipFilePath);
        if ($actualExtension !== $extension) {
            $newZipFilePath = $tempDir . DIRECTORY_SEPARATOR . 'faa_notams_' . time() . $actualExtension;
            rename($zipFilePath, $newZipFilePath);
            echo "Detected file type: $actualExtension\n";
            return $newZipFilePath;
        }

        return $zipFilePath;
    }

    /**
     * Detect file type by reading magic bytes
     *
     * @param string $filePath Path to the file
     * @return string File extension (.gz or .zip)
     */
    private function detectFileType(string $filePath): string
    {
        $fp = fopen($filePath, 'rb');
        if (!$fp) {
            return '.zip'; // Default fallback
        }

        $bytes = fread($fp, 3);
        fclose($fp);

        // Check for gzip magic bytes: 1f 8b
        if (strlen($bytes) >= 2 && ord($bytes[0]) === 0x1f && ord($bytes[1]) === 0x8b) {
            return '.gz';
        }

        // Check for ZIP magic bytes: 50 4b
        if (strlen($bytes) >= 2 && ord($bytes[0]) === 0x50 && ord($bytes[1]) === 0x4b) {
            return '.zip';
        }

        // Default to .zip
        return '.zip';
    }

    /**
     * Extract archive file to target directory (supports .zip and .gz)
     *
     * @param string $zipFilePath Path to the archive file
     * @throws Exception on failure
     */
    private function extractZipFile(string $zipFilePath): void
    {
        $targetDir = $this->getAbsoluteTargetDir();

        // Create target directory if it doesn't exist
        if (!is_dir($targetDir)) {
            if (!mkdir($targetDir, 0755, true)) {
                throw new Exception("Cannot create target directory: $targetDir");
            }
        }

        // Clear existing files in target directory
        $files = glob($targetDir . DIRECTORY_SEPARATOR . '*');
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }

        // Detect if it's a .gz file
        if (preg_match('/\.gz$/i', $zipFilePath)) {
            $this->extractGzFile($zipFilePath, $targetDir);
        } else {
            // Try ZipArchive first for .zip files
            if (class_exists('ZipArchive')) {
                $this->extractWithZipArchive($zipFilePath, $targetDir);
            } else {
                // Fallback to system commands
                echo "ZipArchive not available, using system command...\n";
                $this->extractWithSystemCommand($zipFilePath, $targetDir);
            }
        }
    }

    /**
     * Extract .gz file
     */
    private function extractGzFile(string $gzFilePath, string $targetDir): void
    {
        echo "Extracting .gz file...\n";

        // Get the output filename (remove .gz extension)
        $outputFile = $targetDir . DIRECTORY_SEPARATOR . basename($gzFilePath, '.gz');

        // Try using gzopen first
        if (function_exists('gzopen')) {
            $gz = gzopen($gzFilePath, 'rb');
            if (!$gz) {
                throw new Exception("Cannot open .gz file: $gzFilePath");
            }

            $out = fopen($outputFile, 'wb');
            if (!$out) {
                gzclose($gz);
                throw new Exception("Cannot create output file: $outputFile");
            }

            while (!gzeof($gz)) {
                fwrite($out, gzread($gz, 4096));
            }

            gzclose($gz);
            fclose($out);

            // Check if file is XML and add extension if needed
            $outputFile = $this->ensureXmlExtension($outputFile);

            echo "Extracted to: " . basename($outputFile) . "\n";
        } else {
            // Fallback to system command
            echo "gzopen not available, using system command...\n";
            $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';

            if ($isWindows) {
                // Use tar on Windows
                $command = sprintf(
                    'tar -xzf "%s" -C "%s" 2>&1',
                    $gzFilePath,
                    $targetDir
                );
            } else {
                // Use gunzip on Linux/Unix
                $command = sprintf(
                    'gunzip -c "%s" > "%s" 2>&1',
                    $gzFilePath,
                    $outputFile
                );
            }

            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                throw new Exception("Failed to extract .gz file: " . implode("\n", $output));
            }

            // Check if file is XML and add extension if needed
            $this->ensureXmlExtension($outputFile);

            echo "Extraction completed using system command.\n";
        }
    }

    /**
     * Check if file is XML and add .xml extension if needed
     *
     * @param string $filePath Path to the file
     * @return string New file path (may be the same or with .xml extension)
     */
    private function ensureXmlExtension(string $filePath): string
    {
        // Check if file already has .xml extension
        if (preg_match('/\.xml$/i', $filePath)) {
            return $filePath;
        }

        // Check if file exists and read first bytes
        if (!file_exists($filePath)) {
            return $filePath;
        }

        $fp = fopen($filePath, 'rb');
        if (!$fp) {
            return $filePath;
        }

        $header = fread($fp, 100);
        fclose($fp);

        // Check if it starts with XML declaration
        if (preg_match('/^\s*<\?xml/i', $header)) {
            $newPath = $filePath . '.xml';
            if (rename($filePath, $newPath)) {
                echo "  Renamed to .xml extension\n";
                return $newPath;
            }
        }

        return $filePath;
    }

    /**
     * Extract using ZipArchive
     */
    private function extractWithZipArchive(string $zipFilePath, string $targetDir): void
    {
        $zip = new ZipArchive();
        $result = $zip->open($zipFilePath);

        if ($result !== true) {
            throw new Exception("Cannot open zip file: $zipFilePath (Error code: $result)");
        }

        echo "Extracting " . $zip->numFiles . " file(s)...\n";

        if (!$zip->extractTo($targetDir)) {
            $zip->close();
            throw new Exception("Failed to extract zip file to: $targetDir");
        }

        $zip->close();
    }

    /**
     * Extract using system command (Windows tar or PowerShell)
     */
    private function extractWithSystemCommand(string $zipFilePath, string $targetDir): void
    {
        // Detect OS
        $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';

        if ($isWindows) {
            // Try using tar command (available on Windows 10+)
            $command = sprintf(
                'tar -xf "%s" -C "%s" 2>&1',
                $zipFilePath,
                $targetDir
            );

            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                // Fallback to PowerShell
                $command = sprintf(
                    'powershell -Command "Expand-Archive -Path \'%s\' -DestinationPath \'%s\' -Force" 2>&1',
                    $zipFilePath,
                    $targetDir
                );

                exec($command, $output2, $returnCode2);

                if ($returnCode2 !== 0) {
                    throw new Exception("Failed to extract zip file. tar output: " . implode("\n", $output) .
                                      ". PowerShell output: " . implode("\n", $output2));
                }
            }
        } else {
            // Linux/Unix
            $command = sprintf(
                'unzip -o "%s" -d "%s" 2>&1',
                $zipFilePath,
                $targetDir
            );

            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                throw new Exception("Failed to extract zip file: " . implode("\n", $output));
            }
        }

        echo "Extraction completed using system command.\n";
    }

    /**
     * Get absolute path to target directory
     *
     * @return string Absolute path
     */
    private function getAbsoluteTargetDir(): string
    {
        if (DIRECTORY_SEPARATOR === '\\' && preg_match('/^[A-Za-z]:/', $this->targetDir)) {
            // Windows absolute path
            return $this->targetDir;
        } elseif ($this->targetDir[0] === DIRECTORY_SEPARATOR) {
            // Unix absolute path
            return $this->targetDir;
        } else {
            // Relative path - resolve it
            return realpath(__DIR__ . DIRECTORY_SEPARATOR . $this->targetDir)
                ?: __DIR__ . DIRECTORY_SEPARATOR . $this->targetDir;
        }
    }

    /**
     * Format bytes to human readable format
     *
     * @param int $bytes
     * @return string
     */
    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 2) . ' ' . $units[$i];
    }
}


// If run directly from command line
if (php_sapi_name() === 'cli' && basename(__FILE__) === basename($_SERVER['PHP_SELF'])) {
    echo "=== FAA NOTAMs Downloader ===\n";
    echo "Started: " . date('Y-m-d H:i:s') . "\n\n";

    // Parse command line arguments
    // Usage: php FaaNotamDownloader.php <clientId> <clientSecret> [environment]
    if ($argc < 3) {
        echo "Usage: php FaaNotamDownloader.php <clientId> <clientSecret> [environment]\n";
        echo "\n";
        echo "Arguments:\n";
        echo "  clientId         API client ID (required)\n";
        echo "  clientSecret     API client secret (required)\n";
        echo "  environment      Environment: production, staging, or fit (optional, default: staging)\n";
        echo "\n";
        echo "Example:\n";
        echo "  php FaaNotamDownloader.php myClientId myClientSecret staging\n";
        echo "\n";
        exit(1);
    }

    $clientId = $argv[1];
    $clientSecret = $argv[2];
    $environment = $argv[3] ?? 'staging';
    $targetDir = '../../tmp/faa_notams'; // Default target directory

    echo "Configuration:\n";
    echo "  Client ID: $clientId\n";
    echo "  Environment: $environment\n";
    echo "  Target directory: $targetDir\n";
    echo "\n";

    try {
        $downloader = new FaaNotamDownloader($clientId, $clientSecret, $targetDir, $environment);
        $result = $downloader->downloadAndExtract();

        if ($result) {
            echo "\n=== Success ===\n";
            echo "Finished: " . date('Y-m-d H:i:s') . "\n";
            exit(0);
        } else {
            echo "\n=== Failed ===\n";
            echo "Finished: " . date('Y-m-d H:i:s') . "\n";
            exit(1);
        }

    } catch (Exception $e) {
        echo "\n=== Error ===\n";
        echo "Error: " . $e->getMessage() . "\n";
        exit(1);
    }
}



