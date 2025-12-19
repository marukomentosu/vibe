// 主要な変数
let state = {
    board: [],
    hands: { sente: {}, gote: {} },
    turn: 'sente',
    history: [],
    currentIndex: 0,
    selected: null
};

// 描画関数
function render() {
    // board要素の中身をクリアして、state.boardに合わせてdivを作成・配置する処理
    // ...
}

// 駒を動かすメイン処理
function executeMove(fr, fc, tr, tc, piece, isDrop = false) {
    // 1. boardの状態を更新
    // 2. 持ち駒の増減
    // 3. 成りの判定
    // 4. historyに保存
    // 5. render()を呼ぶ
}
