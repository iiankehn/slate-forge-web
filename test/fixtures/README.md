The DejaVu Sans font fixture is a small glyph subset of DejaVuSans.ttf,
covering ASCII, é, Greek and Cyrillic characters for PDF appearance tests.
It was produced with fonttools pyftsubset; see DejaVu-LICENSE.txt.

The French and Russian PNGs contain “Bonjour café” and “Привет мир”,
rendered in DejaVu Sans at 42 points on a white background. They exercise
the actual local Tesseract WASM engine; they are synthetic printed-text
fixtures, not evidence of camera/OCR accuracy on physical devices.

DejaVuSans-bidi-subset.ttf is a DejaVu Sans subset covering Latin, Hebrew, Arabic and directional controls, retaining shaping tables. It was generated with fonttools pyftsubset using U+0000–00FF, U+0590–06FF and U+2000–206F with all layout features. It uses the same DejaVu license in DejaVu-LICENSE.txt and is only a regression fixture; users choose their own local PDF font.
