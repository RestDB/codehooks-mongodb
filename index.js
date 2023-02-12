import { MongoClient, ObjectId } from 'mongodb';
import { EventEmitter as emitter } from "events";
import Debug from "debug";
const debug = Debug("codehooks-mongodb");

/*
* Codehooks Datastore adapter for MongoDB
*/

// Stream data emitter
class dataEmitter extends emitter {
    response = null;
    constructor() {
        super();
    }
    pipe = (res) => {
        this.response = res;
        res.set('Content-Type', 'application/json');
        res.write('[\n');
        return this;
    }
    json = (res) => {
        this.response = res;
        return this.pipe(res);
    }
    getPipe = () => {
        return this.response;
    }
}

// Adapter class implementation
export default class mongoStore {
    #connstr = null;
    #client = null;
    #db = null;
    #queueCallback = {};

    constructor(connstr) {
        debug("Connstr", connstr);
        this.#connstr = connstr || 'mongodb://localhost:27017';
    }
    // connect to mongodb
    connect = async () => {
        this.#client = new MongoClient(this.#connstr);
        await this.#client.connect();
        debug('Connected successfully to mongodb');
        this.#db = this.#client.db('coho:dev');
        try {
            await this.#db.createCollection("sysqueue", { capped: true, size: 1024 * 1024/*, max : 1000*/ })
        } catch (error) {
            debug(error.message)
        }
        try {
            await this.#db.createCollection("syskeyvaldata")
        } catch (error) {
            debug(error.message)
        }
        this.#listenQueue();
        return;
    }


    getOne = (collname, ID) => {
        return new Promise(async (resolve, reject) => {
            try {
                debug('getOne', collname, ID)
                const collection = this.#db.collection(collname);
                const options = {};
                const data = await collection.findOne({ _id: new ObjectId(ID) }, options);

                if (data === null) {
                    throw Error('Not found');
                }
                resolve(data);
            } catch (ex) {
                console.error(ex);
                reject(ex.message);
            }
        })
    }

    getMany = (collname, options = {}) => {
        const ee = new emitter();
        const e = new dataEmitter();

        try {

            let sep = ' ';
            ee.on('data', (rec) => {
                let pipe = e.getPipe();
                if (pipe) {
                    pipe.write(sep)
                    pipe.write(JSON.stringify(rec));
                    if (sep === ' ') {
                        sep = ',\n';
                    }
                } else {
                    e.emit('data', rec);
                }
            });
            ee.on('error', (err) => {
                let pipe = e.getPipe();
                if (pipe) {
                    pipe.error.error(err);
                    pipe.write(`{"error": "${err.toString()}"}`);
                    pipe.status(500).end();
                } else {
                    e.emit('error', err);
                }
            });
            ee.on('end', () => {
                debug("ee end")
                let pipe = e.getPipe();
                if (pipe) {
                    pipe.write('\n]');
                    pipe.end();
                } else {
                    e.emit('end');
                }
            });
            setTimeout(async () => {// DB stuff
                const collection = this.#db.collection(collname);
                const query = options.filter || {};
                const hints = options.hints || {};
                const cursor = collection.find(query, hints);
                debug("cursor start")
                await cursor.forEach((data) => {
                    ee.emit('data', data);
                });
                debug("cursor end")
                ee.emit('end');
            }, 1);

        } catch (ex) {
            console.error('getDocuments error:', ex.message)
        }
        debug("emitter", e)
        return e;

    }

    // alias
    find = this.getMany;

    // find as array (ram)
    findAsArray = (collname, options = {}) => {
        return new Promise((resolve, reject) => {
            const arr = new Array();

            const instream = this.getMany(collname, options);
            debug("finsAsArray", collname, options)
            instream.on('data', (rec) => {
                debug("data", rec)
                arr.push(rec);
            });
            instream.on('error', (e) => {
                reject(e);
            });
            instream.on('end', () => {
                resolve(arr)
            });
        });
    }

    // insert new
    insertOne = (collname, data) => {
        return new Promise(async (resolve, reject) => {
            debug('insertOne', collname, data)
            try {
                const col = this.#db.collection(collname)
                if (Array.isArray(data)) {
                    const result = await col.insertMany(data)
                    resolve(result.insertedCount)
                } else {
                    const result = await col.insertOne(data)
                    //resolve(result.insertedId)
                    data._id = result.insertedId;
                    resolve(data)
                }
            } catch (error) {
                reject(error)
            }
        })
    }

    // update by ID
    updateOne = (collname, ID, document, options = {}) => {
        debug("UPDATE 1")
        return new Promise(async (resolve, reject) => {
            try {
                debug('updateOne', collname, ID, document, options);
                const collection = this.#db.collection(collname);
                if (!document['$set']) {
                    document = { $set: document };
                }
                const result = await collection.updateOne({ _id: new ObjectId(ID) }, document, options);
                debug('result', result)
                // fetch updated record and return
                resolve(await this.getOne(collname, ID));
            } catch (ex) {
                reject(ex.message)
            }
        });
    }

    // replace by ID
    replaceOne = (collname, ID, document, options = {}) => {
        debug("REPLACE 1")
        return new Promise(async (resolve, reject) => {
            try {
                debug('replaceOne', collname, ID, document, options);
                const collection = this.#db.collection(collname);
                const result = await collection.replaceOne({ _id: new ObjectId(ID) }, document, options);
                debug('result', result)
                // fetch updated record and return
                resolve(await this.getOne(collname, ID));
            } catch (ex) {
                reject(ex.message)
            }
        });
    }
    // update many by query
    updateMany = (collname, document, options = {}) => {
        return new Promise(async (resolve, reject) => {
            try {
                debug('updateMany', collname, document, options);
                const collection = this.#db.collection(collname);
                const filter = options.filter;
                if (!filter) throw Error("Missing query filter")
                if (!document['$set']) {
                    document = { $set: document };
                }
                const result = await collection.updateMany(filter, document);
                // return count  
                resolve({ count: result.modifiedCount });
            } catch (ex) {
                reject(ex.message);
            }
        });
    }
    // replace many by query
    replaceMany = (collname, document, options = {}) => {
        return new Promise((resolve, reject) => {
            reject('replaceMany is not supported in the MongoDB adapter')
        });
    }

