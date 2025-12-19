// 棋譜の書き出し（.kif形式）
export function generateKifString(history, result, details) {
    const { sente, gote, event, date } = details;
    const NL = "\r\n";
    let out = `#KIF version=2.0 encoding=UTF-8${NL}# ---- Kifu Export ----${NL}`;
    out += `開始日時：${date}${NL}棋戦：${event}${NL}先手：${sente}${NL}後手：${gote}${NL}手数----指手---------消費時間--${NL}`;
    
    history.slice(1).forEach((h, i) => {
        const num = (i + 1).toString().padStart(4, ' ');
        out += `${num} ${h.moveStr.padEnd(12, ' ')} ( 0:00/00:)${NL}`;
    });

    if (result) {
        out += `${(history.length).toString().padStart(4, ' ')} 投了 ( 0:00/00:)${NL}`;
    }
    return out;
}
