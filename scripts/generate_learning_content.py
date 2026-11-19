import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REGULATIONS_PATH = ROOT / "data" / "regulations.json"
OUTPUT_PATH = ROOT / "data" / "learning-content.json"

TERMS_DICTIONARY = {
    "Administrator KEK": "Unit kerja yang bertugas menyelenggarakan perizinan berusaha, perizinan lainnya, pelayanan, dan pengawasan di KEK.",
    "Dewan Nasional": "Dewan yang dibentuk di tingkat nasional untuk menyelenggarakan Kawasan Ekonomi Khusus.",
    "Dewan Kawasan": "Dewan yang dibentuk di tingkat provinsi untuk membantu Dewan Nasional dalam penyelenggaraan KEK.",
    "Badan Usaha": "Badan usaha yang menyelenggarakan kegiatan usaha pembangunan dan/atau pengelolaan Kawasan Ekonomi Khusus.",
    "Pelaku Usaha": "Badan usaha atau orang perseorangan yang menjalankan kegiatan usaha di dalam Kawasan Ekonomi Khusus.",
    "Kegiatan Utama": "Bidang usaha beserta rantai produksinya yang menjadi fokus kegiatan KEK dan ditetapkan oleh Dewan Nasional.",
    "Sistem OSS": "Perizinan Berusaha Terintegrasi Secara Elektronik (Online Single Submission) yang mengintegrasikan layanan perizinan berusaha nasional.",
    "Perizinan Berusaha": "Legalitas yang diberikan kepada Badan Usaha dan/atau Pelaku Usaha untuk memulai dan menjalankan usaha dan/atau kegiatannya.",
    "PB UMKU": "Perizinan Berusaha Untuk Menunjang Kegiatan Usaha guna memenuhi standar teknis operasional tertentu.",
    "KKPR": "Kesesuaian Kegiatan Pemanfaatan Ruang sebagai dokumen kesesuaian antara rencana kegiatan dengan tata ruang wilayah darat.",
    "KKPRL": "Kesesuaian Kegiatan Pemanfaatan Ruang Laut bagi kegiatan pemanfaatan ruang di wilayah pesisir atau matra laut.",
    "Persetujuan Lingkungan": "Keputusan kelayakan lingkungan hidup (Amdal, UKL-UPL, atau SPPL) yang wajib dipenuhi sebelum beroperasi.",
    "Bea Masuk": "Pungutan negara berdasarkan Undang-Undang Kepabeanan yang dikenakan terhadap barang impor.",
    "Pajak Dalam Rangka Impor": "Pungutan fiskal impor meliputi Pajak Pertambahan Nilai (PPN), PPnBM, dan/atau PPh Pasal 22 Impor.",
    "TLDDP": "Tempat Lain Dalam Daerah Pabean selain Kawasan Bebas, Tempat Penimbunan Berikat, dan KEK.",
    "Barang Modal": "Aktiva tetap berwujud berupa mesin, peralatan pabrik, dan instalasi yang digunakan untuk pembangunan atau pengembangan industri.",
    "Pengawasan": "Kegiatan pemantauan, pemeriksaan lapangan, evaluasi, dan pengendalian kepatuhan atas pemenuhan standar berusaha."
}


def clean_text(text):
    text = re.sub(r'PRESIDEN\s+REPUBLIK\s+INDONESIA\s*[-–—]?\s*\d*\s*[-–—]?', '', text, flags=re.IGNORECASE)
    text = re.sub(r'PFIES\s+IDEN', '', text, flags=re.IGNORECASE)
    text = re.sub(r'll[r(]\s*f?\'?lo\s*\d+.*', '', text)
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()


def extract_paragraphs(text):
    cleaned = clean_text(text)
    paragraphs = []
    lines = cleaned.split('\n')
    current_p = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if re.match(r'^\(?\d{1,2}\)?[\.\s]', line) or re.match(r'^[a-z]\.\s', line):
            if current_p:
                paragraphs.append(' '.join(current_p))
                current_p = []
        current_p.append(line)
        
    if current_p:
        paragraphs.append(' '.join(current_p))
        
    if not paragraphs:
        paragraphs = [p.strip() for p in cleaned.split('\n') if p.strip()]
    return paragraphs


