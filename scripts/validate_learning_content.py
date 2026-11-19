import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REGULATIONS_PATH = ROOT / "data" / "regulations.json"
LEARNING_CONTENT_PATH = ROOT / "data" / "learning-content.json"

ALLOWED_STATUSES = {"draft", "reviewed"}
ALLOWED_RELATION_TYPES = {"explicit_reference", "topic_relation"}


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def build_regulations_index(regulations_data):
    index = {}
    for reg in regulations_data.get("regulations", []):
        reg_id = reg.get("id")
        pdf_pages = reg.get("pdfPages", 0)
        articles = {}
        for chapter in reg.get("chapters", []):
            for article in chapter.get("articles", []):
                articles[article.get("number")] = {
                    "page": article.get("page"),
                    "lastPage": article.get("lastPage"),
                    "chapter": article.get("chapter"),
                }
        index[reg_id] = {
            "title": reg.get("title"),
            "number": reg.get("number"),
            "year": reg.get("year"),
            "pdfPages": pdf_pages,
            "articles": articles,
        }
    return index


def validate_learning_content(content, reg_index):
    errors = []

    if not isinstance(content, dict):
        return ["Data learning-content harus berupa JSON object / dictionary."]

    if "version" not in content:
        errors.append("Field 'version' wajib ada pada learning-content.")

    topics = content.get("topics", [])
    if not isinstance(topics, list):
        errors.append("Field 'topics' harus berupa array.")
        topic_ids = set()
    else:
        topic_ids = set()
        for idx, t in enumerate(topics):
            if not isinstance(t, dict):
                errors.append(f"Topic index {idx} harus berupa object.")
                continue
            tid = t.get("id")
            if not tid or not isinstance(tid, str):
                errors.append(f"Topic index {idx} tidak memiliki 'id' string yang valid.")
            elif tid in topic_ids:
                errors.append(f"Topic id duplikat: '{tid}'.")
            else:
                topic_ids.add(tid)
            if not t.get("label") or not isinstance(t.get("label"), str):
                errors.append(f"Topic '{tid}' tidak memiliki label yang valid.")

    articles = content.get("articles", {})
    if not isinstance(articles, dict):
        errors.append("Field 'articles' harus berupa object.")
        return errors

    seen_quiz_ids = set()

    for key, item in articles.items():
        if "|" not in key:
            errors.append(f"Key '{key}' tidak valid. Format harus 'regulationId|NomorPasal'.")
            continue

        reg_id, art_num = key.split("|", 1)
        if reg_id not in reg_index:
            errors.append(f"Key '{key}': regulasi '{reg_id}' tidak ditemukan di regulations.json.")
            continue

        reg_info = reg_index[reg_id]
        if art_num not in reg_info["articles"]:
            errors.append(f"Key '{key}': pasal '{art_num}' tidak ditemukan dalam regulasi '{reg_id}'.")
            continue

        if not isinstance(item, dict):
            errors.append(f"Entri '{key}' harus berupa object.")
            continue

        # Status check
        status = item.get("status")
        if status not in ALLOWED_STATUSES:
            errors.append(f"Key '{key}': status '{status}' tidak valid. Harus salah satu dari {ALLOWED_STATUSES}.")

        # Topics check
        item_topics = item.get("topics", [])
        if not isinstance(item_topics, list):
            errors.append(f"Key '{key}': 'topics' harus berupa array.")
        else:
            for top in item_topics:
                if top not in topic_ids:
                    errors.append(f"Key '{key}': topic '{top}' belum terdaftar di daftar 'topics'.")

        # Summary check
        if "summary" in item and item["summary"] is not None:
            summary = item["summary"]
            if not isinstance(summary, dict):
                errors.append(f"Key '{key}': 'summary' harus berupa object.")
            else:
                core = summary.get("core")
                if not core or not isinstance(core, str):
                    errors.append(f"Key '{key}': summary.core harus berupa string non-kosong.")

                key_points = summary.get("keyPoints", [])
                if not isinstance(key_points, list):
                    errors.append(f"Key '{key}': summary.keyPoints harus berupa array.")

                key_terms = summary.get("keyTerms", [])
                if not isinstance(key_terms, list):
                    errors.append(f"Key '{key}': summary.keyTerms harus berupa array.")
                else:
                    for kt_idx, kt in enumerate(key_terms):
                        if not isinstance(kt, dict) or not kt.get("term") or not kt.get("definition"):
                            errors.append(f"Key '{key}': summary.keyTerms[{kt_idx}] harus memiliki 'term' dan 'definition'.")

                source_page = summary.get("sourcePage")
                if source_page is not None:
                    if not isinstance(source_page, int) or source_page < 1 or source_page > reg_info["pdfPages"]:
                        errors.append(f"Key '{key}': summary.sourcePage ({source_page}) di luar halaman PDF (1-{reg_info['pdfPages']}).")

        # Quiz check
        if "quiz" in item and item["quiz"] is not None:
            quizzes = item["quiz"]
            if not isinstance(quizzes, list):
                errors.append(f"Key '{key}': 'quiz' harus berupa array.")
            else:
                for q_idx, q in enumerate(quizzes):
                    if not isinstance(q, dict):
                        errors.append(f"Key '{key}': quiz[{q_idx}] harus berupa object.")
                        continue
                    qid = q.get("id")
                    if not qid or not isinstance(qid, str):
                        errors.append(f"Key '{key}': quiz[{q_idx}] harus memiliki 'id' unik.")
                    elif qid in seen_quiz_ids:
                        errors.append(f"Quiz ID duplikat: '{qid}' pada key '{key}'.")
                    else:
                        seen_quiz_ids.add(qid)

                    if not q.get("question") or not isinstance(q.get("question"), str):
                        errors.append(f"Key '{key}': quiz[{q_idx}] memiliki 'question' kosong.")

                    options = q.get("options")
                    if not isinstance(options, list) or len(options) < 2:
                        errors.append(f"Key '{key}': quiz[{q_idx}] harus memiliki minimal 2 opsi.")

                    correct_idx = q.get("correctIndex")
                    opt_len = len(options) if isinstance(options, list) else 0
                    if not isinstance(correct_idx, int) or correct_idx < 0 or (opt_len > 0 and correct_idx >= opt_len):
                        errors.append(f"Key '{key}': quiz[{q_idx}] memiliki correctIndex ({correct_idx}) di luar panjang opsi ({opt_len}).")

                    if not q.get("explanation") or not isinstance(q.get("explanation"), str):
                        errors.append(f"Key '{key}': quiz[{q_idx}] harus memiliki 'explanation'.")
                    if not q.get("sourceReference") or not isinstance(q.get("sourceReference"), str):
                        errors.append(f"Key '{key}': quiz[{q_idx}] harus memiliki 'sourceReference'.")

        # Relations check
        if "relations" in item and item["relations"] is not None:
            relations = item["relations"]
            if not isinstance(relations, list):
                errors.append(f"Key '{key}': 'relations' harus berupa array.")
            else:
                for r_idx, rel in enumerate(relations):
                    if not isinstance(rel, dict):
                        errors.append(f"Key '{key}': relations[{r_idx}] harus berupa object.")
                        continue

                    target_reg = rel.get("targetRegulationId")
                    target_art = rel.get("targetArticle")

                    if not target_reg or target_reg not in reg_index:
                        errors.append(f"Key '{key}': relations[{r_idx}] targetRegulationId '{target_reg}' tidak ditemukan.")
                    else:
                        if not target_art or target_art not in reg_index[target_reg]["articles"]:
                            errors.append(f"Key '{key}': relations[{r_idx}] targetArticle '{target_art}' tidak ditemukan di '{target_reg}'.")

                    rel_type = rel.get("relationType")
                    if rel_type not in ALLOWED_RELATION_TYPES:
                        errors.append(f"Key '{key}': relations[{r_idx}] relationType '{rel_type}' tidak valid. Harus {ALLOWED_RELATION_TYPES}.")

                    if not rel.get("note") or not isinstance(rel.get("note"), str):
                        errors.append(f"Key '{key}': relations[{r_idx}] harus memiliki penjelasan 'note'.")

    return errors


