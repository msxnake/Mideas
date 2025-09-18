/**
 * @fileoverview Integration module for OpenMSX automation with the MSX IDE server
 * Provides endpoints and utilities for automated screenshot generation
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execAsync = util.promisify(exec);

/**
 * OpenMSX automation integration class
 */
class OpenMSXAutomation {
    constructor(serverInstance) {
        this.server = serverInstance;
        this.automationDir = path.join(__dirname);
        this.screenshotDir = path.join(__dirname, '..', '..', 'screenshots');

        // Ensure screenshots directory exists
        this.ensureDirectoryExists(this.screenshotDir);

        console.log('🎮 OpenMSX Automation initialized');
        console.log(`   Automation directory: ${this.automationDir}`);
        console.log(`   Screenshots directory: ${this.screenshotDir}`);
    }

    /**
     * Ensure a directory exists, create if it doesn't
     */
    ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    /**
     * Find OpenMSX executable in common Windows locations
     */
    async findOpenMSX() {
        const commonPaths = [
            'C:\\Program Files\\openMSX\\openmsx.exe',
            'C:\\Program Files (x86)\\openMSX\\openmsx.exe',
            'C:\\openMSX\\openmsx.exe'
        ];

        // Check PATH first
        try {
            await execAsync('where openmsx.exe');
            return 'openmsx.exe'; // Available in PATH
        } catch (e) {
            // Not in PATH, check common locations
        }

        for (const exePath of commonPaths) {
            if (fs.existsSync(exePath)) {
                return exePath;
            }
        }

        throw new Error('OpenMSX not found. Please install OpenMSX or add it to PATH.');
    }

    /**
     * Generate screenshot for a ROM file
     */
    async generateScreenshot(romPath, options = {}) {
        const {
            waitSeconds = 10,
            outputDir = this.screenshotDir,
            machine = 'MSX',
            customPrefix = ''
        } = options;

        // Validate ROM file
        if (!fs.existsSync(romPath)) {
            throw new Error(`ROM file not found: ${romPath}`);
        }

        // Find OpenMSX
        const openmsxPath = await this.findOpenMSX();

        // Prepare PowerShell script path
        const psScript = path.join(this.automationDir, 'openmsx-automation.ps1');
        if (!fs.existsSync(psScript)) {
            throw new Error(`PowerShell automation script not found: ${psScript}`);
        }

        // Prepare arguments
        const args = [
            '-ExecutionPolicy', 'Bypass',
            '-File', `"${psScript}"`,
            '-RomPath', `"${romPath}"`,
            '-WaitSeconds', waitSeconds.toString(),
            '-OutputDir', `"${outputDir}"`,
            '-Machine', `"${machine}"`
        ];

        console.log(`🎮 Generating screenshot for: ${path.basename(romPath)}`);
        console.log(`   Wait time: ${waitSeconds}s`);
        console.log(`   Machine: ${machine}`);
        console.log(`   Output: ${outputDir}`);

        try {
            const { stdout, stderr } = await execAsync(`powershell.exe ${args.join(' ')}`);

            // Look for generated screenshot
            const romName = path.basename(romPath, path.extname(romPath));
            const screenshotPattern = path.join(outputDir, `${romName}_*.png`);

            return {
                success: true,
                romPath: romPath,
                romName: romName,
                outputDir: outputDir,
                stdout: stdout,
                stderr: stderr
            };
        } catch (error) {
            console.error(`❌ Screenshot generation failed:`, error);
            throw new Error(`Screenshot generation failed: ${error.message}`);
        }
    }

    /**
     * Generate screenshots for multiple ROMs in batch
     */
    async generateBatchScreenshots(romPaths, options = {}) {
        const {
            waitSeconds = 10,
            outputDir = path.join(this.screenshotDir, 'batch'),
            machine = 'MSX',
            parallel = false,
            maxConcurrent = 2
        } = options;

        this.ensureDirectoryExists(outputDir);

        const results = [];

        if (parallel) {
            // Parallel processing
            const chunks = this.chunkArray(romPaths, maxConcurrent);

            for (const chunk of chunks) {
                const promises = chunk.map(romPath =>
                    this.generateScreenshot(romPath, { waitSeconds, outputDir, machine })
                        .catch(error => ({
                            success: false,
                            romPath,
                            error: error.message
                        }))
                );

                const chunkResults = await Promise.all(promises);
                results.push(...chunkResults);
            }
        } else {
            // Sequential processing
            for (const romPath of romPaths) {
                try {
                    const result = await this.generateScreenshot(romPath, { waitSeconds, outputDir, machine });
                    results.push(result);
                } catch (error) {
                    results.push({
                        success: false,
                        romPath,
                        error: error.message
                    });
                }
            }
        }

        return {
            total: romPaths.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results: results,
            outputDir: outputDir
        };
    }

