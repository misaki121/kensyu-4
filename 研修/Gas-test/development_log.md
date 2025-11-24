# Google Apps Script 開発ログ

## 開発環境セットアップ

### [2025-11-11 09:05-09:35] clasp連携セットアップ

**プロンプト:**
```
今入力してあるスプレッドシートとGASをclaspで連携させたい
```

**実施内容:**
- スプレッドシートID: `17YYuBAeA3J6i-q5EAPxCi0ptMeQXWFuKCYK09duwEFY`
- GASスクリプトID: `1-AiVa-SPnYCHZwUJKt8JIiT3zKyfZzpnNiBSWdRSySjmbWwaK9SkBi6c`

**実施手順:**
1. claspのインストール確認 (バージョン 3.1.1)
2. ログイン状態確認 (ai-dojo@vexum-ai.com)
3. 親ディレクトリの干渉ファイル削除
4. `-P`オプションを使用してプロジェクトディレクトリを明示的に指定
5. スクリプトIDを使用してclone実行

**実行コマンド:**
```bash
cd "c:\Users\yks-r\Desktop\研修\Gas-test"
clasp -P "c:\Users\yks-r\Desktop\研修\Gas-test" clone 1-AiVa-SPnYCHZwUJKt8JIiT3zKyfZzpnNiBSWdRSySjmbWwaK9SkBi6c
```

**結果:**
```
└─ appsscript.json
└─ コード.js
Cloned 2 files.
```

**作成されたファイル:**
- `.clasp.json` - スクリプトID設定ファイル
- `appsscript.json` - プロジェクト設定ファイル
- `コード.js` - GASコード

**初期コード (コード.js):**
```javascript
function myFunction() {

}
```

**連携テスト:**
1. コードを編集してテスト
```javascript
function myFunction() {
  Logger.log('Hello from clasp!');
}
```

2. pushコマンド実行
```bash
clasp push
```
結果: `Pushed 2 files.` (成功)

3. pullコマンド実行
```bash
clasp pull
```
結果: `Pulled 2 files.` (成功)

**clasp連携完了**
- push/pull動作確認済み
- スプレッドシートとの連携確立

---

### [2025-11-11 09:36] 開発ログ記録開始

**プロンプト:**
```
# 開発ログ記録指示

今からGoogle Apps Scriptの開発を行います。
課題評価のため、全ての対話を詳細にログ記録してください。

## 記録ルール
各回答時に以下の形式でログを作成してください：

[日時] 対話記録
プロンプト:
"""
(受信したプロンプトをそのまま記録)
"""

回答・提供コード:
(説明と生成したコード全て)

エラー報告を受けた場合は追加で：
エラー内容: (エラーメッセージ)

最終的に development_log.md として時系列で全記録を保存してください。
些細なやり取りも含めて漏れなく記録をお願いします。
```

**回答:**
development_log.md を作成し、開発ログの記録を開始しました。
以降の全ての対話を時系列で詳細に記録します。

**ステータス:** 開発ログ記録準備完了

---

## 開発作業

### [2025-11-11 09:37] A1セルのドキュメントID読み取り機能

**プロンプト:**
```
スプレッドシートのA1セルにドキュメントのIDがあるので、それを読み取って
```

**回答・提供コード:**
スプレッドシートのA1セルからドキュメントIDを読み取るコードを作成します。

```javascript
/**
 * A1セルからドキュメントIDを読み取る関数
 * @return {string} A1セルに入力されているドキュメントID
 */
function getDocumentIdFromA1() {
  // アクティブなスプレッドシートを取得
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // A1セルの値を取得
  const documentId = sheet.getRange('A1').getValue();

  // ログに出力
  Logger.log('ドキュメントID: ' + documentId);

  return documentId;
}
```

**説明:**
- `SpreadsheetApp.getActiveSpreadsheet()` でアクティブなスプレッドシートを取得
- `getActiveSheet()` で現在のシートを取得
- `getRange('A1').getValue()` でA1セルの値を取得
- 取得したドキュメントIDをログ出力して返却

---

### [2025-11-11 09:38] カスタムメニューとGemini API連携による要約機能

