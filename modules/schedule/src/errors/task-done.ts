/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

export class TaskDone {
    constructor(public readonly res?: any | Promise<any>) {
    }
}

export function mission_completed(response?: any): never {
    throw new TaskDone(response)
}
