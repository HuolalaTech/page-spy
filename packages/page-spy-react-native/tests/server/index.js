const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const data = require('./data.json');
const { Blob } = require('buffer');
const fs = require('fs');
const path = require('path');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header({
    'Access-Control-Allow-Origin': 'http://localhost',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Credentials': true,
  });
  next();
});

app.get('/posts', (req, res) => {
  res.send(data);
});
app.post('/posts', (req, res) => {
  res.send(req.body);
});

app.get('/posts/:id', (_, res) => {
  res.send(data[0]);
});

app.get('/plain-text', (_, res) => {
  res.header({
    'Content-Type': 'text/plain',
  });
  res.send('Hello PageSpy');
});

app.get('/json', (_, res) => {
  res.json({
    name: 'PageSpy',
  });
});

app.get('/html', (_, res) => {
  res.header({
    'Content-Type': 'text/html',
  });
  res.send('<div id="app"><h3>Hello PageSpy</h3></div>');
});

app.get('/blob', (_, res) => {
  const pngFile = path.resolve(__dirname, './favicon.png');
  fs.readFile(pngFile, (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal server error');
      return;
    }

    res.header({
      'Content-Type': 'image/png',
    });
    res.send(data);
  });
});

app.get('/big-file', (_, res) => {
  const pngFile = path.resolve(__dirname, './unsplash.jpeg');
  fs.readFile(pngFile, (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal server error');
      return;
    }

    res.header({
      'Content-Type': 'image/jpg',
    });
    res.send(data);
  });
});

const startServer = (port = 6677) => {
  const server = app.listen(port, () => {
    console.log(`Test server is RUNNING at http://localhost:${port}`);
  });
  server.unref();
  return () => {
    server.close((err) => {});
  };
};

module.exports = startServer;

// const server = app.listen(6677, () => {
//   console.log('Test server is RUNNING at http://localhost:6677');
// });
