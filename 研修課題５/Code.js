const SPREADSHEET_ID = '1Jm8BvzlBH-WG64f6Fzr2GMsivOcag_lFuk-6G25BicA';
const SHEET_NAME_ATTENDANCE = '打刻管理';
const SHEET_NAME_REPORT = '課題完了記録';

function doGet() {
    return HtmlService.createTemplateFromFile('index')
        .evaluate()
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setTitle('勤怠管理アプリ')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getScriptUrl() {
    return ScriptApp.getService().getUrl();
}

function clockIn() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME_ATTENDANCE);
    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME_ATTENDANCE);
        sheet.appendRow(['日付', '氏名', '出勤時間', '退勤時間', '勤務時間', 'ステータス']);
    }
    const now = new Date();
    const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy/MM/dd');
    const timeStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm');
    const userName = Session.getActiveUser().getEmail() || 'ゲスト';
    sheet.appendRow([dateStr, userName, timeStr, '', '', '出勤中']);
    sendLineMessage(`【出勤】${userName}さんが出勤しました。\n時刻: ${timeStr}`);
    return { status: 'success', message: '出勤しました' };
}

function clockOut() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME_ATTENDANCE);
    if (!sheet) throw new Error('シートが見つかりません');
    const lastRow = sheet.getLastRow();
    const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    const userName = Session.getActiveUser().getEmail() || 'ゲスト';
    let targetRow = -1;
    for (let i = data.length - 1; i >= 0; i--) {
        if (data[i][1] === userName && data[i][5] === '出勤中') {
            targetRow = i + 2;
            break;
        }
    }
    if (targetRow === -1) {
        return { status: 'error', message: '出勤記録が見つかりません' };
    }
    const now = new Date();
    const timeStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm');
    const startTimeStr = sheet.getRange(targetRow, 3).getValue();
    let startTime = startTimeStr;
    if (typeof startTimeStr === 'string') {
        const d = new Date();
        const [h, m] = startTimeStr.split(':');
        d.setHours(parseInt(h), parseInt(m), 0);
        startTime = d;
    }
    const durationMs = now.getTime() - startTime.getTime();
    const durationHrs = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const durationStr = `${durationHrs}時間${durationMins}分`;
    sheet.getRange(targetRow, 4).setValue(timeStr);
    sheet.getRange(targetRow, 5).setValue(durationStr);
    sheet.getRange(targetRow, 6).setValue('退勤済');
    sendLineMessage(`【退勤】${userName}さんが退勤しました。\n時刻: ${timeStr}\n勤務時間: ${durationStr}`);
    return { status: 'success', message: '退勤しました' };
}

function sendReport() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME_REPORT);
    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME_REPORT);
        sheet.appendRow(['時刻', '氏名', 'URL', 'ステータス', 'LINE送信']);
    }
    const userName = Session.getActiveUser().getEmail() || 'ゲスト';
    const url = getScriptUrl();
    const now = new Date();
    const timeStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm');
    sheet.insertRowBefore(2);
    sheet.getRange(2, 1, 1, 5).setValues([[timeStr, userName, url, '課題完了', '']]);
    const message = `【課題完了】${userName}さんが課題を完了しました。\nアプリURL: ${url}`;
    const lineResult = sendLineMessage(message);
    sheet.getRange(2, 5).setValue(lineResult ? '送信済' : '送信失敗');
    if (lineResult) {
        return { status: 'success', message: '課題完了を報告しました（LINE通知送信済）' };
    } else {
        return { status: 'error', message: '課題完了は記録しましたが、LINE通知の送信に失敗しました' };
    }
}

function sendLineMessage(message) {
    const channelToken = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_TOKEN');
    const groupId = PropertiesService.getScriptProperties().getProperty('LINE_GROUP_ID');
    if (!channelToken || !groupId) {
        console.log('⚠️ LINE_CHANNEL_TOKEN または LINE_GROUP_ID が設定されていません');
        return false;
    }
    if (!message || message.trim() === '') {
        console.log('⚠️ 送信しようとしたメッセージが空です。');
        return false;
    }
    const payload = {
        to: groupId,
        messages: [{ type: 'text', text: message }]
    };
    const options = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        headers: { Authorization: 'Bearer ' + channelToken },
        muteHttpExceptions: true
    };
    try {
        const response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', options);
        const code = response.getResponseCode();
        const body = response.getContentText();
        console.log('LINE API 呼び出し結果: HTTP ' + code);
        console.log('レスポンス本文:', body);
        if (code === 200) {
            console.log('✅ LINE メッセージ送信成功');
            return true;
        } else {
            console.log('⚠️ LINE メッセージ送信失敗 (HTTP ' + code + ')');
            return false;
        }
    } catch (e) {
        console.log('❌ LINE メッセージ送信エラー:', e);
        return false;
    }
}
