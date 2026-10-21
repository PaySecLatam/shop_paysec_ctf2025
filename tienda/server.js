const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const serveIndex = require('serve-index');
const PORT = process.env.PORT || 3000;
const devDir = path.join(__dirname, 'dev');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/dev/', serveIndex(devDir, { icons: false }));
app.use('/dev/', express.static(devDir));



function certValidation(req, res, next) {
  if (req.path !== '/flag') return next();

  const verified = req.headers['x-client-verified'] || '';
  const cn = req.headers['x-client-cn'] || '';
  const issuer = req.headers['x-client-issuer'] || '';

  if (verified !== 'SUCCESS' || !issuer.includes('PaymentCTF-CA')) {
    return res.status(400).send('Certificado no emitido por CA permitida');
  }
  next();
}

app.use(certValidation);

function generateHexSignature(product) {
  const str = `${product.id}:${product.name}:${product.price}`;
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16);
  }
  return hex;
}

const products = [
  { id: 1, name: 'Flipper Zero', price: 1337, img: '/img/flipper.png',
    tagline: "Is a portable multi-tool for pentesters and geeks in a toy-like body. It loves hacking digital stuff, such as radio protocols, access control and more..." },
  { id: 2, name: 'Chameleon Ultra', price: 133.7, img: '/img/chameleon.jpg',
    tagline: "About The new generation chameleon based on NRF52840 makes the performance of card emulation more stable." },
  { id: 3, name: 'Proxmark', price: 13337.13, img: '/img/PM3.png',
    tagline: "Is an RFID swiss-army tool, allowing for both high and low level interactions with the vast majority of RFID tags and systems world-wide." }
];

app.get('/', (req, res) => res.render('index', { products }));

app.get('/product/:id', (req, res) => {
  const product = products.find(p => p.id === Number(req.params.id));
  if (!product) return res.status(404).send('Not found');
  res.render('product', { product });
});


app.post('/purchase', (req, res) => {
  const id = Number(req.body.id);
  const product = products.find(p => p.id === id);
  if (!product) return res.status(404).send('Not found');

  const amount = parseFloat(req.body.amount);
  if (isNaN(amount)) return res.status(400).send('Bad amount');

  const signature = req.body.signature || '';
  const expectedSignature = generateHexSignature(product);

  
  let decoded = '';
  try {
    for (let i = 0; i < signature.length; i += 2) {
      decoded += String.fromCharCode(parseInt(signature.substr(i, 2), 16));
    }
  } catch (e) {
    return res.status(400).send('Invalid signature');
  }

  const parts = decoded.split(':');
  if (parts.length !== 3) return res.status(400).send('Invalid signature');

  const sigPrice = parseFloat(parts[2]);
  if (sigPrice !== amount) {
    return res.status(400).send('<div style="font-family: monospace;background:#a00;color:#fff;padding:20px">' +
      '<h1>Invalid signature</h1></div>');
  }

  if (amount < 0) {
    return res.send('<div style="font-family: monospace;background:#0a0;color:#000;padding:20px">' +
      '<h1>FLAG: FLAG7{negative_checksum_payment_bypass}</h1></div>');
  }

  res.render('success', { product, amount });
});

app.get('/flag', (req, res) => {
  res.send('FLAG8{super_secure_tls_flag}');
});


app.listen(PORT, () => console.log(`CTF listening on ${PORT}`));
