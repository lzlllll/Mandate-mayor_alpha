// ===== 时间流逝系统 =====

// 1x 速度：现实 10 分钟 = 游戏中 1 行政周（7天）
// 游戏时间以"自 2000-01-01 00:00 起的游戏内秒数"表示
const TIME_START_DATE = new Date(Date.UTC(2000, 0, 1, 0, 0, 0));
const GAME_SECONDS_PER_REAL_SECOND_AT_1X = (7 * 24 * 60 * 60) / (10 * 60); // = 1008

let gameSecondsFromStart = 0;
let currentTimeSpeed = 1; // 0 = 暂停, 1 = 1x, 5 = 5x
let lastTickRealMs = Date.now();

// 内部地块建造常量
const INTERNAL_PLOT_TICK_HOURS = 1;               // 每多少小时触发一次
const INTERNAL_PLOT_FILL_PROBABILITY = 1;         // 每次触发的填充概率
const INTERNAL_PLOT_BUILD_DAYS = 1;              // 建造中持续的游戏天数
const INTERNAL_PLOT_BUILD_SEC = INTERNAL_PLOT_BUILD_DAYS * 24 * 60 * 60;

let lastInternalPlotHourMark = 0;

// 格式化游戏日期
function formatGameDate(totalSeconds) {
    const d = new Date(TIME_START_DATE.getTime() + totalSeconds * 1000);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    
    // 计算行政周（每7天为一个行政周）
    const dayOfYear = Math.floor((d.getTime() - new Date(Date.UTC(year, 0, 1)).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const adminWeek = Math.ceil(dayOfYear / 7);
    
    // 计算行政周进度（0-1）
    const dayInWeek = ((dayOfYear - 1) % 7) / 7;
    
    // 星期几
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[d.getUTCDay()];
    
    return {
        date: `${year}年${month}月${day}日`,
        hour: `${hours}:${minutes}`,
        adminWeek: adminWeek,
        dayInWeek: dayInWeek,
        weekday: weekday
    };
}

// 更新时间显示
function updateTimeDisplay(timeDateEl, timeHourEl, adminWeekEl, weekProgressEl, weekdayEl) {
    if (!timeDateEl || !timeHourEl) return;
    const { date, hour, adminWeek, dayInWeek, weekday } = formatGameDate(gameSecondsFromStart);
    timeDateEl.textContent = date;
    timeHourEl.textContent = hour;
    
    // 更新行政周显示
    if (adminWeekEl) {
        adminWeekEl.textContent = `行政周 ${adminWeek}`;
    }
    
    // 更新星期几显示
    if (weekdayEl) {
        weekdayEl.textContent = `星期${weekday}`;
    }
    
    // 更新行政周进度（饼状）
    if (weekProgressEl) {
        updateWeekProgress(weekProgressEl, dayInWeek);
    }
}

// 更新行政周进度条（饼状）
function updateWeekProgress(el, progress) {
    // 绘制饼状进度条
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    
    // 背景圆
    ctx.beginPath();
    ctx.arc(20, 20, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#2c3e50';
    ctx.fill();
    
    // 进度弧
    ctx.beginPath();
    ctx.arc(20, 20, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.lineTo(20, 20);
    ctx.closePath();
    ctx.fillStyle = '#3498db';
    ctx.fill();
    
    // 内部圆（创建环形效果）
    ctx.beginPath();
    ctx.arc(20, 20, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#1a252f';
    ctx.fill();
    
    // 显示数字（1-7）
    const dayNumber = Math.ceil(progress * 7);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dayNumber.toString(), 20, 20);
    
    // 替换元素内容
    el.innerHTML = '';
    el.appendChild(canvas);
}

// 设置活动速度按钮
function setActiveSpeedButton(speed, buttons) {
    buttons.forEach(btn => {
        if (parseInt(btn.dataset.speed) === speed) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// 更新游戏时间
function updateGameTime(deltaRealSec) {
    if (currentTimeSpeed > 0) {
        gameSecondsFromStart += deltaRealSec * GAME_SECONDS_PER_REAL_SECOND_AT_1X * currentTimeSpeed;
    }
}

// 获取当前游戏时间
function getGameSeconds() {
    return gameSecondsFromStart;
}

// 设置游戏时间
function setGameSeconds(seconds) {
    gameSecondsFromStart = seconds;
}

// 设置时间速度
function setTimeSpeed(speed) {
    currentTimeSpeed = speed;
}

// 获取时间速度
function getTimeSpeed() {
    return currentTimeSpeed;
}

// 重置时间
function resetTime() {
    gameSecondsFromStart = 0;
    currentTimeSpeed = 1;
    lastTickRealMs = Date.now();
}
