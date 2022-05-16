import { Matcher } from './matcher'

export type JudgementRule = RegExp | Matcher<(target: any) => boolean>

/**
 * 推断配置对象的合法路径。
 * **注意**：类型中不能出现 any，对于未知类型请使用 unknown。
 */
export type Path<T, Key extends keyof T = keyof T> =
    Key extends string
        ?
        Exclude<T[Key], undefined> extends Array<any>
            ?
            `${Key}.${Path<Exclude<T[Key], undefined>, Exclude<keyof Exclude<T[Key], undefined>, keyof Array<any> & string>>}` | Key
            :
            Exclude<T[Key], undefined> extends Record<string, any>
                ?
                `${Key}.${Path<Exclude<T[Key], undefined>>}` | Key
                :
                Key
        :
        never;

/**
 * 根据 Path 推断的路径返回对应值类型。
 */
export type PathValue<T extends Object, P extends Path<T>> =
    P extends `${infer Key}.${infer Rest}`
        ?
        Key extends keyof T
            ?
            Rest extends Path<Exclude<T[Key], undefined>>
                ?
                PathValue<Exclude<T[Key], undefined>, Rest>
                :
                never
            :
            never
        :
        P extends keyof T
            ?
            T[P]
            :
            never;

/**
 * 例如：
 * ```typescript
 * type A = { a: string, b: number, c: { c1: string, c2: number } }
 * type B = PathValueMap<A> => {
 *      'a': string
 *      'b': number
 *      'c': { c1: string, c2: number }
 *      'c.c1': string
 *      'c.c2': number
 * }
 * ```
 */
export type PathValueMap<T> = {
    [P in Path<T>]: PathValue<T, P>
}

/**
 * 过滤值为指定类型的 Path
 * ```typescript
 * type A = { a: string, b: number, c: { c1: string, c2: number } }
 * type B = PathOfType<A, string> => 'a' | 'c.c1'
 * ```
 */
export type PathOfType<T, M> = {
    [P in Path<T>]: PathValue<T, P> extends M ? P : never
}[Path<T>]

/**
 * PathValueMap 中保留值为指定类型的字段
 * ```typescript
 * type A = { a: string, b: number, c: { c1: string, c2: number } }
 * type B = PathValueMapOfType<A, string> => {
 *      'a': string
 *      'c.c1': string
 * }
 * ```
 */
export type PathValueMapOfType<T, M> = {
    [P in PathOfType<T, M>]: PathValue<T, P>
}
