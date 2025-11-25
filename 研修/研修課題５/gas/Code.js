/**
 * 勤怠管理アプリ - Google Apps Script
 * スプレッドシートへの記録とLINE通知を行う
 */

// ========================================
// 設定情報
// ========================================
const CONFIG = {
  // スプレッドシートID（あなたのスプレッドシートIDに置き換えてください）
  SPREADSHEET_ID: '1Jm8BvzlBH-WG64f6Fzr2GMsivOcag_lFuk-6G25BicA',
  
  // シート名
  SHEET_NAME: '勤怠記録',
  
  // LINE Messaging API設定（後で設定）
  LINE_CHANNEL_ACCESS_TOKEN: 'YOUR_LINE_CHANNEL_ACCESS_TOKEN',
  LINE_GROUP_ID: 'YOUR_LINE_GROUP_ID',
  
  // 管理者メールアドレス
  ADMIN_EMAIL: 'admin@example.com',
  
  // アプリURL（デプロイ後に設定）
  APP_URL: 'https://your-app-url.com'
};

// ========================================
// Webアプリのエントリーポイント
// ========================================

/**
 * GETリクエスト処理（テスト用）
 */
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: 'success',
      message: '勤怠管理アプリAPI is running',
      timestamp: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * POSTリクエスト処理（メイン処理）
 */
