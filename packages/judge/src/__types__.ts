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
 * 根据指定的配置路径推断配置内容。
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

export type PathValueMap<T> = {
    [P in Path<T>]: PathValue<T, P>
}

export type PathOfType<T, M> = {
    [P in Path<T>]: PathValue<T, P> extends M ? P : never
}[Path<T>]

export type PathValueMapOfType<T, M> = {
    [P in PathOfType<T, M>]: PathValue<T, P>
}
