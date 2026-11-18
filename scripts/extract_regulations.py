import json
import re
from pathlib import Path

import pdfplumber


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "data" / "regulations.json"
REGULATIONS = [
    {
        "id": "pp-40-2021",
        "file": "PP_40_2021.pdf",
        "number": "40",
        "year": 2021,
        "title": "Penyelenggaraan Kawasan Ekonomi Khusus",
    },
    {
        "id": "pp-71-2021",
        "file": "PP_71_2021.pdf",
        "number": "71",
        "year": 2021,
        "title": "Kawasan Ekonomi Khusus Gresik",
    },
    {
        "id": "pp-48-2025",
        "file": "PP_48_2025.pdf",
        "number": "48",
        "year": 2025,
        "title": "Penertiban Kawasan dan Tanah Telantar",
    },
]

ARTICLE_MARKER = re.compile(
    r"^\s*Pasa(?:l|J|\])\s*([0-9O]+(?:\s+[0-9O]+)*[A-Za-z]?)?\s*$",
    re.IGNORECASE,
)
CHAPTER_MARKER = re.compile(r"^\s*BAB\s+([IVXLCDM]+)(?:\s*[-–:]?\s*(.*))?$", re.IGNORECASE)
PART_MARKER = re.compile(r"^\s*(Bagian|Paragraf)\s+.+$", re.IGNORECASE)
SIGNATURE_MARKER = re.compile(
    r"^\s*(?:Agar setiap orang mengetahuinya|Ditetapkan di\b.*|Diundangkan di\b.*|"
    r"PRESIDEN REPUBLIK INDONESIA\b.*|MENTERI (?:HUKUM|SEKRETARIS NEGARA)\b.*|ttd\b.*|"
    r"TAMBAHAN LEMBARAN NEGARA\b.*|LEMBARAN NEGARA REPUBLIK INDONESIA\b.*|"
    r"Salinan sesuai dengan aslinya\b.*|KEMENTERIAN SEKRETARIAT NEGARA\b.*)"
)
PAGE_NOISE = re.compile(
    r"^(?:PRES\s*IDEN|PRESIDEN|PFIESIDEN|FRESIDEN|REPUBLIK INDONESIA|"
    r"REPUELIK(?: INOONESIA| INDONESIA)?|UBLIK INOONESIA|R,?E?PUBLIK INDONESIA|"
    r"[A-Z]{1,3}E?PUB[A-Z]*\s+(?:INDONESIA|INOONESIA)|t aft\{I-IiN|K|INDONESIA|"
    r"Bagian|-\s*\d+\s*-|SK\s*No\b|\.+|"
    r"BAB\s*[IVXLCDM]+\s*\.{2,}|\d+\s*\.{2,}\s*(?:Pasal)?)$",
    re.IGNORECASE,
)
LIST_ITEM = re.compile(r"^(?:\([0-9]+\)|[0-9]+[.)]|[a-z][.)])(?:\s+|$)", re.IGNORECASE)
TRUNCATED_ITEM = re.compile(r"^(\d+)\.\s+[^.]+(?:\.\s*)*$")
TRUNCATED_LETTER_ITEM = re.compile(r"^([a-z])\.\s+.{1,28}$", re.IGNORECASE)


def normalize_number(value):
    value = re.sub(r"\s+", "", value.upper()).replace("O", "0")
    if value.endswith("T") and value[:-1].isdigit():
        value = f"{value[:-1]}7"
    return value


def clean_line(value):
    if re.fullmatch(r"\s*BAB[IVXLCDM]+(?:\s+.*)?", value, re.IGNORECASE):
        return ""
    value = re.sub(
        r"\s*(?:PRES\s*IDEN|PFIESIDEN|FRESIDEN|REPU\w*|UBLIK INOONESIA|"
        r"BUK INDONESIA|R,?E?PUBLIK INDONESIA|[A-Z]{1,3}E?PUB[A-Z]*\s+(?:INDONESIA|INOONESIA))\b.*$",
        "",
        value,
    )
    value = re.sub(r"\s*SK\s*No.*$", "", value, flags=re.IGNORECASE)
    value = re.sub(r"\s*[-–]\s*\d+\s*[-–]\s*$", "", value)
    value = re.sub(r"\s+", " ", value).strip()
    value = re.sub(r"^(\d+)\.(?=\S)", r"\1. ", value)
    value = re.sub(r"^([a-z])\.(?=\S)", r"\1. ", value, flags=re.IGNORECASE)
    if not value or PAGE_NOISE.fullmatch(value):
        return ""
    return value


