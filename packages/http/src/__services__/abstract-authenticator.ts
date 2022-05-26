/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { LiteContext, TpHttpAuthInfo } from '../__types__'

/**
 * 授权服务接口，通过实现抽象类，实现一个授权服务。
 * AbstractAuthenticator 的实现方式及 Provider 类型是可以自定义的。
 *
 * [[include:core/service/authenticator.md]]
 *
 * @category Abstract Service
 */
export abstract class AbstractAuthenticator {

    /**
     * 对用户的请求进行授权校验。
     *
     * - 校验通过：返回 token 信息，比如用户信息。
     * - 校验不通过：可以返回 undefined，或者直接抛出异常。
     *   需要注意的是，此时抛出的异常会被捕获并认为返回了 undefined。
     *
     * @param ctx
     */
    abstract auth(ctx: LiteContext): Promise<TpHttpAuthInfo | undefined>
}
