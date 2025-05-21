const axios = require('axios');

module.exports = async (req, res) => {
  // Parsing URL dan path
  const { url, pathname } = (() => {
    try {
      const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
      return {
        url: parsedUrl.searchParams.get('url'),
        pathname: parsedUrl.pathname
      };
    } catch {
      return { url: null, pathname: req.url };
    }
  })();

  // Halaman utama dengan input URL
  if (pathname === '/' || pathname === '/api' || pathname === '/api/') {
    const script = `<script>
      const url = prompt('Masukkan URL gambar:') || 'https://remove.bg/example.jpg';
      if (url) location.href = '/api/proxy?url=' + encodeURIComponent(url);
    </script>`;
    res.setHeader('Content-Type', 'text/html');
    return res.end(script);
  }

  // Proxy gambar
  if (pathname === '/api/proxy') {
    if (!url) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Parameter ?url= harus diisi' }));
    }

    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const contentType = response.headers['content-type'];

      if (!contentType.startsWith('image')) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'URL bukan gambar' }));
      }

      res.setHeader('Content-Type', contentType);
      return res.end(response.data);
    } catch (err) {
      console.error('Proxy Error:', err.message);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Gagal mengambil gambar', detail: err.message }));
    }
  }

  // 404 jika endpoint tidak ditemukan
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain');
  return res.end('Not Found');
};
