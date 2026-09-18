from flask import Flask, render_template, request, redirect, url_for, session, abort
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'ezra_secure_secret_key_2026'

ADMIN_USER = "admin"
ADMIN_PASS = "terrahub2026"

site_data = {
    "students_enrolled": "150+",
    "students_earning": "45+",
    "current_project": "Rural Mobile Termux Engineering & Local AI Systems Deployment.",
    "completed_project": "Community Wi-Fi Airshare File Transfer & Digital Literacy Portal v1.",
    "upcoming_project": "Teralink Rural Youth Cloud Infrastructure & Decentralized Mini-App Ecosystems.",
    "facebook": "https://facebook.com/navkholoterrahub",
    "instagram": "https://instagram.com/navkholoterrahub",
    "whatsapp": "https://whatsapp.com/send?phone=254000000000",
    "email": "info@navkholoterrahub.org"
}

# Updated DATABASE structure supporting both certificate and portfolio under the same ID record key
DATABASE = {
    "TERRA-2026-01": {
        "certificate": {
            "institution": "Navkholo Terahub Initiative",
            "full_name": "Ezra Wanyama",
            "course_name": "Advanced Python & Mobile Engineering",
            "date_joined": "January 11, 2024",
            "date_graduated": "September 3, 2026",
            "issuer_name": "John Michael",
            "founder_name": "Ezra Wanyama",
            "issue_date": datetime.now().strftime("%d/%m/%Y"),
            "code": "TERRA-2026-01"
        },
        "portfolio": {
            "full_name": "Ezra Wanyama",
            "professional_title": "Mobile-First Software Engineer",
            "location": "Nakuru, Kenya",
            "github": "github.com/ezrawanyama74",
            "executive_pitch": "Specializing in mobile-first software engineering utilizing Android Termux terminal environments, Python, Flask, and secure decentralized web deployments.",
            "code": "PORT-D45M"
        }
    }
}

@app.route('/')
def landing():
    return render_template('landing.html', data=site_data)

@app.route('/portal')
def portal():
    return render_template('portal.html', data=site_data)

@app.route('/secret-admin-login-9988', methods=['GET', 'POST'])
def admin_login():
    error = None
    if request.method == 'POST':
        if request.form.get('username') == ADMIN_USER and request.form.get('password') == ADMIN_PASS:
            session['admin_logged'] = True
            return redirect(url_for('admin_dashboard'))
        error = "Invalid Credentials!"
    return render_template('admin_login.html', error=error)

@app.route('/secret-admin-panel-9988', methods=['GET', 'POST'])
def admin_dashboard():
    if not session.get('admin_logged'):
        return redirect(url_for('admin_login'))
    
    global site_data, DATABASE
    if request.method == 'POST':
        action = request.form.get('action')
        if action == 'update_links':
            site_data['students_enrolled'] = request.form.get('students_enrolled', site_data['students_enrolled'])
            site_data['students_earning'] = request.form.get('students_earning', site_data['students_earning'])
            site_data['facebook'] = request.form.get('facebook', site_data['facebook'])
            site_data['instagram'] = request.form.get('instagram', site_data['instagram'])
            site_data['whatsapp'] = request.form.get('whatsapp', site_data['whatsapp'])
            site_data['email'] = request.form.get('email', site_data['email'])
        elif action == 'create_certificate':
            rec_id = request.form.get('record_id')
            if rec_id:
                if rec_id not in DATABASE:
                    DATABASE[rec_id] = {}
                DATABASE[rec_id]["certificate"] = {
                    "institution": request.form.get('institution', 'Navkholo Terahub Initiative'),
                    "full_name": request.form.get('full_name'),
                    "course_name": request.form.get('course_name'),
                    "date_joined": request.form.get('date_joined'),
                    "date_graduated": request.form.get('date_graduated'),
                    "issuer_name": request.form.get('issuer_name'),
                    "founder_name": request.form.get('founder_name'),
                    "issue_date": datetime.now().strftime("%d/%m/%Y"),
                    "code": rec_id
                }
        elif action == 'create_portfolio':
            rec_id = request.form.get('record_id')
            if rec_id:
                if rec_id not in DATABASE:
                    DATABASE[rec_id] = {}
                DATABASE[rec_id]["portfolio"] = {
                    "full_name": request.form.get('full_name'),
                    "professional_title": request.form.get('professional_title'),
                    "location": request.form.get('location'),
                    "github": request.form.get('github'),
                    "executive_pitch": request.form.get('executive_pitch'),
                    "code": rec_id
                }
        elif action == 'delete_record':
            rec_id = request.form.get('record_id')
            if rec_id in DATABASE:
                del DATABASE[rec_id]
        return redirect(url_for('admin_dashboard'))
    
    return render_template('admin_dashboard.html', data=site_data, database=DATABASE)

@app.route('/verify', methods=['POST'])
def verify_post():
    record_id = request.form.get('record_id', '').strip()
    return redirect(url_for('verify_record', record_id=record_id))

@app.route('/verify/<record_id>', methods=['GET'])
def verify_record(record_id):
    record = DATABASE.get(record_id)
    if not record:
        abort(404)
    # Renders a combined view showing both certificate and portfolio if they exist under this ID
    return render_template('verify_combined.html', record_id=record_id, record=record)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
