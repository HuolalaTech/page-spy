const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const data = require('./data.json');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extend: true }));
app.use((req, res, next) => {
  res.header({
    'Access-Control-Allow-Origin': 'http://localhost',
    'Access-Control-Allow-Credentials': true,
    'Content-Type': 'application/json',
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

try {
  app.listen(6677, () => {
    console.log('Test server is RUNNING at http://localhost:6677');
  });
} catch (e) {
  console.log(`Test server start failed. \n${e.message}`);
}
