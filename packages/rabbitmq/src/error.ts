/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

/**
 * @category Error
 */
export class Ack extends Error {
}

/**
 * @category Error
 */
export class Dead extends Error {
}

/**
 * @category Error
 */
export class Requeue extends Error {
}

export function kill_message(): never {
    throw new Dead()
}

export function requeue_message(): never {
    throw new Requeue()
}

export function ack_message(): never {
    throw new Ack()
}
