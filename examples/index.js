// index.js - minimal codehooks.io serverless app
import {app, datastore} from 'codehooks-js';
import crudlify from 'codehooks-crudlify-yup';

app.all('/myroute', (req, res) => {
    res.end('Hit me again with any method!')
})
// Add CRUD routes for any collections
crudlify(app);

export default app.init();

// express setup
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