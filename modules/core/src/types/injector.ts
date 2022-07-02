/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor } from './base'
import { Provider } from './provider'

export interface TpEventCollector {
    'error': (...args: any[]) => void
    'start-time': (duration: number) => void
    'start': () => void
    'terminate-time': (duration: number) => void
    'terminate': () => void
    'unused-provider': (path: Constructor<any>[]) => void
}

export type TpEvent = keyof TpEventCollector

export interface InjectorType {

    children: InjectorType[]

    has(token: any): boolean

    get(token: any): Provider<any> | undefined
}

export interface InjectorEventEmitter {

    emit<Event extends TpEvent>(event: Event, ...args: Parameters<TpEventCollector[Event]>): boolean

    on<Event extends TpEvent>(event: Event, callback: TpEventCollector[Event]): this

    once<Event extends TpEvent>(event: Event, callback: TpEventCollector[Event]): this
}