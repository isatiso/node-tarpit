/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Disabled, get_class_decorator, Optional } from '@tarpit/core'
import { expect } from 'chai'
import { Task, TpSchedule } from '../annotations'
import { collect_tasks } from './collect-tasks'

describe('collect-tasks.ts', function() {

    describe('#collect_tasks()', function() {

        it('should collect tasks from TpSchedule', async function() {

            @TpSchedule()
            class TempSchedule {

                @Task('15 * * * *', '清除缓存')
                async clear_cache() {

                }

                @Task('15 6 */2 * *', '检查订单', { utc: true })
                async check_order() {

                }

                @Disabled()
                @Task('15 6 */2 * *', '检查订单（暂时禁用）')
                async temp_check_order() {

                }
            }

            const meta = get_class_decorator(TempSchedule).find(token => token instanceof TpSchedule)
            expect(meta).to.exist
            const units = collect_tasks(meta)
            expect(units).to.be.an('array').with.lengthOf(2)
        })

        it('should return empty array if given schedule meta has no unit', function() {

            @TpSchedule()
            class TestSchedule {
            }

            const meta = get_class_decorator(TestSchedule).find(token => token instanceof TpSchedule)
            expect(meta).to.exist
            const units = collect_tasks(meta)
            expect(units).to.be.an('array').with.lengthOf(0)
        })

        it('should discard unit if its value is not function', function() {

            @TpSchedule()
            class TestSchedule {

                @Task('15 6 */2 * *', '检查订单（暂时禁用）')
                m: string = 'asd'
            }

            const meta = get_class_decorator(TestSchedule).find(token => token instanceof TpSchedule)
            expect(meta).to.exist
            const units = collect_tasks(meta)
            expect(units).to.be.an('array').with.lengthOf(0)
        })

        it('should ignore unknown decorator', function() {

            @TpSchedule()
            class TestSchedule {

                @Optional()
                @Task('15 6 */2 * *', '检查订单', { utc: true })
                async check_order() {

                }
            }

            const meta = get_class_decorator(TestSchedule).find(token => token instanceof TpSchedule)
            expect(meta).to.exist
            const units = collect_tasks(meta)
            expect(units).to.be.an('array').with.lengthOf(1)
        })
    })
})
