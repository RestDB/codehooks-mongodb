# codehooks-mongodb
A standard [codehooks.io](https://codehooks.io) app can also run as a standalone [express.js](https://expressjs.com) app.
This is a great option to avoid service lock-in or if you just want to run and manage it yourself. This repository is an open source implementation of a [codehooks.io](https://codehooks.io) [MongoDB](https://mongodb.com) datastore. 

## Usage

Consider the standard Codehooks serverless app in the `index.js` file below.

```js
/* index.js
*  A minimal codehooks.io serverless app
*/
import {app, datastore} from 'codehooks-js';
import crudlify from 'codehooks-crudlify-yup';

app.all('/myroute', (req, res) => {
    res.end('Hit me again with any method!')
})
// Add CRUD routes for any collections
crudlify(app);

export default app.init();
```
The codehooks app above can be deployed to the cloud serverless runtime with the `coho deploy` command.

However, the same app can also run as a standalone node.js express app. The trick is to add a separate JavaScript startup file, e.g. `standalone.js`. An example startup file is shown below, adapt it to your needs, express settings, MongoDB connection string, etc.

```js
/* 
* standalone.js
* Example express app for running codehooks apps local
*/
import coho from './index.js';
import mongoStore from 'codehooks-mongodb';
import express from 'express';
import bodyParser from 'body-parser';
const app = express();
import Debug from "debug";
const debug = Debug("codehooks-standalone");

app.use(bodyParser.json({ limit: '10mb' }));

const options = {
    "datastore": new mongoStore(process.env.MONGODB_URI || 'mongodb://localhost:27017')
}

// important, make codehooks use express and MongoDB
coho.app.useExpress(app, options);

app.listen(3000, () => {
    console.log("Running standalone on port 3000")
})
```
Create a `package.json` file for your app. 

```bash
npm install codehooks-js codehooks-crudlify-yup express body-parser mongodb --save
```
This should create something like the following example. To enable JavaScript ES6 you need to set `"type":"module"` manually.
```json
{
  "type": "module",
  "scripts": {
    "start": "node standalone.js"
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

Alternatively you can copy the `package.json` above and install the dependencies with `npm install`.

If you don't have a MongoDB instance already, you you can start a local MongoDB as a docker container.

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Finally, start your serverless node.js app locally with the `npm start` command. It should output the following message.

```bash
> start
> node standalone.js

Running standalone on port 3000
```

Your app is now listening on `http://localhost:3000/dev/myroute` and you can GET, PUT, POST, PATCH and DELETE on any collection route, e.g. `/dev/mycollection`.

> Tip: Read the docs for the open source [Crudlify](https://www.npmjs.com/package/codehooks-crudlify-yup) package which creates a full CRUD REST API for your serverless node.js app.

## Documentation
* [Example code](./examples)
* [Database API](https://codehooks.io/docs/nosql-database-api)
* [App events](https://codehooks.io/docs/appeventapi)
* [Queue workers](https://codehooks.io/docs/queuehooks)
* [CRON job workers](https://codehooks.io/docs/jobhooks)