def main():
    if not REGULATIONS_PATH.exists():
        print(f"Error: {REGULATIONS_PATH} tidak ditemukan.")
        sys.exit(1)
    if not LEARNING_CONTENT_PATH.exists():
        print(f"Error: {LEARNING_CONTENT_PATH} tidak ditemukan.")
        sys.exit(1)

    reg_data = load_json(REGULATIONS_PATH)
    reg_index = build_regulations_index(reg_data)

    content = load_json(LEARNING_CONTENT_PATH)
    errors = validate_learning_content(content, reg_index)

    if errors:
        print(f"Validasi GAGAL ({len(errors)} kesalahan):")
        for err in errors:
            print(f" - {err}")
        sys.exit(1)
    else:
        article_count = len(content.get("articles", {}))
        quiz_count = sum(len(a.get("quiz", [])) for a in content.get("articles", {}).values())
        relation_count = sum(len(a.get("relations", [])) for a in content.get("articles", {}).values())
        print("Validasi learning-content BERHASIL:")
        print(f" - Total entri artikel: {article_count}")
        print(f" - Total kuis: {quiz_count}")
        print(f" - Total relasi: {relation_count}")
        print(f" - Total topik: {len(content.get('topics', []))}")
        sys.exit(0)


if __name__ == "__main__":
    main()
