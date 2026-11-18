import unittest

from scripts.extract_regulations import article_marker, parse_articles


class ArticleMarkerTests(unittest.TestCase):
    def test_accepts_marker_without_space_before_number(self):
        self.assertEqual(article_marker([("Pasal24", 1)], 0), ("24", 0))
        self.assertEqual(article_marker([("PasaJ22", 1)], 0), ("22", 0))

    def test_normalizes_split_and_misread_digits(self):
        lines = [("Pasal 1 10", 1), ("Pasal4T", 2)]
        self.assertEqual(article_marker(lines, 0), ("110", 0))
        self.assertEqual(article_marker(lines, 1), ("47", 1))

    def test_extracts_articles_with_ocr_variants(self):
        lines = [
            ("Pasal24", 21),
            ("Ketentuan pertama.", 21),
            ("Pasal 1 10", 69),
            ("Ketentuan kedua.", 69),
            ("Pasal4T", 33),
            ("Ketentuan ketiga.", 33),
        ]

        articles = parse_articles(lines)

        self.assertEqual(
            [article["number"] for article in articles],
            ["Pasal 24", "Pasal 110", "Pasal 47"],
        )
        self.assertTrue(all(article["text"] for article in articles))

    def test_merges_article_marker_repeated_across_page_break(self):
        lines = [
            ("Pasal 9 1", 58),
            ("Teks bagian pertama.", 58),
            ("Pasal 9", 59),
            ("1", 59),
            ("Teks bagian lanjutan.", 59),
        ]

        articles = parse_articles(lines)

        self.assertEqual(len(articles), 1)
        self.assertEqual(articles[0]["number"], "Pasal 91")
        self.assertIn("Teks bagian pertama.", articles[0]["text"])
        self.assertIn("Teks bagian lanjutan.", articles[0]["text"])


if __name__ == "__main__":
    unittest.main()