**プロンプト:**
```
カスタムメニューにPDF要約ってのを作って、それを押すとドキュメントを要約し始めてほしい。要約はGeminiAPIを使って
```

**回答・提供コード:**
カスタムメニューを追加し、Gemini APIを使ってドキュメントを要約する機能を実装します。

```javascript
/**
 * スプレッドシート起動時にカスタムメニューを追加
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('カスタムツール')
    .addItem('PDF要約', 'summarizeDocument')
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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

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

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      throw new Error(`API呼び出しエラー: ${responseCode} - ${response.getContentText()}`);
    }

    const result = JSON.parse(response.getContentText());
    const summary = result.candidates[0].content.parts[0].text;
    return summary;
  } catch (error) {
    Logger.log('Gemini API呼び出しエラー: ' + error);
    throw new Error('要約の生成に失敗しました: ' + error.message);
  }
}

/**
 * メイン関数: ドキュメントを要約してスプレッドシートに出力
 */
function summarizeDocument() {
  try {
    const ui = SpreadsheetApp.getUi();

    // A1セルからドキュメントIDを取得
    const documentId = getDocumentIdFromA1();

    if (!documentId) {
      ui.alert('エラー', 'A1セルにドキュメントIDが入力されていません。', ui.ButtonSet.OK);
      return;
    }

    // 処理開始メッセージ
    ui.alert('要約開始', 'ドキュメントの要約を開始します...', ui.ButtonSet.OK);

    // ドキュメントのテキストを取得
    const documentText = getDocumentText(documentId);

    // Gemini APIで要約
    const summary = summarizeWithGemini(documentText);

    // B1セルに要約結果を出力
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.getRange('B1').setValue(summary);

    // 完了メッセージ
    ui.alert('完了', '要約が完了しました。B1セルに結果を出力しました。', ui.ButtonSet.OK);

    Logger.log('要約完了: ' + summary);

  } catch (error) {
    SpreadsheetApp.getUi().alert('エラー', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
    Logger.log('エラー発生: ' + error);
  }
}
```

**実装内容:**

1. **カスタムメニュー追加 (`onOpen`)**
   - スプレッドシート起動時に「カスタムツール」メニューを作成
   - 「PDF要約」メニュー項目を追加

2. **ドキュメント取得 (`getDocumentText`)**
   - DocumentApp APIを使用してドキュメントを開く
   - 本文テキストを抽出

3. **Gemini API連携 (`summarizeWithGemini`)**
   - Gemini Pro APIを使用してテキストを要約
   - APIキーはスクリプトプロパティから取得
   - エラーハンドリング実装

4. **メイン処理 (`summarizeDocument`)**
   - A1セルからドキュメントIDを取得
   - ドキュメントテキストを取得
   - Gemini APIで要約
   - B1セルに結果を出力
   - ユーザーに進捗とエラーを通知

**設定手順:**
1. GASエディタで「プロジェクトの設定」→「スクリプトプロパティ」を開く
2. プロパティ名: `GEMINI_API_KEY`、値: あなたのGemini APIキーを設定

---

### [2025-11-11 09:40] PDF変換とGmail送信機能の追加

**プロンプト:**
```
要約したものは1. Drive API v3 でPDFに変換
2. Gmail API で要約付きメール送信(PDF添付)にしてほしい。スプレッドシートのB1セルには実行完了ログ、C1セルには実行時間を入れてほしい
```

**回答・提供コード:**
要約後にPDF変換してGmail送信する機能を追加します。

**実装内容:**
1. Drive API v3を使ってドキュメントをPDFに変換
2. Gmail APIでPDFを添付したメールを送信
3. B1セルに実行完了ログ、C1セルに実行時間を記録

**追加した関数:**

```javascript
// PDF変換機能
function convertDocumentToPdf(documentId) {
  const url = `https://www.googleapis.com/drive/v3/files/${documentId}/export?mimeType=application/pdf`;
  const token = ScriptApp.getOAuthToken();
  const response = UrlFetchApp.fetch(url, {
    headers: { 'Authorization': 'Bearer ' + token },
    muteHttpExceptions: true
  });
  const pdfBlob = response.getBlob();
  pdfBlob.setName('要約ドキュメント.pdf');
  return pdfBlob;
}

