"""
HTML → PDF export via WeasyPrint.
Converts a markdown report to a styled PDF in memory.
Uses only system-safe fonts to avoid WeasyPrint network/font errors.
"""

import markdown as md_lib


REPORT_CSS = """
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 11pt;
    line-height: 1.75;
    color: #1a1a2e;
    padding: 48px 64px;
}

h1 {
    font-family: Georgia, serif;
    font-size: 22pt;
    color: #0f3460;
    margin-bottom: 6px;
    border-bottom: 3px solid #e94560;
    padding-bottom: 10px;
    margin-top: 0;
}

h2 {
    font-family: Georgia, serif;
    font-size: 14pt;
    color: #0f3460;
    margin-top: 28px;
    margin-bottom: 10px;
    border-left: 4px solid #e94560;
    padding-left: 12px;
}

h3 {
    font-size: 12pt;
    font-weight: bold;
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
    font-weight: bold;
}

td {
    padding: 7px 12px;
    border-bottom: 1px solid #e0e0e0;
}

tr:nth-child(even) td { background: #f8f9fa; }

code {
    background: #f0f0f0;
    padding: 2px 5px;
    font-family: 'Courier New', monospace;
    font-size: 9pt;
}

hr {
    border: none;
    border-top: 1px solid #ddd;
    margin: 20px 0;
}

ul, ol { padding-left: 22px; margin-bottom: 10px; }
li { margin-bottom: 4px; }
strong { color: #0f3460; }
a { color: #e94560; text-decoration: none; }

blockquote {
    border-left: 3px solid #e94560;
    padding-left: 14px;
    color: #555;
    margin: 12px 0;
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
        raise RuntimeError("WeasyPrint is not installed. Run: pip install weasyprint")

    html_content = markdown_to_html(markdown_text)

    # Disable network access to avoid font/resource fetch errors in Docker
    pdf_bytes = HTML(string=html_content, base_url=None).write_pdf(
        presentational_hints=True,
    )
    return pdf_bytes