/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

export class Barbeque<T> {

    private _head = 0
    private _tail = 0
    private _capacity_mask = 0b1111
    private _list: any[] = new Array(this._capacity_mask + 1)

    constructor(
        public readonly capacity?: number
    ) {
    }

    private _size = 0

    get size() {
        return this._size
    }

    get length() {
        return this._size
    }

    get(index?: number): T | undefined {
        index = index ?? 0
        if (index >= this._size || index < -this._size) {
            return undefined
        }
        const shadow_index = index < 0 ? index + this._size : index
        return this._list[(this._head + shadow_index) & this._capacity_mask]
    }

    first() {
        return this.get()
    }

    last() {
        return this.get(-1)
    }

    shift(): T | undefined {
        if (!this._size) {
            return undefined
        }
        const item = this._list[this._head]
        this._list[this._head] = undefined
        this._head = (this._head + 1) & this._capacity_mask
        this._size -= 1
        this._try_shrink()
        return item
    }

    unshift(item: T) {
        this._head = (this._head - 1 + this._list.length) & this._capacity_mask
        this._list[this._head] = item
        this._size += 1
        this._try_grow()
        if (this.capacity && this._size > this.capacity) {
            this.pop()
        }
        return this._size
    }

    push(item: T) {
        this._list[this._tail] = item
        this._tail = (this._tail + 1) & this._capacity_mask
        this._size += 1
        this._try_grow()
        if (this.capacity && this._size > this.capacity) {
            this.shift()
        }
        return this._size
    }

    pop(): T | undefined {
        if (!this._size) {
            return undefined
        }
        this._tail = (this._tail - 1 + this._list.length) & this._capacity_mask
        const item = this._list[this._tail]
        this._list[this._tail] = undefined
        this._size -= 1
        this._try_shrink()
        return item
    }

    clear() {
        this._head = 0
        this._tail = 0
        this._size = 0
    }

    is_empty() {
        return this._size === 0
    }

    to_array() {
        return this._copy()
    }

    private _try_grow() {
        if (this._tail === this._head) {
            if (this._head) {
                this._list = this._copy()
                this._head = 0
            }
            this._tail = this._size
            this._capacity_mask = (this._capacity_mask << 1) | 1
            this._list.length = this._capacity_mask + 1
        }
    }

    private _try_shrink() {
        if (this._size > 0b11111111 && this._size < this._capacity_mask >>> 3) {
            if (this._head) {
                this._list = this._copy()
                this._head = 0
            }
            this._tail = this._size
            this._capacity_mask >>>= 1
            this._list.length = this._capacity_mask + 1
        }
    }

    private _copy() {
        const arr = []
        const len = this._list.length
        for (let i = 0; i < this._size; i++) {
            let index = this._head + i
            index = index >= len ? index - len : index
            arr.push(this._list[index])
        }
        return arr
    }
}
