import unittest

from scripts.extract_regulations import article_marker, join_text, parse_articles


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


class NumberedPointTests(unittest.TestCase):
    def test_repairs_split_item_number_and_displaced_digit(self):
        lines = [
            ("10. Kegiatan Lainnya adalah bidang usaha di luar KEK.", 3),
            ("1.", 3),
            ("Barang adalah setiap benda, baik berwujud maupun", 3),
            ("1", 3),
            ("tidak berwujud, baik bergerak maupun tidak bergerak.", 3),
            ("12. Barang Kena Pajak adalah barang yang dikenai pajak.", 3),
        ]

        text = join_text(lines)

        self.assertEqual(
            text,
            "10. Kegiatan Lainnya adalah bidang usaha di luar KEK.\n"
            "11. Barang adalah setiap benda, baik berwujud maupun tidak berwujud, "
            "baik bergerak maupun tidak bergerak.\n"
            "12. Barang Kena Pajak adalah barang yang dikenai pajak.",
        )

    def test_does_not_repair_a_reset_without_displaced_digit(self):
        text = join_text([
            "10. Kelompok pertama.",
            "1. Kelompok berikutnya.",
            "12. Kelompok terakhir.",
        ])

        self.assertIn("\n1. Kelompok berikutnya.", text)

    def test_removes_truncated_duplicate_points_with_repeated_periods(self):
        lines = [
            ("17. Jasa. .", 3),
            ("17. Jasa Kena Pajak adalah jasa yang dikenai pajak.", 4),
            ("4. Hak. .", 2),
            ("4. Hak Pengelolaan adalah hak menguasai dari negara.", 3),
            ("14. Pimpinan . .", 4),
            ("14. Pimpinan Instansi adalah pimpinan lembaga negara.", 4),
        ]

        text = join_text(lines)

        for stub in ("17. Jasa. .", "4. Hak. .", "14. Pimpinan . ."):
            self.assertNotIn(stub, text)
        self.assertIn("17. Jasa Kena Pajak adalah jasa yang dikenai pajak.", text)
        self.assertIn("4. Hak Pengelolaan adalah hak menguasai dari negara.", text)
        self.assertIn("14. Pimpinan Instansi adalah pimpinan lembaga negara.", text)


if __name__ == "__main__":
    unittest.main()
