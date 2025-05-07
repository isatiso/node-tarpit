export class FileLock {
    private _read = 0
    private readonly _write: boolean

    constructor(write?: boolean) {
        this._write = write ?? false
    }

    get reading() {
        return this._read > 0
    }

    get writing() {
        return this._write
    }

    get locked() {
        return this.writing || this.reading
    }

    get released() {
        return !this.writing && !this.reading
    }

    acquire_read() {
        this._read++
    }

    release_read() {
        this._read--
        return this.released
    }
}

export class FileLocker {

    private _locks: Map<string, FileLock> = new Map()

    async with_read_lock<T>(paths: string[], fn: () => Promise<T>): Promise<T> {
        return this._acquire_read_lock(paths).then(release => fn().finally(release))
    }

    async with_write_lock<T>(paths: string[], fn: () => Promise<T>): Promise<T> {
        return this._acquire_write_lock(paths).then(release => fn().finally(release))
    }

    /**
     * Acquires a read lock on a file path and all its ancestors
     * @param paths The list of file paths to lock
     * @returns A function to release the lock
     */
    private async _acquire_read_lock(paths: string[]): Promise<() => void> {
        const parts = [...new Set(paths.flatMap(p => this._get_ancestor_paths(p)))]
        await this._wait_for_write_locks(parts)
        for (const p of parts) {
            const lock = this._locks.get(p) || new FileLock()
            lock.acquire_read()
            this._locks.set(p, lock)
        }
        return () => {
            for (const p of parts) {
                if (this._locks.has(p) && this._locks.get(p)!.release_read()) {
                    this._locks.delete(p)
                }
            }
        }
    }

    /**
     * Acquires a write lock on a file path and all its ancestors
     * @param paths The list of file paths to lock
     * @returns A function to release the lock
     */
    private async _acquire_write_lock(paths: string[]): Promise<() => void> {
        const parts = [...new Set(paths.flatMap(p => this._get_ancestor_paths(p)))]
        await this._wait_for_all_locks(parts)
        parts.forEach(p => this._locks.set(p, new FileLock(true)))
        return () => parts.forEach(p => this._locks.delete(p))
    }

    /**
     * Extracts all ancestor paths including the path itself
     * @param path The path to get ancestors for
     * @returns Array of ancestor paths
     */
    private _get_ancestor_paths(path: string): string[] {
        const parts = path.split('/').filter(p => p)
        const paths: string[] = []

        let current_path = ''
        for (const part of parts) {
            current_path = current_path ? `${current_path}/${part}` : `/${part}`
            paths.push(current_path)
        }

        return paths
    }

    /**
     * Waits until no write locks exist on any of the given paths
     * @param paths Paths to check for write locks
     */
    private async _wait_for_write_locks(paths: string[]): Promise<void> {
        return new Promise<void>(resolve => {
            const check = () => {
                if (!paths.some(p => this._locks.get(p)?.writing)) {
                    resolve()
                } else {
                    setTimeout(check, 10)
                }
            }

            check()
        })
    }

    /**
     * Waits until no locks of any type exist on any of the given paths
     * @param paths Paths to check for locks
     */
    private async _wait_for_all_locks(paths: string[]): Promise<void> {
        return new Promise<void>(resolve => {
            const check = () => {
                if (!paths.some(p => this._locks.get(p)?.locked)) {
                    resolve()
                } else {
                    setTimeout(check, 10)
                }
            }

            check()
        })
    }
}
