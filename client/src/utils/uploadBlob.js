export async function uploadBlob(blob, filename) {
    const res = await fetch(
    `${process.env.REACT_APP_PRESIGN_URL || process.env.PRESIGN_URL}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: filename,
        contentType: blob.type,
      }),
    });
  
    const { url } = await res.json();
  
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': blob.type },
      body: blob,
    });
  
    console.log(`Uploaded ${filename}`);
  }
  