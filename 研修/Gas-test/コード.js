/**
 * スプレッドシート起動時にカスタムメニューを追加
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('PDF要約')
    .addItem('PDF要約', 'summarizeDocument')
    .addSeparator()
    .addItem('5分間隔実行開始', 'startAutoExecution')
    .addItem('自動実行停止', 'stopAutoExecution')
    .addToUi();
}

/**
 * A1セルからドキュメントIDを読み取る関数
 * @return {string} A1セルに入力されているドキュメントID
 */
function getDocumentIdFromA1() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const documentId = sheet.getRange('A1').getValue();
  Logger.log('ドキュメントID: ' + documentId);
  return documentId;
}

/**
 * ドキュメントを取得してテキスト内容を抽出
 * @param {string} documentId - ドキュメントのID
 * @return {string} ドキュメントの本文テキスト
 */
function getDocumentText(documentId) {
  try {
    const doc = DocumentApp.openById(documentId);
    const body = doc.getBody();
    const text = body.getText();
    return text;
  } catch (error) {
    Logger.log('ドキュメント取得エラー: ' + error);
    throw new Error('ドキュメントの取得に失敗しました: ' + error.message);
  }
}

/**
 * Gemini APIを使用してテキストを要約
 * @param {string} text - 要約するテキスト
 * @return {string} 要約結果
 */
function summarizeWithGemini(text) {
  // スクリプトプロパティからAPIキーを取得
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

  if (!apiKey) {
    throw new Error('Gemini APIキーが設定されていません。スクリプトプロパティに"GEMINI_API_KEY"を設定してください。');
  }

  // Gemini 2.5 Flash (v1beta API を使用)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{
      parts: [{
        text: `以下のテキストを日本語で簡潔に要約してください:\n\n${text}`
      }]
    }]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  // リトライロジック（最大3回）
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      Logger.log(`試行 ${attempt + 1}/${maxRetries}: API呼び出し開始`);
      const response = UrlFetchApp.fetch(url, options);
      const responseCode = response.getResponseCode();
      Logger.log(`試行 ${attempt + 1}/${maxRetries}: レスポンスコード ${responseCode}`);

      if (responseCode === 200) {
        const result = JSON.parse(response.getContentText());
        const summary = result.candidates[0].content.parts[0].text;
        Logger.log('要約生成成功');
        return summary;
      }

      // 429エラー（レート制限）の場合は待機してリトライ
      if (responseCode === 429) {
        const errorContent = response.getContentText();
        Logger.log(`レート制限エラー詳細: ${errorContent.substring(0, 500)}`);

        lastError = new Error(`レート制限エラー(429): クォータ超過`);

        // 最後の試行でない場合のみ待機
        if (attempt < maxRetries - 1) {
          const waitTime = Math.pow(2, attempt) * 10000; // 10秒、20秒、40秒
          Logger.log(`${waitTime / 1000}秒待機後にリトライします（試行 ${attempt + 1}/${maxRetries}）`);
          Utilities.sleep(waitTime);
          continue;
        } else {
          Logger.log('最後の試行で失敗。リトライを終了します。');
          break;
        }
      }

      // その他のエラー
      const errorText = response.getContentText();
      Logger.log(`APIエラー ${responseCode}: ${errorText.substring(0, 500)}`);
      lastError = new Error(`API呼び出しエラー: ${responseCode} - ${errorText.substring(0, 200)}`);
      throw lastError;

    } catch (error) {
      lastError = error;
      const errorMsg = error.message || String(error);
      Logger.log(`Gemini API呼び出しエラー（試行 ${attempt + 1}/${maxRetries}）: ${errorMsg}`);

      // 最後の試行でない場合は待機
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 5000; // 5秒、10秒
        Logger.log(`${waitTime / 1000}秒待機後にリトライします`);
        Utilities.sleep(waitTime);
      }
    }
  }

  // すべてのリトライが失敗した場合
  if (lastError) {
    const errorMsg = lastError.message || String(lastError);
    Logger.log(`最終エラー: ${errorMsg}`);
    throw new Error('要約の生成に失敗しました（リトライ回数超過）: ' + errorMsg);
  } else {
    Logger.log('lastErrorがnull - 予期しない状態');
    throw new Error('要約の生成に失敗しました（原因不明: lastErrorがnullです。ログを確認してください）');
  }
}

/**
 * Drive API v3を使用してドキュメントをPDFに変換
 * @param {string} documentId - ドキュメントのID
 * @return {Blob} PDFファイルのBlob
 */
