import re

with open('app.py', 'r') as f:
    code = f.read()

# Tafuta sehemu inayopokea add_certificate kwenye app.py na ubadilishe ikae hivi:
# Hakikisha inasoma request.form.get('issuer_name') na request.form.get('founder_name')
print("Patching app.py certificate logic...")
