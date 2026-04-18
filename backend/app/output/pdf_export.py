"""
HTML → PDF export via WeasyPrint.
Uses only system fonts — no network calls, works in Docker.
"""

import markdown as md_lib
import logging

logger = logging.getLogger(__name__)

REPORT_CSS = """
* { box-sizing: border-box; margin: 0; padding: 0; }

@page {
    size: A4;
    margin: 2.5cm 2.2cm;
}

body {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 10.5pt;
    line-height: 1.8;
    color: #1c1c2e;
}

h1 {
    font-size: 20pt;
    color: #0f2d5a;
    font-weight: bold;
    border-bottom: 2.5pt solid #c97b00;
    padding-bottom: 8pt;
    margin-bottom: 6pt;
    margin-top: 0;
}

h2 {
    font-size: 13pt;
    color: #0f2d5a;
    font-weight: bold;
    margin-top: 22pt;
    margin-bottom: 8pt;
    padding-left: 10pt;
    border-left: 3.5pt solid #c97b00;
}

h3 {
    font-size: 11pt;
    font-weight: bold;
    color: #1a3a6e;
    margin-top: 14pt;
    margin-bottom: 5pt;
}

p {
    margin-bottom: 8pt;
    orphans: 3;
    widows: 3;
}

strong { color: #0f2d5a; }

table {
    width: 100%;
    border-collapse: collapse;
    margin: 12pt 0;
    font-size: 9.5pt;
    page-break-inside: avoid;
}

th {
    background-color: #0f2d5a;
    color: white;
    padding: 6pt 10pt;
    text-align: left;
    font-weight: bold;
    font-size: 9pt;
}

td {
    padding: 6pt 10pt;
    border-bottom: 0.5pt solid #dde0ee;
    vertical-align: top;
}

tr:nth-child(even) td { background-color: #f5f6fb; }

code {
    background: #f0f1f8;
    padding: 1pt 4pt;
    font-family: 'Courier New', monospace;
    font-size: 9pt;
    border-radius: 2pt;
}

pre {
    background: #f0f1f8;
    padding: 10pt;
    margin: 10pt 0;
    font-family: 'Courier New', monospace;
    font-size: 9pt;
    overflow: hidden;
    page-break-inside: avoid;
}

hr {
    border: none;
    border-top: 0.5pt solid #d0d4e8;
    margin: 16pt 0;
}

ul, ol {
    padding-left: 18pt;
    margin-bottom: 8pt;
}

li { margin-bottom: 3pt; }

blockquote {
    border-left: 3pt solid #c97b00;
    padding: 6pt 12pt;
    margin: 10pt 0;
    color: #444;
    font-style: italic;
    background: #fffbf0;
}

a { color: #c97b00; text-decoration: none; }

.report-meta {
    font-size: 9pt;
    color: #666;
    margin-bottom: 18pt;
    padding-bottom: 10pt;
    border-bottom: 0.5pt solid #e0e4f0;
}
"""


def markdown_to_html(markdown_text: str) -> str:
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
    """Convert a markdown report to PDF bytes using WeasyPrint."""
    try:
        from weasyprint import HTML
    except ImportError:
        raise RuntimeError("WeasyPrint is not installed.")

    html_content = markdown_to_html(markdown_text)

    try:
        # Try modern WeasyPrint API first (v53+)
        pdf_bytes = HTML(string=html_content, base_url=None).write_pdf()
    except TypeError:
        # Fallback for older versions
        pdf_bytes = HTML(string=html_content).write_pdf()

    return pdf_bytes