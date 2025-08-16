const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

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
  const { tool, inputFile, outputFile } = req.body;

  if (!tool || !inputFile || !outputFile) {
    return res.status(400).json({ message: 'Missing required parameters: tool, inputFile, outputFile' });
  }

  // --- Basic Security Sanity Checks ---
  // Prevent path traversal. We assume paths are relative to the project root.
  const projectRoot = path.join(__dirname, '..');
  const safeInputFile = path.join(projectRoot, inputFile);
  const safeOutputFile = path.join(projectRoot, outputFile);

  if (!safeInputFile.startsWith(projectRoot) || !safeOutputFile.startsWith(projectRoot)) {
    return res.status(400).json({ message: 'Invalid file path specified. Paths must be relative to the project root.' });
  }

  try {
    // 1. Check if input file exists
    const originalStats = await fs.promises.stat(safeInputFile);

    // 2. Ensure output directory exists
    const outputDir = path.dirname(safeOutputFile);
    await fs.promises.mkdir(outputDir, { recursive: true });

    // 3. Execute compression tool
    // NOTE: The actual compressor tool (e.g., ZX0.exe) is not provided in the repository.
    // As a placeholder, we will simulate the compression by simply copying the file.
    // The actual command to run the compressor should be substituted here.
    // For example:
    // const compressorPath = path.join(__dirname, 'ZX0.exe');
    // const command = `"${compressorPath}" "${safeInputFile}" "${safeOutputFile}"`;
    // await new Promise((resolve, reject) => {
    //   exec(command, (error, stdout, stderr) => {
    //     if (error) return reject(error);
    //     resolve(stdout);
    //   });
    // });
    await fs.promises.copyFile(safeInputFile, safeOutputFile);

    // 4. Get compressed file stats
    const compressedStats = await fs.promises.stat(safeOutputFile);

    // 5. Send back statistics
    const ratio = (compressedStats.size / originalStats.size) * 100;
    res.json({
      message: 'File compressed successfully (simulation).',
      originalSize: originalStats.size,
      compressedSize: compressedStats.size,
      ratio: ratio,
    });

  } catch (error) {
    console.error('Compression error:', error);
    if (error.code === 'ENOENT') {
        return res.status(404).json({ message: `Input file not found: ${inputFile}` });
    }
    res.status(500).json({ message: 'An error occurred during compression.', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`MSX IDE Compiler Backend listening at http://localhost:${port}`);
});
