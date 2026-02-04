let currentAdminJobs = [];
let modalCallback = null;
let lastViewOnlyMyJobs = false; // Track if we were viewing 'My Jobs' or 'Pending Jobs'
let currentView = 'pending'; // track current admin view: 'pending', 'my', 'completed'
let currentJobPage = 1; // Pagination for User Jobs View
let userJobMonthFilter = ''; // Monthly filter for User Jobs View
let userJobYearFilter = new Date().getFullYear(); // Yearly filter for User Jobs View
let dashboardYearFilter = new Date().getFullYear(); // Dashboard overall year filter
let currentTechPage = 1;
let currentTechName = '';
let currentTechStart = '';
let currentTechEnd = '';

// --- Global Helper for Technician Name ---
function getTechnicianName() {
    const userStr = localStorage.getItem('itSupportUser');
    if (!userStr) return 'Admin IT';
    const user = JSON.parse(userStr);
    const name = user.fullName || user.username || 'Admin IT';
    return name.trim();
}

// --- API Helper ---
async function apiCall(action, data = {}, method = 'POST') {
    try {
        let url = `api/${action}`;

        // ถ้าเป็น GET ให้แนบ query params
        if (method === 'GET') {
            const params = new URLSearchParams(data).toString();
            if (params) url += `?${params}`;
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
function showConfirmModal(title, message, callback, type = 'normal') {
    document.getElementById('confirmModalTitle').innerText = title;
    document.getElementById('confirmModalMessage').innerText = message;
    confirmCallback = callback;
    document.getElementById('confirmModal').classList.remove('hidden');

    // Bind Confirm Button
    const btn = document.getElementById('btnConfirmAction');

    // Style update based on type
    if (type === 'danger') {
        btn.className = "flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-base font-semibold rounded-2xl shadow-lg shadow-red-200 transition-all transform active:scale-95 focus:outline-none";
    } else {
        btn.className = "flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-base font-semibold rounded-2xl shadow-lg shadow-blue-200 transition-all transform active:scale-95 focus:outline-none";
    }

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
        document.getElementById('userMyJobsBtn').classList.remove('hidden');
        document.getElementById('adminStatsBtn').classList.remove('hidden');
        document.getElementById('adminImportBtn').classList.remove('hidden');
        document.getElementById('adminTemplateBtn').classList.remove('hidden');

        // Check if user is also a technician
        statusBadge.innerHTML = `⭐ สถานะ: ผู้ดูแลระบบ`;
        apiCall('getTechnicianStats', {}, 'GET').then(res => {
            if (res.success && res.technicians) {
                const isTech = res.technicians.some(t => t.technician.trim() === user.fullName.trim());
                if (isTech) {
                    statusBadge.innerHTML = `🛠️ สถานะ: ช่างเทคนิค`;
                    statusBadge.className = "text-[10px] font-medium bg-blue-600/30 px-2 py-0.5 rounded-full w-fit border border-blue-200/20";
                }
            }
        });

        statusBadge.className = "text-[10px] font-medium bg-purple-600/30 px-2 py-0.5 rounded-full w-fit border border-purple-200/20";
        updateJobBadge();
        updateMyJobBadge();
        startDashboardPolling();
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
    loadDepartments(); // Load departments for autocomplete
}

let availableDepartments = [];

async function loadDepartments() {
    const res = await apiCall('getDepartments', {}, 'GET');
    if (res.success && res.departments) {
        availableDepartments = res.departments;
    }
}

// --- Custom Searchable Dropdown Logic ---
function renderLocationDropdown(filterText = '') {
    const dropdown = document.getElementById('customLocationDropdown');
    const input = document.getElementById('repairLocation');
    dropdown.innerHTML = '';

    const filtered = availableDepartments.filter(d =>
        !filterText || d.toLowerCase().includes(filterText.toLowerCase())
    );

    if (filtered.length === 0) {
        dropdown.innerHTML = `<div class="p-3 text-sm text-gray-400 text-center italic">ไม่พบข้อมูล (พิมพ์เพื่อเพิ่มใหม่)</div>`;
        return;
    }

    filtered.forEach(dept => {
        const div = document.createElement('div');
        div.className = "px-4 py-2 hover:bg-orange-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-0 transition";
        div.innerText = dept;
        div.onmousedown = function () { // use mousedown to fire before blur
            selectLocation(dept);
        };
        dropdown.appendChild(div);
    });
}

function toggleLocationDropdown(state) {
    const dropdown = document.getElementById('customLocationDropdown');
    const input = document.getElementById('repairLocation');

    if (state === 'toggle') {
        const isHidden = dropdown.classList.contains('hidden');
        if (isHidden) {
            renderLocationDropdown(''); // Show full list ALWAYS when toggling via button
            dropdown.classList.remove('hidden');
            // Do NOT focus input here, otherwise it triggers onfocus which re-filters the list
        } else {
            dropdown.classList.add('hidden');
        }
    } else if (state === true) {
        // Only filter if not already visible/populated by toggle? NAh, normal focus behavior is filter.
        renderLocationDropdown(input.value);
        dropdown.classList.remove('hidden');
    } else {
        dropdown.classList.add('hidden');
    }
}

function filterLocationDropdown(text) {
    renderLocationDropdown(text);
    document.getElementById('customLocationDropdown').classList.remove('hidden');
}

function selectLocation(value) {
    const input = document.getElementById('repairLocation');
    input.value = value;
    document.getElementById('customLocationDropdown').classList.add('hidden');
}

function confirmLogout() {
    logout();
    showModal('ออกจากระบบ', 'คุณได้ออกจากระบบเรียบร้อยแล้ว', 'logout');
}

function logout() {
    document.getElementById('repairSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.add('hidden');
    document.getElementById('jobListSection').classList.add('hidden');
    document.getElementById('jobDetailSection').classList.add('hidden'); // Hide Job Detail Page // Hide Job List Page

    document.getElementById('importSection').classList.add('hidden');
    document.getElementById('navMenu').classList.add('hidden');
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

                    // Update Global Total & helper
                    if (typeof dashboardTotalCompleted !== 'undefined') {
                        dashboardTotalCompleted = data.overview.completed;
                        if (typeof updateDashboardCompletedDisplay === 'function') {
                            updateDashboardCompletedDisplay();
                        }
                    } else {
                        setVal('statSuccess', data.overview.completed);
                    }

                    setVal('statInProgress', data.overview.in_progress);
                    setVal('statTechnicians', data.overview.technicians);

                    // Update Chart
                    // renderMonthlyChart(); // Removed
                    loadProblemStatChart(); // Update Problem Chart (respects filter)
                }
            }
        }

        // Update Technician Stats Page if visible
        const jobListSection = document.getElementById('jobListSection');
        const jobListTitle = document.getElementById('jobListTitle');
        if (jobListSection && !jobListSection.classList.contains('hidden') && jobListTitle && jobListTitle.innerText === 'สถิติช่างผู้รับงาน') {
            const res = await apiCall('getTechnicianStats', {}, 'GET');
            if (res.success) {
                renderTechnicianStatsUI(res.technicians);
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
    // List of all main content sections to manage visibility
    // List of all main content sections to manage visibility
    const sections = [
        'loginSection',
        'repairSection',
        'dashboardSection',
        'jobListSection',
        'jobDetailSection',
        'deliveryFormSection'
        // 'importSection' is managed separately by login state
    ];

    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('hidden');
            el.style.display = ''; // Clear inline styles
        }
    });

    const target = document.getElementById(pageId);
    if (target) target.classList.remove('hidden');

    // Manage Import Section Visibility (Only for Admin AND on Repair Section)
    const userStr = localStorage.getItem('itSupportUser');
    const importSection = document.getElementById('importSection');
    if (userStr && importSection) {
        const user = JSON.parse(userStr);
        if (user.isAdmin && pageId === 'repairSection') {
            importSection.classList.remove('hidden');
        } else {
            importSection.classList.add('hidden');
        }
    }
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

    if (form.division.value == "") requiredFields.push('หน่วยงาน');
    if (form.problemType.value == "") requiredFields.push('ประเภทปัญหา');
    if (form.repairLocation.value == "") requiredFields.push('สถานที่ซ่อม');

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
        repairLocation: form.repairLocation ? form.repairLocation.value : "",
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

    // Restore Year Selection
    const savedYear = localStorage.getItem('dashboardYearFilter');
    if (savedYear) {
        dashboardYearFilter = savedYear;
    }
    const yearDropdown = document.getElementById('mainDashboardYear');
    if (yearDropdown) {
        yearDropdown.value = dashboardYearFilter;
    }

    const data = await apiCall('getDashboardStats', { year: dashboardYearFilter }, 'GET');
    updateDashboardUI(data);

    // Also fetch annual breakdown
    fetchDashboardAnnualStats();

    // Load Charts (They will internally use dashboardYearFilter if no month selected)
    loadProblemStatChart();
    loadAssessmentStatChart();
}

async function changeDashboardYear(val) {
    dashboardYearFilter = val;
    localStorage.setItem('dashboardYearFilter', val);
    await loadDashboard();
}
window.changeDashboardYear = changeDashboardYear;

async function searchAssetHistory() {
    var code = document.getElementById('searchAssetCode').value;
    if (!code) return showModal('แจ้งเตือน', 'กรุณาระบุเลขครุภัณฑ์', 'info');
    document.getElementById('assetSearchResult').classList.add('hidden');
    const data = await apiCall('getDashboardStats', { assetCode: code }, 'GET');

    // Check if asset stats exist and have total > 0 (or just exist if you want to show 0s)
    if (data.success && data.assetStats && (data.assetStats.total > 0 || data.assetStats.last1Year > 0)) {
        updateDashboardUI(data);
    } else {
        showModal('ไม่พบข้อมูล', 'ไม่พบประวัติการแจ้งซ่อมของครุภัณฑ์นี้', 'info');
    }
}

// Global vars for Dashboard Completed logic
let dashboardAnnualStats = new Array(12).fill(0);
let dashboardTotalCompleted = 0;

async function fetchDashboardAnnualStats() {
    try {
        const year = new Date().getFullYear();
        const res = await apiCall('getAnnualCompletedStats', { year }, 'GET');
        if (res.success) {
            dashboardAnnualStats = res.stats;

            // Restore saved filter
            const savedFilter = localStorage.getItem('dashboardMonthFilter');
            const dropdown = document.getElementById('dashboardCompletedMonthFilter');
            if (dropdown && savedFilter) {
                dropdown.value = savedFilter;
            }

            updateDashboardCompletedDisplay();
        }
    } catch (e) { console.log('Fetch annual stats failed', e); }
}

function updateDashboardCompletedDisplay() {
    const dropdown = document.getElementById('dashboardCompletedMonthFilter');
    const statEl = document.getElementById('statSuccess');
    if (!statEl) return;

    const val = dropdown ? dropdown.value : ""; // "1" .. "12" or ""
    if (dropdown) localStorage.setItem('dashboardMonthFilter', val); // Save state only if exists

    // Reset styling
    statEl.className = "text-2xl font-bold text-gray-800 mb-1 relative z-10"; // Ensure z-index matches new UI

    if (val === "") {
        // Show Total
        statEl.innerText = dashboardTotalCompleted;
    } else {
        // Show Monthly
        const idx = parseInt(val) - 1;
        if (idx >= 0 && idx < 12) {
            statEl.innerText = dashboardAnnualStats[idx];
        } else {
            statEl.innerText = 0;
        }
    }
}

function loadCompletedJobsWithCurrentFilter() {
    const dropdown = document.getElementById('dashboardCompletedMonthFilter');
    const val = dropdown ? dropdown.value : "";

    if (val === "") {
        loadCompletedJobs(true);
    } else {
        const year = new Date().getFullYear();
        const month = val.padStart(2, '0');
        // Filter by specific YYYY-MM
        loadCompletedJobs(true, `${year}-${month}`);
    }
}

function updateDashboardUI(data) {
    if (!data.success) return alert(data.message);
    if (data.overview) {
        document.getElementById('statPending').innerText = data.overview.pending;

        // Update Global Total
        dashboardTotalCompleted = data.overview.completed;

        // Trigger display update (respects current dropdown)
        updateDashboardCompletedDisplay();

        document.getElementById('statInProgress').innerText = data.overview.in_progress;
        document.getElementById('statTechnicians').innerText = data.overview.technicians || 0;
    }
    if (data.assetStats) {
        document.getElementById('resAssetCode').innerText = data.assetStats.assetCode;
        document.getElementById('res7Days').innerText = data.assetStats.last7Days + " ครั้ง";
        document.getElementById('res30Days').innerText = data.assetStats.last1Month + " ครั้ง";
        document.getElementById('res365Days').innerText = data.assetStats.last1Year + " ครั้ง";
        document.getElementById('assetSearchResult').classList.remove('hidden');
    }
}



// --- Admin Job Logic ---
// --- General Job Loader for "Page" View ---
function showJobListPage(title, iconSVG, contentHTML, backDestination = null) {
    showPage('jobListSection');

    // Clear dynamic filters
    const filterArea = document.getElementById('jobListFilterArea');
    if (filterArea) filterArea.classList.add('hidden');

    // Update Title & Icon of the Job List Page
    document.getElementById('jobListTitle').innerText = title;

    // If iconSVG is provided, update it. If null, keep default or handle appropriately.
    if (iconSVG) {
        document.getElementById('jobListIcon').innerHTML = iconSVG;
        // Ensure correct styling if needed, or assume standard structure
    }

    document.getElementById('jobListContainer').innerHTML = contentHTML;

    // Handle Back Button
    const backBtn = document.getElementById('btnJobListBack');
    if (!backBtn) return;

    if (backDestination) {
        backBtn.classList.remove('hidden');
        if (backDestination === 'dashboard') {
            backBtn.onclick = function () { loadDashboard(); };
        } else {
            backBtn.onclick = function () { goHome(); };
        }
    } else {
        backBtn.classList.add('hidden');
    }
}


// --- User Jobs (Paginated / All Jobs) ---
async function changeJobPage(newPage) {
    if (newPage < 1) return;
    currentJobPage = newPage;
    await loadUserJobs();
}

// --- User Job List Logic ---
async function changeUserJobMonth(val) {
    userJobMonthFilter = val;
    currentJobPage = 1;
    await loadUserJobs();
}

async function changeUserJobYear(val) {
    userJobYearFilter = val;
    currentJobPage = 1;
    await loadUserJobs();
}

