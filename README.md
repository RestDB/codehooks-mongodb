# codehooks-mongodb
A MongoDB implementation of a Codehooks datastore.

## Usage

A standard [codehooks.io](https://codehooks.io) app can also run as a standalone [express.js](https://expressjs.com) app.

Consider the standard Codehooks serverless app below in the `index.js` file.

```js
// Part 1: standard codehooks.io serverless app
import {app, datastore} from 'codehooks-js';
import crudlify from 'codehooks-crudlify-yup';

app.all('/myroute', (req, res) => {
    res.end('Hit me again with any method!')
})
// Add CRUD routes for any collections
crudlify(app);

export default app.init();
```

Run as a standalone express app by adding the following code to your `index.js` file.

```js
...
// Part 2: for running it as a standalone express app
import mongoStore from 'codehooks-mongodb';
import express from 'express';
import bodyParser from 'body-parser';
const expressapp = express();

expressapp.use(bodyParser.json({ limit: '10mb' }));

const options = {
    "datastore": new mongoStore(process.env.MONGODB_URI || 'mongodb://localhost:27017')
}
// apply codehooks routes as express route
app.useExpress(expressapp, options);

// start express
expressapp.listen(3000, () => {
    console.log("Running standalone")
})
```
Create a `package.json` file where type is module.

```json
{
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "body-parser": "^1.20.1",
    "codehooks-crudlify-yup": "^1.0.2",
    "codehooks-js": "^1.0.1",
    "express": "^4.18.2",
    "mongodb": "^5.0.0"
  }
}
```

Install dependencies with `npm install`.

For testing you can start a local MongoDB docker container.
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Start your app with `npm start` and you should see.

```bash
> start
> node index.js

Running standalone
```

Your app is now listening on `http://localhost:3000/dev/myroute`.

> Tip: The (Crudlify)[https://www.npmjs.com/package/codehooks-crudlify-yup] package creates a full CRUD REST API for your app.
