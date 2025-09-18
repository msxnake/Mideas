/**
 * @fileoverview This file sets up a simple Express server to handle backend tasks
 * for the MSX IDE, such as code compilation and data compression.
 */

const express = require('express');
const cors = require('cors');
const util = require('util');
const { exec } = require('child_process');
const fs = require('fs');
const execAsync = util.promisify(exec);
const path = require('path');
const { serializeAsset } = require('./assetSerializer');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for large ASM files
app.use(express.urlencoded({ limit: '10mb', extended: true })); // Also for URL-encoded data

/**
 * Root endpoint to check if the server is running.
 * @name GET /
 * @function
 */
app.get('/', (req, res) => {
  res.send('MSX IDE Compiler Backend is running!');
});

/**
 * Endpoint to compile Z80 assembly code using the Glass assembler.
 * Expects a JSON body with a `code` property.
 * @name POST /compile
 * @function
 */
app.post('/compile', (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).send({ error: 'No code provided' });
  }

  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const timestamp = Date.now();
  const tempFilePath = path.join(tempDir, `source_${timestamp}.asm`);
  const outputFilePath = tempFilePath.replace('.asm', '.rom');

  fs.writeFile(tempFilePath, code, (err) => {
    if (err) {
      return res.status(500).send({ error: 'Failed to write temporary file', details: err });
    }

    const jarPath = path.join(__dirname, 'glass.jar');
    const command = `java -jar "${jarPath}" "${tempFilePath}" "${outputFilePath}"`;

    console.log(`🔧 Executing Glass: ${command}`);

    exec(command, (error, stdout, stderr) => {
      // Log detailed information for debugging
      console.log('=== GLASS COMPILATION RESULTS ===');
      console.log('Command:', command);
      console.log('Error object:', error);
      console.log('STDOUT:', stdout);
      console.log('STDERR:', stderr);
      console.log('===================================');

      if (error) {
        // Don't delete temp file yet so we can inspect it
        console.log(`❌ Glass compilation failed. Temp file: ${tempFilePath}`);

        // Read the source file to see what we tried to compile
        fs.readFile(tempFilePath, 'utf8', (readErr, sourceCode) => {
          const errorResponse = {
            error: 'Glass compilation failed',
            details: stderr || stdout || error.message,
            command: command,
            sourceFile: tempFilePath,
            sourceCode: readErr ? 'Could not read source' : sourceCode.substring(0, 1000), // First 1000 chars
            fullStderr: stderr,
            fullStdout: stdout,
            errorCode: error.code,
            signal: error.signal
          };

          console.log('Full error response:', errorResponse);
          return res.status(500).json(errorResponse);
        });
        return;
      }

      fs.readFile(outputFilePath, (readErr, data) => {
        // Clean up only the temporary ASM file, keep the ROM file
        fs.unlink(tempFilePath, () => {});

        if (readErr) {
          return res.status(500).send({ error: 'Failed to read compiled file', details: readErr });
        }

        // MSX ROM files must be multiples of 8KB
        const KB_8 = 8192; // 8KB in bytes
        const originalSize = data.length;

        let paddedData = data;
        if (originalSize % KB_8 !== 0) {
          // Calculate padding needed to reach next 8KB boundary
          const paddingNeeded = KB_8 - (originalSize % KB_8);
          const padding = Buffer.alloc(paddingNeeded, 0xFF); // Fill with 0xFF (common for ROM padding)
          paddedData = Buffer.concat([data, padding]);

          console.log(`📏 ROM Size Adjustment:`);
          console.log(`   Original: ${originalSize} bytes`);
          console.log(`   Padded: ${paddedData.length} bytes (${paddedData.length / KB_8}×8KB)`);
          console.log(`   Added: ${paddingNeeded} bytes of padding (0xFF)`);

          // Write the padded ROM back to file
          fs.writeFileSync(outputFilePath, paddedData);
        } else {
          console.log(`✅ ROM Size OK: ${originalSize} bytes (${originalSize / KB_8}×8KB)`);
        }

        // Return ROM file information for download
        const romFileName = path.basename(outputFilePath);
        res.send({
          success: true,
          data: paddedData.toString('hex'),
          message: stdout,
          romFile: romFileName,
          romPath: outputFilePath,
          downloadUrl: `/download/${romFileName}`,
          romSizeInfo: {
            originalSize: originalSize,
            paddedSize: paddedData.length,
            paddingAdded: paddedData.length - originalSize,
            sizeIn8KB: paddedData.length / KB_8
          }
        });
      });
    });
  });
});

