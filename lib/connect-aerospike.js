/*!
 * Connect - Aerospike
 * Copyright(c) 2014 Michael Neil <mneil@mneilsworld.com>
 * MIT Licensed
 */
var aerospike = require('aerospike');
var status = aerospike.status;

var default_port = 3000;
var default_host = '127.0.0.1';
var noop = function(){};

/**
 * One day in seconds.
 */

var ttl = 86400;

/**
 * Return the `RedisStore` extending `express`'s session Store.
 *
 * @param {object} express session
 * @return {Function}
 * @api public
 */

module.exports = function (session) {

  /**
   * Express's session Store.
   */

  var Store = session.Store;

  /**
   * Initialize RedisStore with the given `options`.
   *
   * @param {Object} options
   * @api public
   */

  function AerospikeStore (options) {

    var self = this;

    options = options || {};
    Store.call(this, options);
    this.prefix = options.prefix == null
        ? 'sess:'
        : options.prefix;

    if (options.client) { // use connected client
      this.client = options.client;
    }
    else if (options.hosts) { // cluster connect
      this.client  = aerospike.client({
        hosts: options.hosts // [ { addr: '127.0.0.1', port: 3000 } ]
      });
    }
    else if (options.port || options.host) { // single node w/ defaults
      this.client = aerospike.client({
        hosts : [{
          addr: options.host || default_host,
          port: options.port || default_port
        }]
      });
    }
    else { // default
      this.client = aerospike.client({
        hosts: [ { addr: '127.0.0.1', port: 3000 } ]
      });
    }

    function connect_cb( err, client ) {
      console.log('Connect to aerospike', err, client);
      if (err.code !== status.AEROSPIKE_OK) {
        throw new Error('unable to connect to aerospike cluster')
      }
      self.client = client;
      console.log('connected',client.get);
    }
    console.log('the client', this.client.get);
    this.client.connect(connect_cb);

    this._ns = options.ns || 'store_session';
    this._set = options.set || 'session'; // config.ENV + '-application'


    /*if (options.pass) {
     this.client.auth(options.pass, function (err) {
     if (err) {
     throw err;
     }
     });
     }*/

    this.ttl = options.ttl;
  }

  /**
   * Inherit from `Store`.
   */

  AerospikeStore.prototype.__proto__ = Store.prototype;

  /**
   * Attempt to fetch session by the given `sid`.
   *
   * @param {String} sid
   * @param {Function} fn
   * @api public
   */

  AerospikeStore.prototype.get = function (sid, fn) {
    var store = this;
    var psid = store.prefix + sid;
    if (!fn) fn = noop;

    store.client.get(aerospike.key(store._ns, store._set, psid), function(err, rec, meta) {

      if( err.code !== status.AEROSPIKE_OK ) return fn(err);
      if ( !rec ) return fn();

      fn(undefined, rec);
    });
  };

  /**
   * Commit the given `sess` object associated with the given `sid`.
   *
   * @param {String} sid
   * @param {Session} sess
   * @param {Function} fn
   * @api public
   */

  AerospikeStore.prototype.set = function (sid, sess, fn) {
    var store = this;
    var psid = store.prefix + sid;
    if (!fn) fn = noop;

    var maxAge = sess.cookie.maxAge;
    var metadata = {
      ttl: store.ttl || (typeof maxAge === 'number'
          ? maxAge / 1000 | 0
          : ttl),
      gen: 0
    };

    sess.cookie.httpOnly = sess.cookie.httpOnly ?  1 : 1;
    store.client.put(aerospike.key(store._ns, store._set, psid), sess, metadata, function(err, key) {

      if( err.code !== status.AEROSPIKE_OK ) return fn(err);
      if ( !key ) return fn();

      fn(undefined, key);
    });

  };

  /**
   * Destroy the session associated with the given `sid`.
   *
   * @param {String} sid
   * @api public
   */

  AerospikeStore.prototype.destroy = function (sid, fn) {
    var store = this;
    var psid = store.prefix + sid;
    if (!fn) fn = noop;
    
    this.client.remove(aerospike.key(store._ns, store._set, psid), function(err, res) {

      if( err.code !== status.AEROSPIKE_OK ) return fn(err);
      fn(undefined, res);
    });

  };

  return AerospikeStore;
};