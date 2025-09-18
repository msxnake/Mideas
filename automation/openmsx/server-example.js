/**
 * @fileoverview Example of how to integrate OpenMSX automation with the existing server
 * This shows how to modify server.js to include screenshot functionality
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import the existing server modules (adjust paths as needed)
// const { serializeAsset } = require('./assetSerializer');

// Import OpenMSX automation
const OpenMSXAutomation = require('./server-integration');

const app = express();
const port = 3001;

// Standard middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Initialize OpenMSX automation
const openmsxAutomation = new OpenMSXAutomation(app);

// Setup OpenMSX routes
openmsxAutomation.setupRoutes(app);

// Example: Extended compile endpoint that optionally generates screenshot
app.post('/compile-with-screenshot', async (req, res) => {
    const { code, generateScreenshot, screenshotOptions } = req.body;

    if (!code) {
        return res.status(400).send({ error: 'No code provided' });
    }

    try {
        // First, compile the code (simplified version of existing compile endpoint)
        const tempDir = path.join(__dirname, '..', '..', 'server', 'temp');
        const timestamp = Date.now();
        const tempFilePath = path.join(tempDir, `source_${timestamp}.asm`);
        const outputFilePath = tempFilePath.replace('.asm', '.rom');

        // Write and compile (this would use the existing Glass compilation logic)
        // For this example, we'll assume the ROM is created successfully

        let response = {
            success: true,
            romFile: path.basename(outputFilePath),
            romPath: outputFilePath
        };

        // Generate screenshot if requested
        if (generateScreenshot) {
            try {
                const screenshotResult = await openmsxAutomation.generateScreenshot(
                    outputFilePath,
                    screenshotOptions || {}
                );

                response.screenshot = screenshotResult;
                response.screenshotGenerated = true;
            } catch (screenshotError) {
                response.screenshotError = screenshotError.message;
                response.screenshotGenerated = false;
            }
        }

        res.json(response);

    } catch (error) {
        res.status(500).json({
            error: 'Compilation failed',
            details: error.message
        });
    }
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'MSX IDE Compiler Backend with OpenMSX Automation',
        version: '1.0.0',
        features: [
            'Z80 Assembly Compilation',
            'OpenMSX Screenshot Automation',
            'Batch Processing',
            'ROM Management'
        ],
        endpoints: {
            compilation: [
                'POST /compile',
                'POST /compile-with-screenshot'
            ],
            screenshots: [
                'POST /screenshot',
                'POST /screenshot-batch',
                'GET /screenshots',
                'GET /screenshot-download/:filename'
            ],
            roms: [
                'GET /roms',
                'GET /roms-available',
                'GET /download/:filename'
            ]
        }
    });
});

// Example usage demonstration endpoint
app.get('/demo', (req, res) => {
    const examples = {
        single_screenshot: {
            method: 'POST',
            url: '/screenshot',
            body: {
                romPath: './server/temp/source_123456.rom',
                waitSeconds: 10,
                machine: 'MSX2'
            }
        },
        batch_screenshots: {
            method: 'POST',
            url: '/screenshot-batch',
            body: {
                waitSeconds: 15,
                machine: 'MSX',
                parallel: true,
                maxConcurrent: 2
            }
        },
        compile_with_screenshot: {
            method: 'POST',
            url: '/compile-with-screenshot',
            body: {
                code: 'org &h8000\nld a,&h01\nret',
                generateScreenshot: true,
                screenshotOptions: {
                    waitSeconds: 10,
                    machine: 'MSX2'
                }
            }
        }
    };

    res.json({
        message: 'OpenMSX Automation API Examples',
        examples: examples,
        notes: [
            'Replace romPath with actual ROM file paths',
            'Ensure OpenMSX is installed and accessible',
            'Screenshots are saved in the screenshots/ directory',
            'Use parallel processing for batch operations on multiple cores'
        ]
    });
});

// Start server
app.listen(port, () => {
    console.log('🚀 MSX IDE Compiler Backend with OpenMSX Automation');
    console.log(`📡 Server running at http://localhost:${port}`);
    console.log('🎮 OpenMSX screenshot automation enabled');
    console.log('📚 Visit /demo for API usage examples');
});

module.exports = app;