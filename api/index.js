const axios = require('axios');

module.exports = async (req, res) => {
  // Parsing URL dan query param
  const { url, pathname } = (() => {
    try {
      const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
      return { url: parsedUrl.searchParams.get('url'), pathname: parsedUrl.pathname };
    } catch {
      return { url: null, pathname: req.url };
    }
  })();

  if (pathname === '/' || pathname === '/api' || pathname === '/api/') {
    // Halaman utama: prompt input URL gambar
    const script = `<script>
      const url = prompt('Masukkan image URL:') || 'https://remove.bg/example.jpg';
      location.href = '/api/proxy?url=' + encodeURIComponent(url);
    </script>`;
    res.setHeader('Content-Type', 'text/html');
    return res.end(script);
  }

  if (pathname === '/api/proxy') {
    if (!url) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'URL param is required' }));
    }

    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const contentType = response.headers['content-type'];

      if (!contentType.startsWith('image')) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Provided URL is not an image' }));
      }

      res.setHeader('Content-Type', contentType);
      return res.end(response.data);
    } catch (error) {
      console.error(error.message);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Failed to fetch or process the image' }));
    }
  }

  // Jika route tidak dikenali
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain');
  return res.end('Not Found');
};
