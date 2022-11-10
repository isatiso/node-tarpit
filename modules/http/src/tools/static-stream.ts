// /**
//  * @license
//  * Copyright Cao Jiahang All Rights Reserved.
//  *
//  * Use of this source code is governed by an MIT-style license that can be
//  * found in the LICENSE file at source root.
//  */
//
// import fresh from 'fresh'
// import fs, { Stats } from 'fs'
// import { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'http'
// import path from 'path'
// import { Stream } from 'stream'
// import { create_etag } from './etag'
// import { HTTP_STATUS } from './http-status'
// import { MIME } from './mime'
// import { parse_range, Range } from './parse-range'
//
// const extname = path.extname
// const join = path.join
// const normalize = path.normalize
// const resolve = path.resolve
// const sep = path.sep
//
// // var createError = require('http-errors')
// // var debug = require('debug')('send')
// // var destroy = require('destroy')
// // var encodeUrl = require('encodeurl')
// // var escapeHtml = require('escape-html')
// // var etag = require('etag')
// // var fresh = require('fresh')
// // var fs = require('fs')
// // var mime = require('mime')
// // var ms = require('ms')
// // var onFinished = require('on-finished')
// // var parseRange = require('range-parser')
// // var path = require('path')
// // var statuses = require('statuses')
// // var Stream = require('stream')
// // var util = require('util')
//
// // Regular expression for identifying a bytes Range header.
// const BYTES_RANGE_REGEXP = /^ *bytes=/
//
// // Maximum value allowed for the max age.
// const MAX_AGE_LIMIT = 60 * 60 * 24 * 365 * 1000 // 1 year
//
// // Regular expression to match a path with a directory up component.
// const UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/
//
// interface SendStreamOptions {
//     accept_ranges?: boolean
//     cache_control?: boolean
//     etag?: boolean
//     dotfiles?: 'allow' | 'deny' | 'ignore'
//     extensions?: string[]
//     immutable?: boolean
//     index?: string[]
//     last_modified?: boolean
//     root?: string
//     max_age?: number
//     start?: number
//     end?: number
// }
//
// class SendStream extends Stream {
//
//     private _accept_ranges = this.options.accept_ranges ?? true
//     private _cache_control = this.options.cache_control ?? true
//     private _last_modified = this.options.last_modified ?? true
//     private _etag = this.options.etag ?? true
//     private _dotfiles = this.options.dotfiles ?? 'ignore'
//     private _immutable = this.options.immutable ?? false
//     private _extensions = this.options.extensions ? normalizeList(this.options.extensions, 'extensions option') : []
//     private _index = this.options.index ? normalizeList(this.options.index, 'index option') : ['index.html']
//     private _root = this.options.root ? resolve(this.options.root) : null
//     private _max_age = Math.min(this.options.max_age ?? 0, MAX_AGE_LIMIT)
//     private _mime = new MIME()
//     private _res?: ServerResponse
//
//     constructor(
//         private req: IncomingMessage,
//         private path: string,
//         private options: SendStreamOptions,
//     ) {
//         super()
//
//         if (!['ignore', 'deny', 'allow'].includes(this._dotfiles)) {
//             throw new TypeError('dotfiles option must be "allow", "deny", or "ignore"')
//         }
//
//         // this._maxage = opts.maxAge || opts.maxage
//         // this._maxage = typeof this._maxage === 'string'
//         //     ? ms(this._maxage)
//         //     : Number(this._maxage)
//         // this._maxage = !isNaN(this._maxage)
//         //     ? Math.min(Math.max(0, this._maxage), MAX_MAXAGE)
//         //     : 0
//     }
//
//     // Set root `path`.
//     root(path: string) {
//         this._root = resolve(path)
//         return this
//     }
//
//     // Emit error with `status`.
//     error(status: number, err?: NodeJS.ErrnoException & { headers?: OutgoingHttpHeaders }) {
//         // emit if listeners instead of responding
//         if (hasListeners(this, 'error')) {
//             return this.emit('error', createHttpError(status, err))
//         }
//
//         if (!this._res) {
//             throw new Error('ServerResponse is not specified.')
//         }
//
//         const msg = HTTP_STATUS.message_of(status) ?? status + ''
//         const doc = createHtmlDocument('Error', escapeHtml(msg))
//
//         // clear existing headers
//         clearHeaders(this._res)
//
//         // add error headers
//         if (err?.headers) {
//             setHeaders(this._res, err.headers)
//         }
//
//         // send basic response
//         this._res.statusCode = status
//         this._res.setHeader('Content-Type', 'text/html; charset=UTF-8')
//         this._res.setHeader('Content-Length', Buffer.byteLength(doc))
//         this._res.setHeader('Content-Security-Policy', 'default-src \'none\'')
//         this._res.setHeader('X-Content-Type-Options', 'nosniff')
//         this._res.end(doc)
//     }
//
//     // Check if the pathname ends with "/".
//     hasTrailingSlash(): boolean {
//         return this.path[this.path.length - 1] === '/'
//     }
//
//     // Check if this is a conditional GET request.
//     isConditionalGET(): boolean {
//         return !!(this.req.headers['if-match'] ||
//             this.req.headers['if-unmodified-since'] ||
//             this.req.headers['if-none-match'] ||
//             this.req.headers['if-modified-since'])
//     }
//
//     // Check if the request preconditions failed.
//     isPreconditionFailure(): boolean {
//
//         if (!this._res) {
//             throw new Error('ServerResponse is not specified.')
//         }
//
//         // if-match
//         const match = this.req.headers['if-match']
//         if (match) {
//             const etag_header = this._res.getHeader('ETag')
//             const etag = typeof etag_header === 'string' ? etag_header.replace(/^W\//, '') : undefined
//             return !etag || match !== '*' && parseTokenList(match).map(token => token.replace(/^W\//, '')).every(token => token !== etag)
//         }
//
//         // if-unmodified-since
//         const unmodified_since = parseHttpDateHeader(this.req.headers['if-unmodified-since'])
//         if (unmodified_since) {
//             const last_modified = parseHttpDateHeader(this._res.getHeader('Last-Modified'))
//             return !last_modified || last_modified > unmodified_since
//         }
//
//         return false
//     }
//
//     // Strip various content header fields for a change in entity.
//     removeContentHeaderFields() {
//         if (!this._res) {
//             throw new Error('ServerResponse is not specified.')
//         }
//         this._res.removeHeader('Content-Encoding')
//         this._res.removeHeader('Content-Language')
//         this._res.removeHeader('Content-Length')
//         this._res.removeHeader('Content-Range')
//         this._res.removeHeader('Content-Type')
//     }
//
//     // Respond with 304 not modified.
//     notModified() {
//         if (!this._res) {
//             throw new Error('ServerResponse is not specified.')
//         }
//         this.removeContentHeaderFields()
//         this._res.statusCode = 304
//         this._res.end()
//     }
//
//     // Raise error that headers already sent.
//     headersAlreadySent() {
//         this.error(500, new Error('Can\'t set headers after they are sent.'))
//     }
//
//     // Check if the request is cacheable, aka
//     // responded with 2xx or 304 (see RFC 2616 section 14.2{5,6}).
//     isCachable(): boolean {
//         if (!this._res) {
//             throw new Error('ServerResponse is not specified.')
//         }
//         const code = this._res.statusCode
//         return (code >= 200 && code < 300) || code === 304
//     }
//
//     // Handle stat() error.
//     onStatError(error: NodeJS.ErrnoException) {
//         switch (error.code) {
//             case 'ENAMETOOLONG':
//             case 'ENOENT':
//             case 'ENOTDIR':
//                 this.error(404, error)
//                 break
//             default:
//                 this.error(500, error)
//                 break
//         }
//     }
//
//     // Check if the cache is fresh.
//     isFresh(): boolean {
//         if (!this._res) {
//             throw new Error('ServerResponse is not specified.')
//         }
//         return fresh(this.req.headers, {
//             etag: this._res.getHeader('ETag'),
//             'last-modified': this._res.getHeader('Last-Modified')
//         })
//     }
//
//     // Check if the range is fresh.
//     isRangeFresh(): boolean {
//         if (!this._res) {
//             throw new Error('ServerResponse is not specified.')
//         }
//
//         const if_range = this.req.headers['if-range']
//         if (!if_range) {
//             return true
//         }
//
//         // if-range as etag
//         if (if_range.indexOf('"') !== -1) {
//             const etag = this._res.getHeader('ETag')
//             return Boolean(etag && if_range.indexOf(etag) !== -1)
//         }
//
//         // if-range as modified date
//         const last_modified = this._res.getHeader('Last-Modified')
//         return parseHttpDateHeader(last_modified) <= parseHttpDateHeader(if_range)
//     }
//
//     // Redirect to path.
//     redirect(path: string) {
//
//         if (!this._res) {
//             throw new Error('ServerResponse is not specified.')
//         }
//
//         if (hasListeners(this, 'directory')) {
//             this.emit('directory', this._res, path)
//             return
//         }
//
//         if (this.hasTrailingSlash()) {
//             this.error(403)
//             return
//         }
//
//         const loc = encodeUrl(collapse_leading_slashes(this.path + '/'))
//         const doc = createHtmlDocument('Redirecting', 'Redirecting to <a href="' + escapeHtml(loc) + '">' +
//             escapeHtml(loc) + '</a>')
//
//         // redirect
//         this._res.statusCode = 301
//         this._res.setHeader('Content-Type', 'text/html; charset=UTF-8')
//         this._res.setHeader('Content-Length', Buffer.byteLength(doc))
//         this._res.setHeader('Content-Security-Policy', 'default-src \'none\'')
//         this._res.setHeader('X-Content-Type-Options', 'nosniff')
//         this._res.setHeader('Location', loc)
//         this._res.end(doc)
//     }
//
//     override pipe(res: ServerResponse): ServerResponse {
//         // root path
//         const root = this._root
//
//         // references
//         this._res = res
//
//         // decode the path
//         let path = decode(this.path)
//         if (path === -1) {
//             this.error(400)
//             return res
//         }
//
//         // null byte(s)
//         if (~path.indexOf('\0')) {
//             this.error(400)
//             return res
//         }
//
//         let parts
//         if (root !== null) {
//             // normalize
//             if (path) {
//                 path = normalize('.' + sep + path)
//             }
//
//             // malicious path
//             if (UP_PATH_REGEXP.test(path)) {
//                 console.debug('malicious path "%s"', path)
//                 this.error(403)
//                 return res
//             }
//
//             // explode path parts
//             parts = path.split(sep)
//
//             // join / normalize from optional root dir
//             path = normalize(join(root, path))
//         } else {
//             // ".." is malicious without "root"
//             if (UP_PATH_REGEXP.test(path)) {
//                 console.debug('malicious path "%s"', path)
//                 this.error(403)
//                 return res
//             }
//
//             // explode path parts
//             parts = normalize(path).split(sep)
//
//             // resolve the path
//             path = resolve(path)
//         }
//
//         // dotfile handling
//         if (contains_dot_file(parts)) {
//             let access = this._dotfiles
//
//             console.debug('%s dotfile "%s"', access, path)
//             switch (access) {
//                 case 'allow':
//                     break
//                 case 'deny':
//                     this.error(403)
//                     return res
//                 case 'ignore':
//                 default:
//                     this.error(404)
//                     return res
//             }
//         }
//
//         // index file support
//         if (this._index.length && this.hasTrailingSlash()) {
//             this.sendIndex(path)
//             return res
//         } else {
//             this.sendFile(path)
//             return res
//         }
//     }
//
//     // Transfer `path`.
//     send(path: string, stat: Stats) {
//         let len = stat.size
//         let options = this.options
//         let opts = {}
//         let res = this._res
//         let req = this.req
//         let range_str = req.headers.range ?? ''
//         let offset = options.start || 0
//
//         if (!this._res) {
//             throw new Error('ServerResponse is not specified.')
//         }
//
//         if (headersSent(res)) {
//             // impossible to send now
//             this.headersAlreadySent()
//             return
//         }
//
//         console.debug('pipe "%s"', path)
//
//         this.set_header(path, stat)
//         this.type(path)
//
//         // conditional GET support
//         if (this.isConditionalGET()) {
//             if (this.isPreconditionFailure()) {
//                 this.error(412)
//                 return
//             }
//
//             if (this.isCachable() && this.isFresh()) {
//                 this.notModified()
//                 return
//             }
//         }
//
//         // adjust len to start/end options
//         len = Math.max(0, len - offset)
//         if (options.end !== undefined) {
//             let bytes = options.end - offset + 1
//             if (len > bytes) {
//                 len = bytes
//             }
//         }
//
//         // Range support
//         if (this._accept_ranges && BYTES_RANGE_REGEXP.test(range_str)) {
//             // parse
//             let ranges = parse_range(len, range_str, { combine: true })
//
//             // If-Range support
//             if (!this.isRangeFresh()) {
//                 console.debug('range stale')
//                 ranges = -2
//             }
//
//             // unsatisfiable
//             if (!ranges.length) {
//                 console.debug('range unsatisfiable')
//
//                 // Content-Range
//                 this._res.setHeader('Content-Range', content_range('bytes', len))
//
//                 // 416 Requested Range Not Satisfiable
//                 return this.error(416, { headers: { 'Content-Range': this._res.getHeader('Content-Range') } })
//             }
//
//             // valid (syntactically invalid/multiple ranges are treated as a regular response)
//             if (ranges !== -2 && ranges.length === 1) {
//                 console.debug('range %j', ranges)
//
//                 // Content-Range
//                 this._res.statusCode = 206
//                 this._res.setHeader('Content-Range', content_range('bytes', len, ranges[0]))
//
//                 // adjust for requested range
//                 offset += ranges[0].start
//                 len = ranges[0].end - ranges[0].start + 1
//             }
//         }
//
//         // clone options
//         for (var prop in options) {
//             opts[prop] = options[prop]
//         }
//
//         // set read options
//         opts.start = offset
//         opts.end = Math.max(offset, offset + len - 1)
//
//         // content-length
//         this._res.setHeader('Content-Length', len)
//
//         // HEAD support
//         if (req.method === 'HEAD') {
//             this._res.end()
//             return
//         }
//
//         this.stream(path, opts)
//     }
//
//     // Transfer file for `path`.
//     sendFile(path: string) {
//         let i = 0
//         console.debug('stat "%s"', path)
//         fs.stat(path, (err, stat) => {
//             if (err && err.code === 'ENOENT' && !extname(path) && path[path.length - 1] !== sep) {
//                 // not found, check extensions
//                 return next(err)
//             }
//             if (err) {
//                 return this.onStatError(err)
//             }
//             if (stat.isDirectory()) {
//                 return this.redirect(path)
//             }
//             this.emit('file', path, stat)
//             this.send(path, stat)
//         })
//
//         const next = (err?: NodeJS.ErrnoException) => {
//             if (this._extensions.length <= i) {
//                 return err
//                     ? this.onStatError(err)
//                     : this.error(404)
//             }
//
//             const p = path + '.' + this._extensions[i++]
//
//             console.debug('stat "%s"', p)
//             fs.stat(p, (err, stat) => {
//                 if (err) {
//                     return next(err)
//                 }
//                 if (stat.isDirectory()) {
//                     return next()
//                 }
//                 this.emit('file', p, stat)
//                 this.send(p, stat)
//             })
//         }
//     }
//
//     // Transfer index for `path`.
//     sendIndex(path: string) {
//         let i = -1
//
//         const next = (err?: NodeJS.ErrnoException) => {
//             if (++i >= this._index.length) {
//                 if (err) {
//                     return this.onStatError(err)
//                 }
//                 return this.error(404)
//             }
//
//             const p = join(path, this._index[i])
//
//             console.debug('stat "%s"', p)
//             fs.stat(p, (err, stat) => {
//                 if (err) {
//                     return next(err)
//                 }
//                 if (stat.isDirectory()) {
//                     return next()
//                 }
//                 this.emit('file', p, stat)
//                 this.send(p, stat)
//             })
//         }
//
//         next()
//     }
//
//     /**
//      * Stream `path` to the response.
//      *
//      * @param {String} path
//      * @param {Object} options
//      * @api private
//      */
//
//     stream(path: string, options: SendStreamOptions) {
//
//         if (!this._res) {
//             throw new Error('ServerResponse is not specified.')
//         }
//
//         // pipe
//         const stream = fs.createReadStream(path, options)
//         this.emit('stream', stream)
//         stream.pipe(this._res)
//
//         // cleanup
//         function cleanup() {
//             destroy(stream, true)
//         }
//
//         // response finished, cleanup
//         onFinished(this._res, cleanup)
//
//         // error handling
//         stream.on('error', err => {
//             // clean up stream early
//             cleanup()
//
//             // error
//             this.onStatError(err)
//         })
//
//         // end
//         stream.on('end', () => {
//             this.emit('end')
//         })
//     }
//
//     // Set content-type based on `path` if it hasn't been explicitly set.
//     type(path: string) {
//         if (!this._res) {
//             throw new Error('ServerResponse is not specified.')
//         }
//
//         if (this._res.getHeader('Content-Type')) {
//             return
//         }
//
//         const type = this._mime.lookup(path)
//         if (!type) {
//             console.debug('no content-type')
//             return
//         }
//
//         const charset = this._mime.lookup_charset(type)
//
//         console.debug('content-type %s', type)
//         this._res.setHeader('Content-Type', type + (charset ? '; charset=' + charset : ''))
//     }
//
//     // Set response header fields, most fields may be pre-defined.
//     set_header(path: string, stat: Stats) {
//
//         if (!this._res) {
//             throw new Error('ServerResponse is not specified.')
//         }
//
//         this.emit('headers', this._res, path, stat)
//
//         if (this._accept_ranges && !this._res.getHeader('Accept-Ranges')) {
//             console.debug('accept ranges')
//             this._res.setHeader('Accept-Ranges', 'bytes')
//         }
//
//         if (this._cache_control && !this._res.getHeader('Cache-Control')) {
//             let cache_control = 'public, max-age=' + Math.floor(this._max_age / 1000)
//
//             if (this._immutable) {
//                 cache_control += ', immutable'
//             }
//
//             console.debug('cache-control %s', cache_control)
//             this._res.setHeader('Cache-Control', cache_control)
//         }
//
//         if (this._last_modified && !this._res.getHeader('Last-Modified')) {
//             const modified = stat.mtime.toUTCString()
//             console.debug('modified %s', modified)
//             this._res.setHeader('Last-Modified', modified)
//         }
//
//         if (this._etag && !this._res.getHeader('ETag')) {
//             const etag = create_etag(stat)
//             console.debug('etag %s', etag)
//             this._res.setHeader('ETag', etag)
//         }
//     }
//
// }
//
// // Clear all headers from a response.
// function clearHeaders(res: ServerResponse) {
//     var headers = getHeaderNames(res)
//
//     for (var i = 0; i < headers.length; i++) {
//         res.removeHeader(headers[i])
//     }
// }
//
// // Collapse all leading slashes into a single slash
// function collapse_leading_slashes(str: string) {
//     return str.replace(/^\/+/, '/')
// }
//
// /**
//  * Determine if path parts contain a dotfile.
//  *
//  * @api private
//  */
//
// function contains_dot_file(parts) {
//     for (var i = 0; i < parts.length; i++) {
//         var part = parts[i]
//         if (part.length > 1 && part[0] === '.') {
//             return true
//         }
//     }
//
//     return false
// }
//
// // Create a Content-Range header.
// function content_range(type: string, size: number, range?: Range): string {
//     return type + ' ' + (range ? range.start + '-' + range.end : '*') + '/' + size
// }
//
// /**
//  * Create a minimal HTML document.
//  *
//  * @param {string} title
//  * @param {string} body
//  * @private
//  */
//
// function createHtmlDocument(title, body) {
//     return '<!DOCTYPE html>\n' +
//         '<html lang="en">\n' +
//         '<head>\n' +
//         '<meta charset="utf-8">\n' +
//         '<title>' + title + '</title>\n' +
//         '</head>\n' +
//         '<body>\n' +
//         '<pre>' + body + '</pre>\n' +
//         '</body>\n' +
//         '</html>\n'
// }
//
// /**
//  * Create a HttpError object from simple arguments.
//  *
//  * @param {number} status
//  * @param {Error|object} err
//  * @private
//  */
//
// function createHttpError(status, err) {
//     if (!err) {
//         return createError(status)
//     }
//
//     return err instanceof Error
//         ? createError(status, err, { expose: false })
//         : createError(status, err)
// }
//
// // Allows V8 to only deoptimize this fn instead of all of send()
// function decode(path: string): string | -1 {
//     try {
//         return decodeURIComponent(path)
//     } catch (err) {
//         return -1
//     }
// }
//
// // Get the header names on a response.
// function getHeaderNames(res: ServerResponse) {
//     return typeof res.getHeaderNames !== 'function'
//         ? Object.keys(res._headers || {})
//         : res.getHeaderNames()
// }
//
// /**
//  * Determine if emitter has listeners of a given type.
//  *
//  * The way to do this check is done three different ways in Node.js >= 0.8
//  * so this consolidates them into a minimal set using instance methods.
//  *
//  * @param {EventEmitter} emitter
//  * @param {string} type
//  * @returns {boolean}
//  * @private
//  */
//
// function hasListeners(emitter, type) {
//     var count = typeof emitter.listenerCount !== 'function'
//         ? emitter.listeners(type).length
//         : emitter.listenerCount(type)
//
//     return count > 0
// }
//
// /**
//  * Determine if the response headers have been sent.
//  *
//  * @param {object} res
//  * @returns {boolean}
//  * @private
//  */
//
// function headersSent(res) {
//     return typeof res.headersSent !== 'boolean'
//         ? Boolean(res._header)
//         : res.headersSent
// }
//
// /**
//  * Normalize the index option into an array.
//  *
//  * @param {boolean|string|array} val
//  * @param {string} name
//  * @private
//  */
//
// function normalizeList(val, name) {
//     var list = [].concat(val || [])
//
//     for (var i = 0; i < list.length; i++) {
//         if (typeof list[i] !== 'string') {
//             throw new TypeError(name + ' must be array of strings or false')
//         }
//     }
//
//     return list
// }
//
// // Parse an HTTP Date into a number.
// function parseHttpDateHeader(date: string | number | string[] | undefined): number | undefined {
//     if (Array.isArray(date)) {
//         date = date[0]
//     }
//     if (typeof date === 'string') {
//         return Date.parse(date)
//     }
// }
//
// // Parse an HTTP token list.
// function parseTokenList(str: string): string[] {
//     return str.split(',').map(token => token.trim())
// }
//
// // Set an object of headers on a response.
// function setHeaders(res, headers) {
//     var keys = Object.keys(headers)
//
//     for (var i = 0; i < keys.length; i++) {
//         var key = keys[i]
//         res.setHeader(key, headers[key])
//     }
// }
