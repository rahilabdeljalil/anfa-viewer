// imageWorker.js
self.addEventListener('message', async ({ data }) => {
    try {
      const { path, isLowRes } = data;
      
      // Fetch the image
      const response = await fetch(path, {
        headers: {
          'Cache-Control': 'max-age=31536000' // Long cache
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Create an ImageBitmap for faster rendering
      try {
        const bitmap = await createImageBitmap(blob);
        self.postMessage({ path, bitmap }, [bitmap]);
      } catch (e) {
        // If createImageBitmap fails, just send back the path
        self.postMessage({ path });
      }
    } catch (error) {
      self.postMessage({ error: error.message });
    }
  });