import { P_MOVE } from './constants.js';
import { canMove, checkIllegalDrop, isLegalMove, isCheckmate } from './gameLogic.js';
import { generateKifString } from './kifuManager.js';
import * as UI from './ui.js';

// --- ゲーム状態（State） ---
let board, hands, turn, selected, history, currentIndex, result, autoPlayTimer = null;

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

    turn = 'sente'; 
    selected = null; 
    history = []; 
    result = null;

    // 初期状態を保存（ここではturnはsente）
    saveHistory(null, null, null, null, "開始");
    render();
    syncDisplayNames();
}

function render() {
    const state = history[currentIndex];
    const legalMoves = getLegalMoves();

    // 描画には「現在の盤面」「現在の持ち駒」「現在の手番」を使う
    UI.renderBoard(board, selected, state.lastPos, legalMoves, handleCellClick);
    UI.updateHandUI('sente', hands.sente, selected, handleHandClick);
    UI.updateHandUI('gote', hands.gote, selected, handleHandClick);
    UI.updateStatusMessage(result, turn, currentIndex < history.length - 1);
    UI.renderKifuList(history, currentIndex, window.jumpTo);
}

// --- ハンドラー ---
function handleHandClick(p, owner) {
    if (result || currentIndex !== history.length - 1 || turn !== owner) return;
    selected = (selected?.type === 'hand' && selected.p === p) ? null : { type: 'hand', p, owner };
    render();
}

function handleCellClick(r, c) {
    if (result || currentIndex !== history.length - 1) return;
    const clicked = board[r][c];

    if (selected) {
        if (selected.type === 'hand') {
            if (!clicked && !checkIllegalDrop(board, selected.p, r, c, turn)) {
                if (isLegalMove(board, null, null, r, c, turn, true, selected.p)) {
                    executeMove(null, null, r, c, selected.p, true);
                    selected = null;
                } else { alert("王手放置です"); }
            } else if (clicked?.owner === turn) {
                selected = { r, c, p: clicked.p, type: 'board' };
            } else { selected = null; }
        } else {
            if (selected.r === r && selected.c === c) {
                selected = null;
            } else if (canMove(board, selected.r, selected.c, r, c, turn)) {
                if (isLegalMove(board, selected.r, selected.c, r, c, turn)) {
                    executeMove(selected.r, selected.c, r, c, selected.p);
                    selected = null;
                } else { alert("王手放置です"); }
            } else if (clicked?.owner === turn) {
                selected = { r, c, p: clicked.p, type: 'board' };
            } else { selected = null; }
        }
    } else if (clicked?.owner === turn) {
        selected = { r, c, p: clicked.p, type: 'board' };
    }
    render();
}

