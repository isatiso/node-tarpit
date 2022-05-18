/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

export class Stranger {

    private board = new Set<any>()

    mark(quit_announcer: Promise<void>) {
        this.board.add(quit_announcer)
    }

    async wait_all_quit() {
        await Promise.all(this.board)
    }
}
