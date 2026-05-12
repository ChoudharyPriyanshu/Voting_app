const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Allowed image types for profile photos
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
// Allowed types for admin verification documents
const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

// Max file sizes
const MAX_PROFILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Cloudinary storage for profile photos
 */
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'votosphere/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      return `profile-${uniqueSuffix}`;
    },
  },
});

/**
 * Cloudinary storage for admin verification documents
 */
const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'votosphere/documents',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    resource_type: 'auto',
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      return `doc-${uniqueSuffix}`;
    },
  },
});

/**
 * File filter for profile photo uploads
 */
const profileFileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed for profile photos.'), false);
  }
};

/**
 * File filter for document uploads
 */
const documentFileFilter = (req, file, cb) => {
  if (ALLOWED_DOC_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP images and PDF files are allowed for documents.'), false);
  }
};

// Multer upload instances
const uploadProfilePhoto = multer({
  storage: profileStorage,
  fileFilter: profileFileFilter,
  limits: { fileSize: MAX_PROFILE_SIZE },
});

const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: { fileSize: MAX_DOC_SIZE },
});

/**
 * Combined upload for signup — handles both profile photo and verification document
 */
const uploadSignupFiles = multer({
  storage: profileStorage, // default storage — overridden per field below
  limits: { fileSize: MAX_DOC_SIZE },
});

// For signup, we use a custom approach: two separate Multer instances
// combined via a middleware wrapper
const handleSignupUploads = (req, res, next) => {
  const upload = multer({
    storage: multer.memoryStorage(), // temporary memory storage
    limits: { fileSize: MAX_DOC_SIZE },
    fileFilter: (req, file, cb) => {
      if (file.fieldname === 'profilePhoto') {
        if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid profile photo type. Only JPEG, PNG, and WebP are allowed.'), false);
        }
      } else if (file.fieldname === 'verificationDocument') {
        if (ALLOWED_DOC_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid document type. Only JPEG, PNG, WebP, and PDF are allowed.'), false);
        }
      } else {
        cb(null, true);
      }
    },
  }).fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'verificationDocument', maxCount: 1 },
  ]);

  upload(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Max size: 10MB' });
        }
        return res.status(400).json({ message: err.message });
      }
      return res.status(400).json({ message: err.message });
    }

    try {
      // Upload files to Cloudinary
      if (req.files?.profilePhoto?.[0]) {
        const profileFile = req.files.profilePhoto[0];
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'votosphere/profiles',
              transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(profileFile.buffer);
        });
        req.uploadedProfilePhoto = result.secure_url;
      }

      if (req.files?.verificationDocument?.[0]) {
        const docFile = req.files.verificationDocument[0];
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'votosphere/documents',
              resource_type: 'auto',
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(docFile.buffer);
        });
        req.uploadedVerificationDoc = result.secure_url;
      }

      next();
    } catch (uploadError) {
      console.log('Cloudinary upload error:', uploadError);
      return res.status(500).json({ message: 'File upload failed. Please try again.' });
    }
  });
};

module.exports = {
  cloudinary,
  uploadProfilePhoto,
  uploadDocument,
  handleSignupUploads,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOC_TYPES,
};
