const path = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;

class FileValidator {
  constructor() {
    // File type configurations
    this.allowedTypes = {
      documents: {
        extensions: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
        mimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'application/rtf'
        ],
        maxSize: 10 * 1024 * 1024 // 10MB
      },
      images: {
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        mimeTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp'
        ],
        maxSize: 5 * 1024 * 1024 // 5MB
      },
      videos: {
        extensions: ['.mp4', '.avi', '.mov', '.webm'],
        mimeTypes: [
          'video/mp4',
          'video/x-msvideo',
          'video/quicktime',
          'video/webm'
        ],
        maxSize: 100 * 1024 * 1024 // 100MB
      },
      code: {
        extensions: ['.js', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs'],
        mimeTypes: [
          'text/javascript',
          'application/javascript',
          'text/x-python',
          'text/x-java',
          'text/x-c',
          'text/plain'
        ],
        maxSize: 1 * 1024 * 1024 // 1MB
      }
    };

    // Magic numbers for file type verification
    this.magicNumbers = {
      pdf: Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
      jpg: Buffer.from([0xFF, 0xD8, 0xFF]),
      png: Buffer.from([0x89, 0x50, 0x4E, 0x47]),
      gif: Buffer.from([0x47, 0x49, 0x46]),
      zip: Buffer.from([0x50, 0x4B, 0x03, 0x04]),
      docx: Buffer.from([0x50, 0x4B, 0x03, 0x04]) // DOCX is a ZIP
    };

    // Dangerous patterns
    this.dangerousPatterns = [
      /<script[\s\S]*?<\/script>/gi,
      /<iframe[\s\S]*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // Event handlers
      /<embed[\s\S]*?>/gi,
      /<object[\s\S]*?<\/object>/gi
    ];
  }

  async validateFile(file, category = 'documents') {
    const validation = {
      valid: true,
      errors: [],
      warnings: []
    };

    const config = this.allowedTypes[category];
    if (!config) {
      validation.valid = false;
      validation.errors.push(`Unknown category: ${category}`);
      return validation;
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!config.extensions.includes(ext)) {
      validation.valid = false;
      validation.errors.push(`File extension '${ext}' not allowed for ${category}`);
    }

    // Check MIME type
    if (file.mimetype && !config.mimeTypes.includes(file.mimetype)) {
      validation.warnings.push(`MIME type '${file.mimetype}' not typical for ${category}`);
    }

    // Check file size
    if (file.size > config.maxSize) {
      validation.valid = false;
      validation.errors.push(`File size (${this.formatSize(file.size)}) exceeds limit (${this.formatSize(config.maxSize)})`);
    }

    // Check magic numbers if buffer available
    if (file.buffer) {
      const magicValidation = this.checkMagicNumber(file.buffer, ext);
      if (!magicValidation.valid) {
        validation.valid = false;
        validation.errors.push(magicValidation.error);
      }
    }

    // Scan for dangerous content
    if (file.buffer && category === 'documents') {
      const contentCheck = await this.scanContent(file.buffer);
      if (contentCheck.dangerous) {
        validation.valid = false;
        validation.errors.push(`Dangerous content detected: ${contentCheck.reason}`);
      }
    }

    // Generate file hash for duplicate detection
    if (file.buffer) {
      validation.hash = this.generateFileHash(file.buffer);
    }

    validation.metadata = {
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      extension: ext,
      category
    };

    return validation;
  }

  checkMagicNumber(buffer, extension) {
    const ext = extension.replace('.', '');
    const expectedMagic = this.magicNumbers[ext];

    if (!expectedMagic) {
      return { valid: true }; // No magic number check for this type
    }

    const fileMagic = buffer.slice(0, expectedMagic.length);
    
    if (!fileMagic.equals(expectedMagic)) {
      return {
        valid: false,
        error: `File content doesn't match extension '${extension}'`
      };
    }

    return { valid: true };
  }

  async scanContent(buffer) {
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 10000));
    
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(content)) {
        return {
          dangerous: true,
          reason: `Suspicious pattern detected: ${pattern.source}`
        };
      }
    }

    // Check for excessive null bytes (could be malformed)
    const nullBytes = (content.match(/\0/g) || []).length;
    if (nullBytes > content.length * 0.3) {
      return {
        dangerous: true,
        reason: 'Excessive null bytes detected'
      };
    }

    return { dangerous: false };
  }

  generateFileHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  formatSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  sanitizeFilename(filename) {
    // Remove path traversal attempts
    let safe = filename.replace(/\.\./g, '');
    
    // Remove special characters
    safe = safe.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Limit length
    const ext = path.extname(safe);
    const name = path.basename(safe, ext);
    if (name.length > 100) {
      safe = name.substring(0, 100) + ext;
    }

    // Add timestamp for uniqueness
    const timestamp = Date.now();
    const finalName = `${path.basename(safe, ext)}_${timestamp}${ext}`;

    return finalName;
  }

  async validateFileSystem(filePath) {
    try {
      const stats = await fs.stat(filePath);
      
      return {
        exists: true,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        permissions: stats.mode
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message
      };
    }
  }

  getConfigForMimeType(mimeType) {
    for (const [category, config] of Object.entries(this.allowedTypes)) {
      if (config.mimeTypes.includes(mimeType)) {
        return { category, config };
      }
    }
    return null;
  }

  isExecutable(filename) {
    const dangerousExtensions = [
      '.exe', '.bat', '.cmd', '.sh', '.ps1', 
      '.app', '.vbs', '.js', '.jar', '.com'
    ];
    
    const ext = path.extname(filename).toLowerCase();
    return dangerousExtensions.includes(ext);
  }

  async quarantineFile(file, reason) {
    const quarantinePath = process.env.QUARANTINE_PATH || './quarantine';
    const fileName = this.sanitizeFilename(file.originalname);
    const fullPath = path.join(quarantinePath, fileName);

    try {
      // Ensure quarantine directory exists
      await fs.mkdir(quarantinePath, { recursive: true });
      
      // Write file to quarantine
      await fs.writeFile(fullPath, file.buffer);
      
      // Log quarantine event
      const logEntry = {
        timestamp: new Date().toISOString(),
        originalName: file.originalname,
        quarantinedName: fileName,
        reason,
        size: file.size,
        mimeType: file.mimetype
      };
      
      await fs.appendFile(
        path.join(quarantinePath, 'quarantine.log'),
        JSON.stringify(logEntry) + '\n'
      );

      return {
        success: true,
        path: fullPath,
        logEntry
      };
    } catch (error) {
      console.error('Quarantine error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = FileValidator;