/**
 * Endpoint to run a compression tool (e.g., ZX0) on asset data.
 * Serializes the provided asset data, saves it to a temporary file,
 * runs the specified compressor, and returns compression statistics.
 * @name POST /run-compressor
 * @function
 */
app.post('/run-compressor', async (req, res) => {
  const { tool, inputData, outputFile, assetType } = req.body;

  if (!tool || !inputData || !outputFile || !assetType) {
    return res.status(400).json({ message: 'Missing required parameters: tool, inputData, outputFile, or assetType.' });
  }

  const projectRoot = path.join(__dirname, '..');
  const safeOutputFile = path.join(projectRoot, outputFile);

  if (!safeOutputFile.startsWith(projectRoot)) {
    return res.status(400).json({ message: 'Invalid output file path specified.' });
  }

  const tempDir = path.join(__dirname, 'temp');
  let tempInputFilePath = null;

  try {
    await fs.promises.mkdir(tempDir, { recursive: true });

    const binaryData = serializeAsset({ type: assetType, data: inputData });

    tempInputFilePath = path.join(tempDir, `compress_input_${Date.now()}`);
    await fs.promises.writeFile(tempInputFilePath, binaryData);

    const originalSize = binaryData.length;

    const outputDir = path.dirname(safeOutputFile);
    await fs.promises.mkdir(outputDir, { recursive: true });

    if (tool.toUpperCase() === 'ZX0') {
      const jarPath = path.join(__dirname, 'zx0.jar');
      const command = `java -jar "${jarPath}" "${tempInputFilePath}" "${safeOutputFile}"`;

      try {
        await execAsync(command);
      } catch (e) {
        throw new Error(`ZX0 compression failed: ${e.stderr || e.stdout || e.message}`);
      }
    } else {
      await fs.promises.copyFile(tempInputFilePath, safeOutputFile);
    }

    const compressedStats = await fs.promises.stat(safeOutputFile);

    const ratio = originalSize > 0 ? (1 - (compressedStats.size / originalSize)) * 100 : 0;
    res.json({
      message: `File compressed successfully with ${tool}.`,
      originalSize: originalSize,
      compressedSize: compressedStats.size,
      ratio: ratio,
    });

  } catch (error) {
    console.error('Compression error:', error);
    res.status(500).json({ message: 'An error occurred during compression.', details: error.message });
  } finally {
    if (tempInputFilePath) {
      try {
        await fs.promises.unlink(tempInputFilePath);
      } catch (cleanupError) {
        console.error('Failed to delete temporary compression file:', cleanupError);
      }
    }
  }
});

/**
 * Endpoint to download compiled ROM files
 * @name GET /download/:filename
 * @function
 */
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;

  // Validate filename (only allow .rom files)
  if (!filename.endsWith('.rom') || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).send({ error: 'Invalid filename' });
  }

  const tempDir = path.join(__dirname, 'temp');
  const filePath = path.join(tempDir, filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).send({ error: 'ROM file not found' });
  }

  // Set headers for download
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/octet-stream');

  // Send the file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      return res.status(500).send({ error: 'Failed to read ROM file', details: err });
    }

    res.send(data);

    // Optional: Delete the file after sending (uncomment if you want to clean up)
    // setTimeout(() => {
    //   fs.unlink(filePath, () => {});
    // }, 5000); // Delete after 5 seconds
  });
});

/**
 * Endpoint to list available ROM files
 * @name GET /roms
 * @function
 */
app.get('/roms', (req, res) => {
  const tempDir = path.join(__dirname, 'temp');

  if (!fs.existsSync(tempDir)) {
    return res.send({ roms: [] });
  }

  fs.readdir(tempDir, (err, files) => {
    if (err) {
      return res.status(500).send({ error: 'Failed to read temp directory', details: err });
    }

    const romFiles = files
      .filter(file => file.endsWith('.rom'))
      .map(file => {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          created: stats.mtime,
          downloadUrl: `/download/${file}`
        };
      });

    res.send({ roms: romFiles });
  });
});

/**
 * Endpoint to run ROM in OpenMSX for testing
 * @name POST /run-openmsx
 * @function
 */
