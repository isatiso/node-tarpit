/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type MetaWrapperType = 'prototype_only' | 'property_only' | 'both'
export type MetaWrapperDefaultByFunction<T> = (prototype: any, property?: string) => Exclude<T, undefined>

/**
 * @private
 * 通过 reflect-metadata 存取元数据的工具。
 */
export function MetaWrapper<T = any>(metadata_key: string, type: 'prototype_only', default_by?: MetaWrapperDefaultByFunction<T>): (proto: any) => Meta<T | undefined>
export function MetaWrapper<T = any>(metadata_key: string, type: 'property_only', default_by?: MetaWrapperDefaultByFunction<T>): (proto: any, prop: string) => Meta<T | undefined>
export function MetaWrapper<T = any>(metadata_key: string, type: 'both', default_by?: MetaWrapperDefaultByFunction<T>): (proto: any, prop?: string) => Meta<T | undefined>
export function MetaWrapper<T = any>(metadata_key: string, type: MetaWrapperType, default_by?: MetaWrapperDefaultByFunction<T>): (proto: any, prop?: string) => Meta<T | undefined> {
    return function(prototype: any, property?: string): Meta<T | undefined> {
        return new Meta<T | undefined>(metadata_key, prototype, property, default_by)
    }
}

export class Meta<T> {

    private _exist: boolean | undefined

    constructor(
        private metadata_key: string,
        private target: any,
        private property?: string,
        private default_by?: MetaWrapperDefaultByFunction<T>,
    ) {
    }

    private _value: T | undefined = undefined

    /**
     * 获取数据。
     */
    get value(): T {
        if (!this.exist()) {
            return this._value as T
        }
        if (this._value === undefined) {
            if (this.property === undefined) {
                this._value = Reflect.getMetadata(this.metadata_key, this.target)
            } else {
                this._value = Reflect.getMetadata(this.metadata_key, this.target, this.property)
            }
        }
        return this._value as T
    }

    /**
     * 是否存在指定元数据。
     */
    exist(): this is Meta<Exclude<T, undefined>> {
        if (this._exist === undefined) {
            if (this.property === undefined) {
                this._exist = Reflect.hasMetadata(this.metadata_key, this.target)
            } else {
                this._exist = Reflect.hasMetadata(this.metadata_key, this.target, this.property)
            }
        }
        return this._exist
    }

    /**
     * 当 meta 存在时执行一些操作。
     */
    if_exist(exec: (meta: Exclude<T, undefined>) => void): this {
        if (this.exist()) {
            exec(this.value as Exclude<T, undefined>)
        }
        return this
    }

    /**
     * 设置元数据。
     *
     * @param value
     */
    set(value: Exclude<T, undefined>): Meta<Exclude<T, undefined>> {
        if (this.property === undefined) {
            Reflect.defineMetadata(this.metadata_key, value, this.target)
        } else {
            Reflect.defineMetadata(this.metadata_key, value, this.target, this.property)
        }
        this._value = value
        this._exist = true
        return this as any
    }

    /**
     * 设置元数据默认值。
     *
     * @param value
     */
    ensure_default<R extends Exclude<T, undefined> = Exclude<T, undefined>>(value?: R): Meta<R> {
        if (!this.exist()) {
            const metadata_value = value ?? this.default_by?.(this.target, this.property)
            if (this.property === undefined) {
                Reflect.defineMetadata(this.metadata_key, metadata_value, this.target)
            } else {
                Reflect.defineMetadata(this.metadata_key, metadata_value, this.target, this.property)
            }
            this._exist = true
        }
        return this as any
    }

    /**
     * do something。
     */
    do(something: (value: T) => void): this {
        const value = this.value
        something(value)
        return this
    }

    /**
     * do something。
     */
    convert<R>(func: (value: T) => R): R {
        const value = this.value
        return func(value)
    }

    /**
     * 清除元数据。
     */
    clear() {
        if (this.property === undefined) {
            Reflect.deleteMetadata(this.metadata_key, this.target)
        } else {
            Reflect.deleteMetadata(this.metadata_key, this.target, this.property)
        }
        this._exist = false
    }
}
