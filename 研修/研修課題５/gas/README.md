# GASデプロイ手順

## 1. 手動でGASプロジェクトを作成する方法

claspでの自動作成がうまくいかない場合は、以下の手順で手動セットアップしてください：

### ステップ1: スプレッドシートからGASエディタを開く
1. スプレッドシート（ID: `1Jm8BvzlBH-WG64f6Fzr2GMsivOcag_lFuk-6G25BicA`）を開く
2. 「拡張機能」→「Apps Script」をクリック
3. GASエディタが開きます

### ステップ2: コードをコピー
1. `gas/Code.js`の内容をすべてコピー
2. GASエディタの`Code.gs`に貼り付け

### ステップ3: 設定を更新
`Code.js`の以下の部分を更新してください：

```javascript
const CONFIG = {
  SPREADSHEET_ID: '1Jm8BvzlBH-WG64f6Fzr2GMsivOcag_lFuk-6G25BicA', // ✅ 既に設定済み
  SHEET_NAME: '勤怠記録',
  LINE_CHANNEL_ACCESS_TOKEN: 'YOUR_LINE_CHANNEL_ACCESS_TOKEN', // ⚠️ 後で設定
  LINE_GROUP_ID: 'YOUR_LINE_GROUP_ID', // ⚠️ 後で設定
  ADMIN_EMAIL: 'admin@example.com', // ⚠️ あなたのメールアドレスに変更
  APP_URL: 'https://your-app-url.com' // ⚠️ デプロイ後に設定
};
```

### ステップ4: Webアプリとしてデプロイ
1. GASエディタで「デプロイ」→「新しいデプロイ」をクリック
2. 「種類の選択」で「ウェブアプリ」を選択
3. 設定：
   - **説明**: 勤怠管理アプリ
   - **次のユーザーとして実行**: 自分
   - **アクセスできるユーザー**: 全員
4. 「デプロイ」をクリック
5. **デプロイURL**をコピー（後でフロントエンドで使用）

### ステップ5: claspと連携（オプション）
GASプロジェクトのScript IDを取得して、claspで管理できるようにします：

1. GASエディタで「プロジェクトの設定」をクリック
2. 「スクリプトID」をコピー
3. ローカルで`.clasp.json`を作成：

```json
{
  "scriptId": "YOUR_SCRIPT_ID",
  "rootDir": "."
}
```

4. `clasp pull`でコードをダウンロード
5. 以降は`clasp push`でアップロード可能

---

## 2. LINE Messaging API設定

### ステップ1: LINE Developersでチャネル作成
1. [LINE Developers](https://developers.line.biz/)にアクセス
2. 新しいプロバイダーを作成
3. Messaging APIチャネルを作成
4. 「Messaging API設定」タブで**チャネルアクセストークン**を発行

### ステップ2: Botをグループに追加
1. LINEアプリでグループトークを作成
2. Botを友だち追加
3. グループにBotを招待

### ステップ3: グループIDを取得
グループIDの取得方法：
- Webhook URLを設定して、グループでメッセージを送信
- Webhookで受信したデータから`groupId`を取得

または、以下のテストコードをGASで実行：

```javascript
function getGroupId() {
  // テストメッセージを送信して、エラーメッセージからグループIDを確認
}
```

---

## 3. テスト実行

GASエディタで以下の関数を実行してテスト：

1. `testClockIn()` - 出勤打刻テスト
2. `testClockOut()` - 退勤打刻テスト
3. `testSubmitReport()` - 課題完了報告テスト

実行ログで結果を確認してください。

---

## 4. 次のステップ

- [ ] GASコードをスプレッドシートにコピー
- [ ] Webアプリとしてデプロイ
- [ ] デプロイURLを取得
- [ ] LINE Messaging API設定
- [ ] フロントエンド（HTML/CSS/JS）作成
- [ ] PWA設定
