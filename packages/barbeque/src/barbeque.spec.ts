import { describe, it, expect, beforeAll } from 'vitest'
import { Barbeque } from './barbeque'

describe('barbeque.ts', function() {

    describe('Barbeque', function() {

        it('could new instance', function() {
            expect(new Barbeque()).toBeInstanceOf(Barbeque)
        })

        it('should limit capacity of queue if provided', function() {
            const q = new Barbeque(300)
            const _temp_arr = []
            for (let i = 0; i < 500; i++) {
                _temp_arr.push(i)
                q.push(i)
            }
            expect(q.length).toEqual(300)
            for (let i = 0; i < 300; i++) {
                expect(q.get(i)).toEqual(_temp_arr[200 + i])
            }
            const _shift_arr = []
            for (let i = 0; i < 50; i++) {
                _shift_arr.push(i)
                q.unshift(i)
            }
            for (let i = 0; i < 50; i++) {
                expect(q.get(i)).toEqual(_shift_arr[49 - i])
            }
            for (let i = 0; i < 150; i++) {
                expect(q.get(i + 50)).toEqual(_temp_arr[200 + i])
            }
        })
    })

    describe('.push()', function() {
        it('should push and pop item', function() {
            const q = new Barbeque()
            const _temp_arr = []

            expect(q.pop()).toBeUndefined()
            for (let i = 0; i < 50000; i++) {
                expect(q.push(i)).toEqual(i + 1)
                _temp_arr.push(i)
            }
            expect(q.length).toEqual(50000)
            for (let i = 0; i < 50000; i++) {
                expect(q.pop()).toEqual(_temp_arr.pop())
                expect(q.length).toEqual(50000 - i - 1)
            }
            expect(q.length).toEqual(0)
        })
    })

    describe('.shift()', function() {
        it('should shift and unshift item', function() {
            const q = new Barbeque()
            const _temp_arr = []

            expect(q.shift()).toBeUndefined()
            for (let i = 0; i < 50000; i++) {
                expect(q.unshift(i)).toEqual(i + 1)
                _temp_arr.push(i)
            }
            expect(q.length).toEqual(50000)
            for (let i = 0; i < 50000; i++) {
                expect(q.shift()).toEqual(_temp_arr.pop())
                expect(q.length).toEqual(50000 - i - 1)
            }
            expect(q.length).toEqual(0)
        })
    })

    describe('.get()', function() {
        const q = new Barbeque()
        const _temp_arr: any[] = []

        beforeAll(function() {
            for (let i = 0; i < 50000; i++) {
                const n = Math.random()
                _temp_arr.push(n)
            }
            for (let i = 14999; i >= 0; i--) {
                q.unshift(_temp_arr[i])
            }
            for (let i = 15000; i < 50000; i++) {
                q.push(_temp_arr[i])
            }
        })

        it('should get value of specified index', function() {
            expect(q.length).toEqual(50000)
            for (let i = 0; i < 50000; i++) {
                expect(q.get(i)).toEqual(_temp_arr[i])
            }
        })

        it('should return undefined if specified index out of bounds', function() {
            expect(q.get(-60000)).toBeUndefined()
            expect(q.get(78963)).toBeUndefined()
        })

        it('should return first value by alias first()', function() {
            expect(q.first()).toEqual(_temp_arr[0])
        })

        it('should return last value by alias last()', function() {
            expect(q.last()).toEqual(_temp_arr[49999])
        })
    })

    describe('.size', function() {
        it('should show size of queue', function() {
            const q = new Barbeque()
            let c = 0
            for (let i = 0; i < 50000; i++) {
                const n = Math.random()
                if (n < 0.25) {
                    q.push(i)
                    c++
                    expect(q.length).toEqual(c)
                } else if (0.25 <= n && n < 0.5) {
                    q.unshift(i)
                    c++
                    expect(q.size).toEqual(c)
                } else if (0.5 <= n && n < 0.75) {
                    if (!q.size) {
                        continue
                    }
                    q.shift()
                    c--
                    expect(q.length).toEqual(c)
                } else {
                    if (!q.size) {
                        continue
                    }
                    q.pop()
                    c--
                    expect(q.size).toEqual(c)
                }
            }
        })
    })

    describe('.to_array()', function() {
        it('should show size of queue', function() {
            const q = new Barbeque()
            const arr: any[] = []
            for (let i = 0; i < 50000; i++) {
                const n = Math.random()
                if (n < 0.25) {
                    q.push(i)
                    arr.push(i)
                } else if (0.25 <= n && n < 0.5) {
                    q.unshift(i)
                    arr.unshift(i)
                } else if (0.5 <= n && n < 0.75) {
                    if (!q.size) {
                        continue
                    }
                    q.shift()
                    arr.shift()
                } else {
                    if (!q.size) {
                        continue
                    }
                    q.pop()
                    arr.pop()
                }
            }
            expect(q.to_array()).toEqual(arr)
        })
    })

    describe('.is_empty()', function() {
        it('should show size of queue', function() {
            const q = new Barbeque()
            q.push(1)
            q.push(2)
            q.push(3)
            q.push(4)
            q.push(5)
            expect(q.length).toEqual(5)
            q.clear()
            expect(q.length).toEqual(0)
            expect(q.is_empty()).toBe(true)
        })
    })
})
