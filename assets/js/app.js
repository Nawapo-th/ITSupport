// Global Variables
let currentAdminJobs = [];
let modalCallback = null;

// --- API Helper ---
async function apiCall(action, data = {}, method = 'POST') {
    try {
        let url = `api/api.php?action=${action}`;

        // ถ้าเป็น GET ให้แนบ query params
        if (method === 'GET') {
            const params = new URLSearchParams(data).toString();
            if (params) url += `&${params}`;
        }

        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        if (method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        return { success: false, message: error.toString() };
    }
}

// --- UI/Modal Utils ---
function togglePassword() {
    const pwdInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    const eyeSlashIcon = document.getElementById('eyeSlashIcon');
    if (pwdInput.type === 'password') {
        pwdInput.type = 'text';
        eyeIcon.classList.add('hidden');
        eyeSlashIcon.classList.remove('hidden');
    } else {
        pwdInput.type = 'password';
        eyeIcon.classList.remove('hidden');
        eyeSlashIcon.classList.add('hidden');
    }
}

function showModal(title, message, type = 'success', callback = null) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMessage').innerText = message;
    modalCallback = callback;
    const iconBg = document.getElementById('modalIconBg');
    const iconSvg = document.getElementById('modalIcon');
    if (type === 'success') {
        iconBg.className = "mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-green-100 to-green-50 mb-6 shadow-sm";
        // Simple bounce animation via JS or use a utility class if available. Using standard tailwind classes.
        iconSvg.className = "h-10 w-10 text-green-500";
        iconSvg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
    } else if (type === 'info') {
        iconBg.className = "mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-5";
        iconSvg.className = "h-10 w-10 text-blue-600";
        iconSvg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
    } else if (type === 'logout') {
        iconBg.className = "mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-5";
        iconSvg.className = "h-10 w-10 text-orange-500";
        iconSvg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>';
    }
    document.getElementById('customModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('customModal').classList.add('hidden');
    if (modalCallback) { modalCallback(); modalCallback = null; }
}

let confirmCallback = null;
function showConfirmModal(title, message, callback) {
    document.getElementById('confirmModalTitle').innerText = title;
    document.getElementById('confirmModalMessage').innerText = message;
    confirmCallback = callback;
    document.getElementById('confirmModal').classList.remove('hidden');

    // Bind Confirm Button
    const btn = document.getElementById('btnConfirmAction');
    // Remove old listeners to prevent stacking
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', () => {
        if (confirmCallback) confirmCallback();
        closeConfirmModal();
    });
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.add('hidden');
    confirmCallback = null;
}

// --- Login Logic ---
async function performLogin() {
    var u = document.getElementById('username').value;
    var p = document.getElementById('password').value;
    var btn = document.getElementById('btnLogin');

    if (!u || !p) return alert("กรุณากรอกข้อมูลให้ครบ");

    btn.innerText = "กำลังตรวจสอบ...";
    btn.disabled = true;
    document.getElementById('loginError').classList.add('hidden');

    const res = await apiCall('userLogin', { username: u, password: p });

    if (res.success) {
        showModal('ยินดีต้อนรับ', 'เข้าสู่ระบบสำเร็จแล้ว', 'success', () => { handleLoginSuccess(res); });
    } else {
        document.getElementById('loginError').innerText = res.message;
        document.getElementById('loginError').classList.remove('hidden');
        resetLoginBtn();
    }
}

function resetLoginBtn() {
    var btn = document.getElementById('btnLogin');
    btn.innerText = "เข้าสู่ระบบ";
    btn.disabled = false;
}

function handleLoginSuccess(user) {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('navMenu').classList.remove('hidden');

    // Save to localStorage for persistence
    localStorage.setItem('itSupportUser', JSON.stringify(user));

    // Auto-fill user info
    document.getElementById('inputName').value = user.fullName;
    document.getElementById('inputDivision').value = user.division || user.department;

    // อัปเดตสถานะผู้ใช้งานที่ Header
    const statusBadge = document.getElementById('userStatusBadge');
    statusBadge.classList.remove('hidden');

    // Allow clicking logo to go home
    const headerLogo = document.getElementById('mainHeaderLogo');
    headerLogo.classList.add('cursor-pointer', 'hover:opacity-90');

    if (user.isAdmin) {
        document.getElementById('adminJobBtn').classList.remove('hidden');
        document.getElementById('adminMyJobBtn').classList.remove('hidden');
        document.getElementById('userMyJobsBtn').classList.remove('hidden'); // แสดงปุ่มดูสถานะงานสำหรับ Admin
        document.getElementById('adminStatsBtn').classList.remove('hidden');
        document.getElementById('importSection').classList.remove('hidden');
        document.getElementById('adminImportBtn').classList.remove('hidden');
        document.getElementById('adminTemplateBtn').classList.remove('hidden');

        // แสดงสถานะ Admin
        statusBadge.innerHTML = `⭐ สถานะ: ผู้ดูแลระบบ`;
        statusBadge.className = "text-[10px] font-medium bg-purple-600/30 px-2 py-0.5 rounded-full w-fit border border-purple-200/20";
        updateJobBadge(); // Start fetching badge
        updateMyJobBadge(); // Start fetching my job badge
        startDashboardPolling(); // Start Real-time updates
    } else {
        document.getElementById('adminJobBtn').classList.add('hidden');
        document.getElementById('adminMyJobBtn').classList.add('hidden');
        document.getElementById('adminStatsBtn').classList.add('hidden');
        document.getElementById('importSection').classList.add('hidden');

        // แสดงปุ่มดูสถานะงานสำหรับผู้ใช้ทั่วไป
        document.getElementById('userMyJobsBtn').classList.remove('hidden');

        // แสดงสถานะ User
        statusBadge.innerHTML = `👤 สถานะ: ผู้ใช้งานทั่วไป`;
        statusBadge.className = "text-[10px] font-medium bg-white/20 px-2 py-0.5 rounded-full w-fit";
    }
    showPage('repairSection');
}

function confirmLogout() {
    logout();
    showModal('ออกจากระบบ', 'คุณได้ออกจากระบบเรียบร้อยแล้ว', 'logout');
}

