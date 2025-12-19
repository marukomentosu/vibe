import { P_MOVE } from './constants.js';

/**
 * 駒が物理的にそのマスへ動けるか（駒の利き）を判定
 */
export function canMove(board, fr, fc, tr, tc, owner) {
    const pData = board[fr][fc];
    if (!pData) return false;
    const dest = board[tr][tc];
    if (dest && dest.owner === owner) return false;

    const moves = P_MOVE[pData.p].m;
    const mult = (owner === 'sente') ? 1 : -1;

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

/**
 * 指定された側(turn)の玉が、相手の駒に狙われているか判定
 */
export function isCheck(board, turn) {
    let kingPos = null;
    // 1. 自分の玉を探す
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const p = board[r][c];
            if (p && p.owner === turn && (p.p === '玉' || p.p === '王')) {
                kingPos = { r, c }; break;
            }
        }
    }
    if (!kingPos) return false;

    // 2. 相手のすべての駒について、玉の位置に動けるか確認
    const opponent = (turn === 'sente') ? 'gote' : 'sente';
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const p = board[r][c];
            if (p && p.owner === opponent) {
                if (canMove(board, r, c, kingPos.r, kingPos.c, opponent)) return true;
            }
        }
    }
    return false;
}

/**
 * 「その手を指した後の局面」を作って、自玉が取られる状態にならないか確認
 */
export function isLegalMove(board, fr, fc, tr, tc, turn, isDrop = false, piece = null) {
    // 仮想盤面を作成
    const virtualBoard = JSON.parse(JSON.stringify(board));
    
    if (isDrop) {
        virtualBoard[tr][tc] = { p: piece, owner: turn };
    } else {
        virtualBoard[tr][tc] = virtualBoard[fr][fc];
        virtualBoard[fr][fc] = null;
    }

    // 指した後の盤面で、自分の玉が王手されていたら「非合法（王手放置）」
    return !isCheck(virtualBoard, turn);
}

/**
 * 詰み判定
 */
export function isCheckmate(board, hands, turn) {
    // 1. 現在、王手されているか確認（王手されていなければ詰みではない）
    if (!isCheck(board, turn)) return false;

    // 2. 盤上の駒を動かして王手を逃れられるか
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const p = board[r][c];
            if (p && p.owner === turn) {
                for (let tr = 0; tr < 9; tr++) {
                    for (let tc = 0; tc < 9; tc++) {
                        if (canMove(board, r, c, tr, tc, turn)) {
                            if (isLegalMove(board, r, c, tr, tc, turn)) return false;
                        }
                    }
                }
            }
        }
    }
    // 3. 持ち駒を打って王手を逃れられるか
    for (const [p, count] of Object.entries(hands[turn])) {
        if (count > 0) {
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (!board[r][c] && !checkIllegalDrop(board, p, r, c, turn, true)) {
                        if (isLegalMove(board, null, null, r, c, turn, true, p)) return false;
                    }
                }
            }
        }
    }
    return true; // どんな手を指しても王手から逃れられないなら詰み
}

export function checkIllegalDrop(board, p, r, c, turn, silent = false) {
    if (p === '歩') {
        for (let i = 0; i < 9; i++) {
            if (board[i][c]?.p === '歩' && board[i][c]?.owner === turn) {
                if (!silent) alert("反則：二歩です"); return true;
            }
        }
    }
    const isSente = (turn === 'sente');
    if (((p === '歩' || p === '香') && (isSente ? r === 0 : r === 8)) || (p === '桂' && (isSente ? r <= 1 : r >= 7))) {
        if (!silent) alert("反則：行き所のない場所に駒は打てません"); return true;
    }
    return false;
}
