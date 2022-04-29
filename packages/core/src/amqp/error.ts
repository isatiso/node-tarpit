/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
