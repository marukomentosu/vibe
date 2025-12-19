function playShort() {
    console.log("ボタンが押されました"); // 確認用メッセージ
    
    if (navigator.vibrate) {
        alert("バイブ機能は存在します。これから振るわせます！");
        navigator.vibrate(50);
    } else {
        alert("このブラウザ・端末はバイブに対応していません！");
    }
}
