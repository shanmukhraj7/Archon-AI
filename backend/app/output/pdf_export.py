"""
HTML → PDF export via WeasyPrint.
Converts a markdown report to a styled PDF in memory.
"""

import re
import markdown as md_lib


REPORT_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Source+Sans+3:wght@400;600&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
    font-family: 'Source Sans 3', sans-serif;
    font-size: 11pt;
    line-height: 1.7;
    color: #1a1a2e;
    padding: 40px 60px;
    max-width: 900px;
    margin: 0 auto;
}

h1 {
    font-family: 'Merriweather', serif;
    font-size: 22pt;
    color: #0f3460;
    margin-bottom: 8px;
    border-bottom: 3px solid #e94560;
    padding-bottom: 10px;
}

h2 {
    font-family: 'Merriweather', serif;
    font-size: 15pt;
    color: #0f3460;
    margin-top: 28px;
    margin-bottom: 10px;
    border-left: 4px solid #e94560;
    padding-left: 12px;
}

h3 {
    font-size: 12pt;
    font-weight: 600;
    color: #16213e;
    margin-top: 18px;
    margin-bottom: 6px;
}

p { margin-bottom: 10px; }

table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 10pt;
}

th {
    background: #0f3460;
    color: white;
    padding: 8px 12px;
    text-align: left;
    font-weight: 600;
}

td {
    padding: 7px 12px;
    border-bottom: 1px solid #e0e0e0;
}

tr:nth-child(even) td { background: #f8f9fa; }

code {
    background: #f0f0f0;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: monospace;
    font-size: 9pt;
}

hr {
    border: none;
    border-top: 1px solid #e0e0e0;
    margin: 20px 0;
}

ul, ol { padding-left: 24px; margin-bottom: 10px; }
li { margin-bottom: 4px; }

strong { color: #0f3460; }

.meta {
    font-size: 9pt;
    color: #666;
    margin-bottom: 24px;
}
"""


def markdown_to_html(markdown_text: str) -> str:
    """Convert markdown to HTML with table and fenced-code support."""
    html_body = md_lib.markdown(
        markdown_text,
        extensions=["tables", "fenced_code", "nl2br"],
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>{REPORT_CSS}</style>
</head>
<body>
{html_body}
</body>
</html>"""


def export_pdf(markdown_text: str) -> bytes:
    """
    Convert a markdown report to PDF bytes using WeasyPrint.
    """
    try:
        from weasyprint import HTML, CSS
    except ImportError:
        raise RuntimeError("WeasyPrint is not installed. Run: pip install weasyprint")

    html_content = markdown_to_html(markdown_text)
    pdf_bytes = HTML(string=html_content).write_pdf()
    return pdf_bytes