def repair_split_point_number(lines):
    markers = []
    for index, line in enumerate(lines):
        match = re.match(r"^(\d+)\.(?:\s|$)", line)
        if match:
            markers.append((index, match.group(1)))

    repairs = []
    for marker_index in range(1, len(markers) - 1):
        line_index, number = markers[marker_index]
        if (
            number != "1"
            or markers[marker_index - 1][1] != "10"
            or markers[marker_index + 1][1] != "12"
        ):
            continue

        next_marker_index = markers[marker_index + 1][0]
        for orphan_index in range(line_index + 2, next_marker_index):
            if (
                lines[orphan_index] == "1"
                and lines[orphan_index - 1].rstrip().endswith("maupun")
                and lines[orphan_index + 1].lstrip().startswith("tidak berwujud")
            ):
                repairs.append((line_index, orphan_index))
                break

    for line_index, orphan_index in reversed(repairs):
        # The PDF text order displaced the second digit of item 11 into its definition.
        lines[line_index] = re.sub(r"^1\.", "11.", lines[line_index], count=1)
        del lines[orphan_index]


def join_text(lines):
    result = ""
    cleaned = []
    for item in lines:
        line = clean_line(item[0] if isinstance(item, tuple) else item)
        if line:
            cleaned.append(line)

    repair_split_point_number(cleaned)

    kept = []
    for index, line in enumerate(cleaned):
        stub = TRUNCATED_ITEM.fullmatch(line)
        if stub and any(
            re.match(rf"^{re.escape(stub.group(1))}\.(?:\s|$)", following)
            for following in cleaned[index + 1 : index + 3]
        ):
            continue
        letter_stub = TRUNCATED_LETTER_ITEM.fullmatch(line)
        if letter_stub and any(
            re.match(rf"^{re.escape(letter_stub.group(1))}\.\s", following, re.IGNORECASE)
            for following in cleaned[index + 1 : index + 3]
        ):
            continue
        kept.append(line)

    for line in kept:
        if not line:
            continue
        if not result:
            result = line
        elif LIST_ITEM.match(line):
            result += "\n" + line
        else:
            result += " " + line
    return result.strip()


def article_marker(lines, index, previous_number=""):
    match = ARTICLE_MARKER.fullmatch(lines[index][0])
    if not match:
        return None, index
    number = match.group(1)
    if number:
        number = normalize_number(number)
        if index + 1 < len(lines):
            following = re.sub(r"\s+", "", lines[index + 1][0])
            previous = re.match(r"\d+", previous_number)
            if (
                previous
                and re.fullmatch(r"[0-9O]", number)
                and re.fullmatch(r"[0-9O]", following)
            ):
                combined = int(number + normalize_number(following))
                if (
                    combined == int(previous.group())
                    or int(previous.group()) < combined <= int(previous.group()) + 2
                ):
                    return number + normalize_number(following), index + 1
        return number, index
    if index + 1 < len(lines):
        following = re.sub(r"\s+", "", lines[index + 1][0])
        if re.fullmatch(r"[0-9O]+[A-Za-z]?", following):
            return normalize_number(following), index + 1
    return None, index


