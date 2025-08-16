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

app.listen(port, () => {
  console.log(`MSX IDE Compiler Backend listening at http://localhost:${port}`);
});
