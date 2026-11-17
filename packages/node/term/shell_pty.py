"""Run a command on a pseudo-terminal of a set size, relaying stdin and stdout over pipes.

usage: shell_pty.py ROWS COLS COMMAND [ARG...]
The dev-server terminal plugin spawns this, because Node has no pty of its own and macOS
script(1) refuses a piped stdin. When stdin closes, the terminal is hung up, so the command
does not outlive the dev server. Exits with the command's exit status.
"""
import fcntl
import os
import pty
import select
import struct
import sys
import termios

rows, cols = int(sys.argv[1]), int(sys.argv[2])
pid, fd = pty.fork()
if pid == 0:
    os.execvp(sys.argv[3], sys.argv[3:])
fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", rows, cols, 0, 0))
while True:
    readable, _, _ = select.select([fd, 0], [], [])
    try:
        if fd in readable:
            data = os.read(fd, 65536)
            if not data:
                break
            os.write(1, data)
        if 0 in readable:
            data = os.read(0, 65536)
            if not data:
                break
            os.write(fd, data)
    except OSError:
        break
os.close(fd)
_, status = os.waitpid(pid, 0)
sys.exit(os.waitstatus_to_exitcode(status) if os.WIFEXITED(status) else 1)
