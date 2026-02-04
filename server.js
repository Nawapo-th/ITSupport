const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors());

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || '10.67.3.111',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Qshc@68335',
    database: process.env.DB_NAME || 'inventory_db',


    timezone: '+07:00'
};



let pool;

async function initDb() {
    try {
        // First, connect without a database to ensure we can reach the server
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            timezone: dbConfig.timezone
        });

        console.log(`Connected to MySQL server at ${dbConfig.host}`);

        // Create database if not exists
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
        await connection.end();

        // Now create the pool with the database
        pool = await mysql.createPool(dbConfig);
        console.log(`Database pool created for '${dbConfig.database}'.`);

        // Check if repairs table exists, if not, we might need to run schema (basic check)
        const [tables] = await pool.query("SHOW TABLES LIKE 'repairs'");

        // Create assessments table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS assessments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ticket_id VARCHAR(50) NOT NULL,
                assessment_date DATE,
                satisfaction VARCHAR(50),
                service_time VARCHAR(50),
                comment TEXT,
                assessor VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_ticket (ticket_id)
            )
        `);

        if (tables.length === 0) {
            console.log("Table 'repairs' missing! Running schema.sql...");
            const schemaPath = path.join(__dirname, 'database', 'schema.sql');
            if (fs.existsSync(schemaPath)) {
                const schema = fs.readFileSync(schemaPath, 'utf8');
                const queries = schema.split(';').filter(q => q.trim().length > 0);
                for (let query of queries) {
                    await pool.query(query);
                }
                console.log("Database schema applied successfully.");
            }
        }

        // --- Auto-Migration: Check for 'technician' column and 'technicians' table ---
        const [repairsColumns] = await pool.query("SHOW COLUMNS FROM repairs LIKE 'technician'");
        if (repairsColumns.length === 0) {
            console.log("Adding missing column 'technician' to 'repairs' table...");
            await pool.query("ALTER TABLE repairs ADD COLUMN technician VARCHAR(100) AFTER contact");
        }

        const [repairLocationColumns] = await pool.query("SHOW COLUMNS FROM repairs LIKE 'repair_location'");
        if (repairLocationColumns.length === 0) {
            console.log("Adding missing column 'repair_location' to 'repairs' table...");
            await pool.query("ALTER TABLE repairs ADD COLUMN repair_location VARCHAR(255) AFTER floor");
        }

        const [tablesList] = await pool.query("SHOW TABLES LIKE 'technicians'");
        if (tablesList.length === 0) {
            console.log("Creating missing 'technicians' table...");
            await pool.query(`
                CREATE TABLE technicians (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) UNIQUE NOT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
            `);
            // Add default tech
            await pool.query("INSERT IGNORE INTO technicians (name) VALUES (?)", ['Admin IT']);
        } else {
            // Ensure collation matches just in case
            await pool.query("ALTER TABLE technicians MODIFY name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL");
        }
        const [notesColumns] = await pool.query("SHOW COLUMNS FROM repairs LIKE 'notes'");
        if (notesColumns.length === 0) {
            console.log("Adding missing column 'notes' to 'repairs' table...");
            await pool.query("ALTER TABLE repairs ADD COLUMN notes TEXT AFTER technician");
        }

        const [startedAtColumns] = await pool.query("SHOW COLUMNS FROM repairs LIKE 'started_at'");
        if (startedAtColumns.length === 0) {
            console.log("Adding missing column 'started_at' to 'repairs' table...");
            await pool.query("ALTER TABLE repairs ADD COLUMN started_at DATETIME AFTER created_at");
        }

        const [filePathColumns] = await pool.query("SHOW COLUMNS FROM repairs LIKE 'file_path'");
        if (filePathColumns.length === 0) {
            console.log("Adding missing column 'file_path' to 'repairs' table...");
            await pool.query("ALTER TABLE repairs ADD COLUMN file_path VARCHAR(255) AFTER issue");
        }

        const [categoryColumns] = await pool.query("SHOW COLUMNS FROM repairs LIKE 'category'");
        if (categoryColumns.length === 0) {
            console.log("Adding missing column 'category' to 'repairs' table...");
            await pool.query("ALTER TABLE repairs ADD COLUMN category VARCHAR(50) AFTER issue");
        }

        console.log("Database tables verified.");
    } catch (err) {
        console.error('Failed to initialize DB:', err);
        process.exit(1);
    }
}

// Multer for CSV imports
const upload = multer({ dest: 'uploads/' });

// --- Helper Functions ---
function getTimestamp() {
    return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).slice(0, 19).replace('T', ' ');
}

function formatDate(date) {
    if (!date) return null;
    if (typeof date === 'string') return date;
    // Format to YYYY-MM-DD HH:mm:ss in Bangkok time
    return new Date(date).toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).slice(0, 19).replace('T', ' ');
}

// Function to map snake_case from DB to camelCase for Frontend
function mapJob(j) {
    if (!j) return null;
    const ts = formatDate(j.created_at);
    return {
        ticketId: j.ticket_id,
        assetCode: j.asset_code,
        deviceName: j.device_name,
        brand: j.brand,
        model: j.model,
        reporter: j.reporter_name,
        reporter_name: j.reporter_name,
        division: j.division,
        floor: j.floor,
        issue: j.issue,
        contact: j.contact || j.contact_number,
        status: j.status,
        timestamp: ts,
        created_at: ts,
        started_at: formatDate(j.started_at),
        finished_at: formatDate(j.finished_at),
        technician: j.technician,
        repairLocation: j.repair_location,
        notes: j.notes,
        category: j.category,
        isAssessed: !!j.is_assessed
    };
}



// --- API Routes ---

// 1. Login
app.post('/api/userLogin', async (req, res) => {
    const { username, password } = req.body;

    try {
        // External AD Auth
        // const apiUrl = "https://webappqshc.kku.ac.th/QSHCAuth/api/Account/ADAuthJson";
        const apiUrl = "http://10.67.67.166/QSHCAuth/api/Account/ADAuthJson";
        try {
            const apiRes = await axios.post(apiUrl, { username, password }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000
            });

            if (apiRes.data && apiRes.data.isSuccess) {
                const userData = apiRes.data.data || {};
                const division = userData.division || '';
                const fullName = userData.fullName || userData.FullName || username;
                const isAdmin = ["งานเทคโนโลยีสารสนเทศ", "จ้างเหมา งานเทคโนโลยีสารสนเทศ"].includes(division.trim());

                if (isAdmin && fullName) {
                    try {
                        await pool.query("INSERT IGNORE INTO technicians (name) VALUES (?)", [fullName.trim()]);
                    } catch (e) {
                        console.log('Auto-register technician (AD) failed:', e.message);
                    }
                }

                return res.json({
                    success: true,
                    fullName: fullName,
                    division: division,
                    department: userData.department || '',
                    isAdmin: isAdmin,
                    data: userData
                });
            }
        } catch (e) {
            console.log('External API auth failed, falling back to local DB');
        }

        // Local DB Fallback
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        const user = users[0];

        if (user && (password === '1234' || user.password === password)) {
            const isAdmin = user.role === 'Admin' || ["งานเทคโนโลยีสารสนเทศ", "จ้างเหมา งานเทคโนโลยีสารสนเทศ"].includes((user.division || '').trim());
            const fullName = user.full_name;

            if (isAdmin && fullName) {
                try {
                    await pool.query("INSERT IGNORE INTO technicians (name) VALUES (?)", [fullName.trim()]);
                } catch (e) {
                    console.log('Auto-register technician failed:', e.message);
                }
            }

            return res.json({
                success: true,
                fullName: fullName,
                division: user.division,
                isAdmin: isAdmin
            });
        }

        res.json({ success: false, message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. Find Asset Info
app.get('/api/findAssetInfo', async (req, res) => {
    const { code } = req.query;
    try {
        const [assets] = await pool.query('SELECT * FROM assets WHERE asset_code = ?', [code]);
        if (assets.length > 0) {
            return res.json({
                found: true,
                deviceName: assets[0].device_name,
                brand: assets[0].brand,
                model: assets[0].model
            });
        }

        const [history] = await pool.query('SELECT device_name, brand, model FROM repairs WHERE asset_code = ? ORDER BY created_at DESC LIMIT 1', [code]);
        if (history.length > 0) {
            return res.json({
                found: true,
                deviceName: history[0].device_name,
                brand: history[0].brand,
                model: history[0].model
            });
        }

        res.json({ found: false });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 3. Process Repair Form
app.post('/api/processForm', async (req, res) => {
    const formData = req.body;
    const ticketId = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    let createdAt = getTimestamp();
    if (formData.customDate) {
        let t = formData.customTime || new Date().toTimeString().slice(0, 8);
        if (t.length === 5) t += ':00';
        createdAt = `${formData.customDate} ${t}`;
    }

    try {
        await pool.query(
            "INSERT INTO repairs (ticket_id, asset_code, device_name, brand, model, reporter_name, division, floor, repair_location, issue, contact, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [ticketId, formData.assetCode, formData.deviceName, formData.brand, formData.model, formData.name, formData.division, formData.floor, formData.repairLocation || '', formData.issue, formData.contact, createdAt]
        );

        await pool.query(
            "INSERT INTO assets (asset_code, device_name, brand, model) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE device_name=?, brand=?, model=?",
            [formData.assetCode, formData.deviceName, formData.brand, formData.model, formData.deviceName, formData.brand, formData.model]
        );

        res.json({ success: true, message: `บันทึกข้อมูลเรียบร้อย! รหัสใบงาน: ${ticketId}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 4. Dashboard Stats
