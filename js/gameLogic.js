import { P_MOVE } from './constants.js';

// 指定した場所へ移動可能か判定
export function canMove(board, fr, fc, tr, tc, owner) {
    const pData = board[fr][fc];
    if (!pData) return false;
    const dest = board[tr][tc];
    if (dest && dest.owner === owner) return false; // 自分の駒がある場所には行けない

    const moves = P_MOVE[pData.p].m;
    const mult = owner === 'sente' ? 1 : -1;

    for (let [mr, mc] of moves) {
        const trgR = mr * mult;
        const trgC = mc * mult;

        if (Math.abs(mr) < 10 && Math.abs(mc) < 10) {
            // 通常の移動
            if (tr - fr === trgR && tc - fc === trgC) return true;
        } else {
            // 走り駒（飛・角・香）の移動
            const sR = Math.sign(trgR);
            const sC = Math.sign(trgC);
            for (let i = 1; i < 9; i++) {
                const cR = fr + sR * i, cC = fc + sC * i;
                if (cR < 0 || cR > 8 || cC < 0 || cC > 8) break;
                if (cR === tr && cC === tc) return true;
                if (board[cR][cC]) break; // 駒に当たったらそれ以上進めない
            }
        }
    }
    return false;
}

// 反則チェック（二歩・行き所のない駒）
export function checkIllegalDrop(board, turn, p, r, c, silent = false) {
    if (p === '歩') {
        for (let i = 0; i < 9; i++) {
            if (board[i][c]?.p === '歩' && board[i][c]?.owner === turn) {
                if (!silent) alert("二歩です");
                return true;
            }
        }
    }
    // 行き所のない駒の判定
    if (((p === '歩' || p === '香') && ((turn === 'sente' && r === 0) || (turn === 'gote' && r === 8))) ||
        (p === '桂' && ((turn === 'sente' && r <= 1) || (turn === 'gote' && r >= 7)))) {
        if (!silent) alert("行き所がありません");
        return true;
    }
    return false;
}
