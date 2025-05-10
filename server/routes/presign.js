const express = require('express');
const router = express.Router();
const minio = require('../config/minio');

router.post('/', async (req, res) => {
  const { key, contentType } = req.body;
  // ensure bucket exists
  await minio.bucketExists(process.env.MINIO_BUCKET);
  // generate presigned PUT URL
  minio.presignedPutObject(
    process.env.MINIO_BUCKET,
    key,
    60 * 5,            // valid for 5 minutes
    (err, presignedUrl) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ url: presignedUrl });
    }
  );
});

module.exports = router;
