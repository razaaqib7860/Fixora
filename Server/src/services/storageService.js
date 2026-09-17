const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const env = require('../config/env');

const isCloudinaryConfigured = () => {
  return !!(
    env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  console.log('[Storage] Cloudinary initialized.');
} else {
  console.log('[Storage] Cloudinary not configured. Using local disk fallback in /uploads.');
}

/**
 * Upload single file (either to Cloudinary or Local uploads directory)
 * @param {Object} file Multer file object
 * @returns {Promise<Object>} Attachment metadata
 */
const uploadFile = async (file) => {
  const isAudio = file.mimetype.startsWith('audio/') || file.originalname.endsWith('.webm') || file.originalname.endsWith('.mp3');
  const fileType = isAudio ? 'AUDIO' : 'IMAGE';

  if (isCloudinaryConfigured()) {
    return new Promise((resolve, reject) => {
      const resourceType = isAudio ? 'video' : 'image'; // Cloudinary uses 'video' for audio files
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: 'hostel_complaints',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            fileType,
            originalName: file.originalname,
            size: file.size,
          });
        }
      );
      uploadStream.end(file.buffer);
    });
  }

  // Local Disk Storage Fallback
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const ext = path.extname(file.originalname) || (isAudio ? '.webm' : '.jpg');
  const uniqueName = `file-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const filePath = path.join(uploadsDir, uniqueName);

  fs.writeFileSync(filePath, file.buffer);

  return {
    url: `/uploads/${uniqueName}`,
    publicId: uniqueName,
    fileType,
    originalName: file.originalname,
    size: file.size,
  };
};

/**
 * Upload multiple files
 * @param {Array} files Array of Multer file objects
 * @returns {Promise<Array>} Array of uploaded attachment records
 */
const uploadMultipleFiles = async (files = []) => {
  if (!files || files.length === 0) return [];
  const results = [];
  for (const file of files) {
    const attachment = await uploadFile(file);
    results.push(attachment);
  }
  return results;
};

module.exports = {
  uploadFile,
  uploadMultipleFiles,
};
