document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    const resultBox = document.getElementById("result-container");

    if (!token) {
        resultBox.innerHTML = `<div class="status-box rejected">❌ REJECTED / INVALID QR CODE</div>`;
        return;
    }

    try {
        const response = await fetch(`/api/verify/${token}`);
        const data = await response.json();

        if (data.success && data.student) {
            const s = data.student;
            resultBox.innerHTML = `
                <div class="status-box verified">
                    <h2>✔ VERIFIED OFFICIAL ID</h2>
                    <div class="student-card-details">
                        <img src="${s.photoUrl}" alt="Photo" class="student-photo">
                        <h3>${s.name}</h3>
                        <p><strong>Program:</strong> ${s.program}</p>
                        <p><strong>ID Number:</strong> ${s.idNumber}</p>
                        <p><strong>Valid Through:</strong> ${s.validThrough}</p>
                        <p class="badge">${s.status}</p>
                    </div>
                </div>
            `;
        } else {
            resultBox.innerHTML = `
                <div class="status-box rejected">
                    <h2>❌ REJECTED / UNVERIFIED</h2>
                    <p>This student ID is unverified or has been removed from the TerraHub database.</p>
                </div>
            `;
        }
    } catch (err) {
        resultBox.innerHTML = `<div class="status-box rejected">❌ Network Verification Error</div>`;
    }
});
