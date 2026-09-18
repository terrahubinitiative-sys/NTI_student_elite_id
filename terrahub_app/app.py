from flask import Flask, render_template, request, redirect, url_for, flash, session
import os

app = Flask(__name__)
app.secret_key = 'terrahub_secret_key_74'

# In-memory storage for app data
app_settings = {
    "current_mission": "Equipping rural youth in Kakamega County with next-generation digital skills, software engineering training, and decentralized connectivity solutions.",
    "enrolled_students": "120+",
    "working_youths": "45+",
    "whatsapp_link": "https://whatsapp.com",
    "facebook_link": "https://facebook.com",
    "instagram_link": "https://instagram.com",
    "contact_email": "info@navakholoterrahub.org"
}

completed_projects = [
    {"title": "AirShare Local Wi-Fi File Sharing", "description": "A decentralized local hotspot media streaming and file transfer application built for offline environments."},
    {"title": "Signal Matrix Bot", "description": "Automated Telegram mini-application for real-time data signals and notification dispatch."}
]

upcoming_projects = [
    {"title": "Teralink Rural Mesh Network", "description": "Expanding low-cost community Wi-Fi nodes powered by solar energy in underserved regions."},
    {"title": "AI-Powered Paper Grader", "description": "An academic integrity tool designed to analyze text variance, syntax complexity, and content authenticity."}
]

verified_certificates = {
    "TERRA-2026-001": {"name": "Ezra Wanyama", "course": "Full-Stack Mobile Software Engineering", "status": "Verified & Active"},
    "TERRA-2026-002": {"name": "Student Innovator", "course": "Python & Decentralized Networks", "status": "Verified & Active"}
}

@app.route('/')
def landing():
    return render_template('landing.html')

@app.route('/explore')
def index():
    return render_template('index.html', settings=app_settings, completed_projects=completed_projects, upcoming_projects=upcoming_projects)

@app.route('/verify', methods=['POST'])
def verify_certificate():
    cert_id = request.form.get('cert_id', '').strip()
    if cert_id in verified_certificates:
        cert = verified_certificates[cert_id]
        flash(f"Valid Certificate! Holder: {cert['name']} | Course: {cert['course']} | Status: {cert['status']}", "success")
    else:
        flash("Invalid or unrecognized Certificate ID. Please check and try again.", "danger")
    return redirect(url_for('index') + '#verify-section')

@app.route('/admin', methods=['GET', 'POST'])
@app.route('/admin_secure_portal_74', methods=['GET', 'POST'])
def admin_panel():
    if request.method == 'POST':
        action = request.form.get('action')
        
        if action == 'update_settings':
            app_settings['current_mission'] = request.form.get('current_mission', app_settings['current_mission'])
            app_settings['enrolled_students'] = request.form.get('enrolled_students', app_settings['enrolled_students'])
            app_settings['working_youths'] = request.form.get('working_youths', app_settings['working_youths'])
            app_settings['whatsapp_link'] = request.form.get('whatsapp_link', app_settings['whatsapp_link'])
            app_settings['facebook_link'] = request.form.get('facebook_link', app_settings['facebook_link'])
            app_settings['instagram_link'] = request.form.get('instagram_link', app_settings['instagram_link'])
            app_settings['contact_email'] = request.form.get('contact_email', app_settings['contact_email'])
            flash("Platform settings updated successfully!", "success")
            
        elif action == 'add_completed_project':
            title = request.form.get('title')
            desc = request.form.get('description')
            if title and desc:
                completed_projects.append({"title": title, "description": desc})
                flash("Completed project added successfully!", "success")
                
        elif action == 'add_upcoming_project':
            title = request.form.get('title')
            desc = request.form.get('description')
            if title and desc:
                upcoming_projects.append({"title": title, "description": desc})
                flash("Upcoming project added successfully!", "success")
                
        elif action == 'add_certificate':
            cert_id = request.form.get('cert_id')
            name = request.form.get('name')
            course = request.form.get('course')
            if cert_id and name and course:
                verified_certificates[cert_id] = {"name": name, "course": course, "status": "Verified & Active"}
                flash(f"Certificate {cert_id} added successfully!", "success")
                
        return redirect(url_for('admin_panel'))
        
    return render_template('admin.html', settings=app_settings, completed_projects=completed_projects, upcoming_projects=upcoming_projects, certificates=verified_certificates)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
