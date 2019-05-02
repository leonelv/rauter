# Rauter

![GitHub Logo](https://img.shields.io/snyk/vulnerabilities/npm/rauter@latest.svg) ![GitHub Logo](https://img.shields.io/npm/v/rauter.svg)

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

## TODO

- [ ] Write tests
- [ ] Make a middleware interface
- [ ] Use with app.use in koa, express and similar.