// 1. 短い振動
function playShort() {
    // 50ミリ秒だけ震える（チッという感じ）
    navigator.vibrate(50);
}

// 2. 長い振動
function playLong() {
    // 500ミリ秒（0.5秒）震える（ブーという感じ）
    navigator.vibrate(500);
}

// 3. リズム振動
function playRhythm() {
    // [振動, 休憩, 振動, 休憩...] の順番で指定
    // 200ms揺れる → 100ms休む → 200ms揺れる → 100ms休む → 500ms揺れる
    navigator.vibrate([200, 100, 200, 100, 500]);
}