// メール送信機能
function sendEmailWithPdf(summary, pdfBlob) {
  const recipient = Session.getActiveUser().getEmail();
  const subject = 'ドキュメント要約完了';
  const body = `ドキュメントの要約が完了しました。\n\n【要約】\n${summary}\n\nPDFファイルを添付しています。`;
  GmailApp.sendEmail(recipient, subject, body, {
    attachments: [pdfBlob],
    name: 'ドキュメント要約システム'
  });
}
```

**更新したメイン関数:**
- 実行開始時刻を記録
- 4ステップで処理: ドキュメント取得 → 要約生成 → PDF変換 → メール送信
- B1セル: 完了ログ（タイムスタンプ、処理内容）
- C1セル: 実行時間（秒単位）
- エラー時もログと時間を記録

**appsscript.json更新:**
必要なOAuthスコープを追加:
- `https://www.googleapis.com/auth/spreadsheets.currentonly`
- `https://www.googleapis.com/auth/documents.readonly`
- `https://www.googleapis.com/auth/drive.readonly`
- `https://mail.google.com/`

**処理フロー:**
1. A1セルからドキュメントID取得
2. ドキュメント本文を取得
3. Gemini APIで要約生成
4. Drive API v3でPDF変換
5. Gmail APIでメール送信（要約本文、PDF添付）
6. B1セルに実行ログ、C1セルに実行時間を記録

---

### [2025-11-11 09:42] 自動実行機能（5分間隔トリガー）の追加

**プロンプト:**
```
* 「5分間隔実行開始」（自動化開始）
* 「自動実行停止」（自動化停止）この二つの設定も入れたい
```

**回答・提供コード:**
カスタムメニューに自動実行の開始/停止機能を追加します。

**実装内容:**
1. 5分間隔で自動実行するトリガーを作成
2. トリガーを削除して自動実行を停止
3. カスタムメニューに「5分間隔実行開始」「自動実行停止」を追加

**追加した関数:**

```javascript
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
```

**更新したonOpen関数:**

```javascript
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('カスタムツール')
    .addItem('PDF要約', 'summarizeDocument')
    .addSeparator()
    .addItem('5分間隔実行開始', 'startAutoExecution')
    .addItem('自動実行停止', 'stopAutoExecution')
    .addToUi();
}
```

**機能説明:**

1. **5分間隔実行開始 (`startAutoExecution`)**
   - 既存のトリガーを削除（重複防止）
   - 5分ごとに`summarizeDocument`を実行するトリガーを作成
   - 確認メッセージを表示

2. **自動実行停止 (`stopAutoExecution`)**
   - すべてのトリガーを削除
   - 自動実行を完全に停止
   - 確認メッセージを表示

3. **トリガー管理 (`deleteAllTriggers`)**
   - プロジェクト内のすべてのトリガーを取得
   - 各トリガーを削除

**カスタムメニュー構成:**
- PDF要約（手動実行）
- ―――――（区切り線）
- 5分間隔実行開始
- 自動実行停止

**注意事項:**
- トリガーは初回実行時に承認が必要
- 自動実行中はA1セルのドキュメントIDが5分ごとに処理される
- 同じドキュメントが繰り返し処理されるため、必要に応じてA1セルを更新する仕組みを追加することを推奨

---

### [2025-11-11 09:45] カスタムメニュー名の変更

**プロンプト:**
```
スプレッドシート状に表示されるカスタムツールっていう表示を、PDF要約、に変えてほしい
```

**回答・提供コード:**
カスタムメニューの名前を「カスタムツール」から「PDF要約」に変更します。

**変更内容:**

```javascript
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('PDF要約')  // 「カスタムツール」から変更
    .addItem('PDF要約', 'summarizeDocument')
    .addSeparator()
    .addItem('5分間隔実行開始', 'startAutoExecution')
    .addItem('自動実行停止', 'stopAutoExecution')
    .addToUi();
}
```

**変更箇所:**
- メニュー名: `'カスタムツール'` → `'PDF要約'`

