// Состояние приложения
let usageDates = new Set();
let currentDate = new Date();

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    updateUI();
    registerServiceWorker();
});

// Загрузка данных из localStorage
function loadData() {
    const saved = localStorage.getItem('usageDates');
    if (saved) {
        usageDates = new Set(JSON.parse(saved));
    }
}

// Сохранение данных в localStorage
function saveData() {
    localStorage.setItem('usageDates', JSON.stringify([...usageDates]));
}

// Настройка обработчиков событий
function setupEventListeners() {
    document.getElementById('todayButton').addEventListener('click', toggleToday);
    document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));
}

// Переключение отметки для сегодня
function toggleToday() {
    const today = normalizeDate(new Date());
    toggleDate(today);

    const button = document.getElementById('todayButton');
    button.classList.add('pop');
    setTimeout(() => button.classList.remove('pop'), 300);
}

// Переключение отметки для даты
function toggleDate(dateStr) {
    if (usageDates.has(dateStr)) {
        usageDates.delete(dateStr);
    } else {
        usageDates.add(dateStr);
    }
    saveData();
    updateUI();
}

// Проверка отметки на дату
function hasUsage(dateStr) {
    return usageDates.has(dateStr);
}

// Нормализация даты в строку YYYY-MM-DD
function normalizeDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Изменение месяца
function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    updateUI();
}

// Обновление всего UI
function updateUI() {
    updateStats();
    updateTodayButton();
    updateCalendar();
}

// Обновление статистики
function updateStats() {
    document.getElementById('currentStreak').textContent = getCurrentStreak();
    document.getElementById('bestStreak').textContent = getLongestStreak();
    document.getElementById('totalDays').textContent = usageDates.size;
}

// Обновление кнопки сегодня
function updateTodayButton() {
    const today = normalizeDate(new Date());
    const isMarked = hasUsage(today);

    const icon = document.getElementById('todayIcon');
    const status = document.getElementById('todayStatus');
    const dateEl = document.getElementById('todayDate');

    icon.textContent = isMarked ? '●' : '○';
    icon.className = isMarked ? 'check-icon checked' : 'check-icon';
    status.textContent = isMarked ? 'Отмечено сегодня' : 'Отметить сегодня';

    const options = { day: 'numeric', month: 'long' };
    dateEl.textContent = new Date().toLocaleDateString('ru-RU', options);
}

// Обновление календаря
function updateCalendar() {
    const monthEl = document.getElementById('currentMonth');
    const gridEl = document.getElementById('calendarGrid');

    // Заголовок месяца
    const options = { month: 'long', year: 'numeric' };
    monthEl.textContent = currentDate.toLocaleDateString('ru-RU', options);

    // Очистка сетки
    gridEl.innerHTML = '';

    // Получение дней месяца
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Определение первого дня недели (0 = воскресенье, преобразуем в понедельник = 0)
    let firstWeekday = firstDay.getDay() - 1;
    if (firstWeekday === -1) firstWeekday = 6;

    // Добавление пустых ячеек
    for (let i = 0; i < firstWeekday; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'day-cell empty';
        gridEl.appendChild(emptyCell);
    }

    // Добавление дней месяца
    const today = normalizeDate(new Date());

    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        const dateStr = normalizeDate(date);

        const cell = document.createElement('div');
        cell.className = 'day-cell';
        cell.textContent = day;

        // Определение класса
        const isFuture = date > new Date();
        const isToday = dateStr === today;
        const isMarked = hasUsage(dateStr);

        if (isFuture) {
            cell.classList.add('future');
        } else if (isMarked) {
            cell.classList.add('marked');
        } else if (isToday) {
            cell.classList.add('today');
        }

        // Обработчик клика
        if (!isFuture) {
            cell.addEventListener('click', () => {
                toggleDate(dateStr);
                cell.classList.add('pop');
                setTimeout(() => cell.classList.remove('pop'), 300);
            });
        }

        gridEl.appendChild(cell);
    }
}

// Расчет текущей серии
function getCurrentStreak() {
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = normalizeDate(date);

        if (hasUsage(dateStr)) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

// Расчет самой длинной серии
function getLongestStreak() {
    if (usageDates.size === 0) return 0;

    const sortedDates = [...usageDates].sort();
    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffDays = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
        } else {
            currentStreak = 1;
        }
    }

    return longestStreak;
}

// Регистрация Service Worker для PWA
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .catch(() => {
                // Тихо игнорируем ошибки SW
            });
    }
}
