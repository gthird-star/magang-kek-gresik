import sys
lines = [l for l in sys.stdin.read().splitlines() if not l.strip().startswith(" Co-authored-by:\)]
