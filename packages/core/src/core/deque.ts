/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Deque<T> {

    private _head: number
    private _tail: number
    private _capacityMask: number
    private _list: any[]

    constructor(private readonly _capacity?: number) {
        this._head = 0
        this._tail = 0
        this._capacityMask = 0b1111
        this._list = new Array(this._capacityMask + 1)
    }

    get length() {
        return this.size()
    }

    get(index: number): T | undefined {
        return this.peekAt(index)
    }

    peek(): T | undefined {
        if (this._head === this._tail) {
            return undefined
        }
        return this._list[this._head]
    }

    peekAt(index: number): T | undefined {
        const len = this.size()
        if (index >= len || index < -len) {
            return undefined
        }
        const i = index < 0 ? index + len : index
        const pos = (this._head + i) & this._capacityMask
        return this._list[pos]
    }

    peekFront(): T | undefined {
        return this.peek()
    }

    peekBack(): T | undefined {
        return this.peekAt(-1)
    }

    shift(): T | undefined {
        if (this._head === this._tail) {
            return undefined
        }
        const head = this._head
        const item = this._list[head]
        this._list[this._head] = undefined
        this._head = (head + 1) & this._capacityMask
        this._shrink_array()
        return item
    }

    unshift(item: T) {
        const len = this._list.length
        this._head = (this._head - 1 + len) & this._capacityMask
        this._list[this._head] = item
        return this._after_grow()
    }

    push(item: T) {
        const tail = this._tail
        this._list[tail] = item
        this._tail = (tail + 1) & this._capacityMask
        return this._after_grow()
    }

    pop(): T | undefined {
        if (this._tail === this._head) {
            return undefined
        }
        this._tail = (this._tail - 1 + this._list.length) & this._capacityMask
        const item = this._list[this._tail]
        this._list[this._tail] = undefined
        this._shrink_array()
        return item
    }

    size() {
        if (this._head === this._tail) {
            return 0
        }
        if (this._head < this._tail) {
            return this._tail - this._head
        } else {
            return this._capacityMask + 1 - (this._head - this._tail)
        }
    }

    clear() {
        this._head = 0
        this._tail = 0
    }

    isEmpty() {
        return this._head === this._tail
    }

    toArray() {
        return this._copy_array()
    }

    private _after_grow() {
        if (this._tail === this._head) {
            this._grow_array()
        }
        if (this._capacity && this.size() > this._capacity) {
            this.shift()
        }
        return this.size()
    }

    private _grow_array() {
        if (this._head) {
            // copy existing data, head to end, then beginning to tail.
            this._list = this._copy_array()
            this._head = 0
        }

        this._tail = this._list.length
        this._capacityMask = (this._capacityMask << 1) | 1
        this._list.length = this._capacityMask + 1
    }

    private _copy_array() {
        const newArray = []
        const len = this._list.length
        for (let i = 0; i < len; i++) {
            const target = (i + this._head) % len
            newArray.push(this._list[target])
        }
        return newArray
    }

    private _shrink_array() {
        if (this._head < 2 && this._tail > 100 && this._tail <= this._list.length >>> 2) {
            this._list.length >>>= 1
            this._capacityMask >>>= 1
        }
    }
}
