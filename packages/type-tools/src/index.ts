/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
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

export type PathValue<T, P extends Path<T>> =
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
    [P in Path<T>]: M extends Exclude<PathValue<T, P>, undefined> ? P : never
}[Path<T>]

export type PathValueMapOfType<T, M> = {
    [P in PathOfType<T, M>]: PathValue<T, P>
}

export const name = 'type-tools'

export type KeysOfType<T extends {}, M> = keyof T & keyof { [K in keyof T as T[K] extends M ? K : never]: 0 }

export type Callable = (...args: any) => any
