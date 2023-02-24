import {app, datastore} from 'codehooks-js'
import crudlify from 'codehooks-crudlify-yup';

app.all('/myroute', (req, res) => {
    res.end('All of me')
})

// Add CRUD routes for any collection
crudlify(app);


// Finally bind to serverless runtime
export default app.init();