// --- User Job List Logic ---
async function loadUserJobs() {
    // Hide back button for my requests page (Nav item)
    showJobListPage(
        'สถานะงานซ่อมทั้งหมด',
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>',
        '<div class="text-center py-8 text-gray-500">กำลังโหลดข้อมูล...</div>',
        null // Hide back button
    );

    // Setup Filter Area (Month + Year)
    const filterArea = document.getElementById('jobListFilterArea');
    if (filterArea) {
        filterArea.classList.remove('hidden');
        filterArea.className = "flex items-center gap-2"; // Ensure flex row

        // Month Options
        const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
        let monthOptions = '<option value="">ทั้งหมด (เดือน)</option>';
        months.forEach((m, i) => {
            const val = (i + 1).toString();
            monthOptions += `<option value="${val}" ${userJobMonthFilter === val ? 'selected' : ''}>${m}</option>`;
        });

        // Year Options (BE 2567 - 2573)
        let yearOptions = '';
        const startYear = 2024;
        for (let y = startYear; y <= 2030; y++) {
            yearOptions += `<option value="${y}" ${userJobYearFilter == y ? 'selected' : ''}>${y + 543}</option>`;
        }

        filterArea.innerHTML = `
            <div class="flex items-center gap-2">
                <!-- Month -->
                <div class="relative bg-white rounded-xl shadow-sm border border-gray-200 pl-3 py-1.5 hover:border-orange-500 transition-all duration-200 flex items-center gap-2">
                    <select id="userJobMonthSelect" onchange="changeUserJobMonth(this.value)"
                      class="appearance-none bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer pr-8 leading-tight w-full min-w-[120px]">
                      ${monthOptions}
                    </select>
                    <div class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                </div>
                <!-- Year -->
                <div class="relative bg-white rounded-xl shadow-sm border border-gray-200 pl-3 py-1.5 hover:border-orange-500 transition-all duration-200 flex items-center gap-2">
                    <select id="userJobYearSelect" onchange="changeUserJobYear(this.value)"
                      class="appearance-none bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer pr-8 leading-tight min-w-[80px]">
                      ${yearOptions}
                    </select>
                    <div class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                </div>
            </div>
        `;
    }

    const userStr = localStorage.getItem('itSupportUser');
    if (!userStr) {
        document.getElementById('jobListContainer').innerHTML = `<div class="text-center p-6 bg-red-50 text-red-600 rounded-lg">ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่</div>`;
        return;
    }

    // Call Paginated API with filter
    let query = `page=${currentJobPage}&limit=10`;
    if (userJobMonthFilter) {
        query += `&month=${userJobYearFilter}-${userJobMonthFilter.padStart(2, '0')}`;
    } else {
        query += `&year=${userJobYearFilter}`;
    }

    const res = await apiCall(`getRepairJobsPaginated?${query}`, {}, 'GET');

    if (!res.success) {
        document.getElementById('jobListContainer').innerHTML = `<div class="text-red-500 text-center">${res.message}</div>`;
        return;
    }

    const { jobs, pagination } = res;
    // VERY IMPORTANT: Store in global variable so viewJobDetail(index) works
    currentAdminJobs = jobs;

    if (jobs.length === 0) {
        document.getElementById('jobListContainer').innerHTML = `<div class="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300"><p class="text-gray-500">ไม่พบประวัติการแจ้งซ่อม</p></div>`;
        return;
    }

    // --- RENDER USER JOBS (List View) ---
    let html = `
    <div class="overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                    <th class="p-4 font-semibold">Ticket ID</th>
                    <th class="p-4 font-semibold">ผู้แจ้ง</th>
                    <th class="p-4 font-semibold">อุปกรณ์</th>
                    <th class="p-4 font-semibold">อาการ</th>
                    <th class="p-4 font-semibold text-center">สถานะ</th>
                    <th class="p-4 font-semibold text-center w-10"></th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 text-sm text-gray-700">`;

    jobs.forEach((job, index) => { // NOTE: index here is 0-9. viewJobDetail needs correct index if mapping from 'currentAdminJobs'. Since currentAdminJobs = jobs, this is fine.
        let statusColor = 'bg-gray-100 text-gray-600';
        let statusText = job.status;

        if (job.status === 'รอรับเรื่อง') {
            statusColor = 'bg-purple-50 text-purple-700 border border-purple-100';
        } else if (job.status === 'กำลังดำเนินการ') {
            statusColor = 'bg-blue-50 text-blue-700 border border-blue-100';
        } else if (job.status.includes('สำเร็จ') || job.status === 'Completed') {
            statusColor = 'bg-green-50 text-green-700 border border-green-100';
        }

        html += `
            <tr class="hover:bg-gray-50/50 transition">
                <td class="p-4">
                    <div class="font-mono font-bold text-gray-800 text-xs">#${job.ticketId}</div>
                    <div class="text-[10px] text-gray-400 mt-1">${job.timestamp}</div>
                </td>
                <td class="p-4">
                    <div class="font-medium text-gray-800">${job.reporter || '-'}</div>
                    <div class="text-[10px] text-gray-400">${job.division || ''}</div>
                </td>
                <td class="p-4">
                    <div class="font-medium text-gray-800">${job.deviceName || '-'}</div>
                    <div class="text-[10px] text-gray-500 mt-1 flex flex-wrap gap-1 items-center">
                        <span class="font-mono text-gray-400">${job.assetCode || ''}</span>
                        ${job.floor ? `<span class="bg-gray-100 px-1.5 rounded text-gray-600 ml-1">ชั้น ${job.floor}</span>` : ''}
                        ${job.contact ? `<span class="text-gray-400 ml-1">📞 ${job.contact}</span>` : ''}
                    </div>
                </td>
                <td class="p-4 max-w-xs truncate" title="${job.issue}">
                    ${job.issue}
                </td>
                <td class="p-4 text-center">
                     <span class="${statusColor} px-2.5 py-1 rounded-md text-xs font-bold border inline-block min-w-[80px]">
                        ${statusText}
                     </span>
                </td>
                <td class="p-4 text-center">
                    <div class="flex justify-center items-center gap-1">
                        <button onclick="viewJobDetail(${index})" class="text-gray-500 hover:text-blue-600 transition p-1 rounded-full hover:bg-blue-50" title="ดูรายละเอียด">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        </button>
                        ${(job.status.includes('สำเร็จ') || job.status === 'Completed') ?
                (job.isAssessed ?
                    `<button onclick="openAssessmentModal(${index})" class="text-green-500 hover:text-green-600 transition p-1 rounded-full hover:bg-green-50" title="ประเมินแล้ว">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>` :
                    `<button onclick="openAssessmentModal(${index})" class="text-yellow-500 hover:text-yellow-600 transition p-1 rounded-full hover:bg-yellow-50" title="ประเมินการซ่อม">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                            </button>`
                ) : ''}
                    </div>
                </td>
            </tr>`;
    });

    html += `</tbody></table></div>`;

    // --- PAGINATION CONTROLS ---
    const { totalPages, currentPage } = pagination;
    const isFirst = currentPage === 1;
    const isLast = currentPage === totalPages;

    html += `
    <div class="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
        <div>
            แสดงหน้าที่ <span class="font-bold text-gray-900">${currentPage}</span> จาก <span class="font-bold text-gray-900">${totalPages}</span> (ทั้งหมด ${pagination.totalItems} รายการ)
        </div>
        <div class="flex gap-2">
            <button onclick="changeJobPage(1)" ${isFirst ? 'disabled' : ''} class="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path></svg>
                หน้าแรก
            </button>
            <button onclick="changeJobPage(${currentPage - 1})" ${isFirst ? 'disabled' : ''} class="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                ก่อนหน้า
            </button>
            <div class="px-4 py-2 bg-gray-100 rounded-lg font-bold text-gray-700">
                ${currentPage}
            </div>
            <button onclick="changeJobPage(${currentPage + 1})" ${isLast ? 'disabled' : ''} class="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                ถัดไป
            </button>
            <button onclick="changeJobPage(${totalPages})" ${isLast ? 'disabled' : ''} class="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1">
                หน้าสุดท้าย
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
            </button>
        </div>
    </div>
    `;

    document.getElementById('jobListContainer').innerHTML = html;
}

// --- Admin Job List Logic ---
async function loadAdminJobs(onlyMyJobs = false, fromDashboard = false) {
    lastViewOnlyMyJobs = onlyMyJobs; // Save current view mode
    currentView = onlyMyJobs ? 'my' : 'pending';

    let backDest = fromDashboard ? 'dashboard' : null;

    showJobListPage(
        onlyMyJobs ? 'งานที่รับผิดชอบ (กำลังดำเนินการ)' : 'รายการแจ้งซ่อม (รอรับเรื่อง)',
        onlyMyJobs
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>'
            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>',
        '<div class="text-center py-8 text-gray-500">กำลังโหลดข้อมูล...</div>',
        backDest
    );

    let action = 'getPendingJobs';
    let data = {};
    if (onlyMyJobs) {
        action = 'getMyJobs';
        data = { technician: getTechnicianName() };
    }

    const res = await apiCall(action, data, 'GET');

    if (!res.success) { document.getElementById('jobListContainer').innerHTML = `<div class="text-red-500 text-center">${res.message}</div>`; return; }

    currentAdminJobs = res.jobs;

    if (currentAdminJobs.length === 0) {
        document.getElementById('jobListContainer').innerHTML = `<div class="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-4">
            <div class="bg-gray-50 p-4 rounded-full text-gray-300">
                <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <p class="text-lg text-gray-500 font-medium">${onlyMyJobs ? 'ไม่มีงานที่กำลังดำเนินการ' : 'ไม่มีงานแจ้งซ่อมใหม่'}</p>
        </div>`;
        return;
    }

    let html = '';
    if (!onlyMyJobs) {
        html += `
        <div class="flex justify-end mb-4">
            <button onclick="bulkCompleteJobs()" class="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm rounded-xl font-bold shadow-md transition flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                ปิดงานรอรับทั้งหมด
            </button>
        </div>`;
    }
    html += '<div class="grid grid-cols-1 gap-4">';
    currentAdminJobs.forEach((job, index) => {
        let isDoing = job.status === 'กำลังดำเนินการ';

        let statusBadge = '';
        if (isDoing) {
            statusBadge = `<div class="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded border border-blue-100 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>กำลังซ่อม</div>`;
        } else {
            statusBadge = `
                <div class="flex flex-col items-end gap-1">
                    <div class="bg-purple-50 text-purple-700 text-xs font-bold px-2 py-1 rounded border border-purple-100">รอรับเรื่อง</div>
                </div>`;
        }

        let actionBtn = isDoing
            ? `<button onclick="completeJob('${job.ticketId}')" class="w-full h-10 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm rounded-lg shadow-md transition font-bold flex items-center justify-center gap-2">✅ ปิดงาน</button>`
            : `<button onclick="completeJob('${job.ticketId}')" class="w-full h-10 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm rounded-lg shadow-md transition font-bold flex items-center justify-center gap-2">✅ ปิดงาน</button>`;

        html += `
      <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition relative group">
        <div class="flex justify-between items-start mb-3">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
                 <span class="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-md font-mono font-bold tracking-wide">#${job.ticketId}</span>
                 <span class="text-xs text-gray-400">${job.timestamp}</span>
            </div>
            <h3 class="font-bold text-gray-800 text-lg leading-tight mt-1">${job.deviceName || 'อุปกรณ์ไม่ระบุชื่อ'}</h3>
            <div class="flex flex-wrap gap-2 mt-1 text-xs items-center">
                 <span class="font-mono text-gray-400 bg-gray-50 px-1.5 rounded border border-gray-100">${job.assetCode || '-'}</span>
                 ${job.repairLocation ? `<span class="bg-blue-50 text-blue-600 px-1.5 rounded border border-blue-100">📍 ${job.repairLocation}</span>` : ''}
                 ${job.floor ? `<span class="bg-orange-50 text-orange-600 px-1.5 rounded border border-orange-100">ชั้น ${job.floor}</span>` : ''}
                 ${job.contact ? `<span class="text-gray-400 flex items-center gap-0.5">📞 ${job.contact}</span>` : ''}
            </div>
          </div>
          <div class="text-right">
             ${statusBadge}
          </div>
        </div>
        
        <div class="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4">
            <svg class="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <p class="text-sm text-gray-700 leading-relaxed font-medium">"${job.issue}"</p>
        </div>

        <div class="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-3 gap-2">
             <div class="flex items-center gap-4 w-full md:w-auto">
                 <div class="flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg> ${job.division}</div>
                 <div class="flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> ${job.reporter}</div>
             </div>
             <div class="flex gap-3 w-full md:w-auto">
                <button onclick="viewJobDetail(${index})" class="h-10 px-4 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition font-bold shadow-sm whitespace-nowrap">รายละเอียด</button>
                <div class="w-32">${actionBtn}</div>
             </div>
        </div>
      </div>`;
    });
    html += '</div>';

    document.getElementById('jobListContainer').innerHTML = html;


}


// --- Helper to Apply Filter from Completed Jobs Page ---
function applyJobHistoryFilter() {
    const m = document.getElementById('filterMonth').value;
    const y = document.getElementById('filterYear').value;

    let filter = null;
    if (m && y) {
        // Pad month with 0 if needed
        const mStr = m.toString().padStart(2, '0');
        filter = `${y}-${mStr}`;
    }

    // Reload with new filter
    loadCompletedJobs(false, filter);
}


// --- Load Completed Jobs (History) as Page ---
async function loadCompletedJobs(fromDashboard = false, monthFilter = null) {
    currentView = 'completed';
    let backDest = fromDashboard ? 'dashboard' : null;

    let title = 'ประวัติการแจ้งซ่อม (สำเร็จแล้ว)';
    if (monthFilter) {
        const [y, m] = monthFilter.split('-');
        const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        const monthName = thaiMonths[parseInt(m) - 1];
        const yearThai = parseInt(y) + 543;
        title += ` - ${monthName} ${yearThai}`;
    }

    showJobListPage(
        title,
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
        '<div class="text-center py-8 text-gray-500">กำลังโหลดข้อมูล...</div>',
        backDest
    );

    const data = monthFilter ? { month: monthFilter } : {};
    const res = await apiCall('getCompletedJobs', data, 'GET');

    if (!res.success) { document.getElementById('jobListContainer').innerHTML = `<div class="text-red-500 text-center">${res.message}</div>`; return; }

    currentAdminJobs = res.jobs;

    if (currentAdminJobs.length === 0) {
        document.getElementById('jobListContainer').innerHTML = `<div class="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300"><p class="text-gray-500">ไม่พบประวัติการซ่อมสำเร็จ</p></div>`;
        return;
    }

    // -- Dropdown Logic --
    const currentYear = new Date().getFullYear();
    const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

    let defaultY = currentYear;
    let defaultM = "";

    if (monthFilter) {
        const [y, m] = monthFilter.split('-');
        defaultY = parseInt(y);
        defaultM = parseInt(m).toString();
    }

    // -- Fetch Annual Stats --
    const selectedYear = defaultY || currentYear;
    let annualStats = new Array(12).fill(0);
    try {
        const statsRes = await apiCall('getAnnualCompletedStats', { year: selectedYear }, 'GET');
        if (statsRes.success) annualStats = statsRes.stats;
    } catch (e) {
        console.log('Stats error');
    }

    let html = `
    <div class="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
        <div class="flex items-center gap-2 w-full md:w-auto">
            <span class="text-sm font-bold text-gray-600">เลือกเดือน/ปี:</span>
            <select id="filterMonth" class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 bg-gray-50">
                <option value="">ทั้งหมด</option>
                ${thaiMonths.map((m, i) => `<option value="${i + 1}" ${defaultM == (i + 1).toString() ? 'selected' : ''}>${m}</option>`).join('')}
            </select>
            <select id="filterYear" class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 bg-gray-50">
                ${Array.from({ length: 5 }, (_, i) => currentYear - i).map(y =>
        `<option value="${y}" ${defaultY == y ? 'selected' : ''}>${y + 543}</option>`
    ).join('')}
            </select>
            <button onclick="applyJobHistoryFilter()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition">
                ค้นหา
            </button>
        </div>

        <button onclick="printReport('overview')" class="px-4 py-2 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-700 text-sm rounded-lg font-bold flex items-center gap-2 shadow-sm transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            พิมพ์รายงาน
        </button>
    </div>

    <!-- Monthly Stats Grid -->
    <div class="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 mb-6">
        ${annualStats.map((count, i) => {
        const isSelected = defaultM == (i + 1).toString();
        const bgClass = isSelected ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-orange-50';
        const borderClass = isSelected ? 'border-orange-600' : 'border-gray-200';
        const textClass = isSelected ? 'text-white' : 'text-orange-500';

        const monthStr = String(i + 1).padStart(2, '0');
        const targetFilter = `${selectedYear}-${monthStr}`;

        return `
            <div onclick="loadCompletedJobs(false, '${targetFilter}')" 
                 class="${bgClass} border ${borderClass} rounded-lg p-2 text-center cursor-pointer transition flex flex-col items-center justify-center h-16 relative overflow-hidden group">
                <span class="text-[10px] uppercase font-bold tracking-wider relative z-10">${thaiMonths[i].substring(0, 3)}</span> 
                <span class="text-xl font-bold ${textClass} group-hover:scale-110 transition relative z-10">${count}</span>
                ${isSelected ? '' : '<div class="absolute inset-0 bg-orange-100 opacity-0 group-hover:opacity-20 transition"></div>'}
            </div>`;
    }).join('')}
    </div>

    <div class="grid grid-cols-1 gap-4">
    `;

    currentAdminJobs.forEach((job, index) => {
        // Check SLA Status & Formatting


        html += `
        <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition opacity-95 hover:opacity-100">
            <div class="flex justify-between items-start mb-3">
                <div class="flex items-center gap-3">
                   <h4 class="font-bold text-gray-800 text-lg">${job.deviceName || 'ไม่ระบุชื่อเครื่อง'}</h4>
                   <span class="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">#${job.ticketId}</span>
                </div>
                <div class="flex flex-col items-end gap-1">
                    <div class="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                       <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                       สำเร็จ
                    </div>
                </div>
            </div>
            
            <div class="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                 <span class="flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> แจ้ง: ${job.timestamp}</span>
                 <span class="flex items-center gap-1 hidden"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> เสร็จ: ${job.finished_at}</span>
            </div>

            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4 flex justify-between items-center">
               <p class="text-sm text-gray-700 line-clamp-2">"${job.issue}"</p>
            </div>

             <div class="flex justify-between items-center pt-2 border-t border-gray-50">
               <div class="text-xs text-gray-500">
                   ช่างผู้ปฏิบัติงาน: <span class="font-bold text-gray-700">${job.technician}</span>
               </div>
               <button onclick="viewJobDetail(${index})" class="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs px-4 py-1.5 rounded-lg transition font-bold">ดูรายละเอียด</button>
             </div>
        </div>
        `;
    });
    html += '</div>';

    document.getElementById('jobListContainer').innerHTML = html;
}

// --- Technician Stats Logic as Page ---
async function loadTechnicianStats(fromDashboard = false) {
    let backDest = fromDashboard ? 'dashboard' : null;

    showJobListPage(
        'ช่างผู้รับงาน',
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>',
        '<div class="text-center py-8 text-gray-500">กำลังโหลดข้อมูลช่าง...</div>',
        backDest
    );

    const res = await apiCall('getTechnicianStats', {}, 'GET');

    if (!res.success) {
        document.getElementById('jobListContainer').innerHTML = `<div class="text-red-500 text-center">${res.message}</div>`;
        return;
    }

    renderTechnicianStatsUI(res.technicians);
}

// Helper to support loadMyJobs calling loadAdminJobs correctly
async function loadMyJobs(fromDashboard = false) {
    loadAdminJobs(true, fromDashboard);
}