function doPost(e) {
  try {
    // リクエストボディをパース
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    
    let result;
    
    switch (action) {
      case 'clockIn':
        result = handleClockIn(params);
        break;
      case 'clockOut':
        result = handleClockOut(params);
        break;
      case 'submitReport':
        result = handleSubmitReport(params);
        break;
      default:
        throw new Error('Invalid action: ' + action);
    }
    
    return ContentService.createTextOutput(
      JSON.stringify({
        status: 'success',
        data: result
      })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error in doPost: ' + error.message);
    return ContentService.createTextOutput(
      JSON.stringify({
        status: 'error',
        message: error.message
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ========================================
// 出勤打刻処理
// ========================================

/**
 * 出勤打刻を処理
 * @param {Object} params - リクエストパラメータ
 * @return {Object} 処理結果
 */
function handleClockIn(params) {
  const userName = params.userName;
  const clockInTime = params.clockInTime;
  const date = params.date;
  
  // スプレッドシートに記録
  const sheet = getSheet();
  const timestamp = new Date().toLocaleString('ja-JP');
  
  sheet.appendRow([
    date,
    userName,
    clockInTime,
    '', // 退勤時刻（空）
    '', // 勤務時間（空）
    '出勤中',
    timestamp
  ]);
  
  // LINE通知送信
  const message = `【出勤打刻】\n名前: ${userName}\n時刻: ${date} ${clockInTime}`;
  sendLineNotification(message);
  
  return {
    message: '出勤打刻が完了しました',
    userName: userName,
    clockInTime: clockInTime
  };
}

// ========================================
// 退勤打刻処理
// ========================================

/**
 * 退勤打刻を処理
 * @param {Object} params - リクエストパラメータ
 * @return {Object} 処理結果
 */
function handleClockOut(params) {
  const userName = params.userName;
  const clockOutTime = params.clockOutTime;
  const workHours = params.workHours;
  const date = params.date;
  
  // スプレッドシートの該当行を更新
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  
  // 最新の出勤中レコードを探す
  for (let i = lastRow; i >= 2; i--) {
    const rowData = sheet.getRange(i, 1, 1, 7).getValues()[0];
    const rowDate = rowData[0];
    const rowUserName = rowData[1];
    const rowStatus = rowData[5];
    
    // 同じ日付、同じユーザー、出勤中のレコードを見つける
    if (rowDate === date && rowUserName === userName && rowStatus === '出勤中') {
      // 退勤時刻、勤務時間、ステータスを更新
      sheet.getRange(i, 4).setValue(clockOutTime); // D列: 退勤時刻
      sheet.getRange(i, 5).setValue(workHours);    // E列: 勤務時間
      sheet.getRange(i, 6).setValue('退勤済み');    // F列: ステータス
      break;
    }
  }
  
  // LINE通知送信
  const message = `【退勤打刻】\n名前: ${userName}\n時刻: ${date} ${clockOutTime}\n勤務時間: ${workHours}\nお疲れ様でした！`;
  sendLineNotification(message);
  
  return {
    message: '退勤打刻が完了しました',
    userName: userName,
    clockOutTime: clockOutTime,
    workHours: workHours
  };
}

// ========================================
// 課題完了報告処理
// ========================================

/**
 * 課題完了報告を処理
 * @param {Object} params - リクエストパラメータ
 * @return {Object} 処理結果
 */
function handleSubmitReport(params) {
  const userName = params.userName;
  const timestamp = new Date().toLocaleString('ja-JP');
  
  // 管理者にメール送信
  const subject = `【課題完了報告】${userName}`;
  const body = `
課題完了報告が届きました。

報告者: ${userName}
アプリURL: ${CONFIG.APP_URL}
完了日時: ${timestamp}

よろしくお願いいたします。
  `;
  
  MailApp.sendEmail(CONFIG.ADMIN_EMAIL, subject, body);
  
  // LINE通知送信
  const message = `【課題完了報告】\n名前: ${userName}\nアプリURL: ${CONFIG.APP_URL}\n完了日時: ${timestamp}`;
  sendLineNotification(message);
  
  return {
    message: '課題完了報告を送信しました',
    userName: userName,
    timestamp: timestamp
  };
}

// ========================================
// ユーティリティ関数
// ========================================

/**
 * スプレッドシートのシートを取得
 * @return {Sheet} シートオブジェクト
 */
function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
  
  // シートが存在しない場合は作成
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
    // ヘッダー行を追加
    sheet.appendRow(['日付', 'ユーザー名', '出勤時刻', '退勤時刻', '勤務時間', 'ステータス', 'タイムスタンプ']);
    // ヘッダー行を太字にする
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  }
  
  return sheet;
}

/**
 * LINE通知を送信
 * @param {string} message - 送信するメッセージ
 */
function sendLineNotification(message) {
  // LINE Messaging APIが設定されていない場合はスキップ
  if (CONFIG.LINE_CHANNEL_ACCESS_TOKEN === 'YOUR_LINE_CHANNEL_ACCESS_TOKEN') {
    Logger.log('LINE notification skipped (not configured): ' + message);
    return;
  }
  
  const url = 'https://api.line.me/v2/bot/message/push';
  
  const payload = {
    to: CONFIG.LINE_GROUP_ID,
    messages: [
      {
        type: 'text',
        text: message
      }
    ]
  };
  
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + CONFIG.LINE_CHANNEL_ACCESS_TOKEN
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode !== 200) {
      Logger.log('LINE API Error: ' + response.getContentText());
    }
  } catch (error) {
    Logger.log('Error sending LINE notification: ' + error.message);
  }
}

// ========================================
// テスト用関数
// ========================================

/**
 * 出勤打刻のテスト
 */
function testClockIn() {
  const params = {
    action: 'clockIn',
    userName: 'テストユーザー',
    date: '2025/11/25',
    clockInTime: '09:00:00'
  };
  
  const result = handleClockIn(params);
  Logger.log(result);
}

/**
 * 退勤打刻のテスト
 */
function testClockOut() {
  const params = {
    action: 'clockOut',
    userName: 'テストユーザー',
    date: '2025/11/25',
    clockOutTime: '18:00:00',
    workHours: '9:00'
  };
  
  const result = handleClockOut(params);
  Logger.log(result);
}

/**
 * 課題完了報告のテスト
 */
function testSubmitReport() {
  const params = {
    action: 'submitReport',
    userName: 'テストユーザー'
  };
  
  const result = handleSubmitReport(params);
  Logger.log(result);
}
