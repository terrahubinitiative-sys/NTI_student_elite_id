import re

with open('app.py', 'r') as f:
    code = f.read()

# Hakikisha routes za delete zimetengwa vizuri
old_del_cert = """    elif action == 'delete_certificate':"""
# Kama unataka tuandike app.py nzima au tubadilishe tu hiyo sehemu, niambie tukate hapa hapa!
