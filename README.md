# codehooks-mongodb
A standard codehooks.io app can also run as a standalone [express.js](https://expressjs.com) app.
This repository is an open source implementation of a [codehooks.io](https://codehooks.io) MongoDB datastore. A great option to avoid service lock-in or if you just want to run and manage it yourself.

## Usage

Consider the standard Codehooks serverless app in the `index.js` file below.

```js
// index.js - minimal codehooks.io serverless app
import {app, datastore} from 'codehooks-js';
import crudlify from 'codehooks-crudlify-yup';

app.all('/myroute', (req, res) => {
    res.end('Hit me again with any method!')
})
// Add CRUD routes for any collections
crudlify(app);

export default app.init();

// add code snippet below to run as a standard express app
```
The above app can be deployed to the cloud serverless runtime with the `coho deploy` command.

However, that same app can also run as a standalone express app by adding the following code snippet to your `index.js` file.

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
Create a `package.json` file for your app. 

```bash
npm install codehooks-js codehooks-crudlify-yup express body-parser mongodb --save
```
This should create something like the following example. To enable JavaScript ES6 you need to set `"type": "module"` manually.
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

Alternatively you can copy the package.json above and install the dependencies with `npm install`.

If you don't have a MongoDB instance already, you you can start a local MongoDB as a docker container.

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Finally, start your serverless node.js app locally with the `npm start` command. It should output the following message.

```bash
> start
> node index.js

Running standalone
```

Your app is now listening on `http://localhost:3000/dev/myroute` and you can GET, PUT, POST, PATCH and DELETE on any collection route, e.g. `/dev/mycollection`.

> Tip: Read the docs for the open source [Crudlify](https://www.npmjs.com/package/codehooks-crudlify-yup) package which creates a full CRUD REST API for your serverless node.js app.

## Documentation
* [Database API](https://codehooks.io/docs/nosql-database-api)
* [App events](https://codehooks.io/docs/appeventapi)
* [Queue workers](https://codehooks.io/docs/queuehooks)
* [CRON job workers](https://codehooks.io/docs/jobhooks)
