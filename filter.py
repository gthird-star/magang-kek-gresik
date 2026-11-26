import sys
content = sys.stdin.read()
filtered = [l for l in content.splitlines() if not l.strip().startswith(" Co-authored-by:\)]
