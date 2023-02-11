import {app, datastore} from 'codehooks-js'
import crudlify from 'codehooks-crudlify-yup';

app.all('/myroute', (req, res) => {
    res.end('All of me')
})

// Add CRUD routes for collections (customer and product) with yup schema
crudlify(app);


// Finally bind to serverless runtime
export default app.init();