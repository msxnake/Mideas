import axios from 'axios';

/**
 * Sends a request to the local server to execute a compression tool.
 * @param {string} tool The name of the compression tool to use (e.g., 'ZX0').
 * @param {string} inputData The data to be compressed.
 * @param {string} outputFile The desired path for the output file.
 * @param {string} assetType The type of the asset being compressed (e.g., 'tile', 'sprite').
 * @returns {Promise<object>} A promise that resolves with an object containing the compression statistics.
 */
export const compressData = async (tool, inputData, outputFile, assetType) => {
  const serverUrl = 'http://localhost:3001/run-compressor';
  const body = {
    tool,
    inputData,
    outputFile,
    assetType,
  };

  try {
    const response = await axios.post(serverUrl, body);
    return response.data;
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(`Server responded with an error: ${error.response.status} ${error.response.data.message || ''}`);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('Could not connect to the compression server. Is it running?');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(`An unexpected error occurred: ${error.message}`);
    }
  }
};

const CompressionService = {
  compressData,
};

export default CompressionService;
