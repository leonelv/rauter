/// <reference types="node" />
import { ServerResponse } from 'http';
declare class Router {
    errorMessage: string;
    DELETE: RequestHandlerContainer;
    GET: RequestHandlerContainer;
    PATCH: RequestHandlerContainer;
    POST: RequestHandlerContainer;
    PUT: RequestHandlerContainer;
    [key: string]: any;
    constructor(errorMessage?: string);
    /**
     * @private
     * @method createHandler
     * @description Creates a ProxyHandler object
     */
    private createHandler;
    /**
     * @private
     * @method wrapMethod
     * @param {Object} obj Object containing all the route handlers
     * @description Takes an object and wraps it arround a Proxy that ensures a response even if the handler is not found
     */
    private wrapMethod;
    /**
     * @private
     * @method handleHTTPMethod
     * @param {string} method the HTTP method of the request
     * @param {string} URL the URL to handle
     * @param {function} callback the request handler
     */
    __registerHTTPRequestHandler(method: HTTPMethod | string, URL: string, callback: CallbackFunction): void;
    /**
     * @static
     * @method use
     * @description this method allow us to handle all our requests with a specific router
     * @param router - the router object that we want to use
     * @param request - the request from the client
     * @param response - the server response
     */
    static use(router: Router, request: IncomingMessage, response: ServerResponse): void;
}
export = Router;
