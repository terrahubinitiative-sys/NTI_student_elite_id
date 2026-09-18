let db = null;
const DB_NAME = "TerraHubIDDB";
const STORE_NAME = "students";

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            let dbInstance = e.target.result;
            if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
                dbInstance.createObjectStore(STORE_NAME, { keyPath: "token" });
            }
        };
        request.onsuccess = (e) => { db = e.target.result; resolve(db); };
        request.onerror = (e) => reject(e);
    });
}

async function saveStudentToDB(record) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e);
    });
}

async function getStudentByToken(token) {
    return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).get(token);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
    });
}

async function getAllStudentsFromDB() {
    return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
    });
}

async function deleteStudentFromDB(token) {
    return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).delete(token);
        tx.oncomplete = () => resolve();
    });
}

let currentToken = "";
let currentPhotoBase64 = "";
let html5QrCode = null;

window.addEventListener('DOMContentLoaded', async () => {
    await initDB();
    if (document.getElementById('reader')) startScanner();
    if (document.getElementById('adminAuth')) {
        generateNewToken();
        liveUpdateCard();
    }
    if (document.getElementById('verifyContainer')) checkUrlForDirectVerify();
});

async function loginAdmin() {
    const inputVal = document.getElementById('adminPassInput').value.trim();
    
    const buffer = new TextEncoder().encode(inputVal);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const inputHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    const targetHash = window.ADMIN_HASH || "";

    if (inputHash === targetHash) {
        document.getElementById('adminAuth').style.display = 'none';
        document.getElementById('adminWorkspace').style.display = 'flex';
        refreshDatabaseTable();
    } else {
        document.getElementById('authError').style.display = 'block';
    }
}

function generateNewToken() {
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    currentToken = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

function liveUpdateCard() {
    document.getElementById('cardName').innerText = document.getElementById('inName').value.toUpperCase();
    document.getElementById('cardProgram').innerText = document.getElementById('inProgram').value.toUpperCase();
    document.getElementById('cardID').innerText = document.getElementById('inID').value.toUpperCase();
    document.getElementById('cardValid').innerText = document.getElementById('inValid').value.toUpperCase();

    const verifyURL = `${window.location.origin}/verify.html?token=${currentToken}`;
    const qrContainer = document.getElementById("qrcode");
    qrContainer.innerHTML = "";
    
    new QRCode(qrContainer, {
        text: verifyURL,
        width: 90,
        height: 90,
        colorDark: "#0d0216",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
    });
}

function handlePhotoUpload(event) {
    const reader = new FileReader();
    reader.onload = function() {
        currentPhotoBase64 = reader.result;
        const img = document.getElementById('cardPhoto');
        img.src = currentPhotoBase64;
        img.style.display = 'block';
        document.getElementById('photoText').style.display = 'none';
    };
    if(event.target.files[0]) reader.readAsDataURL(event.target.files[0]);
}

async function saveAndGenerate() {
    const studentID = document.getElementById('inID').value.toUpperCase();
    const record = {
        token: currentToken,
        name: document.getElementById('inName').value.toUpperCase(),
        program: document.getElementById('inProgram').value.toUpperCase(),
        id: studentID,
        valid: document.getElementById('inValid').value.toUpperCase(),
        photo: currentPhotoBase64,
        createdAt: new Date().toISOString()
    };

    const cardElement = document.getElementById('printableCard');
    const canvas = await html2canvas(cardElement, { scale: 3, useCORS: true });
    const link = document.createElement('a');
    link.download = `${studentID}_TerraHub_ID.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    await saveStudentToDB(record);
    await refreshDatabaseTable();

    setTimeout(() => {
        generateNewToken();
        liveUpdateCard();
    }, 500);
}

async function editRecord(token) {
    const student = await getStudentByToken(token);
    if (!student) return;

    currentToken = student.token;
    document.getElementById('inName').value = student.name;
    document.getElementById('inProgram').value = student.program;
    document.getElementById('inID').value = student.id;
    document.getElementById('inValid').value = student.valid;
    if (student.photo) {
        currentPhotoBase64 = student.photo;
        const img = document.getElementById('cardPhoto');
        img.src = currentPhotoBase64;
        img.style.display = 'block';
        document.getElementById('photoText').style.display = 'none';
    }
    liveUpdateCard();
}

async function refreshDatabaseTable() {
    const students = await getAllStudentsFromDB();
    const tbody = document.getElementById('databaseTableBody');
    tbody.innerHTML = "";

    if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:15px; color:#aaa;">No records stored yet.</td></tr>`;
        return;
    }

    students.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${s.id}</b></td>
            <td>${s.name}</td>
            <td>${s.program}</td>
            <td>${s.valid}</td>
            <td><code style="font-size:0.65rem; color:var(--brand-gold);">${s.token}</code></td>
            <td style="display:flex; gap:4px;">
                <button class="btn btn-edit" style="padding:4px 6px; font-size:0.65rem; margin:0;" onclick="editRecord('${s.token}')">Edit</button>
                <button class="btn btn-danger" style="padding:4px 6px; font-size:0.65rem; margin:0;" onclick="removeRecord('${s.token}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function removeRecord(token) {
    if (confirm("Delete this student record permanently?")) {
        await deleteStudentFromDB(token);
        refreshDatabaseTable();
    }
}