function convertDocumentToPdf(documentId) {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${documentId}/export?mimeType=application/pdf`;
    const token = ScriptApp.getOAuthToken();

    const response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + token
      },
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      throw new Error(`PDF変換エラー: ${responseCode} - ${response.getContentText()}`);
    }

    const pdfBlob = response.getBlob();
    pdfBlob.setName('要約ドキュメント.pdf');

    Logger.log('PDF変換完了');
    return pdfBlob;
  } catch (error) {
    Logger.log('PDF変換エラー: ' + error);
    throw new Error('PDFへの変換に失敗しました: ' + error.message);
  }
}

/**
 * Gmail APIを使用してメールを送信
 * @param {string} summary - 要約テキスト
 * @param {Blob} pdfBlob - 添付するPDFファイル
 */
function sendEmailWithPdf(summary, pdfBlob) {
  try {
    const recipient = Session.getActiveUser().getEmail();

    // メール本文を作成
    const subject = 'ドキュメント要約完了';
    const body = `ドキュメントの要約が完了しました。\n\n【要約】\n${summary}\n\nPDFファイルを添付しています。`;

    // Gmail APIでメール送信
    GmailApp.sendEmail(recipient, subject, body, {
      attachments: [pdfBlob],
      name: 'ドキュメント要約システム'
    });

    Logger.log(`メール送信完了: ${recipient}`);
  } catch (error) {
    Logger.log('メール送信エラー: ' + error);
    throw new Error('メールの送信に失敗しました: ' + error.message);
  }
}

/**
 * メイン関数: ドキュメントを要約してPDF化し、メール送信
 */
function summarizeDocument() {
  const startTime = new Date();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  try {
    // A1セルからドキュメントIDを取得
    const documentId = getDocumentIdFromA1();

    if (!documentId) {
      // トリガー実行時はUIが使えないため、ログのみ
      Logger.log('エラー: A1セルにドキュメントIDが入力されていません');
      sheet.getRange('B1').setValue(`エラー: ${new Date().toLocaleString('ja-JP')} | A1セルが空です`);
      return;
    }

    // 1. ドキュメントのテキストを取得
    Logger.log('ステップ1: ドキュメント取得');
    const documentText = getDocumentText(documentId);

    // 2. Gemini APIで要約
    Logger.log('ステップ2: 要約生成');
    const summary = summarizeWithGemini(documentText);

    // 3. Drive API v3でPDFに変換
    Logger.log('ステップ3: PDF変換');
    const pdfBlob = convertDocumentToPdf(documentId);

    // 4. Gmail APIでメール送信
    Logger.log('ステップ4: メール送信');
    sendEmailWithPdf(summary, pdfBlob);

    // 実行時間を計算
    const endTime = new Date();
    const executionTime = (endTime - startTime) / 1000; // 秒単位

    // B1セルに実行完了ログを出力
    const logMessage = `完了: ${new Date().toLocaleString('ja-JP')} | 要約生成→PDF変換→メール送信成功`;
    sheet.getRange('B1').setValue(logMessage);

    // C1セルに実行時間を出力
    sheet.getRange('C1').setValue(`${executionTime.toFixed(2)}秒`);

    Logger.log(`処理完了: 実行時間 ${executionTime.toFixed(2)}秒`);

  } catch (error) {
    // エラー時の処理
    const endTime = new Date();
    const executionTime = (endTime - startTime) / 1000;

    // B1セルにエラーログを出力
    const errorMessage = `エラー: ${new Date().toLocaleString('ja-JP')} | ${error.message}`;
    sheet.getRange('B1').setValue(errorMessage);

    // C1セルに実行時間を出力
    sheet.getRange('C1').setValue(`${executionTime.toFixed(2)}秒 (失敗)`);

    Logger.log('エラー発生: ' + error);
  }
}

/**
 * 5分間隔で自動実行するトリガーを作成
 */
function startAutoExecution() {
  try {
    // 既存のトリガーを削除（重複防止）
    deleteAllTriggers();

    // 5分間隔のトリガーを作成
    ScriptApp.newTrigger('summarizeDocument')
      .timeBased()
      .everyMinutes(5)
      .create();

    SpreadsheetApp.getUi().alert('自動実行開始', '5分間隔での自動実行を開始しました。', SpreadsheetApp.getUi().ButtonSet.OK);
    Logger.log('5分間隔トリガー作成完了');
  } catch (error) {
    SpreadsheetApp.getUi().alert('エラー', 'トリガーの作成に失敗しました: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
    Logger.log('トリガー作成エラー: ' + error);
  }
}

/**
 * すべてのトリガーを削除して自動実行を停止
 */
function stopAutoExecution() {
  try {
    deleteAllTriggers();
    SpreadsheetApp.getUi().alert('自動実行停止', '自動実行を停止しました。', SpreadsheetApp.getUi().ButtonSet.OK);
    Logger.log('すべてのトリガー削除完了');
  } catch (error) {
    SpreadsheetApp.getUi().alert('エラー', 'トリガーの削除に失敗しました: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
    Logger.log('トリガー削除エラー: ' + error);
  }
}

/**
 * このプロジェクトのすべてのトリガーを削除
 */
function deleteAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });
  Logger.log(`${triggers.length}個のトリガーを削除`);
}
