"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const path_to_regexp_1 = __importDefault(require("path-to-regexp"));
class Router {
    constructor(errorMessage = 'not found') {
        /*
         *  Using Object.assign(this, { errorMessage }) makes tslint cry, use the good ol' this * keyword method.
         *
         *  Also applies when you're creating methods dynamically, eg:
         *
         *  for (const method of HTTPMethods) {
         *    this[method] = this.wrapMethod({})
         *  }
         */
        const RouterProxyHandler = {
            /*
             * Here we are manipulating the way that we get the properties from the router object
             * This get trap compares if the property that we are trying to access exists with a uppercase name
             * If exists with a uppercase name, that means that is a HTTP method, and we should return a handler for that method
             */
            get(target, prop, a) {
                if (typeof prop === 'string' && prop !== prop.toUpperCase()) {
                    const method = prop.toUpperCase();
                    const keys = Object.keys(target);
                    /**
                     * @private
                     * @function methodCall
                     * @param {string} URL the URL to handle
                     * @param {Function} callback the URL handler
                     */
                    function methodCall(URL, callback) {
                        // checks the types of the input parameters
                        if (!(callback instanceof Function)) {
                            throw new TypeError(`callback expected a string but got ${callback}`);
                        }
                        if (callback.length < 2) {
                            throw new Error(`callback function needs to have 2 arguments but has ${callback.length}`);
                        }
                        this.router.__registerHTTPRequestHandler(this.method, URL, callback);
                    }
                    if (keys.includes(method)) {
                        return methodCall.bind({ router: target, method });
                    }
                    else {
                        return Reflect.get(target, prop);
                    }
                }
                else {
                    return Reflect.get(target, prop);
                }
            }
        };
        this.errorMessage = errorMessage;
        //declaring method stores
        this.DELETE = this.wrapMethod({});
        this.GET = this.wrapMethod({});
        this.PATCH = this.wrapMethod({});
        this.POST = this.wrapMethod({});
        this.PUT = this.wrapMethod({});
        return new Proxy(Object.freeze(this), RouterProxyHandler);
    }
    /**
     * @private
     * @method createHandler
     * @description Creates a ProxyHandler object
     */
    createHandler() {
        const { errorMessage } = this;
        const handler = {
            get(target, propertyName) {
                // checks if the object has the required property, all the properties of the input object should have ONLY HANDLERS
                if (target.hasOwnProperty(propertyName)) {
                    // if has the property, returns the property
                    return Reflect.get(target, propertyName);
                }
                else {
                    //if the property doesn't exist, returns a handler that sends a 404 to the client
                    return (req, res) => {
                        if (!req || !res) {
                            throw new Error('req or res is not defined');
                        }
                        res.statusCode = 404; // set the status
                        res.end(errorMessage); // send content and end stream
                    };
                }
            }
        };
        return handler;
    }
    /**
     * @private
     * @method wrapMethod
     * @param {Object} obj Object containing all the route handlers
     * @description Takes an object and wraps it arround a Proxy that ensures a response even if the handler is not found
     */
    wrapMethod(obj) {
        return new Proxy(obj, this.createHandler());
    }
    /**
     * @private
     * @method handleHTTPMethod
     * @param {string} method the HTTP method of the request
     * @param {string} URL the URL to handle
     * @param {function} callback the request handler
     */
    __registerHTTPRequestHandler(method, URL, callback) {
        // checks the types of the input parameters
        if (typeof method !== 'string') {
            throw new TypeError(`method expected a string but got ${typeof method}`);
        }
        if (typeof URL !== 'string') {
            throw new TypeError(`URL expected a string but got ${typeof URL}`);
        }
        // adding a / for safety
        if (!URL.startsWith('/'))
            URL = '/' + URL;
        const MethodStore = this[method.toUpperCase()];
        const valid = /\w+:(\/?\/?)[^\s]+/;
        if (!valid.test(URL)) {
            throw new Error('the url is not valid');
        }
        // create a regexp pattern source and use it as an object key
        const URLRegexp = path_to_regexp_1.default(URL).source;
        // i don't know if i'm very clever or very stupid for storing values inside a function and treating it as any object
        callback.url = URL;
        // registering callback
        MethodStore[URLRegexp] = callback;
    }
    /**
     * @static
     * @method use
     * @description this method allow us to handle all our requests with a specific router
     * @param router - the router object that we want to use
     * @param request - the request from the client
     * @param response - the server response
     */
    static use(router, request, response) {
        const RegExpSources = Object.keys(router[request.method]);
        /**
         * @private
         * @function handler
         * @param {string} match - uses this value as an index for accessing the handler
         */
        function handler(match) {
            // cb references the handler
            const cb = router[request.method][match];
            // url is the URL that we set at the method __registerHTTPRequestHandler
            const { url } = cb;
            // here we extract the params of the url
            const params = getParams(url);
            // and here we set the params inside the request object
            request.params = params;
            //then, we call the handler
            cb(request, response);
        }
        /**
         * @private
         * @function getParams
         * @param url the url that this function will use to parse the params
         */
        function getParams(url) {
            if (url) {
                // here we extract the values from the request
                const values = path_to_regexp_1.default(url).exec(request.url);
                // and here the info of the path
                const names = path_to_regexp_1.default.parse(url);
                const params = {};
                if (values && values.length > 1) {
                    // we are mapping the values here
                    for (let i = 1; i < values.length; i++) {
                        const value = values[i];
                        const name = names[i].name;
                        params[name] = value;
                    }
                }
                return params;
            }
        }
        // here we check if the request has an available handler
        for (let i = 0; i < RegExpSources.length; i++) {
            let r = new RegExp(RegExpSources[i]);
            const itsAMatch = r.test(request.url);
            if (itsAMatch) {
                let match = RegExpSources[i];
                handler(match);
                return;
            }
        }
        // if there's not any handler, we pass an empty string, that will return a not found error to the client
        handler('');
        return;
    }
}
module.exports = Router;