app.post('/run-openmsx', (req, res) => {
  const { romFile } = req.body;

  if (!romFile) {
    return res.status(400).send({ error: 'No ROM file specified' });
  }

  const tempDir = path.join(__dirname, 'temp');
  const romPath = path.join(tempDir, romFile);

  // Verify ROM file exists
  if (!fs.existsSync(romPath)) {
    return res.status(404).send({ error: 'ROM file not found', romFile: romFile });
  }

  // Path to automation script
  const automationDir = path.join(__dirname, '..', 'automation', 'openmsx');
  const runScript = path.join(automationDir, 'run-openmsx.bat');

  if (!fs.existsSync(runScript)) {
    return res.status(500).send({ error: 'OpenMSX automation script not found' });
  }

  console.log(`🎮 Starting OpenMSX with ROM: ${romFile}`);

  // Execute run script (doesn't wait - OpenMSX stays open)
  const command = `"${runScript}" "${romPath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.log(`❌ Failed to start OpenMSX: ${error.message}`);
      return res.status(500).send({
        error: 'Failed to start OpenMSX',
        details: error.message,
        stdout: stdout,
        stderr: stderr
      });
    }

    console.log(`✅ OpenMSX started successfully for ROM: ${romFile}`);
    res.send({
      success: true,
      message: 'OpenMSX started successfully',
      romFile: romFile,
      note: 'OpenMSX is running - close it manually when done testing'
    });
  });
});

/**
 * Endpoint to generate screenshot from ROM
 * @name POST /generate-screenshot
 * @function
 */
app.post('/generate-screenshot', (req, res) => {
  const { romFile, waitSeconds = 10 } = req.body;

  if (!romFile) {
    return res.status(400).send({ error: 'No ROM file specified' });
  }

  const tempDir = path.join(__dirname, 'temp');
  const romPath = path.join(tempDir, romFile);

  // Verify ROM file exists
  if (!fs.existsSync(romPath)) {
    return res.status(404).send({ error: 'ROM file not found', romFile: romFile });
  }

  // Path to automation script
  const automationDir = path.join(__dirname, '..', 'automation', 'openmsx');
  const screenshotScript = path.join(automationDir, 'openmsx-screenshot-corrected.bat');

  if (!fs.existsSync(screenshotScript)) {
    return res.status(500).send({ error: 'Screenshot automation script not found' });
  }

  console.log(`📷 Generating screenshot for ROM: ${romFile} (wait: ${waitSeconds}s)`);

  // Execute screenshot script and wait for completion
  const command = `"${screenshotScript}" "${romPath}" ${waitSeconds}`;

  exec(command, { timeout: (waitSeconds + 20) * 1000 }, (error, stdout, stderr) => {
    if (error) {
      console.log(`❌ Screenshot generation failed: ${error.message}`);
      return res.status(500).send({
        error: 'Screenshot generation failed',
        details: error.message,
        stdout: stdout,
        stderr: stderr
      });
    }

    // Look for generated screenshot
    const screenshotsDir = path.join(automationDir, 'screenshots');

    if (!fs.existsSync(screenshotsDir)) {
      return res.status(500).send({ error: 'Screenshots directory not found' });
    }

    // Find the most recent PNG file
    try {
      const screenshotFiles = fs.readdirSync(screenshotsDir)
        .filter(file => file.endsWith('.png'))
        .map(file => {
          const filePath = path.join(screenshotsDir, file);
          const stats = fs.statSync(filePath);
          return { filename: file, mtime: stats.mtime, size: stats.size };
        })
        .sort((a, b) => b.mtime - a.mtime);

      if (screenshotFiles.length === 0) {
        return res.status(500).send({ error: 'No screenshot generated' });
      }

      const latestScreenshot = screenshotFiles[0];
      console.log(`✅ Screenshot generated: ${latestScreenshot.filename}`);

      res.send({
        success: true,
        message: 'Screenshot generated successfully',
        romFile: romFile,
        screenshot: {
          filename: latestScreenshot.filename,
          size: latestScreenshot.size,
          generated: latestScreenshot.mtime
        },
        waitSeconds: waitSeconds
      });

    } catch (dirError) {
      return res.status(500).send({
        error: 'Failed to read screenshots directory',
        details: dirError.message
      });
    }
  });
});

/**
 * Endpoint to serve screenshot files
 * @name GET /screenshot/:filename
 * @function
 */
app.get('/screenshot/:filename', (req, res) => {
  const filename = req.params.filename;

  // Validate filename
  if (!filename.endsWith('.png') || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).send({ error: 'Invalid filename' });
  }

  const automationDir = path.join(__dirname, '..', 'automation', 'openmsx');
  const screenshotsDir = path.join(automationDir, 'screenshots');
  const filePath = path.join(screenshotsDir, filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).send({ error: 'Screenshot not found' });
  }

  // Set headers for image
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

  // Send the image file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      return res.status(500).send({ error: 'Failed to read screenshot', details: err });
    }
    res.send(data);
  });
});

/**
 * Starts the Express server.
 */
app.listen(port, () => {
  console.log(`MSX IDE Compiler Backend listening at http://localhost:${port}`);
});