function renderTechnicianStatsUI(techs) {
    if (!techs || techs.length === 0) {
        document.getElementById('jobListContainer').innerHTML = `
        <div class="flex flex-col items-center justify-center py-12 gap-4">
             <button onclick="addNewTechnician()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg transition flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                เพิ่มรายชื่อช่างคนแรก
             </button>
             <p class="text-gray-400 text-sm italic">ยังไม่มีข้อมูลช่างในระบบ</p>
        </div>`;
        return;
    }

    // List Layout
    let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';

    // Add Button (as card)
    html += `
    <button onclick="addNewTechnician()" class="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50 transition group h-full min-h-[140px]">
        <div class="bg-gray-100 group-hover:bg-white rounded-full p-3 transition"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg></div>
        <span class="text-sm font-bold">เพิ่มรายชื่อช่างใหม่</span>
    </button>
    `;

    techs.forEach(tech => {
        html += `
        <div class="relative group">
            <div onclick="loadTechnicianDetail('${tech.technician}')" class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-4 cursor-pointer hover:bg-indigo-50/30 hover:shadow-md transition group h-full">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl border border-indigo-100 shadow-sm">
                        ${tech.technician ? tech.technician.charAt(0) : '?'}
                    </div>
                    <div>
                        <h4 class="font-bold text-gray-800 text-base leading-tight">${tech.technician}</h4>
                        <p class="text-xs text-gray-400 mt-1">งานทั้งหมด: ${tech.total_jobs}</p>
                    </div>
                    <div class="ml-auto text-indigo-300 group-hover:text-indigo-500 transition">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                </div>
                
                <div class="mt-auto">
                     <div class="bg-green-50 rounded-xl p-3 text-center border border-green-100 italic transition-transform group-hover:scale-[1.02]">
                         <span class="block text-2xl font-bold text-green-600 leading-none">${tech.completed}</span>
                         <span class="text-[10px] text-green-500 font-bold uppercase tracking-wider">งานที่สำเร็จแล้ว</span>
                     </div>
                </div>
            </div>
            
        </div>
        `;
    });
    html += '</div>';
    document.getElementById('jobListContainer').innerHTML = html;
}

// Re-implement loadTechnicianDetail to stay in page context or use modal?
// The user asked for "buttons... create as webpage".
// Technician detail is a drill-down. It might be better as a page too.
// Re-implement loadTechnicianDetail to stay in page context or use modal?
// The user asked for "buttons... create as webpage".
// Technician detail is a drill-down. It might be better as a page too.
async function loadTechnicianDetail(name) {
    currentTechName = name;
    currentTechPage = 1;
    currentTechStart = '';
    currentTechEnd = '';

    showJobListPage(
        `ประวัติงาน: ${name}`,
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>',
        '<div class="text-center py-8 text-gray-500">กำลังโหลดประวัติงาน...</div>'
    );

    const container = document.getElementById('jobListContainer');

    // Header with Date Pickers
    let controlsHTML = `
    <div class="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
                <label class="block text-xs font-bold text-indigo-600 mb-1">ตั้งแต่วันที่</label>
                <input type="date" id="techHistStart" class="w-full border border-indigo-200 rounded-xl p-2.5 text-sm focus:ring-4 focus:ring-indigo-100 outline-none">
            </div>
            <div>
                <label class="block text-xs font-bold text-indigo-600 mb-1">ถึงวันที่</label>
                <input type="date" id="techHistEnd" class="w-full border border-indigo-200 rounded-xl p-2.5 text-sm focus:ring-4 focus:ring-indigo-100 outline-none">
            </div>
            <div class="flex gap-2">
                <button onclick="searchTechnicianHistory('${name}')" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition shadow-md flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    ค้นหา
                </button>
                <button onclick="loadTechnicianDetail('${name}')" class="px-3 bg-white border border-indigo-200 text-indigo-600 rounded-xl hover:bg-indigo-100 transition" title="ล้างการค้นหา">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4L20 20M4 20L20 4"></path></svg>
                </button>
            </div>
        </div>
    </div>
    <div id="techJobResults" class="text-center py-8 text-gray-500">กำลังโหลดประวัติงาน...</div>
    `;
    container.innerHTML = controlsHTML;

    await fetchTechnicianJobs();
}

async function changeTechPage(newPage) {
    if (newPage < 1) return;
    currentTechPage = newPage;
    await fetchTechnicianJobs();
}

async function searchTechnicianHistory(name) {
    const start = document.getElementById('techHistStart').value;
    const end = document.getElementById('techHistEnd').value;

    if (!start || !end) return showModal('แจ้งเตือน', 'กรุณาระบุวันเริ่มต้นและสิ้นสุด', 'info');

    currentTechStart = start;
    currentTechEnd = end;
    currentTechPage = 1;

    await fetchTechnicianJobs();
}

async function fetchTechnicianJobs() {
    const container = document.getElementById('techJobResults');
    // Don't clear immediately if pagination to avoid flickering, but maybe simple opacity change
    container.classList.add('opacity-50');

    const args = {
        name: currentTechName,
        page: currentTechPage,
        limit: 10
    };
    if (currentTechStart && currentTechEnd) {
        args.start = currentTechStart;
        args.end = currentTechEnd;
    }

    const res = await apiCall('getTechnicianJobs', args, 'GET');
    container.classList.remove('opacity-50');

    renderTechnicianJobsTable(res);
}

function renderTechnicianJobsTable(res) {
    const container = document.getElementById('techJobResults');
    if (!res.success) {
        container.innerHTML = `<div class="text-red-500 text-center">${res.message}</div>`;
        return;
    }

    const jobs = res.jobs;
    const pagination = res.pagination || { totalPages: 1, currentPage: 1, totalItems: jobs.length };
    currentAdminJobs = jobs; // For printing/details

    if (jobs.length === 0) {
        container.innerHTML = `<div class="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300"><p class="text-gray-500">ไม่พบงานในช่วงเวลาที่เลือก</p></div>`;
        return;
    }

    let printBtn = '';
    if (currentTechStart && currentTechEnd) {
        printBtn = `
            <div class="flex gap-2">
                <button onclick="printReport('technician', '${currentTechName}', '${currentTechStart}', '${currentTechEnd}')" class="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm rounded-lg font-bold flex items-center gap-2 shadow-sm transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                    พิมพ์รายงาน
                </button>
                <button onclick="printDeliveryReport('${currentTechName}', '${currentTechStart}', '${currentTechEnd}')" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg font-bold flex items-center gap-2 shadow-sm transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    ส่งมอบงาน
                </button>
            </div>`;
        // Hide original button
        const _unused = `
            <button onclick="printReport('technician', '${currentTechName}', '${currentTechStart}', '${currentTechEnd}')" class="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm rounded-lg font-bold flex items-center gap-2 shadow-sm transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                พิมพ์รายงาน
            </button>`;
    }

    let html = `
    <div class="mb-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="text-sm text-gray-600">
            พบข้อมูลทั้งหมด <span class="font-bold text-gray-900">${pagination.totalItems}</span> รายการ
        </div>
        ${printBtn}
    </div>
    
    <div class="overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                    <th class="p-4 font-semibold">Ticket ID</th>
                    <th class="p-4 font-semibold">เวลาที่แจ้ง/เสร็จ</th>
                    <th class="p-4 font-semibold">อุปกรณ์</th>
                    <th class="p-4 font-semibold">อาการ</th>
                    <th class="p-4 font-semibold text-center">สถานะ</th>
                    <th class="p-4 font-semibold text-center w-10"></th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 text-sm text-gray-700">`;

    jobs.forEach((job, index) => {
        let statusColor = job.status === 'สำเร็จ' || job.status === 'Completed' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-blue-50 text-blue-700 border border-blue-100';
        let finishedText = job.finished_at ? `<div class="text-[10px] text-green-600 font-bold mt-1 hidden">✓ ${job.finished_at}</div>` : '';

        html += `
            <tr class="hover:bg-gray-50/50 transition">
                <td class="p-4">
                    <div class="font-mono font-bold text-gray-800 text-xs">#${job.ticketId}</div>
                </td>
                <td class="p-4">
                    <div class="text-xs text-gray-500">${job.timestamp}</div>
                    ${finishedText}
                </td>
                <td class="p-4">
                    <div class="font-medium text-gray-800">${job.deviceName || '-'}</div>
                    <div class="text-[10px] text-gray-400 font-mono">${job.assetCode || ''}</div>
                </td>
                <td class="p-4 max-w-xs truncate" title="${job.issue}">
                    ${job.issue}
                </td>
                <td class="p-4 text-center">
                     <span class="${statusColor} px-2.5 py-1 rounded-md text-xs font-bold border inline-block">
                        ${job.status}
                     </span>
                </td>
                <td class="p-4 text-center">
                    <button onclick="viewJobDetail(${index})" class="text-gray-500 hover:text-blue-600 transition p-1 rounded-full hover:bg-blue-50">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>
                </td>
            </tr>`;
    });

    html += `</tbody></table></div>`;

    // Pagination
    const { totalPages, currentPage } = pagination;
    const isFirst = currentPage === 1;
    const isLast = currentPage === totalPages;

    html += `
    <div class="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
        <div>
            หน้า <span class="font-bold">${currentPage}</span> / ${totalPages}
        </div>
        <div class="flex gap-2">
            <button onclick="changeTechPage(1)" ${isFirst ? 'disabled' : ''} class="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1">
                หน้าแรก
            </button>
             <button onclick="changeTechPage(${currentPage - 1})" ${isFirst ? 'disabled' : ''} class="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                ก่อนหน้า
            </button>
            <button onclick="changeTechPage(${currentPage + 1})" ${isLast ? 'disabled' : ''} class="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                ถัดไป
            </button>
             <button onclick="changeTechPage(${totalPages})" ${isLast ? 'disabled' : ''} class="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1">
                หน้าสุดท้าย
            </button>
        </div>
    </div>`;

    container.innerHTML = html;
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

    const res = await apiCall('addTechnician', { name: name.trim() }, 'POST');

    if (res.success) {
        showModal('สำเร็จ', 'เพิ่มรายชื่อช่างเรียบร้อยแล้ว', 'success', () => {
            loadTechnicianStats(); // Reload list
        });
    } else {
        showModal('แจ้งเตือน', res.message || 'เกิดข้อผิดพลาด', 'info');
    }
}

async function deleteTechnician(name) {
    showConfirmModal(
        'ยืนยันการลบ',
        `คุณต้องการลบรายชื่อช่าง "${name}" หรือไม่?\n(ข้อมูลประวัติงานเดิมจะไม่หายไป แต่ชื่อนี้จะไม่ปรากฏในรายการสถิติหลัก)`,
        async () => {
            showModal('กำลังลบ', 'กรุณารอสักครู่...', 'info');
            const res = await apiCall('deleteTechnician', { name }, 'POST');
            if (res.success) {
                showModal('สำเร็จ', 'ลบรายชื่อเรียบร้อยแล้ว', 'success', () => {
                    loadTechnicianStats();
                });
            } else {
                showModal('ผิดพลาด', res.message, 'info');
            }
        },
        'danger'
    );
}

async function renameTechnician(oldName) {
    const newName = prompt(`แก้ไขชื่อของ "${oldName}" เป็น:`, oldName);
    if (!newName || newName.trim() === '' || newName.trim() === oldName) return;

    showModal('กำลังบันทึก', 'กรุณารอสักครู่...', 'info');
    const res = await apiCall('renameTechnician', { oldName, newName: newName.trim() }, 'POST');
    if (res.success) {
        showModal('สำเร็จ', 'แก้ไขชื่อช่างเรียบร้อยแล้ว (รวมถึงประวัติงานทั้งหมด)', 'success', () => {
            loadTechnicianStats();
        });
    } else {
        showModal('ผิดพลาด', res.message, 'info');
    }
}