    /**
     * Utility to chunk array for parallel processing
     */
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * Get list of available ROM files in temp directory
     */
    getAvailableRoms() {
        const tempDir = path.join(__dirname, '..', '..', 'server', 'temp');

        if (!fs.existsSync(tempDir)) {
            return [];
        }

        return fs.readdirSync(tempDir)
            .filter(file => file.endsWith('.rom'))
            .map(file => ({
                filename: file,
                path: path.join(tempDir, file),
                size: fs.statSync(path.join(tempDir, file)).size,
                modified: fs.statSync(path.join(tempDir, file)).mtime
            }));
    }

    /**
     * Get list of generated screenshots
     */
    getScreenshots(subDir = '') {
        const screenshotPath = subDir ? path.join(this.screenshotDir, subDir) : this.screenshotDir;

        if (!fs.existsSync(screenshotPath)) {
            return [];
        }

        const screenshots = [];

        function scanDirectory(dir, baseDir = '') {
            const items = fs.readdirSync(dir);

            for (const item of items) {
                const itemPath = path.join(dir, item);
                const relativePath = path.join(baseDir, item);
                const stat = fs.statSync(itemPath);

                if (stat.isDirectory()) {
                    scanDirectory(itemPath, relativePath);
                } else if (item.toLowerCase().endsWith('.png')) {
                    screenshots.push({
                        filename: item,
                        relativePath: relativePath,
                        fullPath: itemPath,
                        size: stat.size,
                        created: stat.mtime
                    });
                }
            }
        }

        scanDirectory(screenshotPath);
        return screenshots.sort((a, b) => b.created - a.created);
    }

    /**
     * Setup Express routes for OpenMSX automation
     */
    setupRoutes(app) {
        // Generate screenshot for specific ROM
        app.post('/screenshot', async (req, res) => {
            try {
                const { romPath, waitSeconds, machine, outputDir } = req.body;

                if (!romPath) {
                    return res.status(400).json({ error: 'ROM path is required' });
                }

                const result = await this.generateScreenshot(romPath, {
                    waitSeconds: waitSeconds || 10,
                    machine: machine || 'MSX',
                    outputDir: outputDir || this.screenshotDir
                });

                res.json(result);
            } catch (error) {
                res.status(500).json({
                    error: 'Screenshot generation failed',
                    details: error.message
                });
            }
        });

        // Generate screenshots for all ROMs in temp directory
        app.post('/screenshot-batch', async (req, res) => {
            try {
                const { waitSeconds, machine, parallel, maxConcurrent } = req.body;

                const availableRoms = this.getAvailableRoms();
                if (availableRoms.length === 0) {
                    return res.status(404).json({ error: 'No ROM files found in temp directory' });
                }

                const romPaths = availableRoms.map(rom => rom.path);
                const result = await this.generateBatchScreenshots(romPaths, {
                    waitSeconds: waitSeconds || 10,
                    machine: machine || 'MSX',
                    parallel: parallel || false,
                    maxConcurrent: maxConcurrent || 2
                });

                res.json(result);
            } catch (error) {
                res.status(500).json({
                    error: 'Batch screenshot generation failed',
                    details: error.message
                });
            }
        });

        // Get list of available ROMs
        app.get('/roms-available', (req, res) => {
            try {
                const roms = this.getAvailableRoms();
                res.json({ roms });
            } catch (error) {
                res.status(500).json({
                    error: 'Failed to get ROM list',
                    details: error.message
                });
            }
        });

        // Get list of screenshots
        app.get('/screenshots', (req, res) => {
            try {
                const { subDir } = req.query;
                const screenshots = this.getScreenshots(subDir);
                res.json({ screenshots });
            } catch (error) {
                res.status(500).json({
                    error: 'Failed to get screenshots list',
                    details: error.message
                });
            }
        });

        // Download screenshot
        app.get('/screenshot-download/:filename', (req, res) => {
            try {
                const filename = req.params.filename;

                // Security check
                if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                    return res.status(400).json({ error: 'Invalid filename' });
                }

                const filePath = path.join(this.screenshotDir, filename);

                if (!fs.existsSync(filePath)) {
                    return res.status(404).json({ error: 'Screenshot not found' });
                }

                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                res.setHeader('Content-Type', 'image/png');
                res.sendFile(filePath);
            } catch (error) {
                res.status(500).json({
                    error: 'Failed to download screenshot',
                    details: error.message
                });
            }
        });

        console.log('🎮 OpenMSX automation routes registered:');
        console.log('   POST /screenshot - Generate single screenshot');
        console.log('   POST /screenshot-batch - Generate batch screenshots');
        console.log('   GET /roms-available - List available ROMs');
        console.log('   GET /screenshots - List screenshots');
        console.log('   GET /screenshot-download/:filename - Download screenshot');
    }
}

module.exports = OpenMSXAutomation;