# Connect Aerospike

connect-aerospike is an Aerospike session store backed by [aerospike-client-nodejs](https://github.com/aerospike/aerospike-client-nodejs).

## Installation

    $ npm install connect-aerospike

### A note for Express 3.x users

Use [`express-session`](https://github.com/expressjs/session) instead of the default connect `session` middleware.

    $ npm install express-session

## Options

  An Aerospike client is required.  An existing client can be passed directly using the `client` param or make a new one with hosts or host/port.
  - `client` A configured, but not connected, aerospike client
  - `hosts` A list of Aerospike server [{addr:'127.0.0.1',port:3000}]
  - `host` A single Aerospike host (def: 127.0.0.1)
  - `port` A single Aerospike port for the host (def: 3000)

The following additional params may be included:

  - `ttl` Aerospike session TTL (expiration) in seconds (def: 86400)
  - `ns` Namespace to use (def: store_session)
  - `set` Set to use (def: session)
  - `prefix` Key prefix defaulting to "sess:"

## Usage

Pass the `express-session` store into `connect-aerospike` to create a `AerospikeStore` constructor.

    var session = require('express-session');
    var RedisStore = require('connect-aerospike')(session);

    app.use(session({
        store: new AerospikeStore(options),
        secret: 'keyboard cat'
    }));

# License

  MIT
