// kifuManager.js
export function generateKifString(history, result, info) {
    const NL = "\r\n";
    let out = `#KIF version=2.0 encoding=UTF-8${NL}開始日時：${info.date}${NL}棋戦：${info.event}${NL}先手：${info.sente}${NL}後手：${info.gote}${NL}手数----指手---------消費時間--${NL}`;
    history.slice(1).forEach((h, i) => {
        out += `${(i + 1).toString().padStart(4, ' ')} ${h.moveStr.padEnd(12, ' ')} ( 0:00/00:)${NL}`;
    });
    if (result) out += `${history.length.toString().padStart(4, ' ')} 投了            ( 0:00/00:)${NL}`;
    return out;
}
