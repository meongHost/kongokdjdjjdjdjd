const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { url } = req.query;

    if (req.url === '/' || req.url === '/api' || req.url === '/api/') {
      const script = `<script>
        const url = prompt('Masukkan image URL:') || 'https://remove.bg/example.jpg';
        location.href = '/api?url=' + encodeURIComponent(url);
      </script>`;
      res.setHeader('Content-Type', 'text/html');
      return res.end(script);
    }

    if (!url) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'URL param is required' }));
    }

    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const contentType = response.headers['content-type'];

    if (!contentType.startsWith('image')) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Provided URL is not an image' }));
    }

    res.setHeader('Content-Type', contentType);
    return res.end(response.data);
  } catch (err) {
    console.error('Function error:', err.message);
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
};const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { url } = req.query;

    if (req.url === '/' || req.url === '/api' || req.url === '/api/') {
      const script = `<script>
        const url = prompt('Masukkan image URL:') || 'https://remove.bg/example.jpg';
        location.href = '/api?url=' + encodeURIComponent(url);
      </script>`;
      res.setHeader('Content-Type', 'text/html');
      return res.end(script);
    }

    if (!url) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'URL param is required' }));
    }

    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const contentType = response.headers['content-type'];

    if (!contentType.startsWith('image')) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Provided URL is not an image' }));
    }

    res.setHeader('Content-Type', contentType);
    return res.end(response.data);
  } catch (err) {
    console.error('Function error:', err.message);
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
};