def parse_articles(lines):
    articles = []
    current = None
    chapter_number = ""
    chapter_title = ""
    part = ""
    pending_chapter_title = False

    def finish():
        nonlocal current
        if current is None:
            return
        current["text"] = join_text(current.pop("lines"))
        if current["text"]:
            current["chapter"] = (
                f"BAB {chapter_number} - {chapter_title}".strip(" -")
                if chapter_number
                else ""
            )
            current["part"] = part
            if articles and articles[-1]["number"] == current["number"]:
                previous = articles[-1]
                if not previous["text"]:
                    articles[-1] = current
                elif current["text"] and current["text"] not in previous["text"]:
                    previous["text"] = f'{previous["text"]}\n{current["text"]}'
                    previous["lastPage"] = current["page"]
            else:
                articles.append(current)
        current = None

    index = 0
    while index < len(lines):
        raw_line, page = lines[index]
        if raw_line.strip().lower() == "agar":
            index += 1
            continue
        if re.search(r"Agar\s+setiap\s+orang", raw_line, re.IGNORECASE):
            preceding = re.split(
                r"Agar\s+setiap\s+orang",
                raw_line,
                maxsplit=1,
                flags=re.IGNORECASE,
            )[0]
            if current is not None and clean_line(preceding):
                current["lines"].append((preceding, page))
                current["lastPage"] = page
            finish()
            break
        line = clean_line(raw_line)
        if SIGNATURE_MARKER.match(line):
            finish()
            break
        chapter = CHAPTER_MARKER.fullmatch(line)
        if chapter:
            finish()
            chapter_number = chapter.group(1).upper()
            chapter_title = chapter.group(2).strip()
            pending_chapter_title = not bool(chapter_title)
            part = ""
            index += 1
            continue
        if pending_chapter_title and line:
            if not ARTICLE_MARKER.fullmatch(line) and not PART_MARKER.fullmatch(line):
                chapter_title = line
                pending_chapter_title = False
                index += 1
                continue
        if PART_MARKER.fullmatch(line):
            finish()
            part = line
            index += 1
            continue

        previous_number = (
            current["number"].split()[-1]
            if current is not None
            else articles[-1]["number"].split()[-1] if articles else ""
        )
        number, marker_end = article_marker(lines, index, previous_number)
        if number:
            finish()
            current = {
                "number": f"Pasal {number}",
                "page": page,
                "lastPage": page,
                "lines": [],
            }
            index = marker_end + 1
            continue

        if current is not None and line:
            current["lines"].append((line, page))
            current["lastPage"] = page
        index += 1

    finish()
    return articles


def split_sections(pages):
    lines = []
    for page_number, text in enumerate(pages, start=1):
        lines.extend((line, page_number) for line in text.splitlines())

    explanation_index = next(
        (
            index
            for index, (line, _) in enumerate(lines)
            if re.fullmatch(r"\s*PENJELASAN\s*", line, re.IGNORECASE)
        ),
        len(lines),
    )
    operative_lines = lines[:explanation_index]
    explanation_lines = lines[explanation_index + 1 :]

    pasal_demi_index = next(
        (
            index
            for index, (line, _) in enumerate(explanation_lines)
            if re.fullmatch(r"\s*PASAL\s+DEMI\s+PASAL\s*", line, re.IGNORECASE)
        ),
        len(explanation_lines),
    )
    general_explanation = join_text(
        line for line, _ in explanation_lines[:pasal_demi_index]
    )
    article_explanation_lines = explanation_lines[pasal_demi_index + 1 :]

    return (
        parse_articles(operative_lines),
        parse_articles(article_explanation_lines),
        general_explanation,
    )


def extract_regulation(metadata):
    path = ROOT / metadata["file"]
    with pdfplumber.open(path) as pdf:
        pages = [page.extract_text() or "" for page in pdf.pages]
        articles, explanations, general_explanation = split_sections(pages)
        explanation_by_number = {item["number"]: item for item in explanations}
        for article in articles:
            explanation = explanation_by_number.get(article["number"])
            if explanation:
                article["explanation"] = explanation["text"]
                article["explanationPage"] = explanation["page"]

        return {
            **metadata,
            "pdfPages": len(pdf.pages),
            "pdf": metadata["file"],
            "generalExplanation": general_explanation,
            "chapters": [
                {
                    "title": chapter,
                    "articles": [article for article in articles if article["chapter"] == chapter],
                }
                for chapter in dict.fromkeys(article["chapter"] for article in articles)
            ],
            "articleCount": len(articles),
            "explanationCount": len(explanations),
        }


def main():
    data = {
        "sourceNote": (
            "Teks pasal dan penjelasan diekstrak dari PDF yang disertakan. "
            "Periksa PDF sumber untuk tata letak dan kemungkinan kesalahan ekstraksi."
        ),
        "regulations": [extract_regulation(item) for item in REGULATIONS],
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT}")
    for regulation in data["regulations"]:
        print(
            f'{regulation["id"]}: {regulation["articleCount"]} pasal, '
            f'{regulation["explanationCount"]} penjelasan, {regulation["pdfPages"]} halaman'
        )


if __name__ == "__main__":
    main()
