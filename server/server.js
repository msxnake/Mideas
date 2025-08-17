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
app.use(express.json());

app.get('/', (req, res) => {
  res.send('MSX IDE Compiler Backend is running!');
});

app.post('/compile', (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).send({ error: 'No code provided' });
  }

  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const tempFilePath = path.join(tempDir, `source_${Date.now()}.asm`);
  const outputFilePath = tempFilePath.replace('.asm', '.bin');

  fs.writeFile(tempFilePath, code, (err) => {
    if (err) {
      return res.status(500).send({ error: 'Failed to write temporary file', details: err });
    }

    const jarPath = path.join(__dirname, 'glass.jar');
    const command = `java -jar "${jarPath}" "${tempFilePath}" "${outputFilePath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        // Clean up temp file
        fs.unlink(tempFilePath, () => {});
        return res.status(500).send({ error: 'Compilation failed', details: stderr || stdout });
      }

      fs.readFile(outputFilePath, (readErr, data) => {
        // Clean up temp files
        fs.unlink(tempFilePath, () => {});
        fs.unlink(outputFilePath, () => {});

        if (readErr) {
          return res.status(500).send({ error: 'Failed to read compiled file', details: readErr });
        }

        res.send({ success: true, data: data.toString('hex'), message: stdout });
      });
    });
  });
});

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
    // 1. Create temp directory
    await fs.promises.mkdir(tempDir, { recursive: true });

    // 2. Serialize asset data to a binary buffer
    const binaryData = serializeAsset({ type: assetType, data: inputData });

    // 3. Write binary data to a temporary file
    tempInputFilePath = path.join(tempDir, `compress_input_${Date.now()}`);
    await fs.promises.writeFile(tempInputFilePath, binaryData);

    const originalSize = binaryData.length;

    // 4. Ensure output directory exists
    const outputDir = path.dirname(safeOutputFile);
    await fs.promises.mkdir(outputDir, { recursive: true });

    // 5. Execute compression tool
    if (tool.toUpperCase() === 'ZX0') {
      const jarPath = path.join(__dirname, 'zx0.jar');
      const command = `java -jar "${jarPath}" "${tempInputFilePath}" "${safeOutputFile}"`;

      try {
        await execAsync(command);
      } catch (e) {
        // If exec fails, it throws an error. We can inspect stdout/stderr.
        throw new Error(`ZX0 compression failed: ${e.stderr || e.stdout || e.message}`);
      }
    } else {
      // In case other tools are added later, we can handle them here.
      // For now, just copy the file if the tool is not ZX0.
      await fs.promises.copyFile(tempInputFilePath, safeOutputFile);
    }

    // 6. Get compressed file stats
    const compressedStats = await fs.promises.stat(safeOutputFile);

    // 7. Send back statistics
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
    // 8. Clean up temporary file
    if (tempInputFilePath) {
      try {
        await fs.promises.unlink(tempInputFilePath);
      } catch (cleanupError) {
        console.error('Failed to delete temporary compression file:', cleanupError);
      }
    }
  }
});

app.listen(port, () => {
  console.log(`MSX IDE Compiler Backend listening at http://localhost:${port}`);
});