// --- Print Report Generator ---
async function printReport(type, techName = '', start = '', end = '') {
    let jobs = [];

    // If it's a technician report with dates, we MUST fetch all jobs for that range (ignoring pagination)
    if (type === 'technician' && techName && start && end) {
        showModal('กำลังเตรียมข้อมูล', 'กรุณารอสักครู่ ระบบกำลังรวบรวมข้อมูลทั้งหมด...', 'info');
        const res = await apiCall('getTechnicianJobs', {
            name: techName,
            start: start,
            end: end,
            limit: 9999 // High limit to get all matching records
        }, 'GET');
        closeModal();
        if (res.success) {
            jobs = res.jobs;
        } else {
            showModal('ผิดพลาด', 'ไม่สามารถดึงข้อมูลรายงานได้: ' + res.message, 'info');
            return;
        }
    } else {
        // Fallback or overview - currently overview is based on displayed list
        jobs = currentAdminJobs;
    }

    if (!jobs || jobs.length === 0) {
        showModal('แจ้งเตือน', 'ไม่พบข้อมูลสำหรับพิมพ์รายงาน', 'info');
        return;
    }

    // Sort jobs by date ascending (oldest first) as requested: "วันที่ 1 ลำดับที่ 1"
    jobs.sort((a, b) => {
        const dateA = new Date(a.created_at || a.timestamp);
        const dateB = new Date(b.created_at || b.timestamp);
        return dateA - dateB;
    });

    const dateStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    const title = type === 'overview' ? 'รายงานสรุปการซ่อมบำรุง' : `รายงานการปฏิบัติงานรายบุคคล (${techName})`;

    let periodHTML = `<p style="text-align: center; font-size: 14px;">ประจำวันที่: ${dateStr}</p>`;
    if (start && end) {
        const formatTh = (d) => new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
        periodHTML = `<p style="text-align: center; font-size: 14px;">ช่วงเวลา: ${formatTh(start)} - ${formatTh(end)}</p>`;
    }

    let tableRows = '';
    jobs.forEach((job, index) => {
        tableRows += `
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; text-align: center;">${index + 1}</td>
                <td style="padding: 8px;">${job.timestamp}</td>
                <td style="padding: 8px; font-family: monospace;">${job.ticketId}</td>
                <td style="padding: 8px;"><div style="font-weight:bold">${job.deviceName || '-'}</div><div style="font-size:10px; color:#555">${job.assetCode || ''}</div></td>
                <td style="padding: 8px;">${job.repairLocation || job.division || '-'}</td>
                <td style="padding: 8px;">${job.issue}</td>
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
                    @page { margin: 0; }
                    body { font-family: 'Sarabun', sans-serif; padding: 2.5cm; display: flex; flex-direction: column; min-height: 24cm; }
                    .report-content { flex-grow: 1; margin-bottom: 50px; }
                    h2, h3 { text-align: center; margin: 10px 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                    th { background: #f0f0f0; padding: 8px; border-bottom: 2px solid #333; font-weight: bold; text-align: left; }
                    .signature-section { display: flex; justify-content: space-between; padding: 0 50px; margin-top: auto; padding-top: 50px; page-break-inside: avoid; }
                    .sign-box { text-align: center; }
                    .dot-line { border-bottom: 1px dotted #000; width: 200px; display: inline-block; margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="report-content">
                    <h2>บันทึกการปฏิบัติงาน ระบบบันทึกงานแจ้งซ่อมIT</h2>
                    <h3>${title}</h3>
                    ${periodHTML}
                    
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 40px; text-align: center;">ลำดับ</th>
                                <th>วันที่แจ้ง</th>
                                <th>Ticket ID</th>
                                <th>อุปกรณ์</th>
                                <th>สถานที่</th>
                                <th>อาการเสีย</th>
                                <th style="text-align: center;">สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
                
                <div class="signature-section">
                    <div class="sign-box">
                        ลงชื่อ<br><br><br>
                        ........................................................<br>
                        (${techName || 'เจ้าหน้าที่ธุรการ/ช่างผู้รับงาน'})<br>
                        ผู้จัดทำรายงาน
                    </div>
                    <div class="sign-box">
                        ลงชื่อ<br><br><br>
                        ........................................................<br>
                        (นายวีระกิตติ์ ศรีเกียรติเกษม)<br>
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

// --- View Job Detail (Page View) ---
function viewJobDetail(index) {
    const job = currentAdminJobs[index];
    if (!job) return;

    // Hide List, Show Detail
    document.getElementById('jobListSection').classList.add('hidden');
    document.getElementById('jobDetailSection').classList.remove('hidden');

    document.getElementById('detTicket').innerText = job.ticketId;
    document.getElementById('detTime').innerHTML = job.timestamp + (job.started_at ? `<div class="text-xs text-indigo-500 font-bold mt-1 border-t border-gray-100 pt-1">เริ่ม: ${job.started_at}</div>` : '');

    let assetStr = `${job.assetCode}`;
    if (job.deviceName) assetStr += `<br><span class="text-xs text-gray-500">${job.deviceName}</span>`;

    // Model only (above Repair Location)
    if (job.model) assetStr += `<br><span class="text-xs text-gray-400">รุ่น: ${job.model}</span>`;

    if (job.repairLocation) assetStr += `<br><span class="text-xs text-blue-600 font-bold">📍 สถานที่ซ่อม: ${job.repairLocation}</span>`;

    // Combine Floor and Contact into Asset Info
    let locInfo = [];
    if (job.floor) locInfo.push(`<span class="bg-orange-50 text-orange-600 px-1.5 rounded border border-orange-100 text-xs">ชั้น ${job.floor}</span>`);
    if (job.contact) locInfo.push(`<span class="text-gray-400 text-xs flex items-center gap-1">📞 ${job.contact}</span>`);

    if (locInfo.length > 0) {
        assetStr += `<div class="flex flex-wrap gap-2 mt-1">${locInfo.join('')}</div>`;
    }

    document.getElementById('detAssetInfo').innerHTML = assetStr;

    document.getElementById('detReporter').innerText = job.reporter || '-';
    // Update Division only (Floor and Contact moved to Asset Info)
    const divEl = document.getElementById('detDiv');
    if (divEl) divEl.innerText = job.division || '-';

    // Clear Floor/Contact elements if they exist (to clean up old UI if HTML not updated instantly or to be safe)
    const floorEl = document.getElementById('detFloor');
    if (floorEl) floorEl.parentElement.style.display = 'none'; // Hide the line containing floor

    const contactLink = document.getElementById('detContactLink');
    if (contactLink) contactLink.parentElement.style.display = 'none'; // Hide contact line

    document.getElementById('detIssue').innerText = job.issue;



    const resultSection = document.getElementById('detResultSection');
    const acceptBtn = document.getElementById('btnAcceptJobDetail');

    if (job.status === 'สำเร็จ' || job.status.includes('สำเร็จ') || job.status === 'Completed') {
        acceptBtn.classList.add('hidden');
        if (resultSection) {
            resultSection.classList.remove('hidden');
            document.getElementById('detTechName').innerText = job.technician || '-';
            document.getElementById('detFinishTime').innerText = job.finished_at || '-';
            document.getElementById('detNotes').innerText = (job.notes === 'ปิดงานทั้งหมด (Bulk)') ? '' : (job.notes || 'ไม่มีหมายเหตุ');
        }

        window.editCompletedJob = function () {
            window.currentCompleteTicketId = job.ticketId;
            document.getElementById('completeJobNotes').value = (job.notes === 'ดำเนินการเสร็จสิ้น' || job.notes === 'ปิดงานทั้งหมด (Bulk)') ? '' : (job.notes || '');
            document.getElementById('completeJobModal').classList.remove('hidden');
            document.getElementById('completeJobNotes').focus();
        };
    } else {
        if (resultSection) resultSection.classList.add('hidden');
        acceptBtn.classList.remove('hidden');
        acceptBtn.innerText = "✅ ปิดงาน (เสร็จสิ้น)";
        acceptBtn.className = "flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-xl font-bold shadow-lg transition";
        acceptBtn.onclick = function () {
            completeJob(job.ticketId);
        };
    }
}

function closeJobDetail() {
    document.getElementById('jobDetailSection').classList.add('hidden');
    document.getElementById('jobListSection').classList.remove('hidden');
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
            // Wait for API
            showModal('กำลังลบ', 'กรุณารอสักครู่...', 'info');

            const res = await apiCall('deleteJob', { ticketId: currentJobToDelete }, 'POST');

            if (res.success) {
                showModal('ลบสำเร็จ', 'ลบงานออกจากระบบเรียบร้อยแล้ว', 'success', () => {
                    closeJobDetail();
                    loadAdminJobs(lastViewOnlyMyJobs); // Refresh current list view
                    updateJobBadge();
                    updateMyJobBadge();
                });
            } else {
                showModal('ผิดพลาด', res.message || 'ไม่สามารถลบงานได้', 'info');
            }

            currentJobToDelete = null;
        },
        'danger' // Add danger flag
    );
}

// --- Edit Job Logic ---
function openEditJobDetailModal() {
    const ticketId = document.getElementById('detTicket').innerText;
    const job = currentAdminJobs.find(j => j.ticketId === ticketId);
    if (!job) return;

    document.getElementById('editDeviceName').value = job.deviceName || '';
    document.getElementById('editAssetCode').value = job.assetCode || '';
    document.getElementById('editRepairLocation').value = job.repairLocation || '';
    document.getElementById('editFloor').value = job.floor || '';
    document.getElementById('editContact').value = job.contact || '';
    document.getElementById('editIssue').value = job.issue || '';

    // Split timestamp "YYYY-MM-DD HH:mm:ss"
    if (job.timestamp) {
        const parts = job.timestamp.split(' ');
        if (parts.length >= 2) {
            document.getElementById('editDate').value = parts[0];
            document.getElementById('editTime').value = parts[1].substring(0, 5); // HH:mm
        }
    } else {
        document.getElementById('editDate').value = '';
        document.getElementById('editTime').value = '';
    }

    document.getElementById('editJobModal').classList.remove('hidden');
}

function closeEditJobModal() {
    document.getElementById('editJobModal').classList.add('hidden');
}

async function saveEditJob() {
    const ticketId = document.getElementById('detTicket').innerText;
    const deviceName = document.getElementById('editDeviceName').value;
    const assetCode = document.getElementById('editAssetCode').value;
    const repairLocation = document.getElementById('editRepairLocation').value;
    const floor = document.getElementById('editFloor').value;
    const contact = document.getElementById('editContact').value;
    const issue = document.getElementById('editIssue').value;
    const editDate = document.getElementById('editDate').value;
    const editTime = document.getElementById('editTime').value;

    if (!deviceName || !issue) {
        showModal('แจ้งเตือน', 'กรุณาระบุชื่ออุปกรณ์และอาการเสีย', 'info');
        return;
    }

    showModal('กำลังบันทึก', 'กำลังอัปเดตข้อมูล...', 'info');

    const res = await apiCall('updateJobDetails', {
        ticketId, deviceName, assetCode, repairLocation, floor, contact, issue,
        customDate: editDate, customTime: editTime
    }, 'POST');

    if (res.success) {
        showModal('สำเร็จ', 'บันทึกข้อมูลเรียบร้อยแล้ว', 'success', () => {
            closeEditJobModal();
            // Update local object in currentAdminJobs
            const jobIdx = currentAdminJobs.findIndex(j => j.ticketId === ticketId);
            if (jobIdx >= 0) {
                let newTimestamp = currentAdminJobs[jobIdx].timestamp;
                if (editDate && editTime) {
                    newTimestamp = `${editDate} ${editTime}:00`; // Simple reconstruction for display immediately
                }
                currentAdminJobs[jobIdx] = {
                    ...currentAdminJobs[jobIdx],
                    deviceName, assetCode, repairLocation, floor, contact, issue,
                    timestamp: newTimestamp
                };
                viewJobDetail(jobIdx); // Re-render detail view
            }
            if (typeof loadAdminJobs === 'function') loadAdminJobs(lastViewOnlyMyJobs); // Refresh list
        });
    } else {
        showModal('ผิดพลาด', res.message, 'info');
    }
}

async function completeJob(ticketId) {
    // Show the custom modal instead of confirm
    document.getElementById('completeJobTicketId').textContent = ticketId;
    document.getElementById('completeJobNotes').value = '';
    document.getElementById('completeJobModal').classList.remove('hidden');

    // Store ticketId globally for confirmCompleteJob to use
    window.currentCompleteTicketId = ticketId;
} async function bulkCompleteJobs() {
    showConfirmModal(
        'ยืนยันปิดงานทั้งหมด',
        'คุณแน่ใจหรือไม่ที่จะปิดงาน "รอรับเรื่อง" ทั้งหมดในระบบ?\nการดำเนินการนี้จะเปลี่ยนสถานะทุกงานเป็นสำเร็จทันที',
        async () => {
            const technicianName = getTechnicianName();
            showModal('กำลังบันทึก', 'ระบบกำลังปิดงานทั้งหมด...', 'info');
            const res = await apiCall('bulkJobComplete', { technician: technicianName });

            if (res.success) {
                showModal('สำเร็จ', 'ปิดงานรอรับทั้งหมดเรียบร้อยแล้ว', 'success', () => {
                    loadAdminJobs(lastViewOnlyMyJobs);
                    updateJobBadge();
                    updateMyJobBadge();
                    if (typeof loadDashboardStats === 'function') loadDashboardStats();
                });
            } else {
                showModal('ผิดพลาด', res.message, 'info');
            }
        },
        'danger'
    );
}


async function acceptJob(ticketId) {
    window.currentAcceptTicketId = ticketId;
    document.getElementById('acceptJobTicketId').innerText = ticketId;

    // Set default date/time to now using existing helpers or manual format
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    document.getElementById('acceptJobDate').value = `${year}-${month}-${day}`;

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('acceptJobTime').value = `${hours}:${minutes}`;

    document.getElementById('acceptJobModal').classList.remove('hidden');
}

function closeAcceptJobModal() {
    document.getElementById('acceptJobModal').classList.add('hidden');
    window.currentAcceptTicketId = null;
}

async function confirmAcceptJob() {
    const ticketId = window.currentAcceptTicketId;
    if (!ticketId) return;

    const customDate = document.getElementById('acceptJobDate').value;
    const customTime = document.getElementById('acceptJobTime').value;

    closeAcceptJobModal();
    const technicianName = getTechnicianName();

    showModal('กำลังบันทึก', 'ระบบกำลังอัปเดตสถานะ...', 'info');

    const res = await apiCall('updateJobStatus', {
        ticketId: ticketId,
        status: "กำลังดำเนินการ",
        technician: technicianName,
        customDate: customDate,
        customTime: customTime
    });

    if (res.success) {
        showModal('รับงานเรียบร้อย!', 'สถานะ: กำลังดำเนินการ', 'success', () => {
            closeJobDetail(); // Go back to list
            loadAdminJobs(lastViewOnlyMyJobs); // Refresh current list view
            updateJobBadge();
            updateMyJobBadge();
        });
    } else {
        showModal('ผิดพลาด', res.message, 'info');
    }
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
        const response = await fetch('/api/importAssets', {
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

    const techName = getTechnicianName();
    console.log('[updateMyJobBadge] Technician name:', techName);

    // Use Node.js API
    let res = await apiCall('getMyJobsCount', { technician: techName }, 'GET');
    console.log('[updateMyJobBadge] API Response:', res);

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

window.viewJobDetail = viewJobDetail;
window.completeJob = completeJob;
window.closeJobDetail = closeJobDetail;
window.closeJobDetail = closeJobDetail;
window.acceptJob = acceptJob;
window.closeAcceptJobModal = closeAcceptJobModal;
window.confirmAcceptJob = confirmAcceptJob;
window.bulkCompleteJobs = bulkCompleteJobs;


window.triggerImport = triggerImport;
window.uploadImportFile = uploadImportFile;
window.updateJobBadge = updateJobBadge;
window.updateMyJobBadge = updateMyJobBadge;
window.loadMyJobs = loadMyJobs;
window.loadCompletedJobs = loadCompletedJobs;
window.loadTechnicianStats = loadTechnicianStats;
window.loadTechnicianDetail = loadTechnicianDetail;
window.searchTechnicianHistory = searchTechnicianHistory;
window.addNewTechnician = addNewTechnician;
window.deleteTechnician = deleteTechnician;
window.renameTechnician = renameTechnician;

window.printReport = printReport;

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

function refreshCurrentView() {
    if (currentView === 'completed') {
        loadCompletedJobs();
    } else {
        loadAdminJobs(lastViewOnlyMyJobs);
    }
}

// Confirm and complete the job
async function confirmCompleteJob() {
    const ticketId = window.currentCompleteTicketId;
    const notes = document.getElementById('completeJobNotes').value.trim();
    const category = document.getElementById('completeJobCategory').value; // Get Category

    if (!ticketId) return;

    // Close the modal and job detail
    closeCompleteJobModal();
    closeJobDetail();

    const technicianName = getTechnicianName();

    showModal('กำลังบันทึก', 'ระบบกำลังอัปเดตข้อมูล...', 'info');

    // Send notes and category
    const res = await apiCall('updateJobStatus', {
        ticketId: ticketId,
        status: "สำเร็จ",
        technician: technicianName,
        notes: notes || 'ดำเนินการเสร็จสิ้น',
        category: category // Send to backend
    });

    if (res.success) {
        showModal('สำเร็จ', 'บันทึกข้อมูลเรียบร้อยแล้ว', 'success', () => {
            refreshCurrentView();
            updateJobBadge();
            updateMyJobBadge();
            if (typeof loadDashboardStats === 'function') {
                loadDashboardStats();
                renderMonthlyChart();
            }
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

let monthlyChartInstance = null;
let problemChartInstance = null;
let deptChartInstance = null;

async function renderMonthlyChart() {
    // This function now orchestrates all charts
    const res = await apiCall('getDashboardStats', {}, 'GET');
    if (!res.success) return;

    renderLineChart(res.monthlyTrend);
    renderProblemChart(res.problemStats);
    renderDeptChart(res.divisionStats);
}

function renderLineChart(data) {
    const ctx = document.getElementById('monthlyTrendChart');
    if (!ctx) return;
    if (monthlyChartInstance) monthlyChartInstance.destroy();

    const labels = data ? data.map(d => d.month) : [];
    const values = data ? data.map(d => d.count) : [];

    monthlyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'จำนวนงานแจ้งซ่อม',
                data: values,
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#3B82F6',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleFont: { family: 'Sarabun', size: 14 },
                    bodyFont: { family: 'Sarabun', size: 14 },
                    padding: 10,
                    callbacks: {
                        label: (ctx) => ` ${ctx.parsed.y} งาน`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { borderDash: [2, 4], color: '#f0f0f0' },
                    ticks: { font: { family: 'Sarabun' } }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { family: 'Sarabun' } }
                }
            }
        }
    });
}

async function loadProblemStatChart() {
    const dropdown = document.getElementById('problemMonthFilter');
    const val = dropdown ? dropdown.value : "";

    if (dropdown) localStorage.setItem('problemMonthFilter', val);

    let query = {};
    if (val) {
        query.month = `${dashboardYearFilter}-${val.padStart(2, '0')}`;
    } else {
        query.year = dashboardYearFilter;
    }

    // API Call
    const res = await apiCall('getProblemStats', query, 'GET');
    if (res.success) {
        renderProblemChart(res.data);
    }
}

function renderProblemChart(data) {
    const ctx = document.getElementById('problemDistChart');
    if (!ctx) return;

    if (problemChartInstance) problemChartInstance.destroy();

    const labels = data ? data.map(d => d.type) : [];
    const values = data ? data.map(d => d.count) : [];
    const total = values.reduce((a, b) => a + b, 0);
    // Colors matching the reference image roughly: Blue, Yellow/Orange, Red, Dark Blue
    const colors = ['#3B82F6', '#fbbf24', '#EF4444', '#1e3a8a', '#8B5CF6', '#EC4899', '#64748B'];

    problemChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'จำนวนครั้ง',
                data: values,
                backgroundColor: colors,
                borderColor: 'transparent',
                borderRadius: 2,
                barPercentage: 0.6, // Make bars slightly thinner
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 8,
                        font: { family: 'Sarabun', size: 12 },
                        generateLabels: (chart) => {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const meta = chart.getDatasetMeta(0);
                                    const style = meta.controller.getStyle(i);
                                    return {
                                        text: label,
                                        fillStyle: style.backgroundColor,
                                        strokeStyle: style.borderColor,
                                        lineWidth: style.borderWidth,
                                        hidden: !chart.getDataVisibility(i),
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    },
                    onClick: (e, legendItem, legend) => {
                        const index = legendItem.index;
                        const ci = legend.chart;
                        if (ci.isDatasetVisible(0)) {
                            ci.toggleDataVisibility(index);
                            ci.update();
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1f2937',
                    bodyColor: '#4b5563',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    bodyFont: { family: 'Sarabun', size: 13 },
                    callbacks: {
                        label: (ctx) => {
                            const percentage = ((ctx.raw / total) * 100).toFixed(2);
                            return ` ${ctx.formattedValue} ครั้ง (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { family: 'Sarabun', size: 11 } }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'จำนวนครั้งที่ให้บริการซ่อม',
                        font: { family: 'Sarabun', size: 12, weight: 'bold' },
                        padding: { bottom: 10 }
                    },
                    grid: { color: '#f3f4f6' },
                    ticks: { stepSize: 1, font: { family: 'Sarabun', size: 11 } }
                }
            },
            layout: { padding: { top: 10, bottom: 10 } }
        }
    });

    // 2. Render Data Table
    const tableContainer = document.getElementById('problemStatsTableContainer');
    if (tableContainer) {
        if (!data || data.length === 0) {
            tableContainer.innerHTML = '<div class="text-center text-gray-400 py-4">ไม่พบข้อมูล</div>';
            return;
        }

        let rows = '';
        data.forEach((d, i) => {
            const pct = total > 0 ? ((d.count / total) * 100).toFixed(2) : "0.00";
            const color = colors[i % colors.length];
            rows += `
             <tr class="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition font-sarabun">
                 <td class="p-3 text-gray-700 flex items-center gap-2">
                     <span class="w-3 h-3 rounded-full shadow-sm" style="background-color: ${color}"></span>
                     ${d.type}
                 </td>
                 <td class="p-3 text-center font-bold text-gray-800">${d.count}</td>
                 <td class="p-3 text-center text-gray-600">${pct}</td>
             </tr>`;
        });

        const tableHtml = `
        <table class="w-full text-sm text-center border-collapse">
            <thead class="bg-gray-100 text-gray-600 font-bold font-sarabun">
                <tr>
                    <th class="p-3 text-left w-1/3 rounded-tl-lg">บริการซ่อม</th>
                    <th class="p-3 w-1/3">จำนวนครั้ง</th>
                    <th class="p-3 w-1/3 rounded-tr-lg">คิดเป็นร้อยละ</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
                <tr class="bg-orange-50 font-bold border-t border-orange-100 text-gray-800 font-sarabun">
                    <td class="p-3 text-left pl-8">Total</td>
                    <td class="p-3 text-center text-orange-600">${total}</td>
                    <td class="p-3 text-center text-orange-600">100%</td>
                </tr>
            </tbody>
        </table>`;
        tableContainer.innerHTML = tableHtml;
    }
}


