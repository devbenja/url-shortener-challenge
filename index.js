const express = require('express');
const cors = require('cors');
const app = express();

const dns = require('dns');
const url = require('url');

// Estructura en memoria para almacenar las URLs
let urlDatabase = [];
let urlCounter = 1;

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(express.json()); // Para solicitudes con JSON
app.use(express.urlencoded({ extended: true })); // Para datos de formularios


app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

const validateUrl = (req, res, next) => {
  const { url: inputUrl } = req.body;

  // Verificar que la URL tenga el formato correcto
  const parsedUrl = url.parse(inputUrl);

  if (!parsedUrl.protocol || !parsedUrl.hostname) {
    return res.json({ error: 'invalid url' });
  }

  // Usar dns.lookup para verificar la existencia del dominio
  dns.lookup(parsedUrl.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }
    // Si el dominio existe, continua con el siguiente middleware o ruta
    next();
  });
};

// POST: Acorta una URL
app.post('/api/shorturl', validateUrl, (req, res) => {

  const original_url = req.body.url;

  // Verificar si la URL ya está acortada
  const existingUrl = urlDatabase.find((entry) => entry.original_url === original_url);
  if (existingUrl) {
    return res.json({
      original_url: existingUrl.original_url,
      short_url: existingUrl.short_url,
    });
  }

  // Agregar la nueva URL a la base temporal
  const short_url = urlCounter++;
  urlDatabase.push({ original_url, short_url });

  return res.json({
    original_url,
    short_url,
  });

 
  
});

// GET: Redirige desde una short_url a la URL original
app.get('/api/shorturl/:short_url', (req, res) => {
  const short_url = parseInt(req.params.short_url);

  // Buscar la URL original en la "base de datos" temporal
  const urlEntry = urlDatabase.find((entry) => entry.short_url === short_url);

  if (!urlEntry) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  // Redirigir a la URL original
  res.redirect(urlEntry.original_url);
});


app.listen(3000, function () {
  console.log(`Listening on port`, 3000);
});
