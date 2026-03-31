import pandas as pd
import os

# BURAYA dosyanın tam yolunu yaz
dosya_yolu = "/Users/serdarkilinc/Downloads/Vize Sınavları Son.xlsx"

# Çıktı klasörü (kaynak dosyayla aynı klasörde ayrı bir klasöre kaydeder)
cikti_klasoru = os.path.join(os.path.dirname(dosya_yolu), "Vize_Sonuclar_Son")
if not os.path.exists(cikti_klasoru):
    os.makedirs(cikti_klasoru)

# Tüm sayfaları oku
xl = pd.read_excel(dosya_yolu, sheet_name=None)

for sayfa_adi, df in xl.items():
    cikti_dosyasi = os.path.join(cikti_klasoru, f"{sayfa_adi}.xlsx")
    df.to_excel(cikti_dosyasi, index=False)
    print(f"✅ {sayfa_adi}.xlsx kaydedildi ({len(df)} satır)")

print(f"\\nTüm sayfalar ayrı dosyalara ({cikti_klasoru}) klasörüne kaydedildi!")
