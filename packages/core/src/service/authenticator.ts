/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { LiteContext } from '../http'
import { TpAuthInfo } from '../types'

/**
 * 授权服务接口，通过实现抽象类，实现一个授权服务。
 * Authenticator 的实现方式及 Provider 类型是可以自定义的。
 *
 * [[include:core/service/authenticator.md]]
 *
 * @category Abstract Service
 */
export abstract class Authenticator {

    /**
     * 对用户的请求进行授权校验。
     *
     * - 校验通过：返回 token 信息，比如用户信息。
     * - 校验不通过：可以返回 undefined，或者直接抛出异常。
     *   需要注意的是，此时抛出的异常会被捕获并认为返回了 undefined。
     *
     * @param ctx
     */
    abstract auth(ctx: LiteContext): Promise<TpAuthInfo | undefined>
}
