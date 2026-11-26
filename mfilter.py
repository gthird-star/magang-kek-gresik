
import sys
content = sys.stdin.read()
lines = [l for l in content.splitlines() if 'Co-authored-by:' not in l]
sys.stdout.write('\n'.join(lines) + '\n')
