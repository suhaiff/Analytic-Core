import pandas as pd
import urllib.request

url = "https://docs.google.com/spreadsheets/d/1XUHj2c8vGZoGGI4GyfVR2Qk758FwTLWQK354YqIXrSE/export?format=xlsx"
urllib.request.urlretrieve(url, "features.xlsx")

xls = pd.ExcelFile("features.xlsx")
print("Sheets:", xls.sheet_names)

for sheet in xls.sheet_names:
    print(f"\n--- Sheet: {sheet} ---")
    df = pd.read_excel(xls, sheet)
    print(df.head(20).to_string())