// Mobile-friendly Backup Export via Blob URL
async function exportDatabase() {
    try {
        const students = await getAllStudentsFromDB();
        if (students.length === 0) {
            alert("Database is currently empty. No records to export.");
            return;
        }

        const jsonString = JSON.stringify(students, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `TerraHub_DB_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    } catch (err) {
        alert("Backup Export Error: " + err.message);
    }
}

// Import Backup JSON file back into IndexedDB
async function importDatabase(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const records = JSON.parse(e.target.result);
            if (!Array.isArray(records)) {
                alert("Invalid backup file format.");
                return;
            }
            for (const record of records) {
                if (record.token) await saveStudentToDB(record);
            }
            await refreshDatabaseTable();
            alert(`Success: Restored ${records.length} records into the database!`);
        } catch (err) {
            alert("Import Error: " + err.message);
        }
    };
    reader.readAsText(file);
}

function startScanner() {
    html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => { window.location.href = decodedText; },
        () => {}
    ).catch(() => {
        document.getElementById('reader').innerHTML = `<p style="padding:10px; font-size:0.75rem; color:#aaa;">Camera unavailable. Upload image file below.</p>`;
    });
}

function handleQrFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");

    html5QrCode.scanFile(file, true)
        .then(decodedText => { window.location.href = decodedText; })
        .catch(() => alert("REJECTED: Could not detect valid QR code on uploaded image."));
}

async function checkUrlForDirectVerify() {
    const token = new URLSearchParams(window.location.search).get('token');
    const container = document.getElementById('verifyContainer');

    if (!token) {
        container.innerHTML = `<div class="verify-result invalid" style="display:block;">✕ REJECTED: Security token missing.</div>`;
        return;
    }

    const student = await getStudentByToken(token);
    if (student) {
        container.innerHTML = `
            <div class="verify-result valid" style="display:block;">
                <div style="font-weight:900; font-size:1.1rem; color:#046c51;">✓ OFFICIAL VERIFIED STUDENT</div>
                <img src="${student.photo || 'Hub.png'}" class="verify-photo">
                <h3 style="margin-top:6px; font-size:1rem; color:#1a0528;">${student.name}</h3>
                <p style="font-size:0.8rem; margin-top:2px;"><b>Program:</b> ${student.program}</p>
                <p style="font-size:0.8rem;"><b>ID:</b> ${student.id} | <b>Valid:</b> ${student.valid}</p>
                <p style="font-size:0.65rem; color:#046c51; margin-top:6px; font-weight:800;">Status: Active Official Credential</p>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="verify-result invalid" style="display:block;">
                <div style="font-weight:900; font-size:1.1rem; color:#9d1737;">✕ REJECTED / UNVERIFIED</div>
                <p style="font-size:0.8rem; margin-top:5px; color:#1a0528;">This student ID is unverified or has been removed from the TerraHub database.</p>
            </div>
        `;
    }
}
