// server/routes/presign.js
const express = require('express');
const router = express.Router();
const minioClient = require('../config/minio'); // your MinIO client

/**
 * Wraps minioClient.bucketExists in a Promise so we can await it.
 * @param {string} bucket
 * @returns {Promise<boolean>}
 */
function ensureBucketExists(bucket) {
  return new Promise((resolve, reject) => {
    minioClient.bucketExists(bucket, (err, exists) => {
      if (err) return reject(err);
      if (exists) return resolve(true);

      // If it doesn't exist, create it
      minioClient.makeBucket(bucket, '', (makeErr) => {
        if (makeErr) return reject(makeErr);
        resolve(true);
      });
    });
  });
}

router.post('/', async (req, res) => {
  const { key, contentType } = req.body;
  const bucket = process.env.MINIO_BUCKET;

  try {
    // 1. Ensure the bucket exists (creates it if missing)
    await ensureBucketExists(bucket);  
    // 2. Generate a presigned PUT URL (valid 5 minutes)
    minioClient.presignedPutObject(bucket, key, 5 * 60, (err, presignedUrl) => {
      if (err) {
        console.error('Error generating presigned URL:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ url: presignedUrl });
    });
  } catch (err) {
    console.error('Error in /presign:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
