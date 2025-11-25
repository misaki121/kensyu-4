/**
 * 勤怠管理アプリ - 設定ファイル
 * このファイルにGAS WebアプリURLとデフォルトのユーザー名を設定してください
 */

const APP_CONFIG = {
    // GAS WebアプリURL
    gasUrl: 'https://script.google.com/macros/s/AKfycbyoim7r09qe6OpOFLI6EAcHuIexq8jnJsyulU0lnbD6Um_d6sPhopkwmjr0dnowV4Gxdw/exec',

    // デフォルトのユーザー名（お好みで変更してください）
    defaultUserName: 'テストユーザー',

    // 設定モーダルを表示するかどうか
    // false: 設定モーダルを完全に省略（gasUrlとdefaultUserNameを使用）
    showSettingsModal: false
};

// 設定をエクスポート（グローバルスコープで使用可能にする）
window.APP_CONFIG = APP_CONFIG;
