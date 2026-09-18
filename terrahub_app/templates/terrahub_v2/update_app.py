with open('app.py', 'r') as f:
    content = f.read()

# Badilisha sehemu ya kufuta vyeti na portfolios iwe huru kabisa
old_code = """    elif action == 'delete_certificate':"""

# Kama app.py yako inatumia njia nyingine, tuandike script safi ya kutafuta na kubadilisha
print("Reading app.py...")