let assessmentChartInstance = null;

async function loadAssessmentStatChart() {
    const dropdown = document.getElementById('assessmentMonthFilter');
    const val = dropdown ? dropdown.value : "";
    if (dropdown) localStorage.setItem('assessmentMonthFilter', val);

    let query = {};
    if (val) {
        query.month = `${dashboardYearFilter}-${val.padStart(2, '0')}`;
    } else {
        query.year = dashboardYearFilter;
    }

    // API Call
    const res = await apiCall('getAssessmentStats', query, 'GET');
    if (res.success) {
        renderAssessmentChart(res.data);
    }
}

function renderAssessmentChart(data) {
    const ctx = document.getElementById('assessmentDistChart');
    if (!ctx) return;
    if (assessmentChartInstance) assessmentChartInstance.destroy();

    const labels = data ? data.map(d => d.type) : [];
    const values = data ? data.map(d => d.count) : [];
    const total = values.reduce((a, b) => a + b, 0);

    // Color Mapping
    const colorMap = {
        'ดีมาก': '#3B82F6', // Blue
        'ดี': '#fbbf24',    // Yellow
        'พอใช้': '#F97316', // Orange
        'ควรปรับปรุง': '#EF4444', // Red
        'ยังไม่ประเมิน': '#9CA3AF' // Gray
    };
    const colors = labels.map(l => colorMap[l] || '#64748B');

    assessmentChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'จำนวนครั้ง',
                data: values,
                backgroundColor: colors,
                borderColor: 'transparent',
                borderRadius: 2,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 8,
                        font: { family: 'Sarabun', size: 12 },
                        generateLabels: (chart) => {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const meta = chart.getDatasetMeta(0);
                                    const style = meta.controller.getStyle(i);
                                    return {
                                        text: label,
                                        fillStyle: style.backgroundColor,
                                        strokeStyle: style.borderColor,
                                        lineWidth: style.borderWidth,
                                        hidden: !chart.getDataVisibility(i),
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    },
                    onClick: (e, legendItem, legend) => {
                        const index = legendItem.index;
                        const ci = legend.chart;
                        if (ci.isDatasetVisible(0)) {
                            ci.toggleDataVisibility(index);
                            ci.update();
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1f2937',
                    bodyColor: '#4b5563',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    bodyFont: { family: 'Sarabun', size: 13 },
                    callbacks: {
                        label: (ctx) => {
                            const percentage = ((ctx.raw / total) * 100).toFixed(2);
                            return ` ${ctx.formattedValue} ครั้ง (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { family: 'Sarabun', size: 11 } } },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'จำนวนครั้ง', font: { family: 'Sarabun', size: 12 } },
                    grid: { color: '#f3f4f6' },
                    ticks: { stepSize: 1, font: { family: 'Sarabun', size: 11 } }
                }
            },
            layout: { padding: { top: 10, bottom: 10 } }
        }
    });

    // Table
    const tableContainer = document.getElementById('assessmentStatsTableContainer');
    if (tableContainer) {
        if (!data || data.length === 0) {
            tableContainer.innerHTML = '<div class="text-center text-gray-400 py-4">ไม่พบข้อมูล</div>';
            return;
        }
        let rows = '';
        data.forEach((d, i) => {
            const pct = total > 0 ? ((d.count / total) * 100).toFixed(2) : "0.00";
            const color = colors[i];
            rows += `
             <tr class="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition font-sarabun">
                 <td class="p-3 text-gray-700 flex items-center gap-2">
                     <span class="w-3 h-3 rounded-full shadow-sm" style="background-color: ${color}"></span>
                     ${d.type}
                 </td>
                 <td class="p-3 text-center font-bold text-gray-800">${d.count}</td>
                 <td class="p-3 text-center text-gray-600">${pct}</td>
             </tr>`;
        });
        const tableHtml = `
        <table class="w-full text-sm text-center border-collapse">
            <thead class="bg-gray-100 text-gray-600 font-bold font-sarabun">
                 <tr>
                    <th class="p-3 text-left w-1/3 rounded-tl-lg">ระดับความพึงพอใจ</th>
                    <th class="p-3 w-1/3">จำนวนครั้ง</th>
                    <th class="p-3 w-1/3 rounded-tr-lg">คิดเป็นร้อยละ</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
                <tr class="bg-orange-50 font-bold border-t border-orange-100 text-gray-800 font-sarabun">
                    <td class="p-3 text-left pl-8">Total</td>
                    <td class="p-3 text-center text-orange-600">${total}</td>
                    <td class="p-3 text-center text-orange-600">100%</td>
                </tr>
            </tbody>
        </table>`;
        tableContainer.innerHTML = tableHtml;
    }
}

function renderDeptChart(data) {
    const ctx = document.getElementById('departmentChart');
    if (!ctx) return;
    if (deptChartInstance) deptChartInstance.destroy();

    const labels = data ? data.map(d => d.division) : [];
    const values = data ? data.map(d => d.count) : [];

    deptChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'จำนวนงาน',
                data: values,
                backgroundColor: '#A855F7',
                borderRadius: 4,
                barThickness: 20
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    bodyFont: { family: 'Sarabun', size: 13 }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { borderDash: [2, 4], color: '#f0f0f0' },
                    ticks: { font: { family: 'Sarabun' } }
                },
                y: {
                    grid: { display: false },
                    ticks: { font: { family: 'Sarabun', size: 12 }, autoSkip: false }
                }
            }
        }
    });
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

    // Add time input formatter (deprecated for type="time", but keeping listener structure if needed)
    const timeInput = document.getElementById('customTime');
    if (timeInput) {
        // Browser handles type="time"
    }
});

// --- Historical Reports Logic ---

let currentHistoryReportJobs = [];

async function searchHistory() {
    const start = document.getElementById('historyStartDate').value;
    const end = document.getElementById('historyEndDate').value;

    if (!start || !end) {
        showModal('แจ้งเตือน', 'กรุณาระบุวันเริ่มต้นและสิ้นสุดให้ครบถ้วน', 'info');
        return;
    }

    if (start > end) {
        showModal('แจ้งเตือน', 'วันเริ่มต้นต้องไม่มากกว่าวันสิ้นสุด', 'info');
        return;
    }

    const tableBody = document.getElementById('historyTableBody');
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-gray-500"><div class="flex justify-center items-center gap-2"><div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>กำลังค้นหาข้อมูล...</div></td></tr>';

    document.getElementById('historyResultArea').classList.remove('hidden');

    // Call API
    const res = await apiCall('getJobsByDate', { start, end }, 'GET');

    if (!res.success) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">เกิดข้อผิดพลาด: ${res.message}</td></tr>`;
        return;
    }

    currentHistoryReportJobs = res.jobs;
    document.getElementById('historyCount').textContent = res.jobs.length;

    // Show/Hide Print Button based on results
    const printBtn = document.getElementById('historyPrintBtn');
    const deliveryBtn = document.getElementById('deliveryPrintBtn');
    if (res.jobs.length > 0) {
        printBtn.classList.remove('hidden');
        if (deliveryBtn) deliveryBtn.classList.remove('hidden');
    } else {
        printBtn.classList.add('hidden');
        if (deliveryBtn) deliveryBtn.classList.add('hidden');
    }

    let html = '';
    if (res.jobs.length === 0) {
        html = '<tr><td colspan="5" class="text-center py-8 text-gray-400">ไม่พบข้อมูลการแจ้งซ่อมในช่วงเวลาที่เลือก</td></tr>';
    } else {
        res.jobs.forEach(job => {
            let statusClass = 'text-gray-600 bg-gray-100';
            if (job.status.includes('สำเร็จ') || job.status === 'Completed') statusClass = 'text-green-700 bg-green-50 border border-green-100';
            else if (job.status === 'กำลังดำเนินการ') statusClass = 'text-blue-700 bg-blue-50 border border-blue-100';
            else if (job.status === 'รอรับเรื่อง') statusClass = 'text-purple-700 bg-purple-50 border border-purple-100';

            html += `
             <tr class="bg-white border-b border-gray-100 hover:bg-gray-50 transition">
                <td class="px-4 py-3 whitespace-nowrap text-gray-600">${job.timestamp.split(' ')[0]} <br> <span class="text-xs text-gray-400">${job.timestamp.split(' ')[1]}</span></td>
                <td class="px-4 py-3 font-mono text-xs text-gray-500">${job.ticketId}</td>
                <td class="px-4 py-3">
                    <div class="font-bold text-gray-800 text-sm">${job.deviceName || '-'}</div>
                    <div class="text-[10px] text-gray-400">${job.assetCode || ''}</div>
                </td>
                <td class="px-4 py-3 max-w-xs truncate text-gray-600" title="${job.issue}">${job.issue}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded-md text-xs font-bold ${statusClass}">${job.status}</span>
                </td>
             </tr>
             `;
        });
    }

    tableBody.innerHTML = html;
}

async function printHistoryReport() {
    const start = document.getElementById('historyStartDate').value;
    const end = document.getElementById('historyEndDate').value;

    if (!start || !end) {
        showModal('แจ้งเตือน', 'กรุณาระบุวันเริ่มต้นและสิ้นสุดให้ครบถ้วน', 'info');
        return;
    }

    showModal('กำลังเตรียมข้อมูล', 'กรุณารอสักครู่ ระบบกำลังรวบรวมข้อมูลทั้งหมด...', 'info');

    // Always fetch fresh data based on the current date inputs
    const res = await apiCall('getJobsByDate', { start, end }, 'GET');
    closeModal();

    if (!res.success || !res.jobs || res.jobs.length === 0) {
        showModal('แจ้งเตือน', 'ไม่พบข้อมูลในช่วงเวลาที่เลือก', 'info');
        return;
    }

    const jobs = res.jobs;

    const formatTh = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const periodStr = `${formatTh(start)} - ${formatTh(end)}`;

    let tableRows = '';
    jobs.forEach((job, index) => {
        tableRows += `
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; text-align: center;">${index + 1}</td>
                <td style="padding: 8px;">${job.timestamp}</td>
                <td style="padding: 8px; font-family: monospace;">${job.ticketId}</td>
                <td style="padding: 8px;">
                    <div style="font-weight:bold">${job.deviceName || '-'}</div>
                    <div style="font-size:10px; color:#555">${job.assetCode || ''}</div>
                </td>
                <td style="padding: 8px;">${job.repairLocation || job.division || '-'}</td>
                <td style="padding: 8px;">${job.issue}</td>
                <td style="padding: 8px;">${job.technician || '-'}</td>
                <td style="padding: 8px; text-align:center;">
                    ${(job.status.includes('สำเร็จ') || job.status == 'Completed') ? '<span style="color:green">✓ สำเร็จ</span>' : job.status}
                </td>
            </tr>
        `;
    });

    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) {
        showModal('แจ้งเตือน', 'Pop-up ถูกบล็อก กรุณาอนุญาต Pop-up สำหรับเว็บไซต์นี้', 'info');
        return;
    }

    printWindow.document.write(`
        <html>
            <head>
                <title>Report - IT Support Dictionary</title>
                
                <style>
                    @font-face {
                        font-family: 'TH Sarabun New';
                        src: url('assets/fonts/THSarabunNew.ttf') format('truetype');
                        font-weight: normal;
                        font-style: normal;
                    }
                    @font-face {
                        font-family: 'TH Sarabun New';
                        src: url('assets/fonts/THSarabunNew Bold.ttf') format('truetype');
                        font-weight: bold;
                        font-style: normal;
                    }

                    @page { margin: 0; }
                    body { font-family: 'TH Sarabun New', 'Sarabun', sans-serif; padding: 2.5cm; display: flex; flex-direction: column; min-height: 24cm; }
                    .report-content { flex-grow: 1; margin-bottom: 50px; }
                    h2, h3 { text-align: center; margin: 5px 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 16px; }
                    th { background: #f5f5f5; padding: 8px; border-bottom: 1px solid #000; font-weight: bold; text-align: left; }
                    .signature-section { display: flex; justify-content: space-between; padding: 0 40px; margin-top: auto; padding-top: 50px; page-break-inside: avoid; }
                    .sign-box { text-align: center; width: 40%; }
                </style>
            </head>
            <body>
                <div class="report-content">
                    <h2>บันทึกการปฏิบัติงาน ระบบบันทึกงานแจ้งซ่อมIT</h2>
                    <h3>รายงานประวัติการแจ้งซ่อม (ย้อนหลัง)</h3>
                    <p style="text-align: center; font-size: 18px; margin-bottom: 20px;">ช่วงเวลา: ${periodStr}</p>
                    
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 30px; text-align: center;">#</th>
                                <th>วันเวลาที่แจ้ง</th>
                                <th>Ticket ID</th>
                                <th>อุปกรณ์</th>
                                <th>สถานที่</th>
                                <th style="width: 25%;">อาการเสีย</th>
                                <th>ผู้รับผิดชอบ</th>
                                <th style="text-align: center;">สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
                
                <div class="signature-section">
                    <div class="sign-box">
                        ลงชื่อ<br><br><br>
                        ........................................................<br>
                        (........................................................)<br>
                        ผู้จัดทำรายงาน
                    </div>
                     <div class="sign-box">
                        ลงชื่อ<br><br><br>
                        ........................................................<br>
                        (นายวีระกิตติ์ ศรีเกียรติเกษม)<br>
                        หัวหน้าหน่วยงาน/ผู้รับรอง
                    </div>
                </div>

                <script>
                    window.onload = function() { setTimeout(() => { window.print(); window.close(); }, 500); }
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
}

async function printDeliveryReport(techName = null, startDateStr = null, endDateStr = null) {
    const start = startDateStr || document.getElementById('historyStartDate')?.value;
    const end = endDateStr || document.getElementById('historyEndDate')?.value;

    if (!start || !end) {
        showModal('แจ้งเตือน', 'กรุณาระบุวันเริ่มต้นและสิ้นสุดให้ครบถ้วน', 'info');
        return;
    }

    // --- Template Upload Handling ---
    // Create a hidden file input to ask for the template
    let fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.docx';

    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showModal('กำลังประมวลผล', 'กำลังสร้างรายงานจากแม่แบบ...', 'info');

        // 1. Fetch Data
        let jobs = [];
        let res;

        try {
            if (techName) {
                res = await apiCall('getTechnicianJobs', { name: techName, start: start, end: end, limit: 9999 }, 'GET');
            } else {
                res = await apiCall('getJobsByDate', { start, end }, 'GET');
            }
        } catch (err) {
            closeModal();
            showModal('ผิดพลาด', 'ไม่สามารถดึงข้อมูลได้', 'info');
            return;
        }

        if (!res || !res.success) {
            closeModal();
            showModal('ผิดพลาด', res?.message || 'ไม่พบข้อมูล', 'info');
            return;
        }
        jobs = res.jobs || [];


        // 2. Prepare Data for Template
        const startDate = new Date(start);
        const endDate = new Date(end);

        const formatTh = (d) => d.toLocaleDateString('th-TH', { day: 'numeric', month: '2-digit', year: 'numeric' });
        const formatMonthYear = (d) => d.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
        const formatFullDate = (d) => d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

        const monthYearStr = formatMonthYear(startDate);
        const endDateFullStr = formatFullDate(endDate);
        const contractorName = techName || "นายนวพล พรเจริญ";

        // --- Categorization Logic for "TOR Summary" ---
        let hwCount = 0, swCount = 0, netCount = 0, otherCount = 0;

        const kwHW = ['printer', 'print', 'monitor', 'mouse', 'keyboard', 'screen', 'เปิดไม่ติด', 'เสีย', 'change', 'replace', 'drum', 'toner', 'หมึก', 'กระดาษ', 'scan', 'barcode', 'part', 'อุปกรณ์', 'cpu', 'ram', 'disk', 'hard', 'เครื่อง', 'เปิด', 'ดับ', 'hardware'];
        const kwSW = ['propgram', 'windows', 'word', 'excel', 'powerpoint', 'outlook', 'office', 'install', 'update', 'error', 'file', 'folder', 'virus', 'slow', 'ช้า', 'ค้าง', 'program', 'login', 'user', 'password', 'driver', 'ลง', 'software'];
        const kwNet = ['internet', 'wifi', 'lan', 'network', 'connect', 'signal', 'net', 'ip', 'cat', 'cable', 'หลุด', 'unstable', 'online'];

        const checkCat = (text) => {
            text = text.toLowerCase();
            if (kwNet.some(k => text.includes(k))) return 'net';
            if (kwSW.some(k => text.includes(k))) return 'sw';
            if (kwHW.some(k => text.includes(k))) return 'hw';
            return 'other';
        };

        // 3. Process Daily Entries & Categorize
        let templateDataEntries = [];

        // Reset and do "Per Day" loop again for clarity
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateObj = new Date(d);
            const dateKey = dateObj.toISOString().split('T')[0];
            const dateTh = formatTh(dateObj);

            // Holidays
            const dayOfWeek = dateObj.getDay();
            let isHoliday = (dayOfWeek === 0 || dayOfWeek === 6);
            let holidayName = "";
            if (dayOfWeek === 0) holidayName = "วันอาทิตย์";
            if (dayOfWeek === 6) holidayName = "วันเสาร์";
            const day = dateObj.getDate();
            const month = dateObj.getMonth() + 1;
            if (day === 1 && month === 1) { isHoliday = true; holidayName = "วันหยุดขึ้นปีใหม่"; }
            if (day === 2 && month === 1) { isHoliday = true; holidayName = "วันหยุดชดเชยวันสิ้นปี"; }

            const dailyJobs = jobs.filter(j => j.timestamp.startsWith(dateKey));

            if (isHoliday) {
                templateDataEntries.push({
                    d: dateTh,
                    work: holidayName || 'วันหยุด',
                    q: '',
                    rem: ''
                });
            } else {
                if (dailyJobs.length > 0) {
                    dailyJobs.forEach((job, idx) => {
                        const issue = job.issue.replace(/\[.*?\]/, '').trim();
                        const division = job.division || 'ไม่ระบุหน่วยงาน';

                        // Stats Calc
                        const combinedText = (job.issue + " " + (job.deviceName || "")).toLowerCase();
                        const cat = checkCat(combinedText);
                        if (cat === 'net') netCount++;
                        else if (cat === 'sw') swCount++;
                        else if (cat === 'hw') hwCount++;
                        else otherCount++;

                        templateDataEntries.push({
                            d: dateTh, // Repeat date? or only first? Let's repeat for distinct rows
                            work: `${idx + 1}. ${division} ${issue} / ดำเนินการสำเร็จ`,
                            q: '1',
                            rem: `Ticket ID #${job.ticketId}`
                        });
                    });
                } else {
                    templateDataEntries.push({
                        d: dateTh,
                        work: '-',
                        q: '',
                        rem: ''
                    });
                }
            }
        }

        const totalJobCount = jobs.length;


        // 3. Process with PizZip and Docxtemplater
        const reader = new FileReader();
        reader.onload = function (evt) {
            const content = evt.target.result;

            try {
                const zip = new PizZip(content);
                const doc = new window.docxtemplater(zip, {
                    paragraphLoop: true,
                    linebreaks: true
                });

                // Render data
                doc.render({
                    month_year: monthYearStr,
                    contractor_name: contractorName,
                    end_date_full: endDateFullStr,
                    table: templateDataEntries, // Loop over this in word as {#table} ... {/table}

                    // Stats
                    total_jobs: totalJobCount,
                    hw_count: hwCount,
                    sw_count: swCount,
                    net_count: netCount,
                    other_count: otherCount
                });

                const blob = doc.getZip().generate({
                    type: "blob",
                    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    compression: "DEFLATE"
                });

                // Download
                saveAs(blob, `รายงานส่งมอบงาน_${monthYearStr}_${contractorName}.docx`);
                closeModal();
                showModal('สำเร็จ', 'สร้างรายงานเรียบร้อยแล้ว', 'success');

            } catch (error) {
                console.error(error);
                closeModal();
                showModal('ผิดพลาด', `เกิดข้อผิดพลาดในการสร้างไฟล์: ${error.message}`, 'info');
            }
        };
        reader.readAsBinaryString(file);
    };

    // Trigger file selection
    fileInput.click();

    // Help Message
    showModal('เลือกไฟล์แม่แบบ', 'กรุณาเลือกไฟล์ Word (.docx) ที่เป็นแม่แบบ\n\nโดยใช้ Tag ดังนี้ในไฟล์:\n{month_year} = เดือน/ปี\n{contractor_name} = ชื่อผู้รับจ้าง\n{#table} ... {/table} = วนลูปแถวตาราง\n{d} = วันที่, {work} = รายละเอียด, {q} = ปริมาณ, {rem} = หมายเหตุ', 'info');
}


