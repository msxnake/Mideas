"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadTextFile = downloadTextFile;
exports.downloadJsonFile = downloadJsonFile;
function downloadTextFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
function downloadJsonFile(filename, data) {
    downloadTextFile(filename, JSON.stringify(data, null, 2), 'application/json');
}