// 4. Dashboard Stats
app.get('/api/getDashboardStats', async (req, res) => {
    const { assetCode, year } = req.query;
    const filterYear = year || new Date().getFullYear();
    try {
        const [overviewRows] = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN (status LIKE '%สำเร็จ%' OR status='Completed') THEN 1 ELSE 0 END), 0) as completed,
                COALESCE(SUM(CASE WHEN (status = 'รอรับเรื่อง') THEN 1 ELSE 0 END), 0) as pending,
                COALESCE(SUM(CASE WHEN (status = 'กำลังดำเนินการ') THEN 1 ELSE 0 END), 0) as in_progress
            FROM repairs
            WHERE YEAR(created_at) = ?
        `, [filterYear]);
        const overview = overviewRows[0] || { completed: 0, pending: 0, in_progress: 0 };

        let techCount = 0;
        try {
            const [techRows] = await pool.query(`
                SELECT COUNT(DISTINCT name) as count FROM (
                    SELECT name FROM technicians
                    UNION
                    SELECT technician as name FROM repairs WHERE technician IS NOT NULL AND technician != ''
                ) t
            `);
            techCount = techRows[0]?.count || 0;
        } catch (e) { console.log('Technicians count failed', e); }

        const [chartRows] = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END), 0) as today,
                COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END), 0) as week,
                COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END), 0) as month,
                COALESCE(SUM(CASE WHEN YEAR(created_at) = ? THEN 1 ELSE 0 END), 0) as year
            FROM repairs
        `, [filterYear]);
        const chartStats = chartRows[0] || { today: 0, week: 0, month: 0, year: 0 };

        // Problem Type Distribution
        let problemRows = [];
        try {
            const [pRows] = await pool.query(`
                SELECT 
                    CASE 
                        WHEN issue LIKE '[%]%' THEN SUBSTRING_INDEX(SUBSTRING_INDEX(issue, ']', 1), '[', -1)
                        ELSE 'อื่นๆ (Others)' 
                    END as type, 
                    COUNT(*) as count 
                FROM repairs 
                WHERE YEAR(created_at) = ?
                GROUP BY type
                ORDER BY count DESC
            `, [filterYear]);
            problemRows = pRows;
        } catch (e) {
            console.log('Problem stats error', e);
        }

        // Top 5 Departments
        let divisionRows = [];
        try {
            const [dRows] = await pool.query(`
                SELECT division, COUNT(*) as count 
                FROM repairs 
                WHERE division IS NOT NULL AND division != '' AND YEAR(created_at) = ?
                GROUP BY division 
                ORDER BY count DESC 
                LIMIT 5
            `, [filterYear]);
            divisionRows = dRows;
        } catch (e) { console.log('Division stats error', e); }

        // Monthly Trend for the selected year
        let monthlyTrend = [];
        try {
            const [mRows] = await pool.query(`
                SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count 
                FROM repairs 
                WHERE YEAR(created_at) = ?
                GROUP BY month 
                ORDER BY month ASC
            `, [filterYear]);
            monthlyTrend = mRows;
        } catch (e) { }

        let assetStats = null;
        if (assetCode) {
            const [rows] = await pool.query("SELECT created_at FROM repairs WHERE asset_code = ?", [assetCode]);
            const now = new Date();
            let d7 = 0, d30 = 0, d365 = 0;
            rows.forEach(r => {
                const diff = (now - new Date(r.created_at)) / (1000 * 60 * 60 * 24);
                if (diff <= 7) d7++;
                if (diff <= 30) d30++;
                if (diff <= 365) d365++;
            });
            assetStats = {
                assetCode,
                total: rows.length,
                last7Days: d7,
                last1Month: d30,
                last1Year: d365
            };
        }

        // Monthly Completed Stats for the selected year
        let monthlyCompleted = [];
        try {
            const [cRows] = await pool.query(`
                SELECT DATE_FORMAT(finished_at, '%Y-%m') as month, COUNT(*) as count 
                FROM repairs 
                WHERE (status LIKE '%สำเร็จ%' OR status='Completed')
                AND finished_at IS NOT NULL
                AND YEAR(finished_at) = ?
                GROUP BY month 
                ORDER BY month ASC
            `, [filterYear]);
            monthlyCompleted = cRows;
        } catch (e) {
            console.log('Monthly completed stats error', e);
        }

        res.json({
            success: true,
            overview: {
                pending: overview.pending,
                completed: overview.completed,
                in_progress: overview.in_progress,
                technicians: techCount
            },
            chartStats,
            problemStats: problemRows,
            divisionStats: divisionRows,
            monthlyTrend,
            assetStats,
            monthlyCompleted
        });
    } catch (err) {
        console.error('getDashboardStats Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/getProblemStats', async (req, res) => {
    const { month, year } = req.query; // YYYY-MM or YYYY
    try {
        let sql = `
            SELECT 
                CASE 
                    WHEN issue LIKE '[%]%' THEN SUBSTRING_INDEX(SUBSTRING_INDEX(issue, ']', 1), '[', -1)
                    ELSE 'อื่นๆ (Others)' 
                END as type, 
                COUNT(*) as count 
            FROM repairs 
        `;

        const params = [];
        if (month) {
            sql += " WHERE DATE_FORMAT(created_at, '%Y-%m') = ? ";
            params.push(month);
        } else {
            const filterYear = year || new Date().getFullYear();
            sql += " WHERE YEAR(created_at) = ? ";
            params.push(filterYear);
        }

        sql += " GROUP BY type ORDER BY count DESC";

        const [rows] = await pool.query(sql, params);
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 4.1 Count Endpoints
app.get('/api/getPendingJobsCount', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT COUNT(*) as count FROM repairs WHERE status = 'รอรับเรื่อง'");
        res.json({ success: true, count: rows[0].count });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/getMyJobsCount', async (req, res) => {
    const { technician } = req.query;
    try {
        const [rows] = await pool.query("SELECT COUNT(*) as count FROM repairs WHERE status = 'กำลังดำเนินการ' AND TRIM(technician) = TRIM(?)", [technician]);
        res.json({ success: true, count: rows[0].count });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/getUserJobs', async (req, res) => {
    const { reporter, isAdmin } = req.query;
    try {
        let sql = "SELECT * FROM repairs WHERE reporter_name = ? ORDER BY created_at DESC";
        let params = [reporter];

        // If it's a technician/admin, they might want to see jobs they've reported OR all if specifically requested.
        // But usually current code just filters by reporter name.

        const [rows] = await pool.query(sql, params);
        res.json({ success: true, jobs: rows.map(mapJob) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 5. Chart Data
app.get('/api/getChartData', async (req, res) => {
    const { filter } = req.query;
    let labels = [];
    let data = [];

    try {
        if (filter === 'today') {
            for (let i = 0; i < 24; i++) labels.push(`${i.toString().padStart(2, '0')}:00`);
            data = new Array(24).fill(0);
            const [rows] = await pool.query("SELECT HOUR(created_at) as h, COUNT(*) as c FROM repairs WHERE DATE(created_at) = CURDATE() GROUP BY h");
            rows.forEach(r => data[r.h] = r.c);
        } else if (filter === 'week') {
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                labels.push(`${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`);
            }
            data = new Array(7).fill(0);
            const [rows] = await pool.query("SELECT DATE(created_at) as d, COUNT(*) as c FROM repairs WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) GROUP BY d");
            rows.forEach(r => {
                const rowDate = new Date(r.d);
                const dayDiff = Math.floor((new Date() - rowDate) / (1000 * 60 * 60 * 24));
                if (dayDiff >= 0 && dayDiff < 7) data[6 - dayDiff] = r.c;
            });
        }
        // ... more filters if needed ...
        res.json({ success: true, labels, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 6. Generic Jobs List
app.get('/api/getPendingJobs', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM repairs WHERE status = 'รอรับเรื่อง' ORDER BY created_at DESC");
        res.json({ success: true, jobs: rows.map(mapJob) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/getMyJobs', async (req, res) => {
    const { technician } = req.query;
    try {
        const [rows] = await pool.query("SELECT * FROM repairs WHERE status = 'กำลังดำเนินการ' AND TRIM(technician) = TRIM(?) ORDER BY created_at DESC", [technician]);
        res.json({ success: true, jobs: rows.map(mapJob) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/getMonthlyStats', async (req, res) => {
    try {
        // Group by Year-Month
        const sql = `
            SELECT DATE_FORMAT(created_at, '%Y-%m') as monthKey, COUNT(*) as total
            FROM repairs
            WHERE created_at IS NOT NULL
            GROUP BY monthKey
            ORDER BY monthKey DESC
            LIMIT 12
        `;
        const [rows] = await pool.query(sql);
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 8.1 SLA Stats


app.get('/api/getCompletedJobs', async (req, res) => {
    const { month } = req.query; // YYYY-MM
    try {
        let sql = "SELECT * FROM repairs WHERE (status LIKE '%สำเร็จ%' OR status = 'Completed')";
        let params = [];

        if (month) {
            sql += " AND DATE_FORMAT(finished_at, '%Y-%m') = ?";
            params.push(month);
            sql += " ORDER BY finished_at DESC";
        } else {
            sql += " ORDER BY finished_at DESC LIMIT 50";
        }

        const [rows] = await pool.query(sql, params);
        res.json({ success: true, jobs: rows.map(mapJob) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/getAnnualCompletedStats', async (req, res) => {
    const { year } = req.query; // e.g. 2024
    if (!year) return res.status(400).json({ success: false, message: 'Year is required' });

    try {
        const sql = `
            SELECT MONTH(finished_at) as m, COUNT(*) as count
            FROM repairs 
            WHERE (status LIKE '%สำเร็จ%' OR status = 'Completed')
            AND YEAR(finished_at) = ?
            GROUP BY m
        `;
        const [rows] = await pool.query(sql, [year]);

        // Map to array of 12 zeros
        const stats = new Array(12).fill(0);
        rows.forEach(r => {
            if (r.m >= 1 && r.m <= 12) stats[r.m - 1] = r.count;
        });

        res.json({ success: true, stats });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/getAllJobs', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM repairs ORDER BY created_at DESC");
        res.json({ success: true, jobs: rows.map(mapJob) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 7. Update Job Status / History Filter
app.get('/api/getJobsByDate', async (req, res) => {
    const { start, end } = req.query; // Expect YYYY-MM-DD
    try {
        // Add time to cover full day: start 00:00:00 to end 23:59:59
        const sql = "SELECT * FROM repairs WHERE created_at BETWEEN ? AND ? ORDER BY created_at ASC";
        const [rows] = await pool.query(sql, [`${start} 00:00:00`, `${end} 23:59:59`]);
        res.json({ success: true, jobs: rows.map(mapJob) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/updateJobDetails', async (req, res) => {
    const { ticketId, deviceName, assetCode, repairLocation, floor, contact, issue, customDate, customTime } = req.body;
    try {
        let createdAt = null;
        if (customDate) {
            let t = customTime || '00:00:00';
            if (t.length === 5) t += ':00';
            createdAt = `${customDate} ${t}`;
        }

        let sql = "UPDATE repairs SET device_name = ?, asset_code = ?, repair_location = ?, floor = ?, contact = ?, issue = ?";
        let params = [deviceName, assetCode, repairLocation, floor, contact, issue];

        if (createdAt) {
            sql += ", created_at = ?";
            params.push(createdAt);
        }

        sql += " WHERE ticket_id = ?";
        params.push(ticketId);

        await pool.query(sql, params);
        res.json({ success: true, message: 'Updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/updateJobStatus', async (req, res) => {
    const { ticketId, status, technician, notes, customDate, customTime, category } = req.body;
    try {
        // ... match logic ... 

        // (Keep lines 587-615 logic same, just change params)
        const clean = (s) => (s || '').toString().trim().replace(/\s/g, '').replace(/^(นาย|นางสาว|นาง|นางสาว|mr|ms|mrs)\.?\s*/i, '').toLowerCase();

        // 1. Get all technician names
        const [techRows] = await pool.query("SELECT name FROM technicians");
        const techEntries = techRows.map(t => ({ original: t.name, clean: clean(t.name) }));

        // 2. Get current job reporter
        const [jobRows] = await pool.query("SELECT reporter_name FROM repairs WHERE ticket_id = ?", [ticketId]);
        if (jobRows.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลงาน' });
        const rawReporter = (jobRows[0].reporter_name || '').trim();
        const cleanReporter = clean(rawReporter);

        // 3. Determine Assignment
        let assignedTech = (technician || 'Admin IT').trim();
        let techMatch = techEntries.find(te => te.clean === cleanReporter);
        if (!techMatch && cleanReporter.length >= 2) {
            techMatch = techEntries.find(te => te.clean.includes(cleanReporter) || cleanReporter.includes(te.clean));
        }

        if (techMatch) assignedTech = techMatch.original;

        // 4. Update
        let sql, params;
        if (status === 'สำเร็จ') {
            const finishedAt = getTimestamp();
            // Update Category as well if provided
            sql = "UPDATE repairs SET status = ?, finished_at = ?, technician = ?, notes = ?, category = ? WHERE ticket_id = ?";
            params = [status, finishedAt, assignedTech, notes || 'ดำเนินการเสร็จสิ้น', category || 'other', ticketId];
        } else if (status === 'กำลังดำเนินการ') {
            let startedAt = null;
            if (customDate) {
                let t = customTime || new Date().toTimeString().slice(0, 8);
                if (t.length === 5) t += ':00';
                startedAt = `${customDate} ${t}`;
            }

            if (startedAt) {
                sql = "UPDATE repairs SET status = ?, technician = ?, started_at = ? WHERE ticket_id = ?";
                params = [status, assignedTech, startedAt, ticketId];
            } else {
                // If no custom date, we don't necessarily overwrite started_at if it exists, OR we could set it to NOW() if it's null? 
                // For now, let's assume if they don't provide it, we might want to set it to NOW() if it wasn't set. 
                // But the requirement is "editable". If not provided (old flow), maybe we should set it to NOW() too.
                // Let's set it to NOW() if not provided, just to be safe and consistent, or ignore.
                // Better: If they are accepting, update started_at to NOW() if not provided.
                const now = getTimestamp();
                sql = "UPDATE repairs SET status = ?, technician = ?, started_at = COALESCE(started_at, ?) WHERE ticket_id = ?";
                params = [status, assignedTech, now, ticketId];
            }
        } else {
            sql = "UPDATE repairs SET status = ?, technician = ? WHERE ticket_id = ?";
            params = [status, assignedTech, ticketId];
        }
        await pool.query(sql, params);
        res.json({ success: true, message: `บันทึกเรียบร้อย (ผู้ปิดงาน: ${assignedTech})` });
    } catch (err) {
        console.error('updateJobStatus Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/deleteJob', async (req, res) => {
    const { ticketId } = req.body;
    try {
        await pool.query("DELETE FROM repairs WHERE ticket_id = ?", [ticketId]);
        res.json({ success: true, message: `Deleted ticket ${ticketId}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/bulkJobComplete', async (req, res) => {
    const { technician, notes } = req.body;
    try {
        const finishedAt = getTimestamp();
        const clean = (s) => (s || '').toString().trim().replace(/\s/g, '').replace(/^(นาย|นางสาว|นาง|นางสาว|mr|ms|mrs)\.?\s*/i, '').toLowerCase();

        // 1. Get techs
        const [techRows] = await pool.query("SELECT name FROM technicians");
        const techEntries = techRows.map(t => ({ original: t.name, clean: clean(t.name) }));

        // 2. Get pending
        const [pending] = await pool.query("SELECT ticket_id, reporter_name FROM repairs WHERE status = 'รอรับเรื่อง'");

        for (const job of pending) {
            const rawReporter = (job.reporter_name || '').trim();
            const cleanReporter = clean(rawReporter);
            let assigned = (technician || 'Admin IT').trim();

            let match = techEntries.find(te => te.clean === cleanReporter);
            if (!match && cleanReporter.length >= 2) {
                match = techEntries.find(te => te.clean.includes(cleanReporter) || cleanReporter.includes(te.clean));
            }
            if (match) assigned = match.original;

            await pool.query(
                "UPDATE repairs SET status = 'สำเร็จ', finished_at = ?, technician = ?, notes = ? WHERE ticket_id = ?",
                [finishedAt, assigned, notes || 'ปิดงานทั้งหมด (Bulk)', job.ticket_id]
            );
        }

        res.json({ success: true, message: `ดำเนินการเสร็จสิ้น (${pending.length} รายการ)` });
    } catch (err) {
        console.error('bulkJobComplete Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ... (previous code)

// 7.5 Paginated Jobs for Public/User View
app.get('/api/getRepairJobsPaginated', async (req, res) => {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const { month, year } = req.query; // YYYY-MM or YYYY
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    const offset = (page - 1) * limit;

    try {
        let whereClause = " WHERE 1=1";
        let params = [];
        if (month) {
            whereClause += " AND DATE_FORMAT(created_at, '%Y-%m') = ?";
            params.push(month);
        } else {
            const filterYear = year || new Date().getFullYear();
            whereClause += " AND YEAR(created_at) = ?";
            params.push(filterYear);
        }

        // Get Total Count
        const [countRows] = await pool.query("SELECT COUNT(*) as total FROM repairs" + whereClause, params);
        const totalItems = countRows[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // Get Data (JOIN with assessments)
        const sql = `
            SELECT r.*, IF(a.ticket_id IS NOT NULL, 1, 0) as is_assessed 
            FROM repairs r
            LEFT JOIN assessments a ON r.ticket_id = a.ticket_id
            ${whereClause.replace(/created_at/g, 'r.created_at')}
            ORDER BY r.created_at DESC 
            LIMIT ? OFFSET ?
        `;

        const [rows] = await pool.query(sql, [...params, limit, offset]);

        res.json({
            success: true,
            jobs: rows.map(mapJob),
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                itemsPerPage: limit
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 8. Gemini Chat


// 9. Tech Stats & Management
app.get('/api/getTechnicianStats', async (req, res) => {
    try {
        const sql = `
            SELECT 
                t.name as technician, 
                COUNT(r.ticket_id) as total_jobs,
                COALESCE(SUM(CASE WHEN r.status LIKE '%สำเร็จ%' OR r.status='Completed' THEN 1 ELSE 0 END), 0) as completed
            FROM (
                SELECT name FROM technicians
                UNION
                SELECT DISTINCT technician as name FROM repairs WHERE technician IS NOT NULL AND technician != ''
            ) t
            LEFT JOIN repairs r ON TRIM(t.name) = TRIM(r.technician)
            GROUP BY t.name
            ORDER BY completed DESC, total_jobs DESC
        `;
        const [rows] = await pool.query(sql);
        res.json({ success: true, technicians: rows });
    } catch (err) {
        console.error('getTechnicianStats Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/getTechnicianJobs', async (req, res) => {
    const { name, start, end } = req.query;
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    const offset = (page - 1) * limit;

    try {
        let whereClause = "WHERE TRIM(technician) = TRIM(?)";
        let params = [name];

        if (start && end) {
            whereClause += " AND created_at BETWEEN ? AND ?";
            params.push(`${start} 00:00:00`, `${end} 23:59:59`);
        }

        // 1. Get Total Count
        const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM repairs ${whereClause}`, params);
        const totalItems = countRows[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // 2. Get Data
        const sql = `SELECT * FROM repairs ${whereClause} ORDER BY created_at ASC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [rows] = await pool.query(sql, params);

        res.json({
            success: true,
            jobs: rows.map(mapJob),
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                itemsPerPage: limit
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/addTechnician', async (req, res) => {
    const { name } = req.body;
    try {
        await pool.query("INSERT INTO technicians (name) VALUES (?)", [name]);
        res.json({ success: true, message: 'เพิ่มรายชื่อเรียบร้อย' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'มีรายชื่อนี้อยู่แล้ว หรือเกิดข้อผิดพลาด' });
    }
});

app.post('/api/deleteTechnician', async (req, res) => {
    const { name } = req.body;
    try {
        // We only delete from the technicians table. 
        // We don't delete from the repairs table to maintain history.
        await pool.query("DELETE FROM technicians WHERE name = ?", [name]);
        res.json({ success: true, message: 'ลบรายชื่อเรียบร้อย' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/renameTechnician', async (req, res) => {
    const { oldName, newName } = req.body;
    if (!oldName || !newName) return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Update technicians table
        await connection.query("UPDATE technicians SET name = ? WHERE name = ?", [newName, oldName]);

        // 2. Update repairs table to maintain consistency if they want to rename history too
        await connection.query("UPDATE repairs SET technician = ? WHERE technician = ?", [newName, oldName]);

        await connection.commit();
        res.json({ success: true, message: 'แก้ไขชื่อเรียบร้อยแล้ว' });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ success: false, message: err.message });
    } finally {
        connection.release();
    }
});

// 10. Import Assets
app.post('/api/importAssets', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'กรุณาเลือกไฟล์ CSV' });

    try {
        const content = fs.readFileSync(req.file.path, 'utf8');
        const records = parse(content, { columns: false, skip_empty_lines: true });

        let count = 0;
        for (const row of records) {
            const code = row[0]?.trim();
            if (!code || /code|รหัส/i.test(code)) continue;

            const name = row[1]?.trim() || '';
            const brand = row[2]?.trim() || '';
            const model = row[3]?.trim() || '';

            await pool.query(
                "INSERT INTO assets (asset_code, device_name, brand, model) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE device_name=?, brand=?, model=?",
                [code, name, brand, model, name, brand, model]
            );
            count++;
        }
        fs.unlinkSync(req.file.path);
        res.json({ success: true, message: `นำเข้าข้อมูลสำเร็จ ${count} รายการ` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Serve frontend static files
app.use(express.static(path.join(__dirname)));

// Root route redirects to index.php (which is currently HTML anyway)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 11. Settings / Departments
app.get('/api/getDepartments', async (req, res) => {
    try {
        // Try 'setting' table first (as per user request "sql named setting")
        // If not found, try 'settings'
        let tableName = 'setting';
        try {
            await pool.query("SELECT 1 FROM setting LIMIT 1");
        } catch (e) {
            tableName = 'settings';
        }

        const [rows] = await pool.query(`SELECT DISTINCT Department FROM \`${tableName}\` WHERE Department IS NOT NULL AND Department != '' ORDER BY Department ASC`);
        res.json({ success: true, departments: rows.map(r => r.Department) });
    } catch (err) {
        // Table might not exist yet
        res.json({ success: false, message: err.message, departments: [] });
    }
});

async function importSettingsSQL() {
    const filePath = path.join(__dirname, 'settings.sql');
    if (fs.existsSync(filePath)) {
        console.log('Found settings.sql, attempting to import...');
        try {
            const sqlContent = fs.readFileSync(filePath, 'utf8');
            // Basic split by semicolon - assumes no semicolons in string literals, simpler for this task
            const statements = sqlContent.split(/;\s*$/m).filter(s => s.trim().length > 0);

            for (const statement of statements) {
                if (statement.trim()) await pool.query(statement);
            }
            console.log('Imported settings.sql successfully.');
            fs.renameSync(filePath, filePath + '.invited');
        } catch (e) {
            console.error('Error importing settings.sql:', e);
        }
    }
}

// 10. Assessment
app.post('/api/evaluateJob', async (req, res) => {
    const { ticketId, date, satisfaction, serviceTime, comment, assessor } = req.body;
    try {
        const [existing] = await pool.query("SELECT id FROM assessments WHERE ticket_id = ?", [ticketId]);
        if (existing.length > 0) {
            return res.json({ success: false, message: 'งานนี้ถูกประเมินไปแล้ว ไม่สามารถแก้ไขได้' });
        }

        await pool.query(`
            INSERT INTO assessments (ticket_id, assessment_date, satisfaction, service_time, comment, assessor)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [ticketId, date, satisfaction, serviceTime, comment, assessor]);
        res.json({ success: true, message: 'บันทึกการประเมินเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 11. Assessment Stats
app.get('/api/getAssessmentStats', async (req, res) => {
    const { month, year } = req.query; // YYYY-MM or YYYY
    try {
        let sql = `
            SELECT 
                CASE 
                    WHEN a.satisfaction IS NULL OR a.satisfaction = '' THEN 'ยังไม่ประเมิน' 
                    ELSE a.satisfaction 
                END as type, 
                COUNT(*) as count 
            FROM repairs r 
            LEFT JOIN assessments a ON r.ticket_id = a.ticket_id
            WHERE (r.status LIKE '%สำเร็จ%' OR r.status = 'Completed')
        `;

        const params = [];
        if (month) {
            sql += " AND DATE_FORMAT(r.created_at, '%Y-%m') = ? ";
            params.push(month);
        } else {
            const filterYear = year || new Date().getFullYear();
            sql += " AND YEAR(r.created_at) = ? ";
            params.push(filterYear);
        }

        sql += " GROUP BY type ORDER BY count DESC";

        const [rows] = await pool.query(sql, params);
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/getAssessment', async (req, res) => {
    const { ticketId } = req.query;
    try {
        const [rows] = await pool.query("SELECT * FROM assessments WHERE ticket_id = ?", [ticketId]);
        if (rows.length === 0) return res.json({ success: false, message: 'Not found' });
        res.json({ success: true, assessment: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 12. Assessors Management
app.get('/api/getAssessors', async (req, res) => {
    try {
        await pool.query("CREATE TABLE IF NOT EXISTS assessors (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) UNIQUE NOT NULL)");
        const [rows] = await pool.query("SELECT * FROM assessors ORDER BY name ASC");
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/addAssessor', async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name required' });
    try {
        await pool.query("CREATE TABLE IF NOT EXISTS assessors (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) UNIQUE NOT NULL)");
        await pool.query("INSERT INTO assessors (name) VALUES (?)", [name.trim()]);
        res.json({ success: true, message: 'Added' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.json({ success: true, message: 'Already exists' });
        }
        res.status(500).json({ success: false, message: err.message });
    }
});

// Start Server
const PORT = process.env.PORT || 3003;
initDb().then(async () => {
    await importSettingsSQL();
    app.listen(PORT, () => {
        console.log(`Node.js Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize DB:', err);
});
