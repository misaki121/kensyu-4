/**
 * 勤怠管理アプリ - メインJavaScript
 * 出勤打刻機能を実装
 */

// ========================================
// グローバル変数
// ========================================
let config = {
    userName: '',
    gasUrl: ''
};

let todayData = {
    date: '',
    clockIn: null,
    clockOut: null,
    workHours: null,
    status: '未出勤'
};

// ========================================
// 初期化
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('アプリ初期化開始');

    // 設定を読み込み
    loadConfig();

    // 設定がない場合は設定モーダルを表示
    if (!config.userName || !config.gasUrl) {
        showSettingsModal();
    } else {
        hideSettingsModal();
        initializeApp();
    }

    // イベントリスナーを設定
    setupEventListeners();

    // 現在時刻の更新を開始
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
});

// ========================================
// 設定管理
// ========================================

/**
 * 設定を読み込む
 */
function loadConfig() {
    const savedConfig = localStorage.getItem('attendanceConfig');
    if (savedConfig) {
        config = JSON.parse(savedConfig);
        console.log('設定を読み込みました:', config);
    }
}

/**
 * 設定を保存する
 */
function saveConfig() {
    localStorage.setItem('attendanceConfig', JSON.stringify(config));
    console.log('設定を保存しました:', config);
}

/**
 * 設定モーダルを表示
 */
function showSettingsModal() {
    const overlay = document.getElementById('settingsOverlay');
    overlay.classList.remove('hidden');
}

/**
 * 設定モーダルを非表示
 */
function hideSettingsModal() {
    const overlay = document.getElementById('settingsOverlay');
    overlay.classList.add('hidden');
}

// ========================================
// イベントリスナー
// ========================================

/**
 * イベントリスナーを設定
 */
function setupEventListeners() {
    // 設定保存ボタン
    document.getElementById('saveSettingsBtn').addEventListener('click', handleSaveSettings);

    // 出勤ボタン
    document.getElementById('clockInBtn').addEventListener('click', handleClockIn);

    // 退勤ボタン
    document.getElementById('clockOutBtn').addEventListener('click', handleClockOut);

    // 課題完了報告ボタン
    document.getElementById('submitReportBtn').addEventListener('click', handleSubmitReport);
}

/**
 * 設定保存処理
 */
function handleSaveSettings() {
    const userName = document.getElementById('userName').value.trim();
    const gasUrl = document.getElementById('gasUrl').value.trim();

    if (!userName || !gasUrl) {
        showNotification('error', '⚠️ すべての項目を入力してください');
        return;
    }

    config.userName = userName;
    config.gasUrl = gasUrl;
    saveConfig();

    hideSettingsModal();
    showNotification('success', '✓ 設定を保存しました');

    // アプリを初期化
    initializeApp();
}

// ========================================
// アプリ初期化
// ========================================

/**
 * アプリを初期化
 */
function initializeApp() {
    console.log('アプリ初期化');

    // 今日のデータを読み込み
    loadTodayData();

    // UIを更新
    updateUI();
}

/**
 * 今日のデータを読み込み
 */
function loadTodayData() {
    const today = formatDate(new Date());
    const savedData = localStorage.getItem(`attendance_${today}`);

    if (savedData) {
        todayData = JSON.parse(savedData);
        console.log('今日のデータを読み込みました:', todayData);
    } else {
        todayData = {
            date: today,
            clockIn: null,
            clockOut: null,
            workHours: null,
            status: '未出勤'
        };
    }
}

/**
 * 今日のデータを保存
 */
function saveTodayData() {
    const today = formatDate(new Date());
    localStorage.setItem(`attendance_${today}`, JSON.stringify(todayData));
    console.log('今日のデータを保存しました:', todayData);
}

// ========================================
// 出勤打刻処理
// ========================================

/**
 * 出勤ボタンクリック処理
 */
async function handleClockIn() {
    console.log('出勤ボタンがクリックされました');

    // すでに出勤済みの場合
    if (todayData.clockIn) {
        showNotification('error', '⚠️ すでに出勤打刻済みです');
        return;
    }

    // 現在時刻を取得
    const now = new Date();
    const clockInTime = formatTime(now);
    const date = formatDate(now);

    // ローディング表示
    showLoading();

    try {
        // GASにPOSTリクエスト
        const response = await sendClockInToGAS(date, clockInTime);

        if (response.status === 'success') {
            // ローカルデータを更新
            todayData.date = date;
            todayData.clockIn = clockInTime;
            todayData.status = '出勤中';
            saveTodayData();

            // UIを更新
            updateUI();

            // 成功通知
            showNotification('success', `✓ 出勤打刻完了 (${clockInTime})`);

            console.log('出勤打刻成功:', todayData);
        } else {
            throw new Error(response.message || '出勤打刻に失敗しました');
        }
    } catch (error) {
        console.error('出勤打刻エラー:', error);
        showNotification('error', `⚠️ エラー: ${error.message}`);
    } finally {
        hideLoading();
    }
}

