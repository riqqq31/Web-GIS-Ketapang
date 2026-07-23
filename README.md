# UAS KAPITA: Analisis Perubahan Vegetasi Kota Ketapang

## Deskripsi Proyek
Proyek ini merupakan tugas akhir (UAS) mata kuliah Kapita Selekta yang berfokus pada analisis perubahan tutupan lahan/vegetasi menggunakan data geospasial. Proyek ini memvisualisasikan data *gain* (penambahan) dan *loss* (pengurangan) vegetasi antara tahun 2024 dan 2025 di Kota Ketapang. Visualisasi disajikan dalam bentuk WebGIS interaktif.

## Informasi Umum
- **Kota**: Ketapang
- **Objek Analisis**: Perubahan Vegetasi (Gain & Loss 2024-2025)
- **Anggota Kelompok**: 
  1. Thoriiq (riqqq31)
  2. [Nama Anggota 2] *(Silakan diisi)*
  3. [Nama Anggota 3] *(Silakan diisi)*

## Struktur Folder
Repository ini disusun dengan struktur folder berikut sesuai dengan ketentuan:
- `gee/`: Berisi skrip dan log dari pemrosesan data menggunakan Google Earth Engine.
- `webgis/`: Berisi file HTML, CSS, dan JavaScript untuk aplikasi WebGIS interaktif (`index.html`, `dashboard.html`).
- `data/`: Berisi data spasial dasar, seperti batas administrasi Kota Ketapang (`Ketapang.geojson`).
- `results/`: Berisi hasil analisis seperti data vegetasi tahunan, serta data spasial penambahan (gain) dan pengurangan (loss) vegetasi, beserta file statistik (`.csv`).
- `report/`: Tempat untuk menyimpan laporan akhir proyek.

## Cara Membuka WebGIS
1. Kloning repository ini ke komputer lokal Anda:
   ```bash
   git clone https://github.com/riqqq31/Web-GIS-Ketapang.git
   ```
2. Buka folder repository hasil kloning.
3. Anda dapat membuka WebGIS dengan dua cara:
   - **Local Server (Direkomendasikan)**: Gunakan ekstensi seperti Live Server di VSCode, lalu jalankan file `webgis/index.html` atau `webgis/dashboard.html`.
   - **Langsung dari Browser**: Buka file `webgis/index.html` langsung melalui web browser pilihan Anda (Google Chrome, Firefox, dll). *(Catatan: Beberapa fitur seperti memuat file GeoJSON lokal mungkin memerlukan local server agar tidak terkena batasan CORS).*

## Tautan Penting
- **WebGIS (Live Demo)**: [Tautan WebGIS GitHub Pages](https://riqqq31.github.io/Web-GIS-Ketapang/webgis/index.html) *(Sesuaikan jika link berbeda)*
- **Laporan Proyek**: [Tautan Unduh Laporan PDF / Google Drive] *(Silakan isi tautan laporan jika terlalu besar untuk diunggah, atau arahkan ke file di dalam folder `report/`)*
- **Data Besar**: Jika file geojson terlalu besar untuk GitHub, silakan akses melalui [Tautan Unduh Google Drive Data].
