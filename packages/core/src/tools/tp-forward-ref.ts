/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

interface ForwardRefFn {
    (): any;
}

interface Type<T> extends Function {
    new(...args: any[]): T;
}

const __forward_ref__ = Symbol('__forward_ref__')

export function tp_forward_ref(forwardRefFn: ForwardRefFn): Type<any> {
    (<any> forwardRefFn).__forward_ref__ = tp_forward_ref
    return (<Type<any>> <any> forwardRefFn)
}

export function resolve_forward_ref<T>(type: T): T {
    return isForwardRef(type) ? type() : type
}

export function isForwardRef(fn: any): fn is() => any {
    return typeof fn === 'function' && fn.hasOwnProperty(__forward_ref__) &&
        fn[__forward_ref__] === tp_forward_ref
}
