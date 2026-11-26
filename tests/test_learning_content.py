import json
import unittest
from pathlib import Path

from scripts.validate_learning_content import (
    build_regulations_index,
    validate_learning_content,
)

ROOT = Path(__file__).resolve().parent.parent


class LearningContentValidationTests(unittest.TestCase):
    def setUp(self):
        self.mock_regulations = {
            "regulations": [
                {
                    "id": "pp-40-2021",
                    "number": "40",
                    "year": 2021,
                    "title": "Penyelenggaraan KEK",
                    "pdfPages": 100,
                    "chapters": [
                        {
                            "title": "BAB I",
                            "articles": [
                                {"number": "Pasal 1", "page": 1, "lastPage": 3},
                                {"number": "Pasal 2", "page": 4, "lastPage": 5},
                            ],
                        }
                    ],
                },
                {
                    "id": "pp-71-2021",
                    "number": "71",
                    "year": 2021,
                    "title": "KEK Gresik",
                    "pdfPages": 20,
                    "chapters": [
                        {
                            "title": "BAB I",
                            "articles": [
                                {"number": "Pasal 5", "page": 3, "lastPage": 3},
                            ],
                        }
                    ],
                },
            ]
        }
        self.reg_index = build_regulations_index(self.mock_regulations)

    def test_detects_invalid_article_key(self):
        content = {
            "version": "1.0.0",
            "topics": [{"id": "umum", "label": "Umum"}],
            "articles": {
                "invalid-format": {"status": "draft"},
                "pp-unknown|Pasal 1": {"status": "draft"},
                "pp-40-2021|Pasal 999": {"status": "draft"},
            },
        }
        errors = validate_learning_content(content, self.reg_index)
        self.assertTrue(any("invalid-format" in e for e in errors))
        self.assertTrue(any("pp-unknown" in e for e in errors))
        self.assertTrue(any("Pasal 999" in e for e in errors))

    def test_detects_invalid_topic(self):
        content = {
            "version": "1.0.0",
            "topics": [{"id": "umum", "label": "Umum"}],
            "articles": {
                "pp-40-2021|Pasal 1": {
                    "status": "draft",
                    "topics": ["belum_terdaftar"],
                }
            },
        }
        errors = validate_learning_content(content, self.reg_index)
        self.assertTrue(any("belum_terdaftar" in e for e in errors))

    def test_detects_invalid_quiz(self):
        content = {
            "version": "1.0.0",
            "topics": [{"id": "umum", "label": "Umum"}],
            "articles": {
                "pp-40-2021|Pasal 1": {
                    "status": "reviewed",
                    "quiz": [
                        {
                            "id": "q1",
                            "question": "Apa itu KEK?",
                            "options": ["A"],  # Kurang dari 2 opsi
                            "correctIndex": 5,  # Di luar index
                            "explanation": "",
                            "sourceReference": "",
                        }
                    ],
                }
            },
        }
        errors = validate_learning_content(content, self.reg_index)
        self.assertTrue(any("minimal 2 opsi" in e for e in errors))
        self.assertTrue(any("correctIndex" in e for e in errors))
        self.assertTrue(any("explanation" in e for e in errors))

    def test_detects_invalid_relation_target(self):
        content = {
            "version": "1.0.0",
            "topics": [{"id": "umum", "label": "Umum"}],
            "articles": {
                "pp-40-2021|Pasal 1": {
                    "status": "reviewed",
                    "relations": [
                        {
                            "targetRegulationId": "pp-71-2021",
                            "targetArticle": "Pasal 999",  # Target tidak ada
                            "relationType": "invalid_type",
                            "note": "Hubungan pengujian.",
                        }
                    ],
                }
            },
        }
        errors = validate_learning_content(content, self.reg_index)
        self.assertTrue(any("targetArticle 'Pasal 999'" in e for e in errors))
        self.assertTrue(any("relationType 'invalid_type'" in e for e in errors))

    def test_validates_actual_data_file_if_present(self):
        real_content_path = ROOT / "data" / "learning-content.json"
        real_reg_path = ROOT / "data" / "regulations.json"
        if real_content_path.exists() and real_reg_path.exists():
            with open(real_reg_path, "r", encoding="utf-8") as f:
                reg_data = json.load(f)
            index = build_regulations_index(reg_data)
            with open(real_content_path, "r", encoding="utf-8") as f:
                content = json.load(f)
            errors = validate_learning_content(content, index)
            self.assertEqual(errors, [], f"Data aktual memiliki kesalahan validasi: {errors}")


if __name__ == "__main__":
    unittest.main()