function logout() {
    document.getElementById('repairSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.add('hidden');
    document.getElementById('navMenu').classList.add('hidden');
    document.getElementById('loginSection').classList.remove('hidden');

    // Disable clicking logo
    const headerLogo = document.getElementById('mainHeaderLogo');
    headerLogo.classList.remove('cursor-pointer', 'hover:opacity-90');

    // Hide Admin Buttons & Badge
    document.getElementById('adminJobBtn').classList.add('hidden');
    document.getElementById('adminMyJobBtn').classList.add('hidden');
    document.getElementById('adminStatsBtn').classList.add('hidden');
    document.getElementById('adminImportBtn').classList.add('hidden');
    document.getElementById('adminTemplateBtn').classList.add('hidden');
    document.getElementById('userMyJobsBtn').classList.add('hidden'); // ซ่อนปุ่มดูสถานะงาน
    document.getElementById('userStatusBadge').classList.add('hidden');
    document.getElementById('importSection').classList.add('hidden'); // ซ่อน Import Section

    document.getElementById('username').value = "";
    document.getElementById('password').value = "";
    resetLoginBtn();

    // Clear localStorage
    localStorage.removeItem('itSupportUser');
    stopDashboardPolling();
}

let pollingInterval = null;
function startDashboardPolling() {
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(async () => {
        // Update Badges
        if (typeof updateJobBadge === 'function') updateJobBadge();
        if (typeof updateMyJobBadge === 'function') updateMyJobBadge();

        // Update Dashboard Stats if visible
        const dashboard = document.getElementById('dashboardSection');
        if (dashboard && !dashboard.classList.contains('hidden')) {
            const data = await apiCall('getDashboardStats', {}, 'GET');
            if (data.success) {
                // Update text elements directly to avoid full re-render flicker
                if (data.overview) {
                    const setVal = (id, val) => {
                        const el = document.getElementById(id);
                        if (el && el.innerText != val) el.innerText = val;
                    };
                    setVal('statPending', data.overview.pending);
                    setVal('statSuccess', data.overview.completed);
                    setVal('statInProgress', data.overview.in_progress);
                    setVal('statTechnicians', data.overview.technicians);
                }
                // Note: We don't refresh chart here to avoid animation reset, unless necessary.
                // The user asked for "Numbers", so card stats are priority.
            }
        }
    }, 5000); // 5 Seconds
}

function stopDashboardPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

function goHome() {
    const loginSection = document.getElementById('loginSection');
    // If login is visible (not hidden), do nothing
    if (!loginSection || !loginSection.classList.contains('hidden')) return;

    showPage('repairSection');
}

function showPage(pageId) {
    document.getElementById('repairSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.add('hidden');
    document.getElementById(pageId).classList.remove('hidden');
}

// --- Repair Form Logic ---
async function autoFillAssetInfo() {
    const assetCode = document.getElementById('assetCodeInput').value;
    if (!assetCode) return;
    document.getElementById('assetLoading').classList.remove('hidden');
    document.getElementById('assetNotFound').classList.add('hidden');
    document.getElementById('assetHint').classList.remove('hidden');

    const data = await apiCall('findAssetInfo', { code: assetCode }, 'GET');

    document.getElementById('assetLoading').classList.add('hidden');
    if (data.found) {
        if (data.deviceName) document.getElementById('deviceName').value = data.deviceName;
        if (data.brand) document.getElementById('brand').value = data.brand;
        if (data.model) document.getElementById('model').value = data.model;
        document.getElementById('assetCodeInput').classList.add('border-green-400');
        setTimeout(() => document.getElementById('assetCodeInput').classList.remove('border-green-400'), 2000);
    } else {
        document.getElementById('assetNotFound').classList.remove('hidden');
        document.getElementById('assetHint').classList.add('hidden');
        // Clear fields if not found
        document.getElementById('deviceName').value = "";
        document.getElementById('brand').value = "";
        document.getElementById('model').value = "";
    }
}

function enableManualInput() {
    document.getElementById('assetNotFound').classList.add('hidden');
    document.getElementById('assetHint').classList.remove('hidden');
    document.getElementById('deviceName').focus();
}

function setCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;

    const timeInput = document.getElementById('customTime');
    timeInput.value = currentTime;

    // Add visual feedback
    timeInput.classList.add('border-green-400', 'bg-green-50');
    setTimeout(() => {
        timeInput.classList.remove('border-green-400', 'bg-green-50');
    }, 1000);
}


async function submitRepair() {
    var form = document.getElementById('repairForm');
    var btn = document.getElementById('btnSubmit');

    // ตรวจสอบฟิลด์ที่จำเป็น (รหัสครุภัณฑ์ไม่บังคับ)
    const requiredFields = [];

    if (form.contact.value == "") requiredFields.push('เบอร์ติดต่อ');
    if (form.division.value == "") requiredFields.push('หน่วยงาน');
    if (form.floor.value == "") requiredFields.push('ชั้น');
    if (form.problemType.value == "") requiredFields.push('ประเภทปัญหา');

    if (requiredFields.length > 0) {
        return showModal('ข้อมูลไม่ครบถ้วน',
            'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน:\n- ' + requiredFields.join('\n- '),
            'info');
    }

    btn.disabled = true;
    btn.innerHTML = `กำลังบันทึก...`;

    var issueDetail = form.issue.value ? " " + form.issue.value : "";
    var fullIssue = "[" + form.problemType.value + "]" + issueDetail;

    var formData = {
        assetCode: form.assetCode.value,
        deviceName: form.deviceName.value,
        brand: form.brand.value,
        model: form.model.value,
        issue: fullIssue,
        contact: form.contact.value,
        name: form.name.value,
        division: form.division.value,
        floor: form.floor.value,
        customDate: form.customDate ? form.customDate.value : "",
        customTime: form.customTime ? form.customTime.value : ""
    };

    const res = await apiCall('processForm', formData);

    if (res.success) {
        let currentName = form.name.value;
        let currentDiv = form.division.value;
        form.reset();
        form.name.value = currentName;
        form.division.value = currentDiv;

        // Immediately update badge if the user is an admin/logged in
        if (typeof updateJobBadge === 'function') updateJobBadge();

        showModal('แจ้งซ่อมสำเร็จ!', res.message, 'success');
    } else {
        alert("Error: " + res.message);
    }
    btn.disabled = false;
    btn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg> <span>ส่งแจ้งซ่อม</span>`;
}

// --- Dashboard Logic ---
async function loadDashboard() {
    showPage('dashboardSection');
    const data = await apiCall('getDashboardStats', {}, 'GET');
    updateDashboardUI(data);
}

async function searchAssetHistory() {
    var code = document.getElementById('searchAssetCode').value;
    if (!code) return alert("กรุณาระบุเลขครุภัณฑ์");
    document.getElementById('assetStatsResult').classList.add('hidden');
    const data = await apiCall('getDashboardStats', { assetCode: code }, 'GET');
    updateDashboardUI(data);
}

function updateDashboardUI(data) {
    if (!data.success) return alert(data.message);
    if (data.overview) {
        document.getElementById('statPending').innerText = data.overview.pending;
        document.getElementById('statSuccess').innerText = data.overview.completed;
        document.getElementById('statInProgress').innerText = data.overview.in_progress;
        document.getElementById('statTechnicians').innerText = data.overview.technicians || 0;

        // Load Default Chart (Week) - Only if not already loaded? Or refresh it.
        updateChartFilter();
    }
    if (data.assetStats) {
        document.getElementById('resAssetCode').innerText = data.assetStats.assetCode;
        document.getElementById('res7Days').innerText = data.assetStats.last7Days + " ครั้ง";
        document.getElementById('res30Days').innerText = data.assetStats.last1Month + " ครั้ง";
        document.getElementById('res365Days').innerText = data.assetStats.last1Year + " ครั้ง";
        document.getElementById('assetStatsResult').classList.remove('hidden');
    }
}

// --- Chart: Statistic Chart ---
let repairChartInstance = null;

async function updateChartFilter() {
    const filter = document.getElementById('chartFilter').value;
    // Show loading state if needed, or just let it transition

    const res = await apiCall(`getChartData&filter=${filter}`, {}, 'GET');

    if (res.success) {
        renderRepairChart(res.labels, res.data);
    }
}

function renderRepairChart(labels, data) {
    const ctx = document.getElementById('repairStatsChart').getContext('2d');

    // Destroy previous chart to handle updates
    if (repairChartInstance) {
        repairChartInstance.destroy();
    }

    repairChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'จำนวนงานซ่อม',
                data: data,
                backgroundColor: 'rgba(249, 115, 22, 0.7)', // Orange Theme
                borderColor: 'rgb(249, 115, 22)',
                borderWidth: 1,
                borderRadius: 6,
                barPercentage: 0.6,
                maxBarThickness: 50
            }]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, font: { family: "'Sarabun', sans-serif" } },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { family: "'Sarabun', sans-serif" } }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1f2937',
                    bodyColor: '#ea580c',
                    titleFont: { family: "'Sarabun', sans-serif", size: 14 },
                    bodyFont: { family: "'Sarabun', sans-serif", weight: 'bold' },
                    borderColor: '#fed7aa',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            return ' ' + context.parsed.y + ' รายการ';
                        }
                    }
                }
            }
        }
    });
}

// --- Admin Job Logic ---
// --- Admin Job Logic ---
async function loadAdminJobs(onlyMyJobs = false) {
    document.getElementById('adminJobModal').classList.remove('hidden');
    // Set Title
    document.getElementById('adminJobModalTitle').innerHTML = onlyMyJobs
        ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> งานที่ฉันดูแล (กำลังดำเนินการ)'
        : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg> งานแจ้งซ่อมที่รอรับเรื่อง';

    document.getElementById('adminJobList').innerHTML = '<div class="text-center py-8 text-gray-500">กำลังโหลดข้อมูล...</div>';

    let action = 'getPendingJobs';
    if (onlyMyJobs) {
        const userStr = localStorage.getItem('itSupportUser');
        const user = userStr ? JSON.parse(userStr) : null;
        const techName = user ? (user.fullName || user.username) : 'Admin IT';
        action = `getMyJobs&technician=${encodeURIComponent(techName)}`;
    }

    const res = await apiCall(action, {}, 'GET');

    if (!res.success) { document.getElementById('adminJobList').innerHTML = `<div class="text-red-500 text-center">${res.message}</div>`; return; }

    currentAdminJobs = res.jobs;

    if (currentAdminJobs.length === 0) {
        document.getElementById('adminJobList').innerHTML = `<div class="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300"><p class="text-gray-500">${onlyMyJobs ? 'ไม่มีงานที่กำลังดำเนินการ' : 'ไม่มีงานค้างในระบบ'}</p></div>`;
        return;
    }

    let html = '';
    currentAdminJobs.forEach((job, index) => {
        let isDoing = job.status === 'กำลังดำเนินการ';

        let statusBadge = isDoing
            ? `<div class="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded border border-blue-100 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>กำลังซ่อม</div>`
            : `<div class="bg-purple-50 text-purple-700 text-xs font-bold px-2 py-1 rounded border border-purple-100">รอรับเรื่อง</div>`;

        let actionBtn = isDoing
            ? `<button onclick="completeJob('${job.ticketId}')" class="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs py-1.5 rounded-lg shadow transition font-bold">✅ ปิดงาน</button>`
            : `<button onclick="acceptJob('${job.ticketId}')" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs py-1.5 rounded-lg shadow transition">รับงาน</button>`;

        html += `
      <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition relative">
        <div class="flex justify-between items-start mb-2">
          <div class="flex flex-col gap-1">
            <div class="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded w-fit font-mono">${job.ticketId}</div>
            ${statusBadge}
          </div>
          <div class="text-xs text-gray-400">${job.timestamp.split(' ')[0]}</div>
        </div>
        <h3 class="font-bold text-gray-800 text-base mb-1 truncate">${job.assetCode}</h3>
        <p class="text-sm text-gray-600 mb-3 line-clamp-2 bg-gray-50 p-2 rounded-lg border border-gray-100">${job.issue}</p>
        <div class="flex gap-2 mt-2 pt-2 border-t border-gray-50">
          <button onclick="viewJobDetail(${index})" class="flex-1 bg-white border border-gray-200 text-gray-600 text-xs py-1.5 rounded-lg hover:bg-gray-50 transition">รายละเอียด</button>
          ${actionBtn}
        </div>
      </div>`;
    });
    document.getElementById('adminJobList').innerHTML = html;
}

