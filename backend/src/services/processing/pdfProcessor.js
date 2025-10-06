const fs = require('fs').promises;
const path = require('path');

class PDFProcessor {
    constructor({ pdfLibrary = null } = {}) {
        // In a real implementation, we'd inject a PDF library like pdf-parse
        this.pdfLib = pdfLibrary;
    }

    async processFile(filePath) {
        if (!filePath) {
            throw new Error('File path required');
        }

        try {
            // Check if file exists
            await fs.access(filePath);
            
            if (this.pdfLib) {
                // Use injected PDF library
                return await this.pdfLib.process(filePath);
            }
            
            // Fallback to pdf-parse if available
            try {
                const pdfParse = require('pdf-parse');
                const dataBuffer = await fs.readFile(filePath);
                const data = await pdfParse(dataBuffer);
                
                return {
                    text: data.text,
                    pages: data.numpages,
                    metadata: data.metadata || {},
                    info: data.info || {}
                };
            } catch (err) {
                // If pdf-parse not available, read as buffer
                const buffer = await fs.readFile(filePath);
                return {
                    text: 'PDF processing requires pdf-parse library',
                    pages: 1,
                    metadata: { error: 'pdf-parse not installed' },
                    buffer: buffer
                };
            }
        } catch (error) {
            console.error('PDF processing error:', error);
            throw error;
        }
    }

    async extractText(filePath) {
        const result = await this.processFile(filePath);
        return result.text;
    }

    async getMetadata(filePath) {
        const result = await this.processFile(filePath);
        return result.metadata;
    }
}

module.exports = PDFProcessor;
