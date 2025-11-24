// DOM要素の取得
const expenseForm = document.getElementById('expense-form');
const expenseList = document.getElementById('expense-list');
const totalAmountElement = document.getElementById('total-amount');
const dateInput = document.getElementById('date');
const chartCanvas = document.getElementById('expense-chart');

// ローカルストレージのキー
const STORAGE_KEY = 'expenseData';

// チャートインスタンスを保持する変数
let expenseChart = null;

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    // 日付入力欄に今日の日付をデフォルト設定
    setDefaultDate();
    // 保存されたデータを読み込んで表示
    loadExpenses();
});

/**
 * 日付入力欄に今日の日付を設定する関数
 */
function setDefaultDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;
}

/**
 * 支出データをローカルストレージから読み込む関数
 */
function loadExpenses() {
    const expenses = getExpensesFromStorage();
    renderList(expenses);
    updateSummary(expenses);
    updateChart(expenses);
}

/**
 * ローカルストレージからデータを取得するヘルパー関数
 * @returns {Array} 支出データの配列
 */
function getExpensesFromStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

/**
 * 支出データをローカルストレージに保存するヘルパー関数
 * @param {Array} expenses 支出データの配列
 */
function saveExpensesToStorage(expenses) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

/**
 * 支出リストを画面に描画する関数
 * @param {Array} expenses 支出データの配列
 */
function renderList(expenses) {
    // リストをクリア
    expenseList.innerHTML = '';

    // 日付順（降順）にソートして表示
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedExpenses.forEach(expense => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${expense.date}</td>
            <td>${getCategoryLabel(expense.category)}</td>
            <td>${expense.item}</td>
            <td>¥${Number(expense.amount).toLocaleString()}</td>
            <td>
                <button class="delete-btn" data-id="${expense.id}">削除</button>
            </td>
        `;

        expenseList.appendChild(row);
    });

    // 削除ボタンにイベントリスナーを追加
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            deleteExpense(id);
        });
    });
}

/**
 * カテゴリの値を表示用ラベルに変換する関数
 * @param {string} value カテゴリの値
 * @returns {string} 表示用ラベル
 */
function getCategoryLabel(value) {
    const categories = {
        'food': '食費',
        'transport': '交通費',
        'daily': '日用品',
        'entertainment': 'エンタメ',
        'others': 'その他'
    };
    return categories[value] || value;
}

/**
 * 合計金額を計算して表示する関数
 * @param {Array} expenses 支出データの配列
 */
function updateSummary(expenses) {
    const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    totalAmountElement.textContent = total.toLocaleString();
}

/**
 * 円グラフを更新する関数
 * @param {Array} expenses 支出データの配列
 */
function updateChart(expenses) {
    // カテゴリごとの集計
    const categoryTotals = {
        'food': 0,
        'transport': 0,
        'daily': 0,
        'entertainment': 0,
        'others': 0
    };

    expenses.forEach(expense => {
        if (categoryTotals.hasOwnProperty(expense.category)) {
            categoryTotals[expense.category] += Number(expense.amount);
        } else {
            // 未定義のカテゴリがあればその他に加算（念のため）
            categoryTotals['others'] += Number(expense.amount);
        }
    });

    const dataValues = Object.values(categoryTotals);
    const labels = ['食費', '交通費', '日用品', 'エンタメ', 'その他'];
    const backgroundColors = [
        '#FF6384', // 食費: 赤系
        '#36A2EB', // 交通費: 青系
        '#FFCE56', // 日用品: 黄系
        '#4BC0C0', // エンタメ: 緑系
        '#9966FF'  // その他: 紫系
    ];

    // 既存のチャートがあれば破棄して再生成
    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(chartCanvas, {
        type: 'doughnut', // ドーナツグラフ（円グラフの一種）
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right', // 凡例を右側に表示
                },
                title: {
                    display: true,
                    text: 'カテゴリ別支出割合'
                }
            }
        }
    });
}

/**
 * 新しい支出を追加する関数
 * @param {Event} e フォーム送信イベント
 */
expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // フォームの値を取得
    const date = document.getElementById('date').value;
    const item = document.getElementById('item').value;
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;

    // 新しい支出オブジェクトを作成
    const newExpense = {
        id: Date.now().toString(), // 簡易的なユニークIDとしてタイムスタンプを使用
        date: date,
        item: item,
        amount: Number(amount),
        category: category
    };

    // 既存のデータに追加して保存
    const expenses = getExpensesFromStorage();
    expenses.push(newExpense);
    saveExpensesToStorage(expenses);

    // 画面更新
    loadExpenses();

    // フォームをリセットし、日付を再設定
    expenseForm.reset();
    setDefaultDate();
});

/**
 * 支出を削除する関数
 * @param {string} id 削除する支出のID
 */
function deleteExpense(id) {
    if (confirm('この項目を削除してもよろしいですか？')) {
        let expenses = getExpensesFromStorage();
        expenses = expenses.filter(expense => expense.id !== id);
        saveExpensesToStorage(expenses);
        loadExpenses();
    }
}