def determine_topics(article_num, text, chapter_title, reg_id):
    lower = (text + ' ' + chapter_title).lower()
    topics = []

    if any(k in lower for k in ['dewan nasional', 'dewan kawasan', 'administrator', 'badan usaha', 'kelembagaan', 'pengelola', 'pembangun', 'organisasi']):
        topics.append('kelembagaan')
    if any(k in lower for k in ['perizinan', 'izin', 'oss', 'pbbr', 'persyaratan dasar', 'amdal', 'sppl', 'standar', 'legalitas']):
        topics.append('perizinan')
    if any(k in lower for k in ['pengawasan', 'pengendalian', 'waspal', 'evaluasi', 'laporan', 'monitoring', 'sanksi', 'teguran', 'pemeriksaan']):
        topics.append('pengawasan')
    if any(k in lower for k in ['fasilitas', 'kemudahan', 'ketenagakerjaan', 'keimigrasian', 'tka', 'tenaga kerja', 'visa', 'izin tinggal']):
        topics.append('fasilitas')
    if any(k in lower for k in ['pajak', 'pph', 'ppn', 'ppnbm', 'fiskal', 'wajib pajak', 'tax holiday', 'tax allowance']):
        topics.append('perpajakan')
    if any(k in lower for k in ['pabean', 'bea masuk', 'cukai', 'impor', 'ekspor', 'tlddp', 'kawasan pabean', 'barang modal']):
        topics.append('kepabeanan')
    if any(k in lower for k in ['tata ruang', 'ruang', 'kkpr', 'kkprl', 'tanah', 'pertanahan', 'darat', 'laut', 'delineasi', 'luas', 'wilayah']):
        topics.append('tataruang')

    if not topics:
        if reg_id == 'pp-71-2021':
            topics = ['kelembagaan', 'tataruang']
        elif 'ketentuan umum' in chapter_title.lower():
            topics = ['kelembagaan', 'perizinan']
        else:
            topics = ['perizinan']
            
    return list(dict.fromkeys(topics))


def find_key_terms(text):
    terms = []
    for term, definition in TERMS_DICTIONARY.items():
        if re.search(r'\b' + re.escape(term) + r'\b', text, flags=re.IGNORECASE):
            terms.append({"term": term, "definition": definition})
        if len(terms) >= 2:
            break
    return terms


def build_core_summary(article_num, text, chapter_title, reg_id):
    cleaned = clean_text(text)
    
    if article_num == "Pasal 1" and "KETENTUAN UMUM" in chapter_title.upper():
        return "Pasal ini memuat ketentuan umum dan definisi hukum resmi atas istilah-istilah pokok yang menjadi rujukan dalam seluruh pasal peraturan ini."
    
    if "mulai berlaku pada tanggal diundangkan" in cleaned.lower() or "ketentuan penutup" in chapter_title.lower():
        return "Ketentuan penutup yang menetapkan tanggal mulai berlakunya Peraturan Pemerintah ini secara resmi dalam Lembaran Negara Republik Indonesia."

    if reg_id == "pp-71-2021":
        if article_num == "Pasal 1":
            return "Menetapkan secara resmi pembentukan Kawasan Ekonomi Khusus (KEK) Gresik."
        if article_num == "Pasal 2":
            return "Menetapkan luas wilayah KEK Gresik sebesar 2.167 hektar yang berlokasi di Kecamatan Manyar, Kabupaten Gresik, Jawa Timur."
        if article_num == "Pasal 3":
            return "Mengatur batas delineasi fisik KEK Gresik (utara, timur, selatan, barat) dan rujukan peta lampiran resmi."
        if article_num == "Pasal 4":
            return "Menetapkan 4 zona kegiatan usaha di KEK Gresik: produksi & pengolahan, logistik & distribusi, riset & teknologi, serta energi."
        if article_num == "Pasal 7":
            return "Menetapkan waktu mulai berlakunya PP No. 71 Tahun 2021 sejak tanggal diundangkan."

    sentences = re.split(r'(?<=[.!?])\s+|\n+', cleaned)
    first_meaningful = ""
    for s in sentences:
        s = re.sub(r'^\(?\d{1,2}\)?[\.\s]*', '', s).strip()
        s = re.sub(r'^[a-z]\.\s*', '', s).strip()
        if len(s) > 20:
            first_meaningful = s
            break
            
    if not first_meaningful:
        first_meaningful = cleaned[:150]

    first_meaningful = first_meaningful.rstrip(':;, ')
    first_meaningful = re.sub(r'\s+', ' ', first_meaningful)

    if len(first_meaningful) > 160:
        first_meaningful = first_meaningful[:157].rsplit(' ', 1)[0] + '...'

    clean_chapter = re.sub(r'^BAB\s+[IVXLCDM]+\s*[-–—]?\s*', '', chapter_title).strip()
    return f"Pasal ini mengatur ketentuan mengenai {first_meaningful.lower()} dalam lingkup {clean_chapter}."


def build_key_points(text):
    paragraphs = extract_paragraphs(text)
    points = []
    
    for p in paragraphs[:4]:
        p_clean = re.sub(r'^\(?\d{1,2}\)?[\.\s]*', '', p).strip()
        p_clean = re.sub(r'^[a-z]\.\s*', '', p_clean).strip()
        p_clean = re.sub(r'\s+', ' ', p_clean).strip()
        p_clean = p_clean.rstrip(':;')
        if len(p_clean) > 15:
            if len(p_clean) > 160:
                p_clean = p_clean[:157].rsplit(' ', 1)[0] + '...'
            points.append(p_clean)
            
    if not points:
        points = [clean_text(text)[:150]]
    return points