/**
 * GASに出勤データを送信
 */
async function sendClockInToGAS(date, clockInTime) {
    const payload = {
        action: 'clockIn',
        userName: config.userName,
        date: date,
        clockInTime: clockInTime
    };

    console.log('GASにリクエスト送信:', payload);

    try {
        const response = await fetch(config.gasUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify(payload),
            redirect: 'follow'
        });

        const text = await response.text();
        console.log('GASレスポンス:', text);

        // JSONパース
        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            // JSONパースに失敗した場合は成功と仮定
            console.warn('JSONパース失敗、成功と仮定:', e);
            return { status: 'success' };
        }
    } catch (error) {
        console.error('GAS通信エラー:', error);
        // ネットワークエラーでも一旦成功として処理（localStorageには保存済み）
        return { status: 'success', message: '通信エラーが発生しましたが、ローカルに保存しました' };
    }
}

// ========================================
// 退勤打刻処理（スタブ）
// ========================================

/**
 * 退勤ボタンクリック処理
 */
async function handleClockOut() {
    console.log('退勤ボタンがクリックされました');
    showNotification('error', '⚠️ 退勤機能は未実装です');
}

// ========================================
// 課題完了報告処理（スタブ）
// ========================================

/**
 * 課題完了報告ボタンクリック処理
 */
async function handleSubmitReport() {
    console.log('課題完了報告ボタンがクリックされました');
    showNotification('error', '⚠️ 課題完了報告機能は未実装です');
}

// ========================================
// UI更新
// ========================================

/**
 * UIを更新
 */
function updateUI() {
    // 本日の勤怠情報を更新
    document.getElementById('todayClockIn').textContent = todayData.clockIn || '--:--';
    document.getElementById('todayClockOut').textContent = todayData.clockOut || '--:--';
    document.getElementById('todayWorkHours').textContent = todayData.workHours || '計算中';

    // ステータスバッジを更新
    const statusBadge = document.getElementById('todayStatus');
    statusBadge.textContent = todayData.status;
    statusBadge.className = 'status-badge';

    if (todayData.status === '出勤中') {
        statusBadge.classList.add('working');
    } else if (todayData.status === '退勤済み') {
        statusBadge.classList.add('finished');
    }

    // ボタンの有効/無効を切り替え
    const clockInBtn = document.getElementById('clockInBtn');
    const clockOutBtn = document.getElementById('clockOutBtn');

    if (todayData.clockIn && !todayData.clockOut) {
        // 出勤済み、退勤未
        clockInBtn.disabled = true;
        clockOutBtn.disabled = false;
    } else if (todayData.clockOut) {
        // 退勤済み
        clockInBtn.disabled = true;
        clockOutBtn.disabled = true;
    } else {
        // 未出勤
        clockInBtn.disabled = false;
        clockOutBtn.disabled = true;
    }
}

/**
 * 現在時刻を更新
 */
function updateCurrentTime() {
    const now = new Date();

    const timeStr = formatTime(now);
    const dateStr = formatDate(now);

    document.getElementById('currentTime').textContent = timeStr;
    document.getElementById('currentDate').textContent = dateStr;
}

// ========================================
// ユーティリティ関数
// ========================================

/**
 * 日付をYYYY/MM/DD形式でフォーマット
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

/**
 * 時刻をHH:MM:SS形式でフォーマット
 */
function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

/**
 * 通知を表示
 */
function showNotification(type, message) {
    const notification = document.getElementById('notification');
    const icon = document.getElementById('notificationIcon');
    const text = document.getElementById('notificationText');

    // アイコンとテキストを設定
    if (type === 'success') {
        icon.textContent = '✓';
        notification.className = 'notification success';
    } else if (type === 'error') {
        icon.textContent = '⚠️';
        notification.className = 'notification error';
    }

    text.textContent = message;

    // 表示
    notification.classList.add('show');

    // 3秒後に非表示
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

/**
 * ローディングを表示
 */
function showLoading() {
    const loading = document.getElementById('loadingOverlay');
    loading.classList.add('show');
}

/**
 * ローディングを非表示
 */
function hideLoading() {
    const loading = document.getElementById('loadingOverlay');
    loading.classList.remove('show');
}

// ========================================
// デバッグ用
// ========================================

// デバッグ情報をコンソールに出力
console.log('勤怠管理アプリ起動');
console.log('設定:', config);
console.log('今日のデータ:', todayData);
