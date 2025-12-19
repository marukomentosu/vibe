// 画面表示（UI）に関する処理をまとめたファイル
export function renderBoard(board, selected, lastPos, legalMoves, onCellClick) {
    const boardEl = document.getElementById('board');
    if (!boardEl) return;
    boardEl.innerHTML = '';

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.createElement('div');
            const isSelected = selected?.type === 'board' && selected.r === r && selected.c === c;
            const isLastMove = lastPos?.r === r && lastPos.c === c;
            
            cell.className = `cell ${isSelected ? 'selected' : ''} ${isLastMove ? 'last-move' : ''}`;
            
            const pieceData = board[r][c];
            if (pieceData) {
                const s = document.createElement('span');
                s.textContent = pieceData.p;
                if (pieceData.owner === 'gote') s.className = 'p-flip';
                cell.appendChild(s);
            }

            if (legalMoves.some(m => m.r === r && m.c === c)) {
                const dot = document.createElement('div');
                dot.className = 'legal-dot';
                cell.appendChild(dot);
            }

            cell.onclick = () => onCellClick(r, c);
            boardEl.appendChild(cell);
        }
    }
}

export function updateHandUI(owner, handData, selected, onHandClick) {
    const container = document.querySelector(`#hand-${owner} .hand-container`);
    if (!container) return;
    container.innerHTML = '';

    for (const [p, count] of Object.entries(handData)) {
        if (count > 0) {
            const el = document.createElement('div');
            const isSelected = selected?.type === 'hand' && selected.p === p && selected.owner === owner;
            el.className = `hand-piece ${owner === 'gote' ? 'p-flip' : ''} ${isSelected ? 'selected' : ''}`;
            el.innerHTML = `${p}${count > 1 ? count : ''}`;
            el.onclick = (e) => {
                e.stopPropagation();
                onHandClick(p, owner);
            };
            container.appendChild(el);
        }
    }
}

export function updateStatusMessage(result, turn, isViewingHistory) {
    const msg = document.getElementById('msg');
    if (!msg) return;
    if (result) {
        msg.textContent = result === 'sente_win' ? "先手勝ち" : "後手勝ち";
    } else {
        msg.textContent = isViewingHistory ? "棋譜閲覧中" : (turn === 'sente' ? "先手番" : "後手番");
    }
}

export function renderKifuList(history, currentIndex, onJump) {
    const log = document.getElementById('kifu-list');
    if (!log) return;
    log.innerHTML = '';
    history.forEach((h, i) => {
        const d = document.createElement('div');
        d.className = `kifu-line ${i === currentIndex ? 'active' : ''}`;
        d.textContent = `${i}: ${h.moveStr}`;
        d.onclick = () => onJump(i);
        log.appendChild(d);
    });
}