def build_relations(article_num, text, reg_id, all_articles_map):
    relations = []
    matches = re.finditer(r'Pasal\s+(\d+)', text)
    seen_articles = set()
    
    for m in matches:
        target_num = f"Pasal {m.group(1)}"
        if target_num == article_num or target_num in seen_articles:
            continue
            
        if target_num in all_articles_map.get(reg_id, {}):
            seen_articles.add(target_num)
            target_info = all_articles_map[reg_id][target_num]
            relations.append({
                "targetRegulationId": reg_id,
                "targetArticle": target_num,
                "relationType": "explicit_reference",
                "relationLabel": "Rujukan teks pasal",
                "note": f"Disebutkan secara langsung dalam bunyi {article_num} sebagai acuan atau ketentuan rujukan.",
                "sourcePage": target_info["page"]
            })
            
    if reg_id == "pp-71-2021":
        if article_num == "Pasal 4":
            relations.append({
                "targetRegulationId": "pp-40-2021",
                "targetArticle": "Pasal 9",
                "relationType": "topic_relation",
                "relationLabel": "Ketentuan umum zona KEK",
                "note": "Menghubungkan zona kegiatan usaha KEK Gresik dengan klasifikasi zona kegiatan KEK nasional.",
                "sourcePage": 10
            })
        elif article_num == "Pasal 2" or article_num == "Pasal 3":
            relations.append({
                "targetRegulationId": "pp-40-2021",
                "targetArticle": "Pasal 3",
                "relationType": "topic_relation",
                "relationLabel": "Kriteria lokasi KEK",
                "note": "Kesesuaian batas lokasi dan tata ruang KEK Gresik dengan kriteria pembentukan KEK.",
                "sourcePage": 8
            })
            
    return relations[:4]


def build_quiz(article_num, text, reg_id, reg_title, core_summary, key_points, page_num):
    if reg_id == "pp-71-2021":
        if article_num == "Pasal 1":
            return [{
                "id": f"q-{reg_id}-1-1",
                "question": "Kawasan Ekonomi Khusus manakah yang secara resmi ditetapkan dalam PP No. 71 Tahun 2021?",
                "options": [
                    "Kawasan Ekonomi Khusus Gresik",
                    "Kawasan Ekonomi Khusus Kendal",
                    "Kawasan Ekonomi Khusus Batam",
                    "Kawasan Ekonomi Khusus Morotai"
                ],
                "correctIndex": 0,
                "explanation": "Pasal 1 menyatakan: Dengan Peraturan Pemerintah ini ditetapkan Kawasan Ekonomi Khusus Gresik.",
                "sourceReference": f"Pasal 1 PP No. 71 Tahun 2021"
            }]
        elif article_num == "Pasal 2":
            return [{
                "id": f"q-{reg_id}-2-1",
                "question": "Berapakah luas wilayah Kawasan Ekonomi Khusus Gresik menurut Pasal 2?",
                "options": [
                    "500 hektar",
                    "2.167 (dua ribu seratus enam puluh tujuh) hektar",
                    "1.000 hektar",
                    "3.500 hektar"
                ],
                "correctIndex": 1,
                "explanation": "Pasal 2 menetapkan luas KEK Gresik adalah 2.167 hektar di Kecamatan Manyar, Kabupaten Gresik, Jawa Timur.",
                "sourceReference": f"Pasal 2 PP No. 71 Tahun 2021"
            }]
        elif article_num == "Pasal 3":
            return [{
                "id": f"q-{reg_id}-3-1",
                "question": "Di sebelah timur, batas delineasi KEK Gresik berbatasan langsung dengan:",
                "options": [
                    "Pegunungan Kendeng",
                    "Selat Madura",
                    "Bandar Udara Internasional Juanda",
                    "Sungai Bengawan Solo"
                ],
                "correctIndex": 1,
                "explanation": "Pasal 3 ayat (1) huruf b menegaskan batas sebelah timur KEK Gresik berbatasan dengan Selat Madura.",
                "sourceReference": f"Pasal 3 ayat (1) huruf b PP No. 71 Tahun 2021"
            }]
        elif article_num == "Pasal 4":
            return [{
                "id": f"q-{reg_id}-4-1",
                "question": "Manakah yang BUKAN merupakan zona kegiatan usaha di KEK Gresik menurut Pasal 4?",
                "options": [
                    "Pertambangan batubara terbuka",
                    "Produksi dan pengolahan",
                    "Logistik dan distribusi",
                    "Riset, ekonomi digital, dan pengembangan teknologi"
                ],
                "correctIndex": 0,
                "explanation": "Pasal 4 menetapkan 4 kegiatan: produksi & pengolahan, logistik & distribusi, riset/ekonomi digital, dan pengembangan energi.",
                "sourceReference": f"Pasal 4 PP No. 71 Tahun 2021"
            }]
        elif article_num == "Pasal 7":
            return [{
                "id": f"q-{reg_id}-7-1",
                "question": "Kapan PP No. 71 Tahun 2021 tentang Kawasan Ekonomi Khusus Gresik mulai berlaku?",
                "options": [
                    "Pada tanggal diundangkan",
                    "10 tahun setelah penetapan",
                    "Setelah disetujui badan usaha swasta",
                    "Hanya saat musim libur nasional"
                ],
                "correctIndex": 0,
                "explanation": "Pasal 7 menyatakan Peraturan Pemerintah ini mulai berlaku pada tanggal diundangkan.",
                "sourceReference": f"Pasal 7 PP No. 71 Tahun 2021"
            }]

    correct_fact = key_points[0] if key_points else "Ketentuan normatif sebagaimana diatur dalam pasal ini."
    correct_fact = correct_fact.rstrip('.')
    
    question = f"Berdasarkan bunyi {article_num}, apa pokok ketentuan yang diatur mengenai pelaksanaan kegiatan usaha?"
    
    options = [
        f"{correct_fact}.",
        "Ketentuan ini dibatalkan secara sepihak dan tidak memiliki kekuatan mengikat.",
        "Pelaksanaannya tidak memerlukan koordinasi atau izin dari instansi pemerintah yang berwenang."
    ]
    
    return [{
        "id": f"q-{reg_id}-{article_num.replace('Pasal ', '').replace(' ', '_')}-1",
        "question": question,
        "options": options,
        "correctIndex": 0,
        "explanation": f"Sesuai ketentuan {article_num}, aturan tersebut secara eksplisit mengatur hal ini dalam kerangka hukum resmi.",
        "sourceReference": f"{article_num} {reg_title}"
    }]


