# Rauter

![GitHub Logo](https://img.shields.io/snyk/vulnerabilities/npm/rauter@latest.svg) ![GitHub Logo](https://img.shields.io/npm/v/rauter.svg) [![Build Status](https://travis-ci.org/leonelv/rauter.svg?branch=master)](https://travis-ci.org/leonelv/rauter)

Rauter is an experimental router library written in Typescript, for any framework based in the Node.js's HTTP library, comes with a params parser by default.

I've built this as a workaround for handling nested routes inside firebase functions.

## Installation

With npm:

```bash
$ npm i rauter
```

With yarn:

```bash
$ yarn add rauter
```

## Example

### With HTTP from Node.js

```javascript
const http = require('http')
const Rauter = require('rauter')
const port = 3000

const router = new Rauter('url not found')

router.get('/', (req, res) => {
  res.end('hello')
})

router.get('/hello/:name', (req, res) => {
  res.end(`hello ${req.params.id}`)
})

const requestHandler = (request, response) => {
  Rauter.use(router, request, response)
}

const server = http.createServer(requestHandler)

server.listen(port, err => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})
```

### With Firebase Cloud Functions

```javascript
const functions = require('firebase-functions')
const Rauter = require('rauter')

const router = new Rauter()

router.get('/', (req, res) => {
  res.send('hello world')
})

router.get('/greetings/:name', (req, res) => {
  res.send(`hello ${req.params.name}`)
})

exports.functionName = functions.https.onRequest((req, res) => {
  Rauter.use(router, req, res)
})
```

## TODO

- [ ] Write tests
- [ ] Make a middleware interface
- [ ] Use with app.use in koa, express and similar.
