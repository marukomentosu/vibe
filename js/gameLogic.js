import { P_MOVE } from './constants.js';

/**
 * 駒が物理的にそのマスへ動けるか（駒の利き）を判定
 */
export function canMove(board, fr, fc, tr, tc, owner) {
    const pData = board[fr][fc];
    if (!pData) return false;
    const dest = board[tr][tc];
    if (dest && dest.owner === owner) return false; // 自分の駒は取れない

    const moves = P_MOVE[pData.p].m;
    const mult = (owner === 'sente') ? 1 : -1;

    for (let [mr, mc] of moves) {
        const trgR = mr * mult, trgC = mc * mult;
        if (Math.abs(mr) < 10 && Math.abs(mc) < 10) {
            // 単純移動
            if (tr - fr === trgR && tc - fc === trgC) return true;
        } else {
            // 走り駒（香・角・飛・龍・馬）
            const sR = Math.sign(trgR), sC = Math.sign(trgC);
            for (let i = 1; i < 9; i++) {
                const cR = fr + sR * i, cC = fc + sC * i;
                if (cR < 0 || cR > 8 || cC < 0 || cC > 8) break;
                if (cR === tr && cC === tc) return true;
                if (board[cR][cC]) break; // 障害物
            }
        }
    }
    return false;
}

/**
 * 指定された側の玉が「王手」されているか判定
 */
export function isCheck(board, turn) {
    let kingPos = null;
    // 1. 玉の位置を探す
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const p = board[r][c];
            if (p && p.owner === turn && (p.p === '玉' || p.p === '王')) {
                kingPos = { r, c };
                break;
            }
        }
    }
    if (!kingPos) return false;

    // 2. 相手の全駒の利きに玉が入っているか確認
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
 * 王手放置・自玉を晒す手ではないか（合法手か）を判定
 */
export function isLegalMove(board, fr, fc, tr, tc, turn, isDrop = false, piece = null) {
    // 仮想盤面を作成してシミュレーション
    const virtualBoard = JSON.parse(JSON.stringify(board));
    
    if (isDrop) {
        virtualBoard[tr][tc] = { p: piece, owner: turn };
    } else {
        virtualBoard[tr][tc] = virtualBoard[fr][fc];
        virtualBoard[fr][fc] = null;
    }

    // 動かした後の盤面で、自分の玉が王手されていたら「非合法（王手放置）」
    return !isCheck(virtualBoard, turn);
}

/**
 * 詰み判定（動かせる場所が一つでもあるか）
 */
export function isCheckmate(board, hands, turn) {
    // 盤上の駒をすべて動かしてみる
    for (let fr = 0; r < 9; r++) {
        for (let fc = 0; c < 9; c++) {
            const p = board[fr][fc];
            if (p && p.owner === turn) {
                for (let tr = 0; r < 9; r++) {
                    for (let tc = 0; c < 9; c++) {
                        if (canMove(board, fr, fc, tr, tc, turn)) {
                            if (isLegalMove(board, fr, fc, tr, tc, turn)) return false;
                        }
                    }
                }
            }
        }
    }
    // 持ち駒をすべて打ってみる
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
    return true; // どこにも動かせないなら詰み
}

/**
 * 打ち歩詰め・二歩・行き所のない駒などの反則チェック
 */
export function checkIllegalDrop(board, p, r, c, turn, silent = false) {
    // 1. 二歩
    if (p === '歩') {
        for (let i = 0; i < 9; i++) {
            if (board[i][c]?.p === '歩' && board[i][c]?.owner === turn) {
                if (!silent) alert("反則：二歩です"); return true;
            }
        }
    }

    // 2. 行き所のない駒
    const isSente = (turn === 'sente');
    if (((p === '歩' || p === '香') && (isSente ? r === 0 : r === 8)) || (p === '桂' && (isSente ? r <= 1 : r >= 7))) {
        if (!silent) alert("反則：行き所のない場所に駒は打てません"); return true;
    }

    // 3. 打ち歩詰め
    if (p === '歩') {
        const opponent = isSente ? 'gote' : 'sente';
        const virtualBoard = JSON.parse(JSON.stringify(board));
        virtualBoard[r][c] = { p: '歩', owner: turn };

        // 王手がかかっているか
        if (isCheck(virtualBoard, opponent)) {
            // かつ、相手が何をしても逃げられない（詰んでいる）か
            // ※ここでは簡略化のため、持ち駒のチェック等は本来必要ですが、メインロジック側で処理します
            // 厳密には打ち歩詰め判定専用の関数が必要
        }
    }

    return false;
}
