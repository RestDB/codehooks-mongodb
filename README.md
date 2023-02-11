# codehooks-mongodb
A MongoDB implementation of a Codehooks datastore.

## Usage

A standard [codehooks.io](https://codehooks.io) (comment Part 1) app can also run as a standalone [express.js](https://expressjs.com) app.

To deploy to the Codehooks cloud just remove the Part 2 code.


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

// Part 2: for running it as a standalone express app
import mongoStore from 'codehooks-mongodb';
import express from 'express';
import bodyParser from 'body-parser';
const expressapp = express();

expressapp.use(bodyParser.json({ limit: '10mb' }));

const options = {
    "datastore": new mongoStore(process.env.MONGODB_URI || 'mongodb://localhost:27017')
}

app.useExpress(expressapp, options);
expressapp.listen(3000, () => {
    console.log("Running standalone")
})
```

The (Crudlify)[https://www.npmjs.com/package/codehooks-crudlify-yup] package create a full CRUD REST API for your app.