// --- Load Completed Jobs (History) ---
async function loadCompletedJobs() {
    document.getElementById('adminJobModal').classList.remove('hidden');
    document.getElementById('adminJobModalTitle').innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ประวัติการซ่อม (สำเร็จแล้ว)';
    document.getElementById('adminJobList').innerHTML = '<div class="text-center py-8 text-gray-500">กำลังโหลดประวัติการซ่อม...</div>';

    const res = await apiCall('getCompletedJobs', {}, 'GET');

    if (!res.success) { document.getElementById('adminJobList').innerHTML = `<div class="text-red-500 text-center">${res.message}</div>`; return; }

    currentAdminJobs = res.jobs;

    // Debug: Check what data we're receiving
    console.log('Completed Jobs Data:', currentAdminJobs);
    if (currentAdminJobs.length > 0) {
        console.log('First job sample:', currentAdminJobs[0]);
    }

    if (currentAdminJobs.length === 0) {
        document.getElementById('adminJobList').innerHTML = `<div class="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300"><p class="text-gray-500">ไม่พบประวัติการซ่อมสำเร็จ</p></div>`;
        return;
    }

    let html = `
    <div class="mb-4 text-right">
        <button onclick="printReport('overview')" class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded-lg font-bold flex items-center gap-1 ml-auto">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            พิมพ์รายงาน
        </button>
    </div>
    `;
    currentAdminJobs.forEach((job, index) => {
        html += `
        <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition opacity-90 hover:opacity-100">
            <div class="flex justify-between items-start mb-2">
                <div>
                   <span class="text-[10px] text-gray-400 font-mono">#${job.ticketId}</span>
                   <h4 class="font-bold text-gray-800 text-sm">${job.deviceName || 'ไม่ระบุชื่อเครื่อง'}</h4>
                </div>
                <div class="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded border border-green-100 flex items-center gap-1">
                   <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                   สำเร็จแล้ว
                </div>
            </div>
            <div class="text-xs text-gray-500 mb-2">
                <p> ${job.division}</p>
                <p>🛠️ โดย: ${job.technician}</p>
                <p>🕒 เสร็จเมื่อ: ${job.finished_at}</p>
            </div>
            <div class="bg-gray-50 p-2 rounded-lg mb-3">
               <p class="text-xs text-gray-600 line-clamp-2">"${job.issue}"</p>
            </div>
             <div class="flex gap-2">
               <button onclick="viewJobDetail(${index})" class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-1.5 rounded-lg transition font-medium">ดูบันทึก</button>
            </div>
        </div>
        `;
    });
    document.getElementById('adminJobList').innerHTML = html;
}

