/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