window.searchHistory = searchHistory;
window.printDeliveryReport = printDeliveryReport;
// --- Navigation Helpers ---
window.goHome = function () {
    // Hide all main content sections
    const sections = ['loginSection', 'repairSection', 'dashboardSection', 'importSection', 'jobListSection', 'jobDetailSection'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    // Check session
    const userStr = localStorage.getItem('itSupportUser');
    if (userStr) {
        const user = JSON.parse(userStr);
        // Admin or Technician -> Dashboard
        // All Users -> Repair Form (Home)
        document.getElementById('repairSection').classList.remove('hidden');

        // If Admin/Technician, still refresh stats in background if needed, but show repair form first
        if (user.isAdmin || user.role === 'admin' || user.role === 'technician') {
            if (typeof loadDashboardStats === 'function') loadDashboardStats();
            // Trigger status check if we have the fullName
            if (user.fullName) {
                // We re-run the status badge logic
                handleLoginSuccess(user);
            }
        }
    } else {
        // No session -> Login
        document.getElementById('loginSection').classList.remove('hidden');
    }
}

// --- Global Keyboard Shortcuts ---
window.addEventListener('keydown', (e) => {
    // 1. Alert Modal (id="customModal") -> Press Enter or Escape to close
    const customModal = document.getElementById('customModal');
    if (customModal && !customModal.classList.contains('hidden')) {
        if (e.key === 'Enter' || e.key === 'Escape') {
            closeModal();
            e.preventDefault();
            return;
        }
    }

    // 2. Confirmation Modal (id="confirmModal") -> Press Enter to Confirm, Escape to Cancel
    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal && !confirmModal.classList.contains('hidden')) {
        if (e.key === 'Enter') {
            const confirmBtn = document.getElementById('btnConfirmAction');
            if (confirmBtn) confirmBtn.click();
            e.preventDefault();
            return;
        } else if (e.key === 'Escape') {
            closeConfirmModal();
            e.preventDefault();
            return;
        }
    }

    // 3. Complete Job Modal (id="completeJobModal") -> Enter to Confirm
    const completeJobModal = document.getElementById('completeJobModal');
    if (completeJobModal && !completeJobModal.classList.contains('hidden')) {
        if (e.key === 'Enter' && !e.shiftKey) {
            confirmCompleteJob();
            e.preventDefault();
            return;
        } else if (e.key === 'Escape') {
            closeCompleteJobModal();
            e.preventDefault();
            return;
        }
    }

    // 4. Other Modals -> Escape to close
    const otherModals = [
        { id: 'addTechnicianModal', close: closeAddTechnicianModal },
        { id: 'jobDetailSection', close: closeJobDetail }
    ];

    otherModals.forEach(m => {
        const el = document.getElementById(m.id);
        if (el && !el.classList.contains('hidden') && e.key === 'Escape') {
            m.close();
            e.preventDefault();
        }
    });
});


// ==========================================
// DELIVERY REPORT FORM LOGIC (NEW)
// ==========================================

let currentDeliveryJobs = [];
let currentDeliveryContext = {};

/**
 * Main Entry Point for Delivery Report
 * Replaces the old direct-print logic.
 */
// Main Entry Point for Delivery Report
window.openDeliveryForm = async function (techName = null, startDateStr = null, endDateStr = null) {
    try {
        const start = startDateStr || document.getElementById('historyStartDate')?.value;
        const end = endDateStr || document.getElementById('historyEndDate')?.value;

        if (!start || !end) {
            showModal('แจ้งเตือน', 'กรุณาระบุวันเริ่มต้นและสิ้นสุดให้ครบถ้วน', 'info');
            return;
        }

        // Switch View - Force Hide
        const sections = ['loginSection', 'repairSection', 'dashboardSection', 'importSection', 'jobListSection', 'jobDetailSection', 'deliveryFormSection'];
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('hidden');
                el.style.display = 'none'; // Force inline style hide to prevent overrides
            }
        });

        const deliverySection = document.getElementById('deliveryFormSection');
        if (deliverySection) {
            deliverySection.classList.remove('hidden');
            deliverySection.style.display = 'block'; // Force inline style show
            window.scrollTo(0, 0);
        }

        // Store Context
        currentDeliveryContext = { techName, start, end };

        // Load Fresh Data
        await reloadDeliveryOriginal();
    } catch (e) {
        console.error("Error opening delivery form:", e);
        alert("เกิดข้อผิดพลาด: " + e.message);
    }
}



async function reloadDeliveryOriginal() {
    const { techName, start, end } = currentDeliveryContext;

    showModal('กำลังโหลด', 'กำลังดึงข้อมูลงาน...', 'info');

    try {
        let res;
        if (techName) {
            res = await apiCall('getTechnicianJobs', { name: techName, start: start, end: end, limit: 9999 }, 'GET');
        } else {
            res = await apiCall('getJobsByDate', { start, end }, 'GET');
        }

        if (!res || !res.success) throw new Error(res?.message || 'ไม่พบข้อมูล');

        currentDeliveryJobs = res.jobs || [];
        initializeDeliveryFormV2(currentDeliveryJobs, start, end, techName);

        closeModal();
    } catch (err) {
        closeModal();
        showModal('ผิดพลาด', 'ไม่สามารถดึงข้อมูลได้: ' + err.message, 'info');
    }
}

function initializeDeliveryForm(jobs, startStr, endStr, techName) {
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);

    // 1. Set Header Info
    const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    document.getElementById('delMonth').value = monthNames[startDate.getMonth()];
    document.getElementById('delYear').value = (startDate.getFullYear() + 543).toString();

    // Specific period logic: If 1st month of contract? Let's leave blank for user input usually.

    if (techName) document.getElementById('delContractor').value = techName;

    // Sign Date (End Date)
    const formatThaiDate = (d) => d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('delSignDate').value = formatThaiDate(endDate);

    // Sign Name
    document.getElementById('delSignName').value = techName || "นายนวพล พรเจริญ";

    // 2. Generate Daily Table
    const tableBody = document.getElementById('delDailyTableBody');
    tableBody.innerHTML = '';

    // Categorization Helpers
    const kwHW = ['printer', 'print', 'monitor', 'mouse', 'keyboard', 'screen', 'เปิดไม่ติด', 'เสีย', 'change', 'replace', 'drum', 'toner', 'หมึก', 'กระดาษ', 'scan', 'barcode', 'part', 'อุปกรณ์', 'cpu', 'ram', 'disk', 'hard', 'เครื่อง', 'เปิด', 'ดับ', 'hardware'];
    const kwSW = ['propgram', 'windows', 'word', 'excel', 'powerpoint', 'outlook', 'office', 'install', 'update', 'error', 'file', 'folder', 'virus', 'slow', 'ช้า', 'ค้าง', 'program', 'login', 'user', 'password', 'driver', 'ลง', 'software', 'format'];
    const kwNet = ['internet', 'wifi', 'lan', 'network', 'connect', 'signal', 'net', 'ip', 'cat', 'cable', 'หลุด', 'unstable', 'online'];

    const checkCat = (text) => {
        text = text.toLowerCase();
        if (kwNet.some(k => text.includes(k))) return 'net';
        if (kwSW.some(k => text.includes(k))) return 'sw';
        if (kwHW.some(k => text.includes(k))) return 'hw';
        return 'other';
    };

    let torHW = [], torSW = [], torNet = [], torOther = [];

    // Loop through dates
    // Clone loop date to avoid mutation issues
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateObj = new Date(d);
        const dateKey = dateObj.toISOString().split('T')[0];
        const dateTh = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: '2-digit', year: 'numeric' });

        // Holidays
        const dayOfWeek = dateObj.getDay();
        let isHoliday = (dayOfWeek === 0 || dayOfWeek === 6);
        let holidayName = "";
        if (dayOfWeek === 0) holidayName = "วันอาทิตย์";
        if (dayOfWeek === 6) holidayName = "วันเสาร์";
        const day = dateObj.getDate();
        const month = dateObj.getMonth() + 1;
        if (day === 1 && month === 1) { isHoliday = true; holidayName = "วันหยุดขึ้นปีใหม่"; }
        if (day === 2 && month === 1) { isHoliday = true; holidayName = "วันหยุดชดเชยวันสิ้นปี"; }

        const dailyJobs = jobs.filter(j => j.timestamp.startsWith(dateKey));

        // Row Data
        let detailText = "";
        let qty = "";
        let remarks = "";
        let bgColorClass = (isHoliday) ? (dayOfWeek === 0 || dayOfWeek === 6 ? "bg-red-50" : "bg-yellow-50") : "bg-white";

        if (isHoliday) {
            detailText = holidayName || "วันหยุด";
        } else if (dailyJobs.length > 0) {
            let lines = [];
            // Remarks: Link then IDs
            let remLines = [`http://10.67.3.111/fixed/`, `Ticket ID`];

            dailyJobs.forEach((job, idx) => {
                const issue = job.issue.replace(/\[.*?\]/, '').trim();
                const division = job.division || 'ไม่ระบุหน่วยงาน';

                // Formatted Line
                lines.push(`${idx + 1}.${division} ${issue} / ดำเนินการสำเร็จ`);
                remLines.push(`${idx + 1}.#${job.ticketId}`);

                // Collect TOR Stats
                const combined = (job.issue + " " + (job.deviceName || "")).toLowerCase();
                const cat = checkCat(combined);
                const statLine = `- ${issue} (${division})`;

                if (cat === 'net') torNet.push(statLine);
                else if (cat === 'sw') torSW.push(statLine);
                else if (cat === 'hw') torHW.push(statLine);
                else torOther.push(statLine);
            });
            detailText = lines.join('\n');
            qty = dailyJobs.length;
            remarks = remLines.join('\n');
        } else {
            detailText = "-";
        }

        // Create Row HTML
        const row = document.createElement('tr');
        row.className = `${bgColorClass} border-b border-gray-100 hover:bg-blue-50 transition`;
        const dateThVal = dateTh; // closure safe?

        // Use raw strings for value to avoid HTML injection issues? Textareas handle it well.
        // We use .value assignment (via DOM) or inner HTML with escaping?
        // Inner HTML of textarea works for standard text.

        row.innerHTML = `
            <td class="p-2 align-top">
                <input type="text" value="${dateTh}" class="w-full bg-transparent border-none text-sm font-medium text-gray-600 focus:ring-0" readonly>
            </td>
            <td class="p-2">
                <textarea class="w-full border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 resize-none bg-transparent" rows="${Math.max(2, detailText.split('\n').length)}">${detailText}</textarea>
            </td>
            <td class="p-2 align-top">
                <input type="text" value="${qty}" class="w-full border-gray-200 rounded-lg text-sm text-center focus:ring-blue-500 focus:border-blue-500 bg-white/50">
            </td>
            <td class="p-2 align-top">
                <textarea class="w-full border-gray-200 rounded-lg text-xs focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-500 bg-transparent" rows="${Math.max(2, remarks.split('\\n').length)}">${remarks}</textarea>
            </td>
        `;
        tableBody.appendChild(row);
    }

    // 3. Fill TOR
    // Default prefix texts
    const prefixHW = "1. ให้บริการและแก้ไขปัญหาเครื่องคอมพิวเตอร์และอุปกรณ์ต่อพ่วงได้ (Hardware)\\n- สามารถแก้ไขปัญหาเปลี่ยนอุปกรณ์หรืออะไหล่เครื่องคอมพิวเตอร์และอุปกรณ์ต่อพ่วงได้\\n- สามารถแก้ไขปัญหาของเครื่องพิมพ์ได้ทั้งเครื่องพิมพ์แบบเลเซอร์ (Laser Print) เครื่องพิมพ์แบบหัวเข็ม (Dot Matrix Printer) เครื่องพิมพ์แบบอิงก์เจ็ท (Inkjet Printer) และเครื่องพิมพ์แบบส่งผ่านความร้อน (Thermal Printer) ได้\\n- สามารถแก้ไขปัญหาที่เกิดกับเครื่อง Scanner เครื่องอ่าน Barcode Reader ได้\\n- สามารถวิเคราะห์ปัญหาทางด้าน Hard ware ที่เกิดกับเครื่องคอมพิวเตอร์และอุปกรณ์ต่อพ่วงได้";
    const prefixSW = "2. สามารถให้บริการและแก้ไขปัญหาเครื่องคอมพิวเตอร์และอุปกรณ์ต่อพ่วงได้ (Software)\\n- สามารถติดตั้ง Upgrade โปรแกรมระบบปฏิบัติการ Windows ทุกเวอร์ชั่นได้\\n- สามารถติดตั้ง Upgrade โปรแกรมใช้งานระบบ Microsoft Office ทุกเวอร์ชั่นได้\\n- สามารถติดตั้งโปรแกรมใช้งาน อเนกประสงค์ Utility Application ต่าง ๆได้\\n- สามารถให้บริการแก้ไขเครื่องคอมพิวเตอร์และอุปกรณ์ต่อพ่วงที่เชื่อมต่อกับระบบโปรแกรมระบบโรงพยาบาลได้\\n- สามารถวิเคราะห์ปัญหาทางด้าน Software ที่เกิดกับเครื่องคอมพิวเตอร์และอุปกรณ์ต่อพ่วงได้\\n- สามารถให้บริการโปรแกรมที่ติดตั้งใช้งานในศูนย์หัวใจสิริกิติ์ ฯ ได้";
    const prefixNet = "3. สามารถให้บริการและแก้ไขปัญหาระบบเครือข่ายได้ (Network)\\n- สามารถเดินสายแลนระยะใกล้ได้ตามมาตรฐาน\\n- สามารถเข้าหัวสายแลน RJ45-Jack และ RJ45ตัวเมียได้ตามมาตรฐาน\\n- สามารถเชื่อมต่อระบบเครือข่ายได้โดยการแยก Switch hub ได้ตามมาตรฐาน\\n- สามารถเช็คและตรวจสอบได้ว่าระบบเครือข่ายสามารถใช้งานได้";

    // We add the stats automatically at the end
    document.getElementById('delTorHardware').value = prefixHW;
    document.getElementById('delCountHW').value = torHW.length;

    document.getElementById('delTorSoftware').value = prefixSW;
    document.getElementById('delCountSW').value = torSW.length;

    document.getElementById('delTorNetwork').value = prefixNet;
    document.getElementById('delCountNet').value = torNet.length;

    document.getElementById('delTorOther').value = "5. งานอื่นๆ\\n";
    document.getElementById('delCountOther').value = torOther.length;
}

