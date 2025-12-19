// gameLogic.js
import { P_MOVE } from './constants.js';

export function canMove(board, fr, fc, tr, tc, owner) {
    const pData = board[fr][fc];
    if (!pData) return false;
    const dest = board[tr][tc];
    if (dest && dest.owner === owner) return false;
    const moves = P_MOVE[pData.p].m, mult = owner === 'sente' ? 1 : -1;
    for (let [mr, mc] of moves) {
        const trgR = mr * mult, trgC = mc * mult;
        if (Math.abs(mr) < 10 && Math.abs(mc) < 10) {
            if (tr - fr === trgR && tc - fc === trgC) return true;
        } else {
            const sR = Math.sign(trgR), sC = Math.sign(trgC);
            for (let i = 1; i < 9; i++) {
                const cR = fr + sR * i, cC = fc + sC * i;
                if (cR < 0 || cR > 8 || cC < 0 || cC > 8) break;
                if (cR === tr && cC === tc) return true;
                if (board[cR][cC]) break;
            }
        }
    }
    return false;
}

export function checkIllegalDrop(board, p, r, c, turn, silent = false) {
    if (p === '歩') {
        for (let i = 0; i < 9; i++) {
            if (board[i][c]?.p === '歩' && board[i][c]?.owner === turn) {
                if (!silent) alert("二歩です"); return true;
            }
        }
    }
    const isSente = turn === 'sente';
    if (((p === '歩' || p === '香') && (isSente ? r === 0 : r === 8)) || (p === '桂' && (isSente ? r <= 1 : r >= 7))) {
        if (!silent) alert("行き所のない駒です"); return true;
    }
    return false;
}
