/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import async_hooks from 'async_hooks'
import { EventEmitter } from 'events'
import { OutgoingMessage } from 'http'
import { Socket } from 'net'

function first(ee: EventEmitter, events: string[], done: (...args: any[]) => void) {

    const cleanups: { ee: EventEmitter, event: string, fn: (...args: any[]) => void }[] = []
    events.forEach(event => {
        ee.on(event, callback)
        cleanups.push({ ee: ee, event, fn: callback })
    })

    function cleanup() {
        cleanups.forEach(x => x.ee.removeListener(x.event, x.fn))
    }

    function callback(err?: any) {
        cleanup()
        done.call(null, err)
    }

    function thunk(fn: (...args: any[]) => void) {
        done = fn
    }

    thunk.cancel = cleanup
    return thunk
}

export type OnFinishedListener = (err: Error | null, msg: Message) => void
export type OnFinishedAttach = Function & { queue?: Function[] }
export type Message = OutgoingMessage & { __on_finished?: OnFinishedAttach }

export function on_finish(msg: OutgoingMessage, listener: OnFinishedListener) {
    if (msg.writableEnded) {
        setImmediate(listener, null, msg)
        return msg
    }

    const async_resource = new async_hooks.AsyncResource(listener.name || 'bound-anonymous-fn')
    const fn = async_resource.runInAsyncScope.bind(async_resource, listener, null)
    attach_listener(msg, fn)
    return msg
}

function attach_listener(msg: Message, listener: Function) {
    if (!msg.__on_finished?.queue) {
        msg.__on_finished = create_listener(msg)
        attach_finished_listener(msg, msg.__on_finished)
    }

    msg.__on_finished?.queue?.push(listener)
}

function create_listener(msg: Message): OnFinishedAttach {
    const listener: OnFinishedAttach = (err: Error | null) => {
        if (msg.__on_finished === listener) {
            msg.__on_finished = undefined
        }
        if (!listener.queue) {
            return
        }

        const queue: Function[] = listener.queue
        listener.queue = undefined
        queue.forEach(func => func(err, msg))
    }

    listener.queue = []

    return listener
}

function attach_finished_listener(msg: Message, callback: OnFinishedAttach) {
    let err_msg: { cancel: () => void }
    let err_socket: { cancel: () => void }
    let finished = false

    function on_finish(error: any) {
        err_msg.cancel()
        err_socket.cancel()
        finished = true
        callback(error)
    }

    err_msg = err_socket = first(msg, ['end', 'finish'], on_finish)

    function on_socket(socket: Socket) {
        msg.removeListener('socket', on_socket)
        if (finished) {
            return
        }
        if (err_msg !== err_socket) {
            return
        }
        err_socket = first(socket, ['error', 'close'], on_finish)
    }

    if (msg.socket) {
        on_socket(msg.socket)
        return
    }

    msg.on('socket', on_socket)
}