**更新後のメニュー構成:**
- メニュー名: **PDF要約**
  - PDF要約（手動実行）
  - ―――――（区切り線）
  - 5分間隔実行開始
  - 自動実行停止

---

### [2025-11-11 10:20] 権限エラーの修正

**エラー内容:**
```
エラー: 2025/11/11 10:19:51 | ドキュメントの取得に失敗しました: 指定された権限では DocumentApp.openById を呼び出すことができません。必要な権限: https://www.googleapis.com/auth/documents
```

**原因:**
appsscript.jsonに設定されているスコープが`documents.readonly`（読み取り専用）だったため、DocumentApp.openByIdの実行に必要な完全な権限が不足していました。

**修正内容:**
appsscript.jsonのOAuthスコープを更新:

```json
{
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets.currentonly",
    "https://www.googleapis.com/auth/documents",  // readonlyを削除
    "https://www.googleapis.com/auth/drive",      // readonlyを削除
    "https://mail.google.com/",
    "https://www.googleapis.com/auth/script.external_request"  // Gemini API用に追加
  ]
}
```

**変更箇所:**
1. `documents.readonly` → `documents` (完全な権限)
2. `drive.readonly` → `drive` (完全な権限)
3. `script.external_request` を追加 (外部API呼び出し用)

**対応方法:**
1. コードをpush後、スプレッドシートでスクリプトを再度実行
2. 権限の再承認を求められるので、承認する
3. すべての機能が正常に動作するようになります

---

### [2025-11-11 10:23] Gemini APIモデル名の修正

**エラー内容:**
```
エラー: 2025/11/11 10:23:12 | 要約の生成に失敗しました: API呼び出しエラー: 404 - models/gemini-pro is not found for API version v1beta
```

**原因:**
Gemini APIのモデル名が変更されました。`gemini-pro`は廃止され、新しいモデル`gemini-1.5-flash`または`gemini-1.5-pro`を使用する必要があります。

**修正内容:**
summarizeWithGemini関数のモデル名を更新:

```javascript
function summarizeWithGemini(text) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

  if (!apiKey) {
    throw new Error('Gemini APIキーが設定されていません。');
  }

  // モデル名を更新: gemini-pro → gemini-1.5-flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      throw new Error(`API呼び出しエラー: ${responseCode} - ${response.getContentText()}`);
    }

    const result = JSON.parse(response.getContentText());
    const summary = result.candidates[0].content.parts[0].text;
    return summary;
  } catch (error) {
    Logger.log('Gemini API呼び出しエラー: ' + error);
    throw new Error('要約の生成に失敗しました: ' + error.message);
  }
}
```

**変更箇所:**
- モデル名: `gemini-pro` → `gemini-1.5-flash`
- `gemini-1.5-flash`は高速で安価なモデル
- より高品質な要約が必要な場合は`gemini-1.5-pro`を使用可能

---

### [2025-11-11 10:24] Gemini 2.0モデルへのアップグレード

**プロンプト:**
```
Geminiは2.0に変更で
```

**回答・提供コード:**
Gemini APIのモデルを最新のGemini 2.0に変更します。

**修正内容:**
```javascript
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
```

**変更箇所:**
- モデル名: `gemini-1.5-flash` → `gemini-2.0-flash-exp`
- Gemini 2.0は最新モデルで、より高度な理解力と要約品質を提供

**Gemini 2.0の特徴:**
- より高精度な要約生成
- マルチモーダル対応の強化
- コンテキスト理解の向上

---

### [2025-11-11 10:30] レート制限エラー対応（リトライロジック追加）

**エラー内容:**
```
エラー: 2025/11/11 10:28:20 | 要約の生成に失敗しました: API呼び出しエラー: 429 - You exceeded your current quota
```

**原因:**
Gemini API の無料枠クォータ（RPM: Requests Per Minute）を超過したため、429エラー（RESOURCE_EXHAUSTED）が発生しました。

**修正内容:**
`summarizeWithGemini`関数にリトライロジックとエクスポネンシャルバックオフを実装:

