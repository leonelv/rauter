import pathToRegexp from 'path-to-regexp'
import { ClientRequest, ServerResponse } from 'http'

class Router {
  errorMessage: string
  DELETE: RequestHandlerContainer
  GET: RequestHandlerContainer
  PATCH: RequestHandlerContainer
  POST: RequestHandlerContainer
  PUT: RequestHandlerContainer
  [key: string]: any
  constructor(errorMessage: string = 'not found') {
    /*
     *  Using Object.assign(this, { errorMessage }) makes tslint cry, use the good ol' this * keyword method.
     *
     *  Also applies when you're creating methods dynamically, eg:
     *
     *  for (const method of HTTPMethods) {
     *    this[method] = this.wrapMethod({})
     *  }
     */

    const RouterProxyHandler: ProxyHandler<any> = {
      /*
       * Here we are manipulating the way that we get the properties from the router object
       * This get trap compares if the property that we are trying to access exists with a uppercase name
       * If exists with a uppercase name, that means that is a HTTP method, and we should return a handler for that method
       */
      get(target: any, prop: string, a: string) {
        if (typeof prop === 'string' && prop !== prop.toUpperCase()) {
          const method: HTTPMethod = prop.toUpperCase() as HTTPMethod
          const keys = Object.keys(target)

          /**
           * @private
           * @function methodCall
           * @param {string} URL the URL to handle
           * @param {Function} callback the URL handler
           */

          function methodCall(this: MethodCallContext, URL: string, callback: CallbackFunction): void {
            // checks the types of the input parameters
            if (!(callback instanceof Function)) {
              throw new TypeError(`callback expected a string but got ${callback}`)
            }

            if (callback.length < 2) {
              throw new Error(`callback function needs to have 2 arguments but has ${callback.length}`)
            }

            this.router.__registerHTTPRequestHandler(this.method, URL, callback)
          }

          if (keys.includes(method)) {
            return methodCall.bind({ router: target, method })
          } else {
            return Reflect.get(target, prop)
          }
        } else {
          return Reflect.get(target, prop)
        }
      }
    }

    this.errorMessage = errorMessage

    //declaring method stores
    this.DELETE = this.wrapMethod({})
    this.GET = this.wrapMethod({})
    this.PATCH = this.wrapMethod({})
    this.POST = this.wrapMethod({})
    this.PUT = this.wrapMethod({})

    return (new Proxy(Object.freeze(this), RouterProxyHandler) as unknown) as Router
  }

  /**
   * @private
   * @method createHandler
   * @description Creates a ProxyHandler object
   */

  private createHandler(): ProxyHandler<any> {
    const { errorMessage } = this
    const handler: ProxyHandler<any> = {
      get(target, propertyName) {
        // checks if the object has the required property, all the properties of the input object should have ONLY HANDLERS
        if (target.hasOwnProperty(propertyName)) {
          // if has the property, returns the property
          return Reflect.get(target, propertyName)
        } else {
          //if the property doesn't exist, returns a handler that sends a 404 to the client
          return (req: ClientRequest, res: ServerResponse) => {
            res.statusCode = 404 // set the status
            res.end(errorMessage) // send content and end stream
          }
        }
      }
    }
    return handler
  }

  /**
   * @private
   * @method wrapMethod
   * @param {Object} obj Object containing all the route handlers
   * @description Takes an object and wraps it arround a Proxy that ensures a response even if the handler is not found
   */

  private wrapMethod(obj: any): any {
    return new Proxy(obj, this.createHandler())
  }

  /**
   * @private
   * @method handleHTTPMethod
   * @param {string} method the HTTP method of the request
   * @param {string} URL the URL to handle
   * @param {function} callback the request handler
   */

  __registerHTTPRequestHandler(method: HTTPMethod | string, URL: string, callback: CallbackFunction) {
    // checks the types of the input parameters
    if (typeof method !== 'string') {
      throw new TypeError(`method expected a string but got ${typeof method}`)
    }

    if (typeof URL !== 'string') {
      throw new TypeError(`URL expected a string but got ${URL}`)
    }

    // adding a / for safety
    if (!URL.startsWith('/')) URL = '/' + URL

    const MethodStore = (this[method.toUpperCase()] as unknown) as any

    // create a regexp pattern source and use it as an object key
    const URLRegexp: string = pathToRegexp(URL).source
    // i don't know if i'm very clever or very stupid for storing values inside a function and treating it as any object
    callback.url = URL
    // registering callback
    MethodStore[URLRegexp] = callback
  }

  /**
   * @static
   * @method use
   * @description this method allow us to handle all our requests with a specific router
   * @param router - the router object that we want to use
   * @param request - the request from the client
   * @param response - the server response
   */
  static use(router: Router, request: IncomingMessage, response: ServerResponse): void {
    const RegExpSources = Object.keys(router[request.method as string])

    /**
     * @private
     * @function handler
     * @param {string} match - uses this value as an index for accessing the handler
     */
    function handler(match: string): void {
      // cb references the handler
      const cb = router[request.method as string][match]
      // url is the URL that we set at the method __registerHTTPRequestHandler
      const { url } = cb
      // here we extract the params of the url
      const params = getParams(url)
      // and here we set the params inside the request object
      request.params = params
      //then, we call the handler
      cb(request, response)
    }

    /**
     * @private
     * @function getParams
     * @param url the url that this function will use to parse the params
     */
    function getParams(url: string): any {
      if (url) {
        // here we extract the values from the request
        const values: any[] | null = pathToRegexp(url).exec(request.url as string)
        // and here the info of the path
        const names: any[] = pathToRegexp.parse(url)

        const params: any = {}

        if (values && values.length > 1) {
          // we are mapping the values here
          for (let i = 1; i < values.length; i++) {
            const value = values[i]
            const name = names[i].name
            params[name] = value
          }
        }
        return params
      }
    }

    // here we check if the request has an available handler
    for (let i = 0; i < RegExpSources.length; i++) {
      let r: RegExp = new RegExp(RegExpSources[i])
      const itsAMatch = r.test(request.url as string)
      if (itsAMatch) {
        let match = RegExpSources[i]
        handler(match)
        return
      }
    }

    // if there's not any handler, we pass an empty string, that will return a not found error to the client
    handler('')
    return
  }
}

export = Router
