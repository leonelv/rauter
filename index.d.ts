/// <reference types="node" />

// Type definitions for Rauter
// Project: Rauter
// Definitions by: Leonel Alexander Vieyra <https://github.com/leonelv>

import { IncomingMessage as IMS, ServerResponse } from 'http'

declare class Router {
  errorMessage: string
  DELETE: RequestHandlerContainer
  GET: RequestHandlerContainer
  PATCH: RequestHandlerContainer
  POST: RequestHandlerContainer
  PUT: RequestHandlerContainer
  constructor(errorMessage?: string)
  [key: string]: any
  /**
   * @private
   * @method createHandler
   * @description Creates a ProxyHandler object
   */
  private createHandler
  /**
   * @private
   * @method wrapMethod
   * @param {Object} obj Object containing all the route handlers
   * @description Takes an object and wraps it arround a Proxy that ensures a response even if the handler is not found
   */
  private wrapMethod
  /**
   * @method handleHTTPMethod
   * @param {string} method the HTTP method of the request
   * @param {string} URL the URL to handle
   * @param {function} callback the request handler
   */
  __handleHTTPMethod(method: HTTPMethod, URL: string, callback: Function): void
  /**
   * @method get
   * @param {string} URL the URL to handle
   * @param {function} callback the request handler
   */
  get(URL: string, callback: Function): void
  /**
   * @method post
   * @param {string} URL the URL to handle
   * @param {function} callback the request handler
   */
  post(URL: string, callback: Function): void
  /**
   * @method put
   * @param {string} URL the URL to handle
   * @param {function} callback the request handler
   */
  put(URL: string, callback: Function): void
  /**
   * @method patch
   * @param {string} URL the URL to handle
   * @param {function} callback the request handler
   */
  patch(URL: string, callback: Function): void
  /**
   * @method delete
   * @param {string} URL the URL to handle
   * @param {function} callback the request handler
   */
  delete(URL: string, callback: Function): void
  static use(router: Router, request: IncomingMessage, response: ServerResponse): void
}

export = Router

declare global {
  export type HTTPMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'
  export interface RequestHandlerContainer {
    [key: string]: Function
  }
  export interface MethodCallContext {
    router: Router
    method: HTTPMethod
  }
  export interface ClientRequest {
    url: string
    method: string
  }

  export interface CallbackFunction extends Function {
    url: string
  }

  export interface IncomingMessage extends IMS {
    params: any
  }
}
