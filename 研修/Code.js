/**
 * 今日の天気をスプレッドシートに記録する関数
 * 手動で天気を入力できるようにします
 */
function recordTodayWeather() {
  // アクティブなスプレッドシートを取得
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // 今日の日付を取得
  const today = new Date();
  const dateString = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy/MM/dd');
  
  // ユーザーに天気を入力してもらう
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    '天気の記録',
    '本日の天気を入力してください（例：晴れ、曇り、雨など）:',
    ui.ButtonSet.OK_CANCEL
  );
  
  // ユーザーがOKをクリックした場合のみ処理を続行
  if (response.getSelectedButton() === ui.Button.OK) {
    const weather = response.getResponseText();
    
    // 天気が入力されているか確認
    if (weather.trim() === '') {
      ui.alert('エラー', '天気が入力されていません。', ui.ButtonSet.OK);
      return;
    }
    
    // ヘッダー行があるか確認（なければ作成）
    const lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      // ヘッダー行を作成
      sheet.getRange(1, 1).setValue('日付');
      sheet.getRange(1, 2).setValue('天気');
      sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
    }
    
    // 新しい行に日付と天気を記録
    const newRow = sheet.getLastRow() + 1;
    sheet.getRange(newRow, 1).setValue(dateString);
    sheet.getRange(newRow, 2).setValue(weather);
    
    // 成功メッセージを表示
    ui.alert('記録完了', '天気を記録しました。\n日付: ' + dateString + '\n天気: ' + weather, ui.ButtonSet.OK);
  }
}

/**
 * 天気を引数で指定して記録する関数
 * @param {string} weather - 記録する天気（例：「晴れ」「曇り」「雨」など）
 */
function recordWeather(weather) {
  // アクティブなスプレッドシートを取得
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // 今日の日付を取得
  const today = new Date();
  const dateString = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy/MM/dd');
  
  // ヘッダー行があるか確認（なければ作成）
  const lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    // ヘッダー行を作成
    sheet.getRange(1, 1).setValue('日付');
    sheet.getRange(1, 2).setValue('天気');
    sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
  }
  
  // 新しい行に日付と天気を記録
  const newRow = sheet.getLastRow() + 1;
  sheet.getRange(newRow, 1).setValue(dateString);
  sheet.getRange(newRow, 2).setValue(weather);
}