function getDeliveryFormData() {
    // Helper to get value
    const val = (id) => document.getElementById(id)?.value || '';

    const rows = [];
    document.querySelectorAll('#delDailyTableBody tr').forEach(tr => {
        const inputs = tr.querySelectorAll('input, textarea');
        rows.push({
            d: inputs[0].value,
            work: inputs[1].value,
            q: inputs[2].value,
            rem: inputs[3].value
        });
    });

    return {
        month: val('delMonth'),
        year: val('delYear'),
        period: val('delPeriod'),
        amount: val('delAmount'),
        project: val('delProject'),
        contractor: val('delContractor'),
        contractNo: val('delContractNo'),
        contractDate: val('delContractDate'),
        amountText: val('delAmountText'),

        table: rows,

        torHW: val('delTorHardware'),
        cntHW: val('delCountHW'),
        torSW: val('delTorSoftware'),
        cntSW: val('delCountSW'),
        torNet: val('delTorNetwork'),
        cntNet: val('delCountNet'),
        torOther: val('delTorOther'),
        cntOther: val('delCountOther'),

        bankName: val('delBankName'),
        accName: val('delAccountName'),
        accNo: val('delAccountNo'),

        signName: val('delSignName'),
        signDate: val('delSignDate')
    };
}

function loadDeliveryFormData(data) {
    const setVal = (id, v) => { if (document.getElementById(id)) document.getElementById(id).value = v; };

    setVal('delMonth', data.month);
    setVal('delYear', data.year);
    setVal('delPeriod', data.period);
    setVal('delAmount', data.amount);
    setVal('delProject', data.project);
    setVal('delContractor', data.contractor);
    setVal('delContractNo', data.contractNo);
    setVal('delContractDate', data.contractDate);
    setVal('delAmountText', data.amountText);

    setVal('delTorHardware', data.torHW);
    setVal('delCountHW', data.cntHW);
    setVal('delTorSoftware', data.torSW);
    setVal('delCountSW', data.cntSW);
    setVal('delTorNetwork', data.torNet);
    setVal('delCountNet', data.cntNet);
    setVal('delTorOther', data.torOther);
    setVal('delCountOther', data.cntOther);

    setVal('delBankName', data.bankName);
    setVal('delAccountName', data.accName);
    setVal('delAccountNo', data.accNo);

    setVal('delSignName', data.signName);
    setVal('delSignDate', data.signDate);

    // Table
    const tableBody = document.getElementById('delDailyTableBody');
    tableBody.innerHTML = '';
    (data.table || []).forEach(row => {
        const tr = document.createElement('tr');
        tr.className = "bg-white border-b border-gray-100 hover:bg-blue-50 transition";
        tr.innerHTML = `
            <td class="p-2 align-top"><input type="text" value="${row.d}" class="w-full bg-transparent border-none text-sm font-medium text-gray-600 focus:ring-0" readonly></td>
            <td class="p-2"><textarea class="w-full border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 resize-none bg-transparent" rows="${Math.max(2, row.work.split('\\n').length)}">${row.work}</textarea></td>
            <td class="p-2 align-top"><input type="text" value="${row.q}" class="w-full border-gray-200 rounded-lg text-sm text-center focus:ring-blue-500 focus:border-blue-500 bg-white/50"></td>
            <td class="p-2 align-top"><textarea class="w-full border-gray-200 rounded-lg text-xs focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-500 bg-transparent" rows="${Math.max(2, row.rem.split('\\n').length)}">${row.rem}</textarea></td>
        `;
        tableBody.appendChild(tr);
    });
}

function saveDeliveryDraft() {
    const data = getDeliveryFormData();
    const { techName, start, end } = currentDeliveryContext;
    const draftKey = `draft_delivery_${start}_${end}_${techName || 'all'}`;
    localStorage.setItem(draftKey, JSON.stringify(data));
    showModal('บันทึกแล้ว', 'บันทึกแบบร่างเรียบร้อยแล้ว', 'success');
}

function exportDeliveryData() {
    const data = getDeliveryFormData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    saveAs(blob, "delivery_data_export.json");
}

function importDeliveryData(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            loadDeliveryFormData(data);
            showModal('สำเร็จ', 'นำเข้าข้อมูลเรียบร้อยแล้ว', 'success');
        } catch (err) {
            showModal('ผิดพลาด', 'ไฟล์ไม่ถูกต้อง', 'info');
        }
    };
    reader.readAsText(file);
    // Reset input
    input.value = '';
}

async function generateDeliveryWordDoc() {
    const data = getDeliveryFormData();

    // Calculate Stats
    const totalJobs = (parseInt(data.cntHW) || 0) + (parseInt(data.cntSW) || 0) + (parseInt(data.cntNet) || 0) + (parseInt(data.cntOther) || 0);

    // HTML Template for Word
    // We use a specific structure that Word interprets well as a "Web Layout" or "Print Layout"
    const content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
        <meta charset="utf-8">
        <title>รายงานส่งมอบงาน</title>
        <style>
            body { font-family: 'TH Sarabun New', 'Angsana New', sans-serif; font-size: 16pt; line-height: 1.2; }
            @page { size: A4; margin: 2.5cm 2.0cm 2.0cm 2.5cm; mso-page-orientation: portrait; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            td { border: 1px solid black; padding: 5px; vertical-align: top; font-size: 14pt; }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
            .section-title { font-weight: bold; margin-top: 15px; margin-bottom: 5px; }
            .indent { margin-left: 30px; }
            .no-border { border: none !important; }
            .signature-box { margin-top: 50px; text-align: center; page-break-inside: avoid; }
        </style>
    </head>
    <body>
    
        <div class="header">
            <strong>แบบรายงานส่งมอบงานจ้างเหมาบริการ (บุคคลธรรมดา)</strong><br>
            ประจำงวดที่ ${data.period || '...'} เดือน ${data.month} พ.ศ.${data.year}<br>
            โครงการ : ${data.project}<br>
            ผู้รับจ้าง : ${data.contractor}<br>
            อ้างอิงสัญญา/ข้อตกลง เลขที่ ${data.contractNo} ลงวันที่ ${data.contractDate}
        </div>

        <div class="section-title">1. ตารางแสดงรายละเอียดผลการปฏิบัติงานรายวัน</div>
        
        <table>
            <tbody>
                <!-- Header Row -->
                <tr>
                    <td width="15%" class="center bold" style="vertical-align: middle;">วัน/เดือน/ปี</td>
                    <td width="50%" class="center bold" style="vertical-align: middle;">รายละเอียดของงานที่ปฏิบัติ / ผลผลิตที่ส่ง<br>มอบ (Output)</td>
                    <td width="15%" class="center bold" style="vertical-align: middle;">ปริมาณงาน<br>(ชิ้น/เรื่อง/ฉบับ/แฟ้ม)</td>
                    <td width="20%" class="center bold" style="vertical-align: middle;">หมายเหตุ / อ้างอิง</td>
                </tr>

                ${data.table.map(row => `
                <tr>
                    <td class="center">${row.d}</td>
                    <td>${row.work.replace(/\n/g, '<br>')}</td>
                    <td class="center">${row.q}</td>
                    <td>${row.rem.replace(/\n/g, '<br>')}</td>
                </tr>
                `).join('')}
                <tr>
                    <td colspan="2" class="center bold" style="background-color:#eee;">รวมสรุปปริมาณงานตลอดงวด</td>
                    <td class="center bold" style="background-color:#eee;">${totalJobs}</td>
                    <td style="background-color:#eee;"></td>
                </tr>
            </tbody>
        </table>

        <div class="section-title">2. สรุปผลสัมฤทธิ์ของงานในงวดนี้ (หัวข้อตรงกับขอบเขตของงาน (TOR) หรือมากกว่า)</div>
        
        <!-- HW -->
        <div style="margin-bottom: 10px;">
            ${data.torHW.replace(/\n/g, '<br>')}
            <div class="bold" style="margin-top:5px;">จำนวน ${data.cntHW} งาน</div>
        </div>

        <!-- SW -->
        <div style="margin-bottom: 10px;">
            ${data.torSW.replace(/\n/g, '<br>')}
            <div class="bold" style="margin-top:5px;">จำนวน ${data.cntSW} งาน</div>
        </div>
        
        <!-- Net -->
        <div style="margin-bottom: 10px;">
            ${data.torNet.replace(/\n/g, '<br>')}
            <div class="bold" style="margin-top:5px;">จำนวน ${data.cntNet} งาน</div>
        </div>
        
        <!-- Other -->
        <div style="margin-bottom: 10px;">
            ${data.torOther.replace(/\n/g, '<br>')}
            <div class="bold" style="margin-top:5px;">จำนวน ${data.cntOther} งาน</div>
        </div>

        <div class="section-title">3. ค่าจ้างเหมาบริการ</div>
        <div class="indent">
            ขอเบิกเงินค่าจ้างเหมาบริการ ประจำงวดที่ ${data.period || '...'} เดือน ${data.month} ${data.year}<br>
            เป็นจำนวนเงิน ${data.amount} บาท (${data.amountText})<br>
            ขอให้โอนเงินผ่านบัญชีธนาคาร ${data.bankName} ชื่อบัญชี ${data.accName} เลขที่บัญชี ${data.accNo}
        </div>
        
        <br>
        <div class="indent">
            ข้าพเจ้าขอรับรองว่าได้ปฏิบัติงานและส่งมอบผลงานดังกล่าวข้างต้น ถูกต้องครบถ้วนตามขอบเขตของงาน (TOR) ทุกประการ
        </div>

        <div class="signature-box">
            ลงชื่อ ................................................................. ผู้ส่งมอบงาน<br>
            (${data.signName})<br>
            วันที่ ${data.signDate}
        </div>

    </body>
    </html>
    `;

    const blob = new Blob(['\ufeff', content], {
        type: 'application/msword'
    });

    saveAs(blob, `รายงานส่งมอบงาน_${data.month}_${data.year}_${data.contractor}.doc`);
    showModal('สำเร็จ', 'สร้างไฟล์รายงาน (Word) เรียบร้อยแล้ว', 'success');
}

// ==========================================
// OVERRIDE GLOBALS
// Override Navigation
window.goHome = function () {
    // Hide all
    const sections = ['loginSection', 'repairSection', 'dashboardSection', 'importSection', 'jobListSection', 'jobDetailSection', 'deliveryFormSection'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('hidden');
            el.style.display = ''; // Clear inline styles (fix for delivery form override)
        }
    });

    // Check session
    const userStr = localStorage.getItem('itSupportUser');
    if (userStr) {
        const user = JSON.parse(userStr);
        document.getElementById('repairSection').classList.remove('hidden');
        if (user.isAdmin || user.role === 'admin' || user.role === 'technician') {
            if (typeof loadDashboardStats === 'function') loadDashboardStats();
            if (user.fullName) handleLoginSuccess(user);
        }
    } else {
        document.getElementById('loginSection').classList.remove('hidden');
    }
}

// Override Print Handler
window.printDeliveryReport = openDeliveryForm;

// Expose Helpers
window.reloadDeliveryOriginal = reloadDeliveryOriginal;
window.saveDeliveryDraft = saveDeliveryDraft;
window.exportDeliveryData = exportDeliveryData;
window.importDeliveryData = importDeliveryData;
window.generateDeliveryWordDoc = generateDeliveryWordDoc;

// Manual Save Draft (Button)
window.saveDeliveryManualDraft = function () {
    saveDeliveryDraft();
    showModal('สำเร็จ', 'บันทึกแบบร่างเรียบร้อยแล้ว', 'success');
};

// Manual Load Draft (Button)
window.loadDeliveryManualDraft = function () {
    const start = currentDeliveryContext.start;
    const end = currentDeliveryContext.end;
    const techName = currentDeliveryContext.techName;

    if (!start || !end) {
        showModal('แจ้งเตือน', 'กรุณาเลือกช่วงเวลาข้อมูลก่อนโหลด', 'info');
        return;
    }

    const draftKey = `draft_delivery_${start}_${end}_${techName || 'all'}`;
    const draft = localStorage.getItem(draftKey);

    if (draft) {
        if (confirm('พบข้อมูลที่บันทึกไว้ล่าสุด ต้องการโหลดหรือไม่?')) {
            loadDeliveryFormData(JSON.parse(draft));
            showModal('สำเร็จ', 'โหลดข้อมูลเรียบร้อยแล้ว', 'success');
        }
    } else {
        showModal('ไม่พบข้อมูล', 'ไม่พบข้อมูลที่บันทึกไว้สำหรับช่วงเวลานี้', 'info');
    }
};

function initializeDeliveryFormV2(jobs, startStr, endStr, techName) {
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);

    // 1. Set Header Info
    const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    document.getElementById('delMonth').value = monthNames[startDate.getMonth()];
    document.getElementById('delYear').value = (startDate.getFullYear() + 543).toString();

    // Auto Calculate Period (Base: 1 Oct 2568 (2025) = Period 1)
    const baseYear = 2025; // 2568 - 543
    const baseMonth = 9;   // October (0-indexed)

    const currentYear = startDate.getFullYear();
    const currentMonth = startDate.getMonth();

    const monthDiff = (currentYear - baseYear) * 12 + (currentMonth - baseMonth);
    const period = monthDiff + 1;

    if (period > 0) {
        document.getElementById('delPeriod').value = period.toString();
    } else {
        document.getElementById('delPeriod').value = "";
    }

    if (techName) document.getElementById('delContractor').value = techName;

    // Sign Date (End Date)
    const formatThaiDate = (d) => d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('delSignDate').value = formatThaiDate(endDate);

    // Sign Name
    document.getElementById('delSignName').value = techName || "นายนวพล พรเจริญ";

    // 2. Generate Daily Table
    const tableBody = document.getElementById('delDailyTableBody');
    tableBody.innerHTML = '';

    // Categorization Helpers
    const kwHW = ['printer', 'print', 'monitor', 'mouse', 'keyboard', 'screen', 'เปิดไม่ติด', 'เสีย', 'change', 'replace', 'drum', 'toner', 'หมึก', 'กระดาษ', 'scan', 'barcode', 'part', 'อุปกรณ์', 'cpu', 'ram', 'disk', 'hard', 'เครื่อง', 'เปิด', 'ดับ', 'hardware'];
    const kwSW = ['propgram', 'windows', 'word', 'excel', 'powerpoint', 'outlook', 'office', 'install', 'update', 'error', 'file', 'folder', 'virus', 'slow', 'ช้า', 'ค้าง', 'program', 'login', 'user', 'password', 'driver', 'ลง', 'software', 'format'];
    const kwNet = ['internet', 'wifi', 'lan', 'network', 'connect', 'signal', 'net', 'ip', 'cat', 'cable', 'หลุด', 'unstable', 'online'];

    const checkCat = (text) => {
        text = text.toLowerCase();
        if (kwNet.some(k => text.includes(k))) return 'net';
        if (kwSW.some(k => text.includes(k))) return 'sw';
        if (kwHW.some(k => text.includes(k))) return 'hw';
        return 'other';
    };

    let torHW = [], torSW = [], torNet = [], torOther = [];

    // Holidays Database (Day/Month or specific YYYY-MM-DD for lunar)
    const getHolidayName = (d) => {
        const day = d.getDate();
        const month = d.getMonth() + 1;
        const year = d.getFullYear(); // 2025, 2026
        const dateKey = `${day}/${month}`;
        const fullKey = `${year}-${month}-${day}`;

        // 2569 (2026) Holidays - Strictly from Image
        if (year === 2026) {
            if (fullKey === '2026-1-1') return "วันขึ้นปีใหม่";
            if (fullKey === '2026-1-2') return "วันหยุดพิเศษเพิ่มเติม";

            if (fullKey === '2026-3-3') return "วันมาฆบูชา";

            if (fullKey === '2026-4-6') return "วันจักรี";
            if (fullKey === '2026-4-13') return "วันสงกรานต์";
            if (fullKey === '2026-4-14') return "วันสงกรานต์";
            if (fullKey === '2026-4-15') return "วันสงกรานต์";

            if (fullKey === '2026-5-1') return "วันแรงงานแห่งชาติ";
            if (fullKey === '2026-5-4') return "วันฉัตรมงคล";
            if (fullKey === '2026-5-11') return "วันพืชมงคล";
            if (fullKey === '2026-5-31') return "วันวิสาขบูชา";

            if (fullKey === '2026-6-1') return "วันหยุดชดเชยวันวิสาขบูชา";
            if (fullKey === '2026-6-3') return "วันเฉลิมพระชนมพรรษาพระราชินี";

            if (fullKey === '2026-7-28') return "วันเฉลิมพระชนมพรรษา ร.10";
            if (fullKey === '2026-7-29') return "วันอาสาฬหบูชา";
            if (fullKey === '2026-7-30') return "วันเข้าพรรษา";

            if (fullKey === '2026-8-12') return "วันแม่แห่งชาติ";

            if (fullKey === '2026-10-13') return "วันคล้ายวันสวรรคต ร.9";
            if (fullKey === '2026-10-23') return "วันปิยมหาราช";
            if (fullKey === '2026-10-26') return "วันออกพรรษา";

            if (fullKey === '2026-12-5') return "วันพ่อแห่งชาติ";
            if (fullKey === '2026-12-7') return "วันหยุดชดเชยวันพ่อแห่งชาติ";
            if (fullKey === '2026-12-10') return "วันรัฐธรรมนูญ";
            if (fullKey === '2026-12-31') return "วันสิ้นปี";

            return "";
        }

        // Fixed Annual Holidays (Fallback)
        if (dateKey === '1/1') return "วันขึ้นปีใหม่";
        if (dateKey === '6/4') return "วันจักรี";
        if (dateKey === '13/4') return "วันสงกรานต์";
        if (dateKey === '14/4') return "วันสงกรานต์";
        if (dateKey === '15/4') return "วันสงกรานต์";
        if (dateKey === '1/5') return "วันแรงงานแห่งชาติ"; // Often observed
        if (dateKey === '4/5') return "วันฉัตรมงคล";
        if (dateKey === '3/6') return "วันเฉลิมพระชนมพรรษาพระราชินี";
        if (dateKey === '28/7') return "วันเฉลิมพระชนมพรรษา ร.10";
        if (dateKey === '12/8') return "วันแม่แห่งชาติ";
        if (dateKey === '13/10') return "วันนวมินทรมหาราช";
        if (dateKey === '23/10') return "วันปิยมหาราช";
        if (dateKey === '5/12') return "วันพ่อแห่งชาติ";
        if (dateKey === '10/12') return "วันรัฐธรรมนูญ";
        if (dateKey === '31/12') return "วันสิ้นปี";

        // Lunar/Variable Holidays (Specific to 2025/2568, 2026/2569)
        // 2025
        if (fullKey === '2025-2-12') return "วันมาฆบูชา";
        if (fullKey === '2025-5-11') return "วันวิสาขบูชา";
        if (fullKey === '2025-7-10') return "วันอาสาฬหบูชา";
        if (fullKey === '2025-7-11') return "วันเข้าพรรษา";

        // Match existing code tail
        // Compensation (Example logic or specific dates)
        // 2025 Compensation
        if (fullKey === '2025-10-14') return "วันหยุดชดเชยวันนวมินทรมหาราช";

        return "";
    };

    // Loop through dates
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateObj = new Date(d);
        const dateKey = dateObj.toISOString().split('T')[0];
        // Format: d/MM/yyyy (BE)
        const dateTh = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: '2-digit', year: 'numeric' });

        // Holidays
        const dayOfWeek = dateObj.getDay();
        const specificHoliday = getHolidayName(dateObj);

        let isHoliday = (dayOfWeek === 0 || dayOfWeek === 6 || specificHoliday !== "");
        let holidayName = specificHoliday;

        if (!holidayName) {
            if (dayOfWeek === 0) holidayName = "วันอาทิตย์";
            if (dayOfWeek === 6) holidayName = "วันเสาร์";
        } else {
            // If Weekend AND Holiday, maybe combine? or just show Holiday name
        }

        const day = dateObj.getDate();
        const month = dateObj.getMonth() + 1;
        // Legacy manual check kept for safety if not in DB
        if (day === 2 && month === 1) { isHoliday = true; holidayName = "วันหยุดชดเชยวันสิ้นปี"; } // Common substitution

        const dailyJobs = jobs.filter(j => j.timestamp.startsWith(dateKey));

        // Row Data
        let detailText = "";
        let qty = "";
        let remarks = "";
        let bgColorClass = (isHoliday) ? (dayOfWeek === 0 || dayOfWeek === 6 ? "bg-red-50" : "bg-yellow-50") : "bg-white";

        if (isHoliday) {
            detailText = holidayName || "วันหยุด";
        } else if (dailyJobs.length > 0) {
            let lines = [];
            let remLines = [`http://10.67.3.111/fixed/`, `Ticket ID`];

            dailyJobs.forEach((job, idx) => {
                const issue = job.issue.replace(/\[.*?\]/, '').trim();
                const division = job.division || 'ไม่ระบุหน่วยงาน';

                // Formatted Line: "Location / Issue + Details"
                // User Request: "สถานที่ซ่อม / ที่ตั้งเครื่อง+รายละเอียดเพิ่มเติม"
                const loc = job.repairLocation ? ` ${job.repairLocation} /` : ''; // Add space for separation from index
                const det = job.details || '';

                // Combine: Index. Location / Issue Details / Success
                lines.push(`${idx + 1}.${loc} ${issue} ${det} / ดำเนินการสำเร็จ`);
                remLines.push(`${idx + 1}.#${job.ticketId}`);

                // Collect TOR Stats
                // Use manual category first if available, else keywords
                let cat = null;
                if (job.category && ['hw', 'sw', 'net', 'other'].includes(job.category)) {
                    cat = job.category;
                } else {
                    const combined = (job.issue + " " + (job.deviceName || "")).toLowerCase();
                    cat = checkCat(combined);
                }

                const statLine = `- ${issue} (${division})`;

                if (cat === 'net') torNet.push(statLine);
                else if (cat === 'sw') torSW.push(statLine);
                else if (cat === 'hw') torHW.push(statLine);
                else torOther.push(statLine); // Default to Other if unknown
            });
            detailText = lines.join('\n');
            qty = dailyJobs.length;
            remarks = remLines.join('\n');
        } else {
            detailText = "-";
        }

        // Create Row HTML
        const row = document.createElement('tr');
        row.className = `${bgColorClass} border-b border-gray-100 hover:bg-blue-50 transition`;

        row.innerHTML = `
            <td class="p-2 align-top">
                <input type="text" value="${dateTh}" class="w-full bg-transparent border-none text-sm font-medium text-gray-600 focus:ring-0" readonly>
            </td>
            <td class="p-2">
                <textarea class="w-full border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 resize-none bg-transparent" rows="${Math.max(2, detailText.split('\n').length)}">${detailText}</textarea>
            </td>
            <td class="p-2 align-top">
                <input type="text" value="${qty}" class="w-full border-gray-200 rounded-lg text-sm text-center focus:ring-blue-500 focus:border-blue-500 bg-white/50">
            </td>
            <td class="p-2 align-top">
                <textarea class="w-full border-gray-200 rounded-lg text-xs focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-500 bg-transparent" rows="${Math.max(2, remarks.split('\\n').length)}">${remarks}</textarea>
            </td>
        `;
        tableBody.appendChild(row);
    }

    // 3. Fill TOR
    // Exact Text from User Image
    const prefixHW = "1. ให้บริการและแก้ไขปัญหาเครื่องคอมพิวเตอร์และอุปกรณ์ต่อพ่วงได้ (Hardware)\\n- สามารถแก้ไขปัญหาเปลี่ยนอุปกรณ์หรืออะไหล่เครื่องคอมพิวเตอร์และอุปกรณ์ต่อพ่วงได้\\n- สามารถแก้ไขปัญหาของเครื่องพิมพ์ได้ทั้งเครื่องพิมพ์แบบเลเซอร์ (Laser Print) เครื่องพิมพ์แบบหัวเข็ม (Dot Matrix Printer) เครื่องพิมพ์แบบอิงก์เจ็ท (Inkjet Printer) และเครื่องพิมพ์แบบส่งผ่านความร้อน (Thermal Printer) ได้\\n- สามารถแก้ไขปัญหาที่เกิดกับเครื่อง Scanner เครื่องอ่าน Barcode Reader ได้\\n- สามารถวิเคราะห์ปัญหาทางด้าน Hard ware ที่เกิดกับเครื่องคอมพิวเตอร์และอุปกรณ์ต่อพ่วงได้";

    const prefixSW = "2. สามารถให้บริการและแก้ไขปัญหาเครื่องคอมพิวเตอร์และอุปกรณ์ต่อพ่วงได้ (Software)\\n- สามารถติดตั้ง Upgrade โปรแกรมระบบปฏิบัติการ Windows ทุกเวอร์ชั่นได้\\n- สามารถติดตั้ง Upgrade โปรแกรมใช้งานระบบ Microsoft Office ทุกเวอร์ชั่นได้\\n- สามารถติดตั้งโปรแกรมใช้งาน อเนกประสงค์ Utility Application ต่าง ๆได้\\n- สามารถให้บริการแก้ไขเครื่องคอมพิวเตอร์และอุปกรณ์ต่อพ่วงที่เชื่อมต่อกับระบบโปรแกรมระบบโรงพยาบาลได้\\n- สามารถวิเคราะห์ปัญหาทางด้าน Software ที่เกิดกับเครื่องคอมพิวเตอร์และอุปกรณ์ต่อพ่วงได้\\n- สามารถให้บริการโปรแกรมที่ติดตั้งใช้งานในศูนย์หัวใจสิริกิติ์ ฯ ได้";

    const prefixNet = "3. สามารถให้บริการและแก้ไขปัญหาระบบเครือข่ายได้ (Network)\\n- สามารถเดินสายแลนระยะใกล้ได้ตามมาตรฐาน\\n- สามารถเข้าหัวสายแลน RJ45-Jack และ RJ45ตัวเมียได้ตามมาตรฐาน\\n- สามารถเชื่อมต่อระบบเครือข่ายได้โดยการแยก Switch hub ได้ตามมาตรฐาน\\n- สามารถเช็คและตรวจสอบได้ว่าระบบเครือข่ายสามารถใช้งานได้";

    const prefixOther = "4. งานอื่นๆ\\n-สามารถให้บริการดูกล้องวงจรปิด สำหรับผู้มาขอใช้บริการ";

    document.getElementById('delTorHardware').value = prefixHW.replace(/\\n/g, '\n');
    document.getElementById('delCountHW').value = torHW.length;

    document.getElementById('delTorSoftware').value = prefixSW.replace(/\\n/g, '\n');
    document.getElementById('delCountSW').value = torSW.length;

    document.getElementById('delTorNetwork').value = prefixNet.replace(/\\n/g, '\n');
    document.getElementById('delCountNet').value = torNet.length;

    document.getElementById('delTorOther').value = prefixOther.replace(/\\n/g, '\n');
    document.getElementById('delCountOther').value = torOther.length;
}

