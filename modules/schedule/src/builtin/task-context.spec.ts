/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Dora } from '@tarpit/dora'
import { describe, it, expect } from 'vitest'
import { TaskUnit } from '../tools/collect-tasks'
import { Bullet } from './bullet'
import { TaskContext } from './task-context'

describe('task-context.ts', function() {

    describe('TaskContext', function() {

        describe('#from()', function() {

            it('should create instance of TaskContext', function() {
                const res = TaskContext.from({ id: 'bullet-1', unit: {} as TaskUnit, execution: Dora.from([2022, 6, 1, 13, 24, 56], { timezone: 'Asia/Shanghai' }) } as Bullet)
                expect(res).toBeInstanceOf(TaskContext)
            })
        })

        describe('.count', function() {

            it('should return count of context', function() {
                const res = TaskContext.from({ id: 'bullet-1', unit: {} as TaskUnit, execution: Dora.from([2022, 6, 1, 13, 24, 56], { timezone: 'Asia/Shanghai' }) } as Bullet)
                expect(res.count).toEqual(0)
            })
        })

        describe('.incr()', function() {

            it('should increase count of context and return it', function() {
                const res = TaskContext.from({ id: 'bullet-1', unit: {} as TaskUnit, execution: Dora.from([2022, 6, 1, 13, 24, 56], { timezone: 'Asia/Shanghai' }) } as Bullet)
                expect(res.count).toEqual(0)
                expect(res.incr()).toEqual(1)
                expect(res.count).toEqual(1)
                expect(res.incr()).toEqual(2)
                expect(res.count).toEqual(2)
            })
        })

        describe('.retry_limit', function() {

            it('should return retry_limit of context', function() {
                const res = TaskContext.from({ id: 'bullet-1', unit: {} as TaskUnit, execution: Dora.from([2022, 6, 1, 13, 24, 56], { timezone: 'Asia/Shanghai' }) } as Bullet)
                expect(res.retry_limit).toEqual(0)
            })
        })

        describe('.set_retry_limit()', function() {

            it('should set retry limit only once', function() {
                const res = TaskContext.from({ id: 'bullet-1', unit: {} as TaskUnit, execution: Dora.from([2022, 6, 1, 13, 24, 56], { timezone: 'Asia/Shanghai' }) } as Bullet)
                expect(res.retry_limit).toEqual(0)
                res.set_retry_limit(3)
                expect(res.retry_limit).toEqual(3)
                res.set_retry_limit(8)
                expect(res.retry_limit).toEqual(3)
                res.set_retry_limit(2)
                expect(res.retry_limit).toEqual(3)
            })
        })

        describe('.crontab', function() {

            it('should return crontab string of unit', function() {
                const res = TaskContext.from({
                    id: 'bullet-1', unit: {
                        crontab_str: '15 6 * * *'
                    } as TaskUnit, execution: Dora.from([2022, 6, 1, 13, 24, 56], { timezone: 'Asia/Shanghai' })
                } as Bullet)
                expect(res.crontab).toEqual('15 6 * * *')
            })
        })

        describe('.set() .get()', function() {

            it('should set value to context', function() {
                const res = TaskContext.from<{ k: string }>({ id: 'bullet-1', unit: {} as TaskUnit, execution: Dora.from([2022, 6, 1, 13, 24, 56], { timezone: 'Asia/Shanghai' }) } as Bullet)
                res.set('k', '123')
                expect(res.get('k')).toEqual('123')
            })
        })
    })
})