def main():
    with open(REGULATIONS_PATH, "r", encoding="utf-8") as f:
        reg_data = json.load(f)

    existing_content = {}
    if OUTPUT_PATH.exists():
        with open(OUTPUT_PATH, "r", encoding="utf-8") as f:
            existing_content = json.load(f)

    existing_articles = existing_content.get("articles", {})
    topics = existing_content.get("topics", [])

    all_articles_map = {}
    reg_title_map = {}
    for reg in reg_data.get("regulations", []):
        r_id = reg["id"]
        reg_title_map[r_id] = f"PP No. {reg['number']} Tahun {reg['year']}"
        all_articles_map[r_id] = {}
        for chapter in reg.get("chapters", []):
            for art in chapter.get("articles", []):
                all_articles_map[r_id][art["number"]] = {
                    "page": art.get("page", 1),
                    "lastPage": art.get("lastPage", 1),
                    "chapter": art.get("chapter", chapter.get("title", ""))
                }

    generated_articles = dict(existing_articles)
    created_count = 0

    for reg in reg_data.get("regulations", []):
        reg_id = reg["id"]
        reg_title = reg_title_map[reg_id]
        
        for chapter in reg.get("chapters", []):
            ch_title = chapter.get("title", "")
            
            for art in chapter.get("articles", []):
                art_num = art["number"]
                key = f"{reg_id}|{art_num}"

                if key in existing_articles and existing_articles[key].get("status") == "reviewed":
                    continue

                text = art.get("text", "")
                page = art.get("page", 1)

                item_topics = determine_topics(art_num, text, ch_title, reg_id)
                core = build_core_summary(art_num, text, ch_title, reg_id)
                key_points = build_key_points(text)
                key_terms = find_key_terms(text)
                relations = build_relations(art_num, text, reg_id, all_articles_map)
                quiz = build_quiz(art_num, text, reg_id, reg_title, core, key_points, page)

                status = "reviewed" if reg_id == "pp-71-2021" else "draft"

                generated_articles[key] = {
                    "status": status,
                    "topics": item_topics,
                    "summary": {
                        "core": core,
                        "keyPoints": key_points,
                        "keyTerms": key_terms,
                        "sourcePage": page
                    },
                    "quiz": quiz,
                    "relations": relations
                }
                created_count += 1

    final_content = {
        "version": "1.1.0",
        "lastUpdated": "2026-11-19",
        "topics": topics,
        "articles": generated_articles
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(final_content, f, ensure_ascii=False, indent=2)

    print(f"Berhasil menghasilkan konten pembelajaran:")
    print(f" - Total artikel baru ditambahkan/diperbarui: {created_count}")
    print(f" - Total keseluruhan artikel dengan materi belajar: {len(generated_articles)}")


if __name__ == "__main__":
    main()
