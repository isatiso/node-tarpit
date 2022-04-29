/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Dora } from '../../builtin'

export class CronMonth {

    private _field_name: ('date' | 'hour' | 'minute' | 'second')[] = ['date', 'hour', 'minute', 'second']
    private _cur: [number, number, number, number] = [0, 0, 0, 0]
    private _current?: [number, number, number, number]
    private _has_next = true

    constructor(
        private readonly _year: number,
        private readonly _month: number,
        private _now: Dora,
        private _tz: string | undefined,
        private readonly _schedule: [number[], number[], number[], number[]],
    ) {
        this._has_next = true
        this._align()
        this._current = this._assemble_current()
    }

    next() {
        if (this._has_next && this._current) {
            const date = Dora.from([this._year, this._month, ...this._current], this._tz)
            this._current = this._tick()
            return date
        } else {
            return
        }
    }

    private _assemble_current(): [number, number, number, number] {
        return [
            this._schedule[0][this._cur[0]],
            this._schedule[1][this._cur[1]],
            this._schedule[2][this._cur[2]],
            this._schedule[3][this._cur[3]],
        ]
    }

    private _tick(): [number, number, number, number] | undefined {
        this._cur[3]++
        if (this._cur[3] >= this._schedule[3].length) {
            this._cur[3] = 0
            this._cur[2]++
            if (this._cur[2] >= this._schedule[2].length) {
                this._cur[2] = 0
                this._cur[1]++
                if (this._cur[1] >= this._schedule[1].length) {
                    this._cur[1] = 0
                    this._cur[0]++
                    if (this._cur[0] >= this._schedule[0].length) {
                        this._has_next = false
                        return
                    }
                }
            }
        }
        this._has_next = true
        return this._assemble_current()
    }

    private _walk_schedule(i: number): boolean {
        const current = this._now.get(this._field_name[i])
        while (this._schedule[i][this._cur[i]] < current) {
            this._cur[i]++
        }
        if (this._schedule[i][this._cur[i]] > current) {
            for (let n = i + 1; n < this._cur.length; n++) {
                this._cur[n] = 0
            }
            return true
        } else if (this._schedule[i][this._cur[i]] === current) {
            if (i === 3) {
                return true
            }
            const direct_return = this._walk_schedule(i + 1)
            if (direct_return) {
                return direct_return
            }
            this._cur[i]++
            if (i + 1 < this._cur.length) {
                this._cur[i + 1] = 0
            }
            return this._cur[i] < this._schedule[i].length
        }
        return false
    }

    private _align() {
        if (!this._walk_schedule(0)) {
            this._has_next = false
        }
    }
}