async function exportDashboardReport() {
    showModal('กำลังสร้างรายงาน', 'กรุณารอสักครู่...', 'info');

    // Fetch all jobs
    const res = await apiCall('getAllJobs', {}, 'GET');

    if (!res.success || !res.jobs) {
        showModal('ผิดพลาด', 'ไม่สามารถดึงข้อมูลได้', 'info');
        return;
    }

    const jobs = res.jobs;
    const dateStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Calculate statistics
    const stats = {
        total: jobs.length,
        pending: jobs.filter(j => j.status === 'รอรับเรื่อง').length,
        inProgress: jobs.filter(j => j.status === 'กำลังดำเนินการ').length,
        completed: jobs.filter(j => j.status.includes('สำเร็จ') || j.status === 'Completed').length
    };

    // Create CSV content
    let csv = '\uFEFF'; // UTF-8 BOM for Excel
    csv += `รายงานภาพรวมงานซ่อมบำรุง ระบบแจ้งซ่อมIT\n`;
    csv += `วันที่สร้างรายงาน: ${dateStr}\n\n`;

    csv += `สรุปภาพรวม\n`;
    csv += `งานทั้งหมด,${stats.total}\n`;
    csv += `รอรับเรื่อง,${stats.pending}\n`;
    csv += `กำลังดำเนินการ,${stats.inProgress}\n`;
    csv += `สำเร็จแล้ว,${stats.completed}\n\n`;

    csv += `รายละเอียดงานทั้งหมด\n`;
    csv += `ลำดับ,Ticket ID,วันที่แจ้ง,รหัสครุภัณฑ์,ชื่ออุปกรณ์,ยี่ห้อ,รุ่น,อาการเสีย,ผู้แจ้ง,หน่วยงาน,ชั้น,เบอร์ติดต่อ,ช่างผู้รับผิดชอบ,สถานะ,เสร็จสิ้นเมื่อ\n`;

    jobs.forEach((job, index) => {
        const row = [
            index + 1,
            job.ticketId || '-',
            job.timestamp || '-',
            job.assetCode || '-',
            job.deviceName || '-',
            job.brand || '-',
            job.model || '-',
            `"${(job.issue || '-').replace(/"/g, '""')}"`, // Escape quotes
            job.reporter || '-',
            job.division || '-',
            job.floor || '-',
            job.contact || '-',
            job.technician || '-',
            job.status || '-',
            job.finished_at || '-'
        ];
        csv += row.join(',') + '\n';
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `รายงานภาพรวมงานซ่อม_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    closeModal();
    showModal('สำเร็จ', 'ดาวน์โหลดรายงานเรียบร้อยแล้ว', 'success');
}

function loadMyJobs() { loadAdminJobs(true); }

// --- Load Technician Stats ---
async function loadTechnicianStats() {
    document.getElementById('adminJobModal').classList.remove('hidden');
    document.getElementById('adminJobModalTitle').innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg> รายชื่อช่างผู้รับงาน';

    document.getElementById('adminJobList').innerHTML = '<div class="text-center py-8 text-gray-500">กำลังโหลดข้อมูลทีมงาน...</div>';

    const res = await apiCall('getTechnicianStats', {}, 'GET');

    if (!res.success) { document.getElementById('adminJobList').innerHTML = `<div class="text-red-500 text-center">${res.message}</div>`; return; }

    const techs = res.technicians;
    if (techs.length === 0) {
        document.getElementById('adminJobList').innerHTML = `<div class="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300"><p class="text-gray-500">ยังไม่มีข้อมูลการทำงานของช่าง</p></div>`;
        return;
    }

    // List Layout
    let html = '<div class="space-y-3">';

    // Add Button (as list item)
    html += `
    <button onclick="addNewTechnician()" class="w-full bg-white border-2 border-dashed border-gray-300 rounded-xl p-3 flex items-center justify-center gap-2 text-gray-500 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50 transition group">
        <div class="bg-gray-100 group-hover:bg-white rounded-full p-1"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg></div>
        <span class="text-sm font-bold">เพิ่มรายชื่อช่างใหม่</span>
    </button>
    `;

    techs.forEach(tech => {
        html += `
        <div onclick="loadTechnicianDetail('${tech.technician}')" class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:bg-gray-50 hover:shadow-md transition">
            <div class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base border border-indigo-100 flex-shrink-0">
                ${tech.technician ? tech.technician.charAt(0) : '?'}
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="font-bold text-gray-800 text-sm truncate">${tech.technician}</h4>
                <div class="text-xs text-gray-500 mt-0.5 flex items-center gap-3">
                     <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> สำเร็จ ${tech.completed}</span>
                     <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> กำลังทำ ${tech.in_progress}</span>
                </div>
            </div>
             <div class="flex items-center gap-2 text-gray-400">
                <span class="text-xs">งานทั้งหมด ${tech.total_jobs}</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
             </div>
        </div>
        `;
    });
    html += '</div>';
    document.getElementById('adminJobList').innerHTML = html;
}

async function loadTechnicianDetail(name) {
    document.getElementById('adminJobModalTitle').innerHTML = `
        <button onclick="loadTechnicianStats()" class="mr-2 text-gray-400 hover:text-purple-600"><svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg></button>
        <span class="flex-1">งานของช่าง: ${name}</span>
    `;

    document.getElementById('adminJobList').innerHTML = '<div class="text-center py-8 text-gray-500">กำลังโหลดประวัติงาน...</div>';

    const res = await apiCall(`getTechnicianJobs&name=${encodeURIComponent(name)}`, {}, 'GET');

    if (!res.success) { document.getElementById('adminJobList').innerHTML = `<div class="text-red-500 text-center">${res.message}</div>`; return; }

    const jobs = res.jobs;
    // Set global currentAdminJobs for printing
    currentAdminJobs = jobs;

    if (jobs.length === 0) {
        document.getElementById('adminJobList').innerHTML = `<div class="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300"><p class="text-gray-500">ช่างคนนี้ยังไม่ได้รับงานใดๆ</p></div>`;
        return;
    }

    let html = `
    <div class="mb-4 text-right">
        <button onclick="printReport('technician', '${name}')" class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded-lg font-bold flex items-center gap-1 ml-auto">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            พิมพ์รายงาน
        </button>
    </div>
    <div class="space-y-3">
    `;
    jobs.forEach(job => {
        let statusColor = job.status === 'สำเร็จ' || job.status === 'Completed' ? 'text-green-600 bg-green-50 border-green-100' : 'text-blue-600 bg-blue-50 border-blue-100';
        let icon = job.status === 'สำเร็จ' || job.status === 'Completed' ? '✅' : '🛠️';

        html += `
        <div class="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-sm">
            <div class="flex justify-between items-start mb-1">
                <span class="font-bold text-gray-800">Ticket #${job.ticketId}</span>
                <span class="text-[10px] px-2 py-0.5 rounded border ${statusColor}">${icon} ${job.status}</span>
            </div>
            <div class="text-gray-600 mb-1 line-clamp-1">${job.deviceName || 'อุปกรณ์'} - ${job.issue}</div>
            <div class="text-[10px] text-gray-400 flex justify-between">
                <span>เริ่ม: ${job.timestamp}</span>
                <span>เสร็จ: ${job.finished_at}</span>
            </div>
        </div>
        `;
    });
    html += '</div>';
    document.getElementById('adminJobList').innerHTML = html;
}

function addNewTechnician() {
    // Open modal and clear previous input
    document.getElementById('addTechnicianModal').classList.remove('hidden');
    document.getElementById('technicianNameInput').value = '';
    document.getElementById('technicianNameError').classList.add('hidden');
    setTimeout(() => document.getElementById('technicianNameInput').focus(), 100);
}

function closeAddTechnicianModal() {
    document.getElementById('addTechnicianModal').classList.add('hidden');
    document.getElementById('technicianNameInput').value = '';
    document.getElementById('technicianNameError').classList.add('hidden');
}

async function submitAddTechnician() {
    const nameInput = document.getElementById('technicianNameInput');
    const errorMsg = document.getElementById('technicianNameError');
    const name = nameInput.value.trim();

    // Validation
    if (!name) {
        errorMsg.classList.remove('hidden');
        nameInput.classList.add('border-red-300', 'bg-red-50');
        nameInput.focus();
        return;
    }

    // Hide error
    errorMsg.classList.add('hidden');
    nameInput.classList.remove('border-red-300', 'bg-red-50');

    // Close modal
    closeAddTechnicianModal();

    // Show loading
    showModal('กำลังบันทึก', 'กรุณารอสักครู่...', 'info');

    const res = await apiCall('addTechnician', { name: name }, 'POST');

    if (res.success) {
        showModal('สำเร็จ', 'เพิ่มรายชื่อช่างเรียบร้อยแล้ว', 'success', () => {
            loadTechnicianStats(); // Reload list
        });
    } else {
        showModal('แจ้งเตือน', res.message || 'เกิดข้อผิดพลาด', 'info');
    }
}

// --- Print Report Generator ---
function printReport(type, techName = '') {
    const jobs = currentAdminJobs;
    const dateStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    const title = type === 'overview' ? 'รายงานสรุปการซ่อมบำรุง' : `รายงานการปฏิบัติงานรายบุคคล (${techName})`;

    let tableRows = '';
    jobs.forEach((job, index) => {
        tableRows += `
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; text-align: center;">${index + 1}</td>
                <td style="padding: 8px;">${job.timestamp}</td>
                <td style="padding: 8px; font-family: monospace;">${job.ticketId}</td>
                <td style="padding: 8px;"><div style="font-weight:bold">${job.deviceName || '-'}</div><div style="font-size:10px; color:#555">${job.assetCode || ''}</div></td>
                <td style="padding: 8px;">${job.issue}</td>
                <td style="padding: 8px;">${job.finished_at || '-'}</td>
                <td style="padding: 8px; text-align:center;">
                    ${(job.status.includes('สำเร็จ') || job.status == 'Completed') ? '<span style="color:green">✓ สำเร็จ</span>' : job.status}
                </td>
            </tr>
        `;
    });

    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(`
        <html>
            <head>
                <title>Report - IT Support</title>
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Sarabun', sans-serif; padding: 20px; }
                    h2, h3 { text-align: center; margin: 10px 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                    th { background: #f0f0f0; padding: 8px; border-bottom: 2px solid #333; font-weight: bold; text-align: left; }
                    .signature-section { display: flex; justify-content: space-between; margin-top: 50px; padding: 0 50px; }
                    .sign-box { text-align: center; }
                    .dot-line { border-bottom: 1px dotted #000; width: 200px; display: inline-block; margin: 10px 0; }
                </style>
            </head>
            <body>
                <h2>บันทึกการปฏิบัติงาน ระบบแจ้งซ่อมIT</h2>
                <h3>${title}</h3>
                <p style="text-align: center; font-size: 14px;">ประจำวันที่: ${dateStr}</p>
                
                <table>
                    <thead>
                        <tr>
                            <th style="width: 40px; text-align: center;">ลำดับ</th>
                            <th>วันที่แจ้ง</th>
                            <th>Ticket ID</th>
                            <th>อุปกรณ์</th>
                            <th>อาการเสีย</th>
                            <th>เสร็จสิ้นเมื่อ</th>
                            <th style="text-align: center;">สถานะ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
                
                <div class="signature-section">
                    <div class="sign-box">
                        <br><br>
                        ลงชื่อ ........................................................<br>
                        (${techName || 'เจ้าหน้าที่ธุรการ/ช่างผู้รับงาน'})<br>
                        ผู้จัดทำรายงาน
                    </div>
                    <div class="sign-box">
                        <br><br>
                        ลงชื่อ ........................................................<br>
                        (........................................................)<br>
                        หัวหน้าหน่วยงาน/ผู้รับรอง
                    </div>
                </div>

                <script>
                    window.onload = function() { window.print(); window.close(); }
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
}

function closeAdminModal() { document.getElementById('adminJobModal').classList.add('hidden'); }

function viewJobDetail(index) {
    const job = currentAdminJobs[index];
    if (!job) return;

    document.getElementById('detTicket').innerText = job.ticketId;
    document.getElementById('detTime').innerText = job.timestamp;

    let assetStr = `${job.assetCode}`;
    if (job.deviceName) assetStr += `<br><span class="text-xs text-gray-500">${job.deviceName}</span>`;
    if (job.brand || job.model) assetStr += `<br><span class="text-xs text-gray-500">${job.brand} ${job.model}</span>`;
    document.getElementById('detAssetInfo').innerHTML = assetStr;

    document.getElementById('detReporter').innerText = job.reporter || '-';
    document.getElementById('detDiv').innerText = job.division || '-';
    document.getElementById('detFloor').innerText = job.floor || "-";

    const contactText = job.contact || '-';
    document.getElementById('detContact').innerText = contactText;
    if (job.contact) {
        document.getElementById('detContactLink').href = `tel:${job.contact}`;
    } else {
        document.getElementById('detContactLink').removeAttribute('href');
    }

    document.getElementById('detIssue').innerText = job.issue;

    const acceptBtn = document.getElementById('btnAcceptJobDetail');
    if (job.status === 'กำลังดำเนินการ') {
        acceptBtn.innerText = "✅ ปิดงาน (เสร็จสิ้น)";
        acceptBtn.className = "flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold shadow transition";
        acceptBtn.onclick = function () {
            closeJobDetail();
            completeJob(job.ticketId);
        };
    } else {
        acceptBtn.innerText = "รับงานนี้";
        acceptBtn.className = "flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-bold shadow transition";
        acceptBtn.onclick = function () {
            closeJobDetail();
            acceptJob(job.ticketId);
        };
    }

    document.getElementById('jobDetailModal').classList.remove('hidden');
}

let currentJobToDelete = null;

function deleteCurrentJob() {
    const job = currentAdminJobs.find(j => j.ticketId === document.getElementById('detTicket').innerText);
    if (!job) return;

    currentJobToDelete = job.ticketId;

    showConfirmModal(
        'ยืนยันการลบงาน',
        `คุณต้องการลบงาน ${job.ticketId} หรือไม่?\n\nการลบจะไม่สามารถกู้คืนได้`,
        async () => {
            closeJobDetail();
            closeAdminModal();

            showModal('กำลังลบ', 'กรุณารอสักครู่...', 'info');

            const res = await apiCall('deleteJob', { ticketId: currentJobToDelete }, 'POST');

            if (res.success) {
                showModal('ลบสำเร็จ', 'ลบงานออกจากระบบเรียบร้อยแล้ว', 'success', () => {
                    updateJobBadge();
                    updateMyJobBadge();
                });
            } else {
                showModal('ผิดพลาด', res.message || 'ไม่สามารถลบงานได้', 'info');
            }

            currentJobToDelete = null;
        }
    );
}

async function completeJob(ticketId) {
    // Show the custom modal instead of confirm
    document.getElementById('completeJobTicketId').textContent = ticketId;
    document.getElementById('completeJobNotes').value = '';
    document.getElementById('completeJobModal').classList.remove('hidden');

    // Store ticketId globally for confirmCompleteJob to use
    window.currentCompleteTicketId = ticketId;
}

function closeJobDetail() { document.getElementById('jobDetailModal').classList.add('hidden'); }

async function acceptJob(ticketId) {
    showConfirmModal('ยืนยันรับงาน', `คุณต้องการรับงานใบแจ้งซ่อม ${ticketId} หรือไม่?`, async () => {
        closeJobDetail(); // Close detail modal
        closeAdminModal(); // Close the list modal too so we can see the main status

        // Get current user's name from localStorage
        const userStr = localStorage.getItem('itSupportUser');
        const user = userStr ? JSON.parse(userStr) : null;
        const technicianName = user ? (user.fullName || user.username) : 'Admin IT';

        showModal('กำลังบันทึก', 'ระบบกำลังอัปเดตสถานะ...', 'info');
        const res = await apiCall('updateJobStatus', { ticketId: ticketId, status: "กำลังดำเนินการ", technician: technicianName });

        if (res.success) {
            showModal('รับงานเรียบร้อย!', 'ย้ายงานไปยัง "กำลังดำเนินการ" แล้ว \nเริ่มดำเนินการได้เลยครับ', 'success', () => {
                // Optional: Re-open admin jobs list or just stay on dashboard
                updateJobBadge();
                updateMyJobBadge();
            });
        } else {
            showModal('ผิดพลาด', res.message, 'info');
        }
    });
}

// --- Chatbot Logic ---
function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.classList.toggle('hidden');
    if (!chatWindow.classList.contains('hidden')) { setTimeout(() => document.getElementById('chatInput').focus(), 100); }
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    const chatMessages = document.getElementById('chatMessages');
    if (!message) return;

    chatMessages.insertAdjacentHTML('beforeend', `<div class="flex items-end justify-end gap-2 mb-3"><div class="bg-orange-500 text-white text-sm px-4 py-2 rounded-2xl rounded-tr-none shadow-sm max-w-[85%]">${message}</div></div>`);
    input.value = ''; chatMessages.scrollTop = chatMessages.scrollHeight;

    chatMessages.insertAdjacentHTML('beforeend', `<div id="botLoading" class="flex items-center gap-2 mb-3"><div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-500 text-xs font-bold">IT</div><div class="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm"><div class="flex gap-1"><div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div><div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div><div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div></div></div></div>`);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const res = await apiCall('chatWithGemini', { message: message });

    document.getElementById('botLoading').remove();
    let responseText = "เกิดข้อผิดพลาดในการเชื่อมต่อ";

    if (res.success && res.reply) {
        responseText = res.reply.replace(/\n/g, '<br>');
        chatMessages.insertAdjacentHTML('beforeend', `<div class="flex items-start gap-2 mb-3 fade-in"><div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-500 text-xs font-bold">IT</div><div class="bg-white border border-gray-100 text-gray-700 text-sm px-4 py-2 rounded-2xl rounded-tl-none shadow-sm max-w-[85%]">${responseText}</div></div>`);
    } else {
        chatMessages.insertAdjacentHTML('beforeend', `<div class="flex items-start gap-2 mb-3 fade-in"><div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-500 text-xs font-bold">Err</div><div class="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-2 rounded-2xl rounded-tl-none shadow-sm">${res.message || "Error"}</div></div>`);
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- Import Logic ---
function triggerImport() {
    document.getElementById('importFile').value = null;
    document.getElementById('importFile').click();
}

async function uploadImportFile() {
    const fileInput = document.getElementById('importFile');
    if (!fileInput.files.length) return;

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    const btn = document.getElementById('adminImportBtn');
    const originalText = btn.innerHTML;
    btn.innerText = "Importing...";
    btn.disabled = true;

    try {
        const response = await fetch('api/api.php?action=importAssets', {
            method: 'POST',
            body: formData
        });
        const res = await response.json();

        if (res.success) {
            showModal('นำเข้าสำเร็จ', res.message, 'success');
        } else {
            showModal('ผิดพลาด', res.message || 'Unknown error', 'info');
        }
    } catch (error) {
        console.error(error);
        showModal('ผิดพลาด', 'เกิดล้มเหลวในการเชื่อมต่อ', 'info');
    }

    btn.innerHTML = originalText;
    btn.disabled = false;
}




async function updateJobBadge() {
    const res = await apiCall('getPendingJobsCount', {}, 'GET');
    const badge = document.getElementById('jobCountBadge');
    if (res.success && res.count > 0) {
        badge.innerText = res.count > 99 ? '99+' : res.count;
        badge.classList.remove('hidden');
        badge.classList.add('animate-bounce'); // Add simple bounce animation
        setTimeout(() => badge.classList.remove('animate-bounce'), 2000);
    } else {
        badge.classList.add('hidden');
    }
}


async function updateMyJobBadge() {
    console.log('[updateMyJobBadge] Starting...');

    // Get current user's name from localStorage
    const userStr = localStorage.getItem('itSupportUser');
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user) {
        console.log('[updateMyJobBadge] No user found in localStorage');
        // If no user logged in, hide badge
        const badge = document.getElementById('myJobCountBadge');
        if (badge) badge.classList.add('hidden');
        return;
    }

    const techName = user.fullName || user.username || user.loginName || 'Admin IT';
    console.log('[updateMyJobBadge] Technician name:', techName);

    // Use direct fetch to check_count.php (works better than api.php)
    let res = await fetch(`api/check_count.php?technician=${encodeURIComponent(techName)}`).then(r => r.json());
    console.log('[updateMyJobBadge] API Response:', res);

    // Auto-fix DB if column missing
    if (!res.success && res.message && res.message.includes('Unknown column')) {
        console.warn("Detected missing column, attempting to fix...");
        await apiCall('fixDatabase', {}, 'GET');
        res = await apiCall(`getMyJobsCount&technician=${encodeURIComponent(techName)}`, {}, 'GET');
    }

    const badge = document.getElementById('myJobCountBadge');
    console.log('[updateMyJobBadge] Badge element:', badge);
    console.log('[updateMyJobBadge] Count:', res.count);

    if (res.success && res.count > 0) {
        console.log('[updateMyJobBadge] Showing badge with count:', res.count);
        badge.innerText = res.count > 99 ? '99+' : res.count;
        badge.classList.remove('hidden');
        badge.classList.add('animate-bounce');
        setTimeout(() => badge.classList.remove('animate-bounce'), 2000);
    } else {
        console.log('[updateMyJobBadge] Hiding badge (count is 0 or failed)');
        badge.classList.add('hidden');
    }
}

async function loadUserJobs() {
    const userStr = localStorage.getItem('itSupportUser');
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user) {
        showModal('แจ้งเตือน', 'กรุณาล็อกอินก่อน', 'info');
        return;
    }

    const userName = user.fullName || user.username || user.loginName;
    const isAdmin = user.isAdmin ? 'true' : 'false'; // ส่งค่า isAdmin ไปด้วย

    document.getElementById('adminJobModalTitle').innerText = 'งานที่ฉันแจ้งซ่อม';
    document.getElementById('adminJobModal').classList.remove('hidden');
    document.getElementById('adminJobList').innerHTML = '<div class="text-center py-8 text-gray-500">กำลังโหลด...</div>';

    // ส่งค่า isAdmin ไปยัง API
    const res = await apiCall(`getUserJobs&reporter=${encodeURIComponent(userName)}&isAdmin=${isAdmin}`, {}, 'GET');

    if (!res.success) {
        document.getElementById('adminJobList').innerHTML = `<div class="text-red-500 text-center">${res.message}</div>`;
        return;
    }

    const jobs = res.jobs;

    if (jobs.length === 0) {
        document.getElementById('adminJobList').innerHTML = `
            <div class="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                <p class="text-gray-500">คุณยังไม่ได้แจ้งซ่อมงานใดๆ</p>
            </div>`;
        return;
    }

    let html = '<div class="space-y-3">';
    jobs.forEach((job, index) => {
        const statusColor = job.status === 'รอรับเรื่อง' ? 'bg-yellow-100 text-yellow-700' :
            job.status === 'กำลังดำเนินการ' ? 'bg-blue-100 text-blue-700' :
                'bg-green-100 text-green-700';

        html += `
        <div class="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition">
            <div class="flex justify-between items-start mb-2">
                <div class="flex-1">
                    <p class="font-bold text-gray-800">${job.ticketId}</p>
                    <p class="text-xs text-gray-500">${job.timestamp}</p>
                </div>
                <span class="${statusColor} px-3 py-1 rounded-full text-xs font-bold">${job.status}</span>
            </div>
            <div class="text-sm text-gray-600 space-y-1">
                <p><strong>อุปกรณ์:</strong> ${job.assetCode} - ${job.deviceName || '-'}</p>
                <p><strong>อาการเสีย:</strong> ${job.issue}</p>
                ${job.technician ? `<p><strong>ช่างผู้รับผิดชอบ:</strong> ${job.technician}</p>` : ''}
                ${job.finished_at ? `<p><strong>เสร็จสิ้นเมื่อ:</strong> ${job.finished_at}</p>` : ''}
            </div>
        </div>`;
    });
    html += '</div>';

    document.getElementById('adminJobList').innerHTML = html;
}

async function loadMyJobs() {
    loadAdminJobs(true); // Reuse loadAdminJobs but filter for 'my jobs'
}

// Expose functions to global scope for HTML onclick events
window.togglePassword = togglePassword;
window.performLogin = performLogin;
window.showModal = showModal;
window.closeModal = closeModal;
window.handleLoginSuccess = handleLoginSuccess;
window.confirmLogout = confirmLogout;
window.showPage = showPage;
window.autoFillAssetInfo = autoFillAssetInfo;
window.enableManualInput = enableManualInput;
window.submitRepair = submitRepair;
window.loadDashboard = loadDashboard;
window.searchAssetHistory = searchAssetHistory;
window.loadAdminJobs = loadAdminJobs;
window.loadUserJobs = loadUserJobs;
window.closeAdminModal = closeAdminModal;
window.viewJobDetail = viewJobDetail;
window.completeJob = completeJob;
window.closeJobDetail = closeJobDetail;
window.acceptJob = acceptJob;
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;
window.triggerImport = triggerImport;
window.uploadImportFile = uploadImportFile;
window.updateJobBadge = updateJobBadge;
window.updateMyJobBadge = updateMyJobBadge;
window.loadMyJobs = loadMyJobs;
window.loadCompletedJobs = loadCompletedJobs;
window.loadTechnicianStats = loadTechnicianStats;
window.loadTechnicianDetail = loadTechnicianDetail;
window.addNewTechnician = addNewTechnician;
window.updateChartFilter = updateChartFilter;
window.printReport = printReport;
window.exportDashboardReport = exportDashboardReport;
window.closeAddTechnicianModal = closeAddTechnicianModal;
window.submitAddTechnician = submitAddTechnician;
window.deleteCurrentJob = deleteCurrentJob;
window.closeConfirmModal = closeConfirmModal;
window.goHome = goHome;
window.setCurrentTime = setCurrentTime;
window.setCurrentDate = setCurrentDate;
window.closeCompleteJobModal = closeCompleteJobModal;
window.confirmCompleteJob = confirmCompleteJob;

// Close complete job modal
function closeCompleteJobModal() {
    document.getElementById('completeJobModal').classList.add('hidden');
    document.getElementById('completeJobNotes').value = '';
}

// Confirm and complete the job
async function confirmCompleteJob() {
    const ticketId = window.currentCompleteTicketId;
    const notes = document.getElementById('completeJobNotes').value.trim();

    if (!ticketId) return;

    // Close the modal and job detail
    closeCompleteJobModal();
    closeJobDetail();

    // Get current user's name from localStorage
    const userStr = localStorage.getItem('itSupportUser');
    const user = userStr ? JSON.parse(userStr) : null;
    const technicianName = user ? (user.fullName || user.username) : 'Admin IT';

    showModal('กำลังบันทึก', 'ระบบกำลังอัปเดตสถานะเป็น "สำเร็จ"...', 'info');

    // Send notes along with status update
    const res = await apiCall('updateJobStatus', {
        ticketId: ticketId,
        status: "สำเร็จ",
        technician: technicianName,
        notes: notes || 'ดำเนินการเสร็จสิ้น'
    });

    if (res.success) {
        showModal('ปิดงานสำเร็จ', 'บันทึกสถานะงานเรียบร้อยแล้ว', 'success', () => {
            loadAdminJobs();
            updateJobBadge();
            updateMyJobBadge();
        });
    } else {
        showModal('ผิดพลาด', res.message, 'info');
    }

    // Clear the stored ticket ID
    window.currentCompleteTicketId = null;
}


// Set current date function
function setCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`;

    const dateInput = document.getElementById('customDate');
    dateInput.value = currentDate;

    // Add visual feedback
    dateInput.classList.add('border-green-400', 'bg-green-50');
    setTimeout(() => {
        dateInput.classList.remove('border-green-400', 'bg-green-50');
    }, 1000);
}

// Auto-format time input
function formatTimeInput(input) {
    let value = input.value.replace(/[^0-9]/g, ''); // Remove non-digits

    if (value.length >= 2) {
        // Add colon after first 2 digits
        value = value.substring(0, 2) + ':' + value.substring(2, 4);
    }

    input.value = value;
}

// Check for persistent session on load
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('itSupportUser');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            // Re-use logic but skip the success modal
            handleLoginSuccess(user);
        } catch (e) {
            console.error("Invalid session data", e);
            localStorage.removeItem('itSupportUser');
        }
    }

    // Add time input formatter
    const timeInput = document.getElementById('customTime');
    if (timeInput) {
        timeInput.addEventListener('input', function (e) {
            formatTimeInput(e.target);
        });

        // Validate on blur
        timeInput.addEventListener('blur', function (e) {
            const value = e.target.value;
            if (value && !value.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
                e.target.classList.add('border-red-300', 'bg-red-50');
                setTimeout(() => {
                    e.target.classList.remove('border-red-300', 'bg-red-50');
                }, 2000);
            }
        });
    }
});

