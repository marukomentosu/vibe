// main.js
import { P_MOVE } from './constants.js';
import { canMove, checkIllegalDrop } from './gameLogic.js';
import { generateKifString } from './kifuManager.js';

let board, hands, turn, selected, history, currentIndex, result, isRotated = false, autoPlayTimer = null;

// --- 初期化 ---
function init() {
    board = Array(9).fill().map(() => Array(9).fill(null));
    hands = { sente: { '歩':0,'香':0,'桂':0,'銀':0,'金':0,'角':0,'飛':0 }, gote: { '歩':0,'香':0,'桂':0,'銀':0,'金':0,'角':0,'飛':0 } };
    const l1 = ['香','桂','銀','金','玉','金','銀','桂','香'];
    l1.forEach((p, c) => board[0][c] = {p, owner:'gote'});
    board[1][1] = {p:'飛', owner:'gote'}; board[1][7] = {p:'角', owner:'gote'};
    for(let i=0; i<9; i++) board[2][i] = {p:'歩', owner:'gote'};
    for(let i=0; i<9; i++) board[6][i] = {p:'歩', owner:'sente'};
    board[7][1] = {p:'角', owner:'sente'}; board[7][7] = {p:'飛', owner:'sente'};
    l1.forEach((p, c) => board[8][c] = {p: p==='玉'?'玉':p, owner:'sente'});
    turn = 'sente'; selected = null; history = []; result = null; stopAutoPlay();
    
    const n = new Date();
    const dateInput = document.getElementById('date-text');
    if(dateInput) dateInput.value = `${n.getFullYear()}/${(n.getMonth()+1).toString().padStart(2,'0')}/${n.getDate().toString().padStart(2,'0')}`;
    
    saveHistory(null, null, null, null, "開始");
    render();
    syncDisplayNames();
}

// --- 描画系 ---
function render() {
    const state = history[currentIndex];
    const boardEl = document.getElementById('board');
    if(!boardEl) return;
    boardEl.innerHTML = '';
    
    const lastP = (currentIndex > 0) ? state.lastPos : null;
    const legalMoves = getLegalMoves();

    for (let r=0; r<9; r++) {
        for (let c=0; c<9; c++) {
            const cell = document.createElement('div');
            cell.className = `cell ${selected?.type==='board'&&selected.r===r&&selected.c===c?'selected':''} ${lastP?.r===r&&lastP.c===c?'last-move':''}`;
            const d = state.board[r][c];
            if (d) {
                const s = document.createElement('span');
                s.textContent = d.p;
                if (d.owner === 'gote') s.className = 'p-flip';
                cell.appendChild(s);
            }
            if (legalMoves.some(m => m.r === r && m.c === c)) {
                const dot = document.createElement('div');
                dot.className = 'legal-dot';
                cell.appendChild(dot);
            }
            if (!result && currentIndex === history.length - 1) cell.onclick = () => { stopAutoPlay(); handleCellClick(r, c); };
            boardEl.appendChild(cell);
        }
    }
    updateHandUI('sente', state.hands.sente);
    updateHandUI('gote', state.hands.gote);
    updateStatus();
    updateKifuList();
}

// --- 操作・ロジック系 (中略: 元のコードのexecuteMove, saveHistory等) ---
// ※ 誌面の都合上、重要な架け橋部分を重点的に記述します

function handleCellClick(r, c) {
    const clicked = board[r][c];
    if (selected?.type === 'hand') {
        if (!clicked && !checkIllegalDrop(board, selected.p, r, c, turn)) executeMove(null, null, r, c, selected.p, true);
        selected = null;
    } else if (selected) {
        if (selected.r === r && selected.c === c) selected = null;
        else if (canMove(board, selected.r, selected.c, r, c, turn)) { executeMove(selected.r, selected.c, r, c, selected.p); selected = null; }
        else if (clicked && clicked.owner === turn) selected = { r, c, p: clicked.p, type: 'board' };
        else selected = null;
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
    render();
}

function saveHistory(tr, tc, fr, fc, moveStr) {
    history.push({ 
        board: JSON.parse(JSON.stringify(board)), 
        hands: JSON.parse(JSON.stringify(hands)), 
        lastPos: {r: tr, c: tc}, 
        moveStr, 
        turn 
    });
    currentIndex = history.length - 1;
}

// --- 他のユーティリティ関数（getLegalMoves, stopAutoPlayなど）もここに配置 ---
function stopAutoPlay() {
    if (autoPlayTimer) { clearInterval(autoPlayTimer); autoPlayTimer = null; }
    const btn = document.getElementById('autoplay-btn');
    if (btn) btn.textContent = "自動再生 開始";
}

function getLegalMoves() {
    if (!selected || result || currentIndex !== history.length-1) return [];
    let moves = [];
    for (let r=0; r<9; r++) {
        for (let c=0; c<9; c++) {
            if (selected.type === 'hand') {
                if (!board[r][c] && !checkIllegalDrop(board, selected.p, r, c, turn, true)) moves.push({r, c});
            } else {
                if (canMove(board, selected.r, selected.c, r, c, turn)) moves.push({r, c});
            }
        }
    }
    return moves;
}

// --- HTMLのonclickに公開する設定 ---
window.jumpTo = (idx) => { currentIndex = idx; selected = null; render(); };
window.prevMove = () => { stopAutoPlay(); if (currentIndex > 0) window.jumpTo(currentIndex - 1); };
window.nextMove = () => { if (currentIndex < history.length - 1) window.jumpTo(currentIndex + 1); else stopAutoPlay(); };
window.undoMove = () => {
    stopAutoPlay(); if (history.length <= 1) return;
    history.pop();
    board = JSON.parse(JSON.stringify(history[history.length-1].board));
    hands = JSON.parse(JSON.stringify(history[history.length-1].hands));
    turn = history[history.length-1].turn; result = null;
    currentIndex = history.length - 1; selected = null;
    render();
};
window.toggleRotate = () => {
    isRotated = !isRotated;
    document.getElementById('board').classList.toggle('rotated');
    document.getElementById('main-container').classList.toggle('rotated');
};
window.toggleKifu = (show) => { document.getElementById('kifu-overlay').style.display = show ? 'flex' : 'none'; };
window.resetGame = () => { if (confirm("リセットしますか？")) init(); };
window.resignGame = () => {
    if (result || !confirm("投了しますか？")) return;
    result = (turn==='sente'?'gote_win':'sente_win');
    saveHistory(null,null,null,null,"投了");
    render();
};
window.openSettings = (m) => {
    document.getElementById('modal-overlay').style.display='flex';
    document.getElementById('filename-area').style.display = (m==='save'?'block':'none');
    document.getElementById('save-final-btn').style.display = (m==='save'?'block':'none');
};
window.closeSettings = () => { document.getElementById('modal-overlay').style.display='none'; syncDisplayNames(); };
window.executeDownload = () => {
    const info = {
        sente: document.getElementById('sente-input').value || "先手",
        gote: document.getElementById('gote-input').value || "後手",
        event: document.getElementById('event').value || "対局",
        date: document.getElementById('date-text').value
    };
    const kif = generateKifString(history, result, info);
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), kif], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `${document.getElementById('filename-input').value || "shogi"}.kif`;
    a.click();
    window.closeSettings();
};

// --- ヘルパー関数群 ---
function syncDisplayNames() { /* 名前更新 */ }
function updateHandUI(owner, handData) { /* 駒台更新 */ }
function updateStatus() { /* 状態表示更新 */ }
function updateKifuList() { /* 棋譜リスト更新 */ }

init();