    // remove one
    removeOne = (collname, ID, options = {}) => {
        return new Promise(async (resolve, reject) => {
            try {
                debug('removeOne', collname, ID, options);
                const collection = this.#db.collection(collname);
                const result = await collection.deleteOne({ _id: new ObjectId(ID) }, options);
                debug(result);
                resolve(ID);
            } catch (ex) {
                reject(ex.message);
            }
        });
    }

    // remove many by query
    removeMany = (collname, options = {}) => {
        return new Promise(async (resolve, reject) => {
            try {
                debug('removeMany', collname, options);
                const collection = this.#db.collection(collname);
                const filter = options.filter;
                if (!filter) throw Error("Missing query filter")
                const result = await collection.deleteMany(filter);
                // return count  
                resolve({ count: result.deletedCount });
            } catch (ex) {
                reject(ex.message);
            }
        });
    }

    // process queue items for workers
    #listenQueue = async () => {
        try {
            const collection = this.#db.collection('sysqueue');
            await collection.insertOne({ "dummy": "seed", processed: true });
            const cursor = collection.find({ processed: false }, { tailable: true, awaitdata: true }),
                cursorStream = cursor.stream()
            cursorStream.on('data', async (data) => {
                try {
                    debug('Queue tail', data);
                    const { payload } = data;
                    await this.updateOne('sysqueue', data._id, { $set: { processed: true } })
                    if (this.#queueCallback[data.topic] && this.#queueCallback[data.topic][0]) {
                        this.#queueCallback[data.topic][0]({ body: { payload } }, {
                            end: () => {
                                debug('Q end')
                            }
                        })
                    } else {
                        console.log('Missing queue topic for:', data.topic)
                    }
                } catch (error) {
                    console.error("Queue tail error:", error)
                }
            });
        } catch (error) {
            console.error(error)
        }
    }

    // send queue item to worker function
    enqueue = async (topic, payload) => {
        //debug('enqueue', topic, payload)
        try {
            const collection = this.#db.collection('sysqueue');
            const result = await collection.insertOne({ topic, payload, processed: false });
            return result.insertedId;
        } catch (error) {
            console.error(error)
        }
    }
    // enqueue all items from query
    enqueueFromQuery = (collname, query = {}, topic = 'NO-TOPIC', options = {}) => {
        return new Promise(async (resolve, reject) => {
            try {                
                throw Error('Not implemented yet')
            } catch (error) {
                console.error(error)
                reject(error.message);
            }
        });
    }

    // helper to set callback worker function
    setQueue = (topic, q) => {
        debug('setQueue', topic, q)
        this.#queueCallback[topic] = q;
    }

    // key value set
    set = (key, value, options = {}) => {
        return new Promise(async (resolve, reject) => {
            try {
                const collection = this.#db.collection('syskeyvaldata');
                const keyspace = options.keyspace || 'default_keyspace';
                const result = await collection.updateOne({key, keyspace}, {$set: {key, value}}, { upsert: true });
                debug("set result", result)
                resolve(result);
            } catch (error) {
                console.error(error)
                reject(error.message);
            }
        });
    }
    // key value get
    get = (key, options={}) => {
        return new Promise(async (resolve, reject) => {
            try {
                const keyspace = options.keyspace || 'default_keyspace';
                const filter = {key, keyspace};
                const result = await this.findAsArray('syskeyvaldata', {filter});
                if (result.length === 0) {
                    debug(key+' is not found')
                    return resolve(null)
                }
                resolve(result);
            } catch (error) {
                console.error(error)
                reject(error.message);
            }
        });
    }

    // key value del
    del = (key, options={}) => {
        return new Promise(async (resolve, reject) => {
            try {
                const keyspace = options.keyspace || 'default_keyspace';
                const result = await this.removeMany('syskeyvaldata', {filter: {key, keyspace}})
                resolve(result);
            } catch (error) {
                console.error(error)
                reject(error.message);
            }
        });
    }

    // key value get all by prefix
    getAll = (key, options={}) => {
        return new Promise(async (resolve, reject) => {
            try {
                const keyspace = options.keyspace || 'default_keyspace';
                throw Error('Not implemented yet')
            } catch (error) {
                console.error(error)
                reject(error.message);
            }
        });
    }

    // key value del all by prefix
    delAll = (key, options={}) => {
        return new Promise(async (resolve, reject) => {
            try {
                const keyspace = options.keyspace || 'default_keyspace';
                throw Error('Not implemented yet')
            } catch (error) {
                console.error(error)
                reject(error.message);
            }
        });
    }

    // key value increment value
    incr = (key, num=1, options={}) => {
        return new Promise(async (resolve, reject) => {
            try {
                num = parseInt(num);
                const collection = this.#db.collection('syskeyvaldata');
                const keyspace = options.keyspace || 'default_keyspace';
                const result = await collection.updateOne({key, keyspace}, {$inc: {value: num}}, { upsert: true });
                debug("incr result", result)
                resolve(await this.get(key, options));
            } catch (error) {
                console.error(error)
                reject(error.message);
            }
        });
    }

    // key value decrement value
    decr = (key, num=1, options={}) => {
        return this.incr(key, num * -1, options)
    }
}