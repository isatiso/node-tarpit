/**
 * 内置字段查询类，提供了路径类型的定义。
 */
import { Path, PathValue } from './__types__'

export class Reference<T> {

    private _cache: {
        [path: string]: { value: any }
    } = {}

    constructor(public data: T) {
        this.data = data ?? {} as T
        this._cache[''] = { value: JSON.parse(JSON.stringify(this.data)) }
    }

    get(): T
    get<P extends Path<T>>(path: P): PathValue<T, P> | undefined;
    get<P extends Path<T>>(path: P, def: PathValue<T, P>): Exclude<PathValue<T, P>, undefined> ;
    get<P extends Path<T>>(path?: P, def?: PathValue<T, P>): T | PathValue<T, P> | undefined {
        if (!path) {
            return this._cache[''].value
        }
        if (this._cache[path] === undefined) {
            const paths = path.split('.')
            let data: any = this.data
            for (const p of paths) {
                data = data[p]
                if (data === undefined) {
                    break
                }
            }
            const final = data ?? def
            if (final !== undefined) {
                this._cache[path] = { value: JSON.parse(JSON.stringify(final)) }
            } else {
                this._cache[path] = { value: undefined }
            }
        }
        return this._cache[path].value as any
    }
}