function executeMove(fr, fc, tr, tc, piece, isDrop = false) {
    let finalPiece = piece, suffix = "";
    const last = history[currentIndex].lastPos;
    const posStr = (last && last.r === tr && last.c === tc) ? "同　" : "９８７６５４３２１"[tc] + "一二三四五六七八九"[tr];

    // 1. 盤面と持ち駒の更新
    if (isDrop) {
        hands[turn][piece]--; suffix = "打";
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
    
    const moveStr = `${posStr}${finalPiece}${suffix}${isDrop?'':`(${9-fc}${fr+1})`}`;

    // 2. 手番を交代する（保存する前に交代！）
    turn = (turn === 'sente' ? 'gote' : 'sente');

    // 3. 交代後の手番を含めて履歴に保存
    saveHistory(tr, tc, fr, fc, moveStr);
    
    // 4. 詰み判定（新しく手番になった人が詰んでいるか）
    if (isCheckmate(board, hands, turn)) {
        result = (turn === 'sente' ? 'gote_win' : 'sente_win');
        alert(`詰みです。${result === 'sente_win' ? '先手' : '後手'}の勝ちです！`);
        saveHistory(null, null, null, null, "詰み");
    }
    render();
}

// --- 補助関数 ---
function saveHistory(tr, tc, fr, fc, moveStr) {
    history.push({ 
        board: JSON.parse(JSON.stringify(board)), 
        hands: JSON.parse(JSON.stringify(hands)), 
        lastPos: {r: tr, c: tc}, 
        moveStr, 
        turn // ここに保存されるのは「次に指すべき人の手番」
    });
    currentIndex = history.length - 1;
}

function getLegalMoves() {
    if (!selected || result || currentIndex !== history.length-1) return [];
    let moves = [];
    for (let r=0; r<9; r++) for (let c=0; c<9; c++) {
        if (selected.type === 'hand') {
            if (!board[r][c] && !checkIllegalDrop(board, selected.p, r, c, turn, true) && isLegalMove(board, null, null, r, c, turn, true, selected.p)) moves.push({r, c});
        } else if (canMove(board, selected.r, selected.c, r, c, turn) && isLegalMove(board, selected.r, selected.c, r, c, turn)) {
            moves.push({r, c});
        }
    }
    return moves;
}

function syncDisplayNames() {
    const s = document.getElementById('sente-input').value || "先手";
    const g = document.getElementById('gote-input').value || "後手";
    document.getElementById('name-display-sente').textContent = s + (result==='sente_win'?' ○':'');
    document.getElementById('name-display-gote').textContent = g + (result==='gote_win'?' ○':'');
}

// --- Global Functions (一手戻すロジックを修正) ---
window.undoMove = () => {
    if (history.length <= 1) return;
    
    // 現在の最新の一手を削除
    history.pop();
    
    // 一つ前の状態を読み出す
    const lastState = history[history.length - 1];
    
    // グローバルな変数に復元
    board = JSON.parse(JSON.stringify(lastState.board));
    hands = JSON.parse(JSON.stringify(lastState.hands));
    turn = lastState.turn; 
    currentIndex = history.length - 1;
    result = null;
    
    render();
};

window.jumpTo = (i) => { 
    currentIndex = i; 
    const state = history[i];
    board = JSON.parse(JSON.stringify(state.board));
    hands = JSON.parse(JSON.stringify(state.hands));
    turn = state.turn;
    selected = null; 
    render(); 
};

window.prevMove = () => { if (currentIndex > 0) window.jumpTo(currentIndex - 1); };
window.nextMove = () => { if (currentIndex < history.length - 1) window.jumpTo(currentIndex + 1); };

window.toggleRotate = () => {
    document.getElementById('board').classList.toggle('rotated');
    document.getElementById('main-container').classList.toggle('rotated');
};

window.toggleKifu = (show) => { document.getElementById('kifu-overlay').style.display = show ? 'flex' : 'none'; };
window.resetGame = () => { if (confirm("リセットしますか？")) init(); };

window.resignGame = () => {
    if (result || !confirm("投了しますか？")) return;
    result = (turn === 'sente' ? 'gote_win' : 'sente_win');
    saveHistory(null, null, null, null, "投了");
    render(); syncDisplayNames();
};

window.openSettings = (m) => {
    document.getElementById('modal-overlay').style.display='flex';
    document.getElementById('filename-area').style.display = (m==='save'?'block':'none');
    document.getElementById('save-final-btn').style.display = (m==='save'?'block':'none');
};
window.closeSettings = () => { document.getElementById('modal-overlay').style.display='none'; syncDisplayNames(); };

window.executeDownload = () => {
    const info = { sente: document.getElementById('sente-input').value || "先手", gote: document.getElementById('gote-input').value || "後手", event: document.getElementById('event').value || "対局", date: document.getElementById('date-text').value };
    const kif = generateKifString(history, result, info);
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), kif], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `${document.getElementById('filename-input').value || "shogi"}.kif`;
    a.click();
    window.closeSettings();
};

window.toggleAutoPlay = () => {
    if (autoPlayTimer) { 
        clearInterval(autoPlayTimer); autoPlayTimer = null; 
        document.getElementById('autoplay-btn').textContent = "自動再生 開始"; 
    } else {
        autoPlayTimer = setInterval(() => { 
            if (currentIndex < history.length - 1) window.nextMove(); 
            else window.toggleAutoPlay(); 
        }, 1000);
        document.getElementById('autoplay-btn').textContent = "停止";
    }
};

init();
