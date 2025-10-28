const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');

const router = express.Router();

// Configure multer for in-memory storage (no disk writes)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Only accept PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

/**
 * POST /api/extract-text-from-pdf
 * 
 * Extracts text content from an uploaded PDF file.
 * 
 * Request:
 *   - Content-Type: multipart/form-data
 *   - Field name: "pdf" (file)
 * 
 * Response:
 *   Success: { success: true, data: { text: string } }
 *   Error: { success: false, error: { message: string } }
 * 
 * Example usage:
 *   const formData = new FormData();
 *   formData.append('pdf', pdfFile);
 *   fetch('/api/extract-text-from-pdf', {
 *     method: 'POST',
 *     body: formData
 *   });
 */
router.post('/extract-text-from-pdf', upload.single('pdf'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No PDF file provided. Please upload a PDF file.'
        }
      });
    }

    console.log(`Processing PDF: ${req.file.originalname} (${req.file.size} bytes)`);

    // Extract text from PDF buffer using pdf-parse with custom options
    // to preserve whitespace and prevent text item combining
    const pdfData = await pdfParse(req.file.buffer, {
      pagerender: (pageData) => {
        const render_options = {
          // Preserve original whitespace characters
          normalizeWhitespace: false,
          // Prevent combining text items which can cause spacing issues
          disableCombineTextItems: true
        };
        
        return pageData.getTextContent(render_options)
          .then(function(textContent) {
            let lastY, text = '';
            for (let item of textContent.items) {
              if (lastY == item.transform[5] || !lastY) {
                text += item.str;
              } else {
                text += '\n' + item.str;
              }
              lastY = item.transform[5];
            }
            return text;
          });
      }
    });

    // Check if any text was extracted
    if (!pdfData.text || pdfData.text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No text could be extracted from the PDF. The file may be empty or contain only images.'
        }
      });
    }

    // Clean up the extracted text
    // - Minimal processing to preserve all original formatting
    // - Only normalize line breaks and convert non-breaking spaces
    const cleanedText = pdfData.text
      .replace(/\r\n/g, '\n')           // Normalize line breaks
      .replace(/\u00A0/g, ' ')          // Convert non-breaking spaces to regular spaces
      .trim();

    console.log(`Successfully extracted ${cleanedText.length} characters from PDF`);

    // Return the extracted text
    res.json({
      success: true,
      data: {
        text: cleanedText,
        metadata: {
          pages: pdfData.numpages,
          filename: req.file.originalname,
          size: req.file.size
        }
      }
    });

  } catch (error) {
    console.error('PDF extraction error:', error);

    // Handle specific error types
    if (error.message === 'Only PDF files are allowed') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid file type. Please upload a PDF file.'
        }
      });
    }

    // Handle file size errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'File too large. Maximum file size is 10MB.'
        }
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to extract text from PDF. Please try again or use a different file.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

module.exports = router;

