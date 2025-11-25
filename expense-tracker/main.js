// DOM要素の取得
const expenseForm = document.getElementById('expense-form');
const expenseList = document.getElementById('expense-list');
const totalAmountElement = document.getElementById('total-amount');
const dateInput = document.getElementById('date');
const chartCanvas = document.getElementById('expense-chart');

// フィルタリング用DOM要素
const viewModeRadios = document.getElementsByName('view-mode');
const monthFilterControls = document.getElementById('month-filter-controls');
const yearFilterControls = document.getElementById('year-filter-controls');
const monthSelect = document.getElementById('month-select');
const yearSelect = document.getElementById('year-select');

// ローカルストレージのキー
const STORAGE_KEY = 'expenseData';

// チャートインスタンスを保持する変数
let expenseChart = null;

// アプリケーションの状態
let currentState = {
    viewMode: 'month', // 'month' or 'year'
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1 // 1-12
};

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    // 日付入力欄に今日の日付をデフォルト設定
    setDefaultDate();

    // 初期表示の更新
    populateYearSelect();
    populateMonthSelect();
    updateFilterUI();

    // 保存されたデータを読み込んで表示
    loadExpenses();
});

// イベントリスナー設定
viewModeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        currentState.viewMode = e.target.value;
        updateFilterUI();
        loadExpenses();
    });
});

monthSelect.addEventListener('change', (e) => {
    currentState.currentMonth = parseInt(e.target.value);
    loadExpenses();
});

yearSelect.addEventListener('change', (e) => {
    currentState.currentYear = parseInt(e.target.value);
    loadExpenses();
});

/**
 * フィルタUIの表示を更新する関数
 */
function updateFilterUI() {
    // モードに応じたコントロールの表示切り替え
    if (currentState.viewMode === 'month') {
        monthFilterControls.style.display = 'block';
        monthSelect.value = currentState.currentMonth;
    } else {
        monthFilterControls.style.display = 'none';
    }
    // 年選択は常に表示
    yearFilterControls.style.display = 'block';
    yearSelect.value = currentState.currentYear;
}

/**
 * 月選択プルダウンを生成する関数
 */
function populateMonthSelect() {
    monthSelect.innerHTML = '';
    for (let i = 1; i <= 12; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i}月`;
        monthSelect.appendChild(option);
    }
    monthSelect.value = currentState.currentMonth;
}

/**
 * 年選択プルダウンを生成する関数
 */
function populateYearSelect() {
    const expenses = getExpensesFromStorage();
    const years = new Set([new Date().getFullYear()]); // 現在年は必ず含める

    expenses.forEach(expense => {
        years.add(new Date(expense.date).getFullYear());
    });

    // 降順にソート
    const sortedYears = Array.from(years).sort((a, b) => b - a);

    yearSelect.innerHTML = '';
    sortedYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = `${year}年`;
        yearSelect.appendChild(option);
    });

    yearSelect.value = currentState.currentYear;
}

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
 * 支出データを読み込み、フィルタリングして表示する関数
 */
function loadExpenses() {
    const allExpenses = getExpensesFromStorage();
    const filteredExpenses = filterExpenses(allExpenses);

    renderList(filteredExpenses);
    updateSummary(filteredExpenses);
    updateChart(filteredExpenses);

    // データ更新時に年の選択肢も更新（新しい年のデータが追加された場合など）
    populateYearSelect();
}

/**
 * 現在の状態に基づいて支出データをフィルタリングする関数
 * @param {Array} expenses 全支出データ
 * @returns {Array} フィルタリングされた支出データ
 */
function filterExpenses(expenses) {
    return expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        const expenseYear = expenseDate.getFullYear();
        const expenseMonth = expenseDate.getMonth() + 1;

        if (currentState.viewMode === 'year') {
            return expenseYear === currentState.currentYear;
        } else {
            return expenseYear === currentState.currentYear && expenseMonth === currentState.currentMonth;
        }
    });
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

    if (sortedExpenses.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5" style="text-align:center;">データがありません</td>`;
        expenseList.appendChild(row);
        return;
    }

    sortedExpenses.forEach(expense => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${expense.date}</td>
            <td>${getCategoryLabel(expense.category)}</td>
            <td>${expense.item}</td>
            <td>¥${Number(expense.amount).toLocaleString()}</td>
            <td>
                <button class="edit-btn" data-id="${expense.id}">編集</button>
                <button class="delete-btn" data-id="${expense.id}">削除</button>
            </td>
        `;

        expenseList.appendChild(row);
    });

    // 編集ボタンにイベントリスナーを追加
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            editExpense(id);
        });
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

    // データが全て0の場合は空のチャートを表示するか、メッセージを出すなどの処理も考えられるが
    // ここではそのまま0のデータを渡す（Chart.jsは空の円を表示する）

    expenseChart = new Chart(chartCanvas, {
        type: 'doughnut',
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
                    position: 'right',
                },
                title: {
                    display: true,
                    text: currentState.viewMode === 'month'
                        ? `${currentState.currentYear}年${currentState.currentMonth}月の支出割合`
                        : `${currentState.currentYear}年の支出割合`
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

    const editingId = expenseForm.dataset.editingId;

    if (editingId) {
        // 編集モード: 既存のデータを更新
        let expenses = getExpensesFromStorage();
        const index = expenses.findIndex(exp => exp.id === editingId);

        if (index !== -1) {
            expenses[index] = {
                id: editingId,
                date: date,
                item: item,
                amount: Number(amount),
                category: category
            };
            saveExpensesToStorage(expenses);
        }

        // 編集モードを解除
        delete expenseForm.dataset.editingId;
        document.getElementById('submit-btn').textContent = '登録';
    } else {
        // 新規追加モード
        const newExpense = {
            id: Date.now().toString(),
            date: date,
            item: item,
            amount: Number(amount),
            category: category
        };

        const expenses = getExpensesFromStorage();
        expenses.push(newExpense);
        saveExpensesToStorage(expenses);
    }

    // 画面更新
    loadExpenses();

    // フォームをリセットし、日付を再設定
    expenseForm.reset();
    setDefaultDate();
});

/**
 * 支出を編集する関数
 * @param {string} id 編集する支出のID
 */
function editExpense(id) {
    const expenses = getExpensesFromStorage();
    const expense = expenses.find(exp => exp.id === id);

    if (!expense) return;

    // フォームにデータを設定
    document.getElementById('date').value = expense.date;
    document.getElementById('item').value = expense.item;
    document.getElementById('amount').value = expense.amount;
    document.getElementById('category').value = expense.category;

    // 編集中のIDを保持
    expenseForm.dataset.editingId = id;

    // ボタンのテキストを変更
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.textContent = '更新';

    // フォームにスクロール
    document.querySelector('.input-area').scrollIntoView({ behavior: 'smooth' });
}

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
