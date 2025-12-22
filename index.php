<!DOCTYPE html>
<?php date_default_timezone_set('Asia/Bangkok'); ?>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ระบบแจ้งซ่อม IT Online</title>
  
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link href="assets/css/style.css?v=<?php echo time(); ?>" rel="stylesheet">
</head>
<body class="bg-orange-50 min-h-screen relative font-sans text-gray-800">

  <!-- Main Container -->
  <div class="w-full md:max-w-7xl mx-auto bg-white md:rounded-3xl shadow-xl overflow-hidden transition-all duration-300 border border-orange-100 mt-0 md:mt-8 relative z-10 min-h-[calc(100vh-4rem)] flex flex-col">
    
    <!-- Header (Fixed Structure) -->
    <div class="bg-gradient-to-r from-orange-400 to-amber-300 p-5 text-white flex justify-between items-center shadow-md">
      <div id="mainHeaderLogo" class="flex items-center gap-3 text-white drop-shadow-sm transition" onclick="goHome()">
        <div class="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        </div>
        <div class="flex flex-col">
          <span class="text-xl font-bold leading-tight">ระบบแจ้งซ่อมIT</span>
          <!-- Status Badge added here -->
          <span id="userStatusBadge" class="text-[10px] font-medium bg-white/20 px-2 py-0.5 rounded-full w-fit hidden">สถานะ: -</span>
        </div>
      </div>
      
      <!-- Nav Menu -->
      <div id="navMenu" class="hidden flex gap-2 items-center">
        <button onclick="showPage('repairSection')" class="text-sm bg-orange-500/80 hover:bg-orange-600 text-white font-medium px-3 py-1.5 rounded-lg transition shadow-sm border border-white/10 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <span>แจ้งซ่อม</span>
        </button>
        <button id="userMyJobsBtn" onclick="loadUserJobs()" class="hidden text-sm bg-cyan-500/80 hover:bg-cyan-600 text-white font-medium px-3 py-1.5 rounded-lg transition shadow-sm border border-white/10 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
          <span class="hidden md:inline">ดูสถานะงาน</span>
        </button>
        <button id="adminStatsBtn" onclick="loadDashboard()" class="hidden text-sm bg-indigo-500/80 hover:bg-indigo-600 text-white font-medium px-3 py-1.5 rounded-lg transition shadow-sm border border-white/10 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          <span class="hidden md:inline">สถิติ</span>
        </button>
        <button id="adminJobBtn" onclick="loadAdminJobs()" class="hidden relative text-sm bg-purple-500/80 hover:bg-purple-600 text-white font-medium px-3 py-1.5 rounded-lg transition shadow-sm border border-white/10 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          <span class="hidden md:inline">งานรอรับ</span>
          <span id="jobCountBadge" class="hidden absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white shadow-sm min-w-[18px] text-center">0</span>
        </button>
        <button id="adminMyJobBtn" onclick="loadMyJobs()" class="hidden relative text-sm bg-blue-500/80 hover:bg-blue-600 text-white font-medium px-3 py-1.5 rounded-lg transition shadow-sm border border-white/10 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          <span class="hidden md:inline">กำลังดำเนินการ</span>
          <span id="myJobCountBadge" class="hidden absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white shadow-sm min-w-[18px] text-center">0</span>
        </button>
        <input type="file" id="importFile" accept=".csv" class="hidden" onchange="uploadImportFile()">
        <button onclick="confirmLogout()" class="text-sm bg-red-500/80 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg transition ml-1 flex items-center gap-1 shadow-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          <span class="hidden md:inline">Logout</span>
        </button>
      </div>
    </div>

    <!-- Import Section (Below Menu) -->
    <div id="importSection" class="hidden bg-white/10 backdrop-blur-sm border-t border-white/20 px-6 md:px-8 py-3">
      <div class="flex gap-3 items-center">
        <button id="adminImportBtn" onclick="triggerImport()" class="hidden text-sm bg-green-500/80 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-lg transition shadow-sm border border-white/10 flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          <span>Import ข้อมูลครุภัณฑ์</span>
        </button>
        <a href="template_assets.csv" download id="adminTemplateBtn" class="hidden text-sm bg-gray-600/80 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition border border-white/10 flex items-center gap-2 shadow-sm" title="ดาวน์โหลดไฟล์ตัวอย่าง">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <span>ดาวน์โหลดไฟล์ตัวอย่าง</span>
        </a>
      </div>
    </div>

    <div class="p-6 md:p-8 flex-1 overflow-y-auto">

      <!-- 1. LOGIN SECTION -->
      <div id="loginSection" class="fade-in bg-white max-w-md mx-auto">
        <div class="text-center mb-8">
          <div class="inline-block p-3 rounded-full bg-orange-100 text-orange-500 mb-3">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-800">เข้าสู่ระบบ</h2>
          <p class="text-gray-500 text-sm mt-1">กรุณาล็อกอินเพื่อใช้งานระบบแจ้งซ่อม</p>
        </div>
        <div class="space-y-5">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">ชื่อผู้ใช้งาน</label>
            <input type="text" id="username" onkeydown="if(event.key === 'Enter') performLogin()" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-400 outline-none bg-gray-50 hover:bg-white transition-all">
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">รหัสผ่าน</label>
            <div class="relative">
              <input type="password" id="password" onkeydown="if(event.key === 'Enter') performLogin()" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-400 outline-none bg-gray-50 hover:bg-white transition-all pr-12">
              <button type="button" onclick="togglePassword()" class="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-orange-500 transition-colors focus:outline-none">
                <svg id="eyeIcon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                <svg id="eyeSlashIcon" class="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
              </button>
            </div>
          </div>
          <button onclick="performLogin()" id="btnLogin" class="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-orange-200 transform active:scale-95">
            เข้าสู่ระบบ
          </button>
          <p id="loginError" class="hidden text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-100"></p>
        </div>
      </div>

      <!-- 2. REPAIR FORM SECTION -->
      <div id="repairSection" class="hidden fade-in max-w-4xl mx-auto">
        <h2 class="text-2xl font-bold text-gray-800 mb-6 border-l-4 border-orange-500 pl-4 hidden md:block">แจ้งซ่อมอุปกรณ์</h2>
        
        <form id="repairForm" class="space-y-6 text-gray-700">
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Left Column: Asset Info -->
            <div class="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-4">
               <div>
                  <h3 class="font-bold text-gray-800 mb-3 flex items-center gap-2"><svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg> ข้อมูลครุภัณฑ์</h3>
                  <label class="block text-sm font-semibold mb-1">รหัสครุภัณฑ์ <span class="text-red-500">*</span></label>
                  <div class="relative">
                    <input type="text" name="assetCode" id="assetCodeInput" 
                           onkeydown="if(event.key === 'Enter') { event.preventDefault(); autoFillAssetInfo(); }" 
                           onblur="autoFillAssetInfo()" 
                           class="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-200 outline-none bg-white font-mono tracking-wide" 
                           placeholder="เช่น 640001" required>
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                    </div>
                    <div id="assetLoading" class="absolute inset-y-0 right-0 pr-3 flex items-center hidden">
                      <svg class="animate-spin h-4 w-4 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    </div>
                  </div>
                  <div id="assetNotFound" class="hidden mt-2 flex items-center justify-between bg-red-50 p-2 rounded-lg border border-red-100 animate-pulse">
                     <div class="flex items-center gap-2 text-red-500 text-xs font-semibold">
                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                       <span>ไม่พบข้อมูล</span>
                     </div>
                     <button type="button" onclick="enableManualInput()" class="text-xs bg-white text-orange-600 border border-orange-200 px-3 py-1.5 rounded-md hover:bg-orange-50 font-bold">เพิ่มรายการใหม่</button>
                  </div>
                  <p id="assetHint" class="text-xs text-gray-400 mt-1 ml-1">💡 ระบบจะดึงข้อมูลให้อัตโนมัติเมื่อกรอกรหัสครบ</p>
               </div>

               <div class="grid grid-cols-1 gap-2">
                  <input type="text" name="deviceName" id="deviceName" class="input-line text-sm" placeholder="ชื่อเครื่อง (Device Name)">
                  <div class="grid grid-cols-2 gap-4">
                      <input type="text" name="brand" id="brand" class="input-line text-sm" placeholder="ยี่ห้อ (Brand)">
                      <input type="text" name="model" id="model" class="input-line text-sm" placeholder="รุ่น (Model)">
                  </div>
               </div>
            </div>

            <!-- Right Column: Problem Details -->
            <div class="space-y-4">
                <div>
                    <h3 class="font-bold text-gray-800 mb-3 flex items-center gap-2 md:hidden"><svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> รายละเอียดปัญหา</h3>
                    <label class="block text-sm font-bold mb-1 text-gray-800">ประเภทปัญหา <span class="text-red-500">*</span></label>
                    <div class="relative">
                      <select name="problemType" id="problemType" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-400 outline-none bg-white text-gray-700 transition-all cursor-pointer shadow-sm" required>
                        <option value="" disabled selected class="text-gray-400">-- เลือกอาการเสีย / ปัญหาอุปสรรค --</option>
                        
                        <optgroup label="ฮาร์ดแวร์ (Hardware)">
                          <option value="เปิดเครื่องไม่ติด">🔌 เปิดเครื่องไม่ติด (No Power)</option>
                          <option value="จอภาพไม่ติด/จอฟ้า">💻 จอภาพไม่ติด / จอฟ้า (Screen Issue)</option>
                          <option value="เครื่องร้อน/พัดลมดัง">🌡️ เครื่องร้อนจัด / พัดลมดัง (Overheat/Noise)</option>
                          <option value="อุปกรณ์เสียหาย">💾 อุปกรณ์ภายในเสียหาย (Harddisk/RAM)</option>
                        </optgroup>
                        
                        <optgroup label="ซอฟต์แวร์ (Software)">
                          <option value="เครื่องทำงานช้า">🐢 เครื่องทำงานช้า / อืด (Slow)</option>
                          <option value="โปรแกรมค้าง/Error">❌ โปรแกรมค้าง / ใช้งานไม่ได้ (Crash)</option>
                          <option value="เข้า Windows ไม่ได้">🪟 เข้า Windows ไม่ได้ (OS Error)</option>
                          <option value="ไวรัส/มัลแวร์">🦠 ติดไวรัส / มัลแวร์ (Virus/Malware)</option>
                        </optgroup>
                        
                        <optgroup label="เครือข่าย (Network)">
                          <option value="อินเทอร์เน็ตใช้งานไม่ได้">🌐 อินเทอร์เน็ตใช้งานไม่ได้ (No Internet)</option>
                          <option value="เชื่อมต่อ Wi-Fi ไม่ได้">📶 เชื่อมต่อ Wi-Fi ไม่ได้ (No Wi-Fi)</option>
                          <option value="เข้าเว็บไซต์/ระบบไม่ได้">🔗 เข้าเว็บไซต์ / ระบบงานไม่ได้</option>
                          <option value="แชร์ไฟล์ไม่ได้">📂 แชร์ไฟล์ / Drive กลางไม่ได้</option>
                        </optgroup>
                        
                        <optgroup label="อุปกรณ์ต่อพ่วง (Peripherals)">
                          <option value="ปริ้นเตอร์/หมึก">🖨️ ปริ้นไม่ออก / กระดาษติด / หมึกหมด</option>
                          <option value="เมาส์/คีย์บอร์ด">🖱️ เมาส์ / คีย์บอร์ด ใช้งานไม่ได้</option>
                          <option value="เสียง/ไมโครโฟน">🔊 เสียงไม่ออก / ไมค์ไม่ดัง</option>
                        </optgroup>
                        
                        <optgroup label="บัญชีผู้ใช้ (Account)">
                          <option value="ลืมรหัสผ่าน">🔑 ลืมรหัสผ่าน (Forgot Password)</option>
                          <option value="ล็อกอินไม่ได้">🔒 บัญชีถูกล็อก / เข้าไม่ได้</option>
                        </optgroup>
                        
                        <option value="อื่นๆ">📝 อื่นๆ (โปรดระบุในรายละเอียด)</option>
                      </select>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-bold mb-1 text-gray-800">วันที่แจ้ง <span class="text-gray-400 font-normal text-xs">(ค่าปกติ: วันนี้)</span></label>
                        <input type="date" name="customDate" id="customDate" class="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50 outline-none transition-all text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-bold mb-1 text-gray-800">เวลา <span class="text-gray-400 font-normal text-xs">(ค่าปกติ: ปัจจุบัน)</span></label>
                        <input type="time" name="customTime" id="customTime" class="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50 outline-none transition-all text-sm">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-bold mb-1 text-gray-800">รายละเอียดเพิ่มเติม <span class="text-gray-400 font-normal text-xs">(ไม่บังคับ)</span></label>
                    <textarea name="issue" rows="4" class="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50 outline-none transition-all resize-none text-sm" 
                              placeholder="ระบุอาการอย่างละเอียดช่วยให้การซ่อมรวดเร็วขึ้น..."></textarea>
                </div>
            </div>
          </div>

          <div class="border-t border-gray-100 pt-4">
              <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2"><svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> ข้อมูลผู้แจ้งซ่อม</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div class="flex items-end gap-4">
                    <div class="flex-1">
                        <label class="block text-sm font-bold mb-1">หน่วยงาน <span class="text-red-500">*</span></label>
                        <input type="text" name="division" id="inputDivision" class="input-line" placeholder="ระบุหน่วยงาน" required>
                    </div>
                    <div class="w-24">
                        <label class="block text-sm font-bold mb-1">ชั้น <span class="text-red-500">*</span></label>
                        <select name="floor" class="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-200 outline-none bg-white text-center cursor-pointer text-sm" required>
                            <option value="FG">FG</option>
                            <option value="F1">F1</option>
                            <option value="F2">F2</option>
                            <option value="F3">F3</option>
                            <option value="F4">F4</option>
                            <option value="F5">F5</option>
                            <option value="F6">F6</option>
                            <option value="F7">F7</option>
                            <option value="F8">F8</option>
                            <option value="F9">F9</option>
                            <option value="F10">F10</option>
                        </select>
                    </div>
                </div>

                <div class="flex items-end gap-4">
                    <div class="flex-1">
                        <label class="block text-sm font-bold mb-1">เบอร์ติดต่อ <span class="text-red-500">*</span></label>
                        <input type="tel" name="contact" class="input-line" placeholder="เบอร์ภายใน" required>
                    </div>
                    <div class="flex-1">
                        <label class="block text-sm font-bold mb-1">ผู้แจ้ง</label>
                        <input type="text" name="name" id="inputName" class="input-line" placeholder="ชื่อผู้แจ้ง">
                    </div>
                </div>
              </div>
          </div>

          <div class="pt-4 md:flex md:justify-end">
            <button type="button" onclick="submitRepair()" id="btnSubmit" class="w-full md:w-auto md:px-10 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-3 rounded-xl transition shadow-lg hover:shadow-orange-200/50 flex justify-center items-center gap-2 transform active:scale-95">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              <span>ยืนยันการแจ้งซ่อม</span>
            </button>
          </div>
          <div id="formStatus"></div>
        </form>
      </div>

      <!-- 3. DASHBOARD SECTION -->
      <div id="dashboardSection" class="hidden fade-in space-y-8 max-w-5xl mx-auto">
         <div class="flex items-center justify-between pb-2 border-b border-gray-100 mb-4">
          <div class="flex items-center gap-3">
            <div class="bg-orange-100 p-2 rounded-lg text-orange-500">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
            <h2 class="text-xl font-bold text-gray-800">ภาพรวมงานซ่อม</h2>
          </div>
          <button onclick="exportDashboardReport()" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg font-bold flex items-center gap-2 shadow-sm transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Export รายงาน
          </button>
        </div>

        <!-- Asset Search Section (Moved to Top) -->
        <div class="bg-gray-50 rounded-2xl p-6 border border-gray-100">
          <h3 class="font-semibold text-gray-700 mb-4 flex items-center gap-2 text-lg">
            <svg class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            ตรวจสอบประวัติครุภัณฑ์
          </h3>
          <div class="flex gap-2 mb-6">
            <input type="text" id="searchAssetCode" class="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all" placeholder="กรอกรหัสครุภัณฑ์เพื่อตรวจสอบประวัติ...">
            <button onclick="searchAssetHistory()" class="bg-gray-800 text-white px-8 py-3 rounded-xl hover:bg-gray-900 transition shadow-lg hover:shadow-xl font-bold">ค้นหา</button>
          </div>
          
          <div id="assetSearchResult" class="hidden mt-4 bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100 shadow-sm">
          <h4 class="font-bold text-sm text-orange-800 mb-3 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            ประวัติการซ่อม: <span id="resAssetCode" class="text-orange-600">-</span>
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div class="p-3 bg-white rounded-lg border border-orange-100 flex justify-between items-center">
              <span class="text-gray-500 text-xs">ทั้งหมด</span>
              <span id="resTotal" class="font-bold text-xl text-gray-800">0</span>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
              <span class="text-gray-500 text-xs">7 วัน</span>
              <span id="res7Days" class="font-bold text-base text-gray-800">0</span>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
              <span class="text-gray-500 text-xs">1 เดือน</span>
              <span id="res30Days" class="font-bold text-base text-gray-800">0</span>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
              <span class="text-gray-500 text-xs">1 ปี</span>
              <span id="res365Days" class="font-bold text-base text-gray-800">0</span>
            </div>
          </div>
        </div>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div onclick="loadAdminJobs()" class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition text-center group cursor-pointer hover:bg-orange-50/50">
             <div class="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
             <div class="text-2xl font-bold text-gray-800 mb-1" id="statPending">-</div>
             <div class="text-xs font-medium text-gray-500">รอรับเรื่อง</div>
          </div>
          
          <div onclick="loadMyJobs()" class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition text-center group cursor-pointer hover:bg-blue-50/50">
             <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg></div>
             <div class="text-2xl font-bold text-gray-800 mb-1" id="statInProgress">-</div>
             <div class="text-xs font-medium text-gray-500">กำลังซ่อม</div>
          </div>

          <div onclick="loadCompletedJobs()" class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition text-center group cursor-pointer hover:bg-emerald-50/50">
             <div class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
             <div class="text-2xl font-bold text-gray-800 mb-1" id="statSuccess">-</div>
             <div class="text-xs font-medium text-gray-500">สำเร็จแล้ว</div>
          </div>
          
           <div onclick="loadTechnicianStats()" class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition text-center group cursor-pointer hover:bg-purple-50/50">
             <div class="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg></div>
             <div class="text-2xl font-bold text-gray-800 mb-1" id="statTechnicians">-</div>
             <div class="text-xs font-medium text-gray-500">ช่างผู้รับงาน</div>
          </div>
        </div>



        <!-- NEW CHART SECTION -->
        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                    สถิติการแจ้งซ่อม
                </h3>
                <select id="chartFilter" onchange="updateChartFilter()" class="border border-gray-200 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-200 text-gray-600 bg-gray-50">
                    <option value="today">วันนี้</option>
                    <option value="week" selected>สัปดาห์นี้</option>
                    <option value="month">เดือนนี้</option>
                    <option value="year">ปีนี้</option>
                </select>
            </div>
            <div class="relative h-36 md:h-44 w-full">
                <canvas id="repairStatsChart"></canvas>
            </div>
        </div>

        <!-- Asset Search -->

      </div>

      <!-- CHATBOT SECTION -->
      <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <div id="chatWindow" class="hidden w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-orange-100 overflow-hidden mb-4 fade-in transform origin-bottom-right transition-all">
          <div class="bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white flex justify-between items-center">
            <div class="flex items-center gap-2">
              <div class="bg-white/20 p-1.5 rounded-full"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg></div>
              <div><h3 class="font-bold text-sm">ผู้ช่วย IT อัจฉริยะ</h3><p class="text-[10px] text-orange-100 opacity-90">Powered by Gemini AI</p></div>
            </div>
            <button onclick="toggleChat()" class="text-white/80 hover:text-white transition"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <div class="h-80 bg-gray-50 p-4 overflow-y-auto" id="chatMessages">
             <div class="flex items-start gap-2 mb-3"><div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-500 text-xs font-bold">IT</div><div class="bg-white border border-gray-100 text-gray-700 text-sm px-4 py-2 rounded-2xl rounded-tl-none shadow-sm max-w-[85%]">สวัสดีครับ! มีปัญหาด้านไอทีสอบถามได้เลยครับ 😊</div></div>
          </div>
          <div class="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input type="text" id="chatInput" placeholder="พิมพ์ข้อความ..." class="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-orange-400 transition-all" onkeydown="if(event.key === 'Enter') sendMessage()">
            <button onclick="sendMessage()" class="w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-md transition transform active:scale-95"><svg class="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg></button>
          </div>
        </div>
        
        <button onclick="toggleChat()" class="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 group relative">
          <span class="absolute right-16 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none shadow-sm flex items-center">ปรึกษา AI Chatbot<span class="absolute -right-1 w-2 h-2 bg-gray-800 transform rotate-45"></span></span>
          <svg class="w-8 h-8 group-hover:animate-bounce transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8.01" y2="16" /><line x1="16" y1="16" x2="16.01" y2="16" /></svg>
          <span class="absolute top-1 right-1 flex h-3 w-3"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
        </button>
      </div>

      <!-- ADMIN JOB MODAL -->
      <div id="adminJobModal" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm hidden z-40 flex items-center justify-center fade-in">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 border border-gray-100 overflow-hidden flex flex-col max-h-[80vh]">
          <div class="bg-purple-100 p-4 border-b border-purple-200 flex justify-between items-center">
            <h3 id="adminJobModalTitle" class="font-bold text-purple-800 flex items-center gap-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>งานแจ้งซ่อมที่รอรับเรื่อง</h3>
            <button onclick="closeAdminModal()" class="text-purple-400 hover:text-purple-600 transition"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <div id="adminJobList" class="p-4 overflow-y-auto space-y-3 bg-gray-50 flex-1"></div>
        </div>
      </div>

      <!-- JOB DETAIL MODAL -->
      <div id="jobDetailModal" class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm hidden z-[60] flex items-center justify-center fade-in">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-gray-200">
          <div class="bg-orange-50 p-4 border-b border-orange-100 flex justify-between items-center">
            <h3 class="font-bold text-orange-800 text-lg">รายละเอียดงาน</h3>
            <button onclick="closeJobDetail()" class="text-gray-400 hover:text-gray-600"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <div class="p-5 text-sm text-gray-600 space-y-3">
            <div class="flex justify-between"><span class="font-bold text-gray-800">Ticket ID:</span><span id="detTicket" class="font-mono text-orange-600"></span></div>
            <div class="flex justify-between"><span class="font-bold text-gray-800">วันที่แจ้ง:</span><span id="detTime"></span></div>
            <hr class="border-gray-100">
            <div><p class="font-bold text-gray-800 mb-1">อุปกรณ์:</p><p id="detAssetInfo" class="pl-2 border-l-2 border-orange-200"></p></div>
            <hr class="border-gray-100">
            <div><p class="font-bold text-gray-800 mb-1">ผู้แจ้ง:</p><p>คุณ <span id="detReporter"></span></p><p><span id="detDiv"></span> ชั้น <span id="detFloor"></span></p><p class="mt-1 flex items-center gap-1 text-blue-600"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg><a href="#" id="detContactLink" class="hover:underline"><span id="detContact"></span></a></p></div>
            <hr class="border-gray-100">
            <div><p class="font-bold text-gray-800 mb-1">อาการเสีย:</p><div id="detIssue" class="bg-gray-50 p-2 rounded-lg border border-gray-100 text-gray-700"></div></div>
            <div class="pt-4 flex gap-2">
              <button id="btnAcceptJobDetail" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-bold shadow transition">รับงานนี้</button>
              <button id="btnDeleteJob" onclick="deleteCurrentJob()" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold shadow transition flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                ลบ
              </button>
              <button onclick="closeJobDetail()" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold transition">ปิด</button>
            </div>
          </div>
        </div>
      </div>

      <!-- GENERIC ALERT MODAL -->
      <div id="customModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] hidden z-[70] flex items-center justify-center fade-in duration-200">
         <div class="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 border border-white/50 relative transform transition-all scale-100 ring-1 ring-black/5">
            <!-- Close Button -->
            <button onclick="closeModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 rounded-full p-1 hover:bg-gray-100">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <div class="text-center pt-2">
               <div id="modalIconBg" class="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-50 mb-6 shadow-sm ring-4 ring-white">
                  <svg id="modalIcon" class="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
               </div>
               <h3 id="modalTitle" class="text-2xl font-bold text-gray-800 mb-2 tracking-tight">สำเร็จ!</h3>
               <p id="modalMessage" class="text-base text-gray-500 mb-8 leading-relaxed px-2">ดำเนินการเรียบร้อยแล้ว</p>
               <button onclick="closeModal()" class="w-full px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white text-base font-semibold rounded-2xl shadow-lg shadow-gray-200 transition-all transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900">
                  ตกลง / เข้าใจแล้ว
               </button>
            </div>
         </div>
      </div>
      
      <!-- CONFIRMATION MODAL -->
      <div id="confirmModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] hidden z-[80] flex items-center justify-center fade-in duration-200">
         <div class="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 border border-white/50 relative transform transition-all scale-100 ring-1 ring-black/5">
            <div class="text-center pt-2">
               <div class="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-50 mb-6 shadow-sm ring-4 ring-white">
                  <svg class="h-10 w-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               </div>
               <h3 id="confirmModalTitle" class="text-2xl font-bold text-gray-800 mb-2 tracking-tight">ยืนยันการดำเนินการ</h3>
               <p id="confirmModalMessage" class="text-base text-gray-500 mb-8 leading-relaxed px-2">คุณแน่ใจหรือไม่ที่จะทำรายการนี้?</p>
               <div class="flex gap-3">
                   <button onclick="closeConfirmModal()" class="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-base font-semibold rounded-2xl transition-colors focus:outline-none">
                      ยกเลิก
                   </button>
                   <button id="btnConfirmAction" class="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-base font-semibold rounded-2xl shadow-lg shadow-blue-200 transition-all transform active:scale-95 focus:outline-none">
                      ยืนยัน
                   </button>
               </div>
            </div>
         </div>
      </div>

      <!-- ADD TECHNICIAN MODAL -->
      <div id="addTechnicianModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] hidden z-[80] flex items-center justify-center fade-in duration-200">
         <div class="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 border border-white/50 relative transform transition-all scale-100 ring-1 ring-black/5">
            <!-- Close Button -->
            <button onclick="closeAddTechnicianModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 rounded-full p-1 hover:bg-gray-100">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <div class="text-center pt-2">
               <!-- Icon -->
               <div class="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 mb-6 shadow-sm ring-4 ring-white">
                  <svg class="h-10 w-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
               </div>
               
               <h3 class="text-2xl font-bold text-gray-800 mb-2 tracking-tight">เพิ่มช่างผู้รับงาน</h3>
               <p class="text-sm text-gray-500 mb-6">กรุณากรอกชื่อ-นามสกุล ของช่างที่ต้องการเพิ่ม</p>
               
               <!-- Form -->
               <div class="mb-6">
                  <label class="block text-left text-sm font-semibold text-gray-700 mb-2">ชื่อ-นามสกุล <span class="text-red-500">*</span></label>
                  <input 
                     type="text" 
                     id="technicianNameInput" 
                     placeholder="เช่น นายสมชาย ใจดี"
                     class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 outline-none bg-gray-50 hover:bg-white transition-all text-gray-800"
                     onkeydown="if(event.key === 'Enter') submitAddTechnician()"
                  >
                  <p id="technicianNameError" class="hidden text-red-500 text-xs mt-2 text-left">กรุณากรอกชื่อ-นามสกุล</p>
               </div>
               
               <!-- Buttons -->
               <div class="flex gap-3">
                  <button onclick="closeAddTechnicianModal()" class="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-base font-semibold rounded-2xl transition-all transform active:scale-95 focus:outline-none">
                     ยกเลิก
                  </button>
                  <button onclick="submitAddTechnician()" class="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-base font-semibold rounded-2xl shadow-lg shadow-purple-200 transition-all transform active:scale-95 focus:outline-none">
                     เพิ่มช่าง
                  </button>
               </div>
            </div>
         </div>
      </div>

    </div>
  </div>

  <!-- เรียกใช้ไฟล์ JavaScript -->
  <script src="assets/js/app.js?v=<?php echo time(); ?>"></script>
</body>
</html>
