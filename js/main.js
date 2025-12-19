import { P_MOVE } from './constants.js';
import { canMove, checkIllegalDrop, isCheck, isLegalMove, isCheckmate } from './gameLogic.js';
import { generateKifString } from './kifuManager.js';

let board, hands, turn, selected, history, currentIndex, result, isRotated = false, autoPlayTimer = null;

function init() {
    board = Array(9).fill().map(() => Array(9).fill(null));
    hands = { sente: { '歩':0,'香':0,'桂':0,'銀':0,'金':0,'角':0,'飛':0 }, gote: { '歩':0,'香':0,'桂':0,'銀':0,'金':0,'角':0,'飛':0 } };
    const setup = ['香','桂','銀','金','玉','金','銀','桂','香'];
    setup.forEach((p, c) => board[0][c] = {p, owner:'gote'});
    board[1][1] = {p:'飛', owner:'gote'}; board[1][7] = {p:'角', owner:'gote'};
    for(let i=0; i<9; i++) board[2][i] = {p:'歩', owner:'gote'};
    for(let i=0; i<9; i++) board[6][i] = {p:'歩', owner:'sente'};
    board[7][1] = {p:'角', owner:'sente'}; board[7][7] = {p:'飛', owner:'sente'};
    setup.forEach((p, c) => board[8][c] = {p: p==='玉'?'玉':p, owner:'sente'});
    turn = 'sente'; selected = null; history = []; result = null;
    saveHistory(null, null, null, null, "開始");
    render();
    syncDisplayNames();
}

function handleCellClick(r, c) {
    if (result || currentIndex !== history.length - 1) return;
    const clicked = board[r][c];

    if (selected?.type === 'hand') {
        if (!clicked && !checkIllegalDrop(board, selected.p, r, c, turn)) {
            // 合法手チェック（王手放置・自玉を晒す手の禁止）
            if (isLegalMove(board, null, null, r, c, turn, true, selected.p)) {
                executeMove(null, null, r, c, selected.p, true);
                selected = null;
            } else {
                alert("王手放置、または自玉を晒す手は指せません");
            }
        } else {
            selected = null;
        }
    } else if (selected) {
        if (selected.r === r && selected.c === c) {
            selected = null;
        } else if (canMove(board, selected.r, selected.c, r, c, turn)) {
            // 合法手チェック
            if (isLegalMove(board, selected.r, selected.c, r, c, turn)) {
                executeMove(selected.r, selected.c, r, c, selected.p);
                selected = null;
            } else {
                alert("王手放置、または自玉を晒す手は指せません");
            }
        } else if (clicked && clicked.owner === turn) {
            selected = { r, c, p: clicked.p, type: 'board' };
        } else {
            selected = null;
        }
    } else if (clicked && clicked.owner === turn) {
        selected = { r, c, p: clicked.p, type: 'board' };
    }
    render();
}

function executeMove(fr, fc, tr, tc, piece, isDrop = false) {
    let finalPiece = piece, suffix = "";
    const last = history[currentIndex].lastPos;
    const isSamePos = last && last.r === tr && last.c === tc;
    const posStr = isSamePos ? "同　" : "９８７６５４３２１"[tc] + "一二三四五六七八九"[tr];

    if (isDrop) {
        hands[turn][piece]--;
        suffix = "打";
    } else {
        if (board[tr][tc]) {
            const cap = board[tr][tc].p;
            const rev = {'と':'歩','杏':'香','圭':'桂','全':'銀','馬':'角','龍':'飛'};
            hands[turn][rev[cap] || cap]++;
        }
        if (P_MOVE[piece].up && ((turn === 'sente' && (fr <= 2 || tr <= 2)) || (turn === 'gote' && (fr >= 6 || tr >= 6)))) {
            if (confirm("成りますか？")) { finalPiece = P_MOVE[piece].up; suffix = "成"; } else suffix = "不成";
        }
        board[fr][fc] = null;
    }
    board[tr][tc] = { p: finalPiece, owner: turn };
    let moveStr = `${posStr}${finalPiece}${suffix}`;
    if (!isDrop) moveStr += `(${9-fc}${fr+1})`;
    
    saveHistory(tr, tc, fr, fc, moveStr);
    turn = (turn === 'sente' ? 'gote' : 'sente');

    // 指した直後に相手が詰んでいるか判定
    if (isCheckmate(board, hands, turn)) {
        result = (turn === 'sente' ? 'gote_win' : 'sente_win');
        alert(`詰みです。${result === 'sente_win' ? '先手' : '後手'}の勝ちです！`);
        saveHistory(null, null, null, null, "詰み");
    }
    render();
}

// --- その他の関数(render, saveHistory, getLegalMoves等) ---
// 前回のコードから変更ありませんが、getLegalMoves内でもisLegalMoveを呼ぶことで
// ドット表示も「王手を回避できる場所」だけに絞り込まれます。

function getLegalMoves() {
    if (!selected || result || currentIndex !== history.length-1) return [];
    let moves = [];
    for (let r=0; r<9; r++) for (let c=0; c<9; c++) {
        if (selected.type === 'hand') {
            if (!board[r][c] && !checkIllegalDrop(board, selected.p, r, c, turn, true)) {
                if (isLegalMove(board, null, null, r, c, turn, true, selected.p)) moves.push({r, c});
            }
        } else {
            if (canMove(board, selected.r, selected.c, r, c, turn)) {
                if (isLegalMove(board, selected.r, selected.c, r, c, turn)) moves.push({r, c});
            }
        }
    }
    return moves;
}

// ... 以下の補助関数（render, updateHandUI, window.xxx 等）は前回の回答と同じものをそのままお使いください ...