async function updateDeliveryMonth() {
    const monthMap = {
        "มกราคม": 0, "กุมภาพันธ์": 1, "มีนาคม": 2, "เมษายน": 3,
        "พฤษภาคม": 4, "มิถุนายน": 5, "กรกฎาคม": 6, "สิงหาคม": 7,
        "กันยายน": 8, "ตุลาคม": 9, "พฤศจิกายน": 10, "ธันวาคม": 11
    };

    const mStr = document.getElementById('delMonth').value;
    const yStr = document.getElementById('delYear').value;

    if (!mStr || !yStr || yStr.length !== 4) return;

    // Convert BE to CE
    const yearCE = parseInt(yStr) - 543;
    const monthIdx = monthMap[mStr];

    if (isNaN(yearCE) || monthIdx === undefined) return;

    // Calculate new range
    const start = new Date(yearCE, monthIdx, 1);
    const end = new Date(yearCE, monthIdx + 1, 0); // Last day of month

    // Fix Timezone issue: Avoid toISOString() which converts to UTC
    const toLocalISO = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const startIso = toLocalISO(start);
    const endIso = toLocalISO(end);

    // Update Context
    currentDeliveryContext.start = startIso;
    currentDeliveryContext.end = endIso;

    // Reload Data
    await reloadDeliveryOriginal();
}
window.updateDeliveryMonth = updateDeliveryMonth;

// --- Assessment Logic ---
async function openAssessmentModal(index) {
    const job = currentAdminJobs[index];
    if (!job) return;

    // Load Assessors
    await loadAssessors();

    // Form & UI Elements
    const form = document.getElementById('assessmentForm');
    const submitBtn = document.getElementById('btnSubmitAssessment');
    const notice = document.getElementById('asmNotice');
    const addAssessorBtn = document.querySelector('button[onclick="addNewAssessor()"]');

    // Reset components
    form.reset();
    document.querySelector('input[name="satisfaction"][value="ดีมาก"]').checked = true; // Default
    document.querySelector('input[name="serviceTime"][value="ในเวลาราชการ"]').checked = true; // Default

    // Handle Read-Only State
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.disabled = job.isAssessed ? true : false;
    });
    if (addAssessorBtn) addAssessorBtn.classList.toggle('hidden', job.isAssessed);

    if (job.isAssessed) {
        submitBtn.classList.add('hidden');
        notice.classList.remove('hidden');

        // Fetch existing data
        const res = await apiCall(`getAssessment?ticketId=${job.ticketId}`, {}, 'GET');
        if (res.success && res.assessment) {
            const asm = res.assessment;
            const satInput = form.querySelector(`input[name="satisfaction"][value="${asm.satisfaction}"]`);
            if (satInput) satInput.checked = true;

            const timeInput = form.querySelector(`input[name="serviceTime"][value="${asm.service_time}"]`);
            if (timeInput) timeInput.checked = true;

            document.getElementById('asmComment').value = asm.comment || '';
            document.getElementById('asmAssessor').value = asm.assessor || '';

            if (asm.assessment_date) {
                const d = new Date(asm.assessment_date);
                document.getElementById('asmEvalDate').innerText = d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
            }
        }
    } else {
        submitBtn.classList.remove('hidden');
        notice.classList.add('hidden');
        const now = new Date();
        document.getElementById('asmEvalDate').innerText = now.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    // Populate Fields (Constant info)
    document.getElementById('asmTicketId').value = job.ticketId;

    // Header Info
    const formatThaiDateTime = (isoStr) => {
        if (!isoStr) return '-';
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return isoStr;
        return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) + ' ' +
            d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    };

    const parts = job.created_at ? formatThaiDateTime(job.created_at).split(' ') : [];
    document.getElementById('asmReportDate').innerText = parts.length >= 3 ? parts.slice(0, 3).join(' ') : (parts[0] || '-');
    document.getElementById('asmReportTime').innerText = parts.length > 3 ? parts[3] : '-';
    document.getElementById('asmReporter').innerText = job.reporter || '-';

    document.getElementById('asmDivision').innerText = job.division || '-';
    let loc = [];
    if (job.floor) loc.push("ชั้น " + job.floor);
    if (job.room) loc.push("ห้อง " + job.room);
    document.getElementById('asmLocation').innerText = loc.length > 0 ? loc.join(' ') : '-';
    document.getElementById('asmContact').innerText = job.contact || '-';
    document.getElementById('asmIssue').innerText = job.issue || '-';

    // Show Modal
    document.getElementById('assessmentModal').classList.remove('hidden');
}

function closeAssessmentModal() {
    document.getElementById('assessmentModal').classList.add('hidden');
}

async function submitAssessment() {
    const ticketId = document.getElementById('asmTicketId').value;
    const date = new Date().toISOString().split('T')[0]; // Current SQL Date (YYYY-MM-DD)

    const satisfaction = document.querySelector('input[name="satisfaction"]:checked')?.value;
    const serviceTime = document.querySelector('input[name="serviceTime"]:checked')?.value;
    const comment = document.getElementById('asmComment').value;
    const assessor = document.getElementById('asmAssessor').value;

    if (!satisfaction) return alert('กรุณาระบุระดับความพึงพอใจ');

    const btn = document.getElementById('btnSubmitAssessment');
    const oldText = btn.innerText;
    btn.innerText = 'กำลังบันทึก...';
    btn.disabled = true;

    const res = await apiCall('evaluateJob', {
        ticketId, date, satisfaction, serviceTime, comment, assessor
    });

    if (res.success) {
        alert('บันทึกการประเมินเรียบร้อยแล้ว');
        closeAssessmentModal();
        await loadUserJobs();
    } else {
        alert('เกิดข้อผิดพลาด: ' + res.message);
    }

    btn.innerText = oldText;
    btn.disabled = false;
}

async function loadAssessors() {
    const res = await apiCall('getAssessors', {}, 'GET');
    const select = document.getElementById('asmAssessor');
    if (res.success && select) {
        const currentVal = select.value;
        select.innerHTML = '<option value="">-- เลือกผู้ประเมิน --</option>';
        res.data.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.name;
            opt.innerText = a.name;
            select.appendChild(opt);
        });
        if (currentVal) select.value = currentVal;
    }
}

async function addNewAssessor() {
    const name = prompt("กรุณาระบุชื่อผู้ประเมิน:");
    if (!name) return;

    const res = await apiCall('addAssessor', { name });
    if (res.success) {
        await loadAssessors();
        document.getElementById('asmAssessor').value = name;
    } else {
        alert("ไม่สามารถเพิ่มรายชื่อได้: " + res.message);
    }
}

window.openAssessmentModal = openAssessmentModal;
window.closeAssessmentModal = closeAssessmentModal;
window.submitAssessment = submitAssessment;
window.loadAssessors = loadAssessors;
window.addNewAssessor = addNewAssessor;
window.changeUserJobMonth = changeUserJobMonth;
window.changeUserJobYear = changeUserJobYear;
