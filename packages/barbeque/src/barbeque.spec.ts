/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { Barbeque } from './barbeque'

chai.use(cap)

describe('barbeque.ts', function() {

    describe('class Barbeque()', function() {
        it('could new instance', function() {
            expect(new Barbeque()).to.be.instanceof(Barbeque)
        })
    })

    describe('Barbeque#push()', function() {
        it('should push and pop item', function() {
            const q = new Barbeque()
            const _temp_arr = []

            expect(q.pop()).to.be.undefined
            for (let i = 0; i < 50000; i++) {
                expect(q.push(i)).to.equal(i + 1)
                _temp_arr.push(i)
            }
            expect(q.length).to.equal(50000)
            for (let i = 0; i < 50000; i++) {
                expect(q.pop()).to.equal(_temp_arr.pop())
                expect(q.length).to.equal(50000 - i - 1)
            }
            expect(q.length).to.equal(0)
        })
    })

    describe('Barbeque#shift()', function() {
        it('should shift and unshift item', function() {
            const q = new Barbeque()
            const _temp_arr = []

            expect(q.shift()).to.be.undefined
            for (let i = 0; i < 50000; i++) {
                expect(q.unshift(i)).to.equal(i + 1)
                _temp_arr.push(i)
            }
            expect(q.length).to.equal(50000)
            for (let i = 0; i < 50000; i++) {
                expect(q.shift()).to.equal(_temp_arr.pop())
                expect(q.length).to.equal(50000 - i - 1)
            }
            expect(q.length).to.equal(0)
        })
    })

    describe('Barbeque#get()', function() {
        const q = new Barbeque()
        const _temp_arr: any[] = []

        before(function() {
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
            expect(q.length).to.equal(50000)
            for (let i = 0; i < 50000; i++) {
                expect(q.get(i)).to.equal(_temp_arr[i])
            }
        })

        it('should return undefined if specified index out of bounds', function() {
            expect(q.get(-60000)).to.be.undefined
            expect(q.get(78963)).to.be.undefined
        })

        it('should return first value by alias first()', function() {
            expect(q.first()).to.equal(_temp_arr[0])
        })

        it('should return last value by alias last()', function() {
            expect(q.last()).to.equal(_temp_arr[49999])
        })
    })

    describe('Barbeque#capacity', function() {
        it('should limit capacity of queue if provided', function() {
            const q = new Barbeque(300)
            const _temp_arr = []
            for (let i = 0; i < 500; i++) {
                _temp_arr.push(i)
                q.push(i)
            }
            expect(q.length).to.equal(300)
            for (let i = 0; i < 300; i++) {
                expect(q.get(i)).to.equal(_temp_arr[200 + i])
            }
            const _shift_arr = []
            for (let i = 0; i < 50; i++) {
                _shift_arr.push(i)
                q.unshift(i)
            }
            for (let i = 0; i < 50; i++) {
                expect(q.get(i)).to.equal(_shift_arr[49 - i])
            }
            for (let i = 0; i < 150; i++) {
                expect(q.get(i + 50)).to.equal(_temp_arr[200 + i])
            }
        })
    })

    describe('Barbeque#size', function() {
        it('should show size of queue', function() {
            const q = new Barbeque()
            let c = 0
            for (let i = 0; i < 50000; i++) {
                const n = Math.random()
                if (n < 0.25) {
                    q.push(i)
                    c++
                    expect(q.length).to.equal(c)
                } else if (0.25 <= n && n < 0.5) {
                    q.unshift(i)
                    c++
                    expect(q.size).to.equal(c)
                } else if (0.5 <= n && n < 0.75) {
                    if (!q.size) {
                        continue
                    }
                    q.shift()
                    c--
                    expect(q.length).to.equal(c)
                } else {
                    if (!q.size) {
                        continue
                    }
                    q.pop()
                    c--
                    expect(q.size).to.equal(c)
                }
            }
        })
    })

    describe('Barbeque#to_array', function() {
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
            expect(q.to_array()).to.eql(arr)
        })
    })

    describe('Barbeque#is_empty', function() {
        it('should show size of queue', function() {
            const q = new Barbeque()
            q.push(1)
            q.push(2)
            q.push(3)
            q.push(4)
            q.push(5)
            expect(q.length).to.equal(5)
            q.clear()
            expect(q.length).to.equal(0)
            expect(q.is_empty()).to.be.true
        })
    })
})
