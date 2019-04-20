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
    if (!URL.startsWith('/')) URL = '/' + URL

    const MethodStore = (this[method.toUpperCase()] as unknown) as any

    const URLRegexp: string = pathToRegexp(URL).source
    callback.url = URL
    MethodStore[URLRegexp] = callback
  }

  static use(router: Router, request: IncomingMessage, response: ServerResponse): void {
    const RegExpSources = Object.keys(router[request.method as string])

    function handler(match: string): void {
      const cb = router[request.method as string][match]
      const { url } = cb

      const params = getParams(url)
      request.params = params

      cb(request, response)
    }

    function getParams(url: string): any {
      if (url) {
        const values: any[] | null = pathToRegexp(url).exec(request.url as string)
        const names: any[] = pathToRegexp.parse(url)

        const params: any = {}

        if (values && values.length > 1) {
          for (let i = 1; i < values.length; i++) {
            const value = values[i]
            const name = names[i].name
            params[name] = value
          }
        }

        return params
      }
    }

    for (let i = 0; i < RegExpSources.length; i++) {
      let r: RegExp = new RegExp(RegExpSources[i])
      const itsAMatch = r.test(request.url as string)
      if (itsAMatch) {
        let match = RegExpSources[i]
        handler(match)
        return
      }
    }

    handler('')
    return
  }
}

export = Router