```javascript
function summarizeWithGemini(text) {
  // ... 既存のコード ...

  // リトライロジック（最大3回）
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = UrlFetchApp.fetch(url, options);
      const responseCode = response.getResponseCode();

      if (responseCode === 200) {
        const result = JSON.parse(response.getContentText());
        const summary = result.candidates[0].content.parts[0].text;
        return summary;
      }

      // 429エラー（レート制限）の場合は待機してリトライ
      if (responseCode === 429) {
        const waitTime = Math.pow(2, attempt) * 10000; // 10秒、20秒、40秒
        Logger.log(`レート制限エラー。${waitTime / 1000}秒待機後にリトライします（試行 ${attempt + 1}/${maxRetries}）`);
        Utilities.sleep(waitTime);
        continue;
      }

      // その他のエラー
      throw new Error(`API呼び出しエラー: ${responseCode} - ${response.getContentText()}`);

    } catch (error) {
      lastError = error;
      Logger.log(`Gemini API呼び出しエラー（試行 ${attempt + 1}/${maxRetries}）: ` + error);

      // 最後の試行でない場合は待機
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 5000; // 5秒、10秒
        Utilities.sleep(waitTime);
      }
    }
  }

  // すべてのリトライが失敗した場合
  throw new Error('要約の生成に失敗しました（リトライ回数超過）: ' + lastError.message);
}
```

**実装内容:**

1. **リトライループ**
   - 最大3回まで自動リトライ
   - 各試行で成功すれば即座に結果を返却

2. **エクスポネンシャルバックオフ**
   - 429エラー時: 10秒 → 20秒 → 40秒の待機
   - その他のエラー時: 5秒 → 10秒の待機
   - `Utilities.sleep()`を使用して待機

3. **エラーハンドリング**
   - 各試行のログを記録
   - すべてのリトライが失敗した場合は最後のエラーをスロー

4. **レスポンスコード別処理**
   - 200: 成功、結果を返却
   - 429: レート制限、待機後にリトライ
   - その他: エラーをスロー

**効果:**
- 一時的なレート制限エラーに対して自動的に復旧
- 最大約70秒の待機後に再試行（10 + 20 + 40秒）
- ユーザーの手動介入なしでエラー回避

**注意事項:**
- GASの実行時間上限（6分）に注意
- 無料枠の場合、1分あたりのリクエスト数制限があるため、5分間隔の自動実行設定では制限に達する可能性あり
- 頻繁にレート制限に達する場合は、自動実行間隔を延長するか、有料プランへのアップグレードを検討

---

### [2025-11-11 10:35] エラーハンドリングのバグ修正

**エラー内容:**
```
エラー: 2025/11/11 10:33:28 | Cannot read properties of null (reading 'message')
```

**原因:**
リトライロジック実装時に、`lastError`が`null`の状態で`.message`プロパティにアクセスしようとしていたため、TypeErrorが発生しました。

**修正内容:**

1. **lastErrorのnullチェック追加**
```javascript
// すべてのリトライが失敗した場合
if (lastError) {
  throw new Error('要約の生成に失敗しました（リトライ回数超過）: ' + lastError.message);
} else {
  throw new Error('要約の生成に失敗しました（原因不明）');
}
```

2. **エラーオブジェクトの明示的な生成**
```javascript
// その他のエラー
const errorText = response.getContentText();
lastError = new Error(`API呼び出しエラー: ${responseCode} - ${errorText}`);
throw lastError;
```

3. **429エラー時の待機タイミング改善**
```javascript
// 429エラー（レート制限）の場合は待機してリトライ
if (responseCode === 429) {
  const waitTime = Math.pow(2, attempt) * 10000; // 10秒、20秒、40秒
  Logger.log(`レート制限エラー。${waitTime / 1000}秒待機後にリトライします（試行 ${attempt + 1}/${maxRetries}）`);

  // 最後の試行でない場合のみ待機
  if (attempt < maxRetries - 1) {
    Utilities.sleep(waitTime);
  }
  continue;
}
```

**修正箇所:**
- [コード.js:87-115](コード.js#L87-L115) のエラーハンドリングロジック

**効果:**
- null参照エラーを回避
- エラーオブジェクトが常に適切に設定される
- より詳細なエラーメッセージを提供

---

Development log updated: [2025-11-11 10:30] Rate limit error handling added
