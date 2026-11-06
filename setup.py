#!/usr/bin/env python3
"""Client Hunter installer (Python 3, standard library only).

  python3 setup.py                 install for Claude Code / Cowork into ~/.claude/skills
  python3 setup.py --project       install into ./.claude/skills of the current project
  python3 setup.py --target DIR    install into another skills folder
  python3 setup.py --copy          copy files instead of symlinking (automatic fallback on Windows)
  python3 setup.py --bundle        build dist/client-hunter.skill, one file for the Claude app
  python3 setup.py --check         show what is installed where
  python3 setup.py --uninstall     remove what this installer added (never touches your ledger)
  python3 setup.py --claude-md F   add a short Client Hunter section to the CLAUDE.md file F
"""
import argparse
import os
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

SUITE = Path(__file__).resolve().parent
NAME = "client-hunter"
STAGES = ["ch-profile", "ch-scout", "ch-sweep", "ch-vet", "ch-qualify", "ch-draft", "ch-ledger", "ch-retro"]
MARKER = ".client-hunter-install"
COPY_SKIP = {".git", ".github", "dist", "__pycache__", ".DS_Store", "node_modules"}
BUNDLE_SKIP = COPY_SKIP | {".gitignore", "setup.py", "setup", "INSTALL.md", "install-windows.ps1", "connectors", "node_modules"}

CLAUDE_MD_SECTION = """
## Client Hunter

Client Hunter skills are installed. Say "Client Hunter" to run the whole pipeline on autopilot, "Client Hunter, hunt" for a run with check-ins, or call one stage: /ch-profile, /ch-scout, /ch-sweep, /ch-vet, /ch-qualify, /ch-draft, /ch-ledger, /ch-retro. Paste any job post or client message and ask "is this legit?" to vet it. If the skills stop loading, run `python3 ~/.claude/skills/client-hunter/setup.py` again.
"""


def say(msg):
    print(msg, flush=True)


def is_ours(path):
    """True if path is a symlink into this suite or a copy made by this installer."""
    if path.is_symlink():
        try:
            return SUITE in path.resolve().parents or path.resolve() == SUITE
        except OSError:
            return False
    return (path / MARKER).exists()


def remove(path):
    if path.is_symlink() or path.is_file():
        path.unlink()
    elif path.is_dir():
        shutil.rmtree(path)


def ignore(_dir, names):
    return [n for n in names if n in COPY_SKIP or n.endswith(".pyc")]


def ignore_bundle(_dir, names):
    return [n for n in names if n in BUNDLE_SKIP or n.endswith(".pyc")]


def place(src, dst, copy):
    """Link or copy src to dst. Returns the method used."""
    if dst.exists() or dst.is_symlink():
        if not is_ours(dst):
            say(f"  skip {dst} (exists and was not created by Client Hunter)")
            return "skipped"
        remove(dst)
    if not copy:
        try:
            os.symlink(src, dst, target_is_directory=True)
            return "linked"
        except (OSError, NotImplementedError):
            say("  symlinks not available here, copying instead (re-run setup after updates)")
    shutil.copytree(src, dst, ignore=ignore)
    (dst / MARKER).write_text(str(SUITE), encoding="utf-8")
    return "copied"


def install(target, copy):
    target.mkdir(parents=True, exist_ok=True)
    suite_dst = target / NAME
    if suite_dst.resolve() == SUITE:
        say(f"Suite already lives at {SUITE}")
    else:
        say(f"{place(SUITE, suite_dst, copy)}: {suite_dst}")
    for stage in STAGES:
        say(f"{place(SUITE / stage, target / stage, copy)}: {target / stage}")
    say("\nInstalled. Start a new Claude Code session (or reload skills) and say: \"Client Hunter\".")
    say("First run interviews you once (offers, prices, red lines), then hunts on its own.")


def uninstall(target):
    for name in [NAME] + STAGES:
        p = target / name
        if p.resolve() == SUITE:
            say(f"keep {p} (this is the source folder; delete it yourself if you want)")
            continue
        if (p.exists() or p.is_symlink()) and is_ours(p):
            remove(p)
            say(f"removed {p}")
    say("Done. Your ledger (Claude artifact or ~/.client-hunter) was not touched.")


def check(target):
    for name in [NAME] + STAGES:
        p = target / name
        if p.resolve() == SUITE and not p.is_symlink():
            state = "source folder (cloned here)"
        elif p.is_symlink():
            state = f"link -> {os.readlink(p)}"
        elif (p / "SKILL.md").exists():
            state = "copy" if (p / MARKER).exists() else "present (not from this installer)"
        else:
            state = "missing"
        say(f"{name:14} {state}")


def build_bundle(separate):
    """Build one uploadable skill: the orchestrator with every stage inside as STAGE.md."""
    dist = SUITE / "dist"
    dist.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp) / NAME
        shutil.copytree(SUITE, root, ignore=ignore_bundle)
        for stage in STAGES:
            skill_md = root / stage / "SKILL.md"
            if skill_md.exists():
                skill_md.rename(root / stage / "STAGE.md")
        found = [p for p in root.rglob("SKILL.md")]
        if len(found) != 1:
            sys.exit(f"Bundle must contain exactly one SKILL.md, found {len(found)}: {found}")
        out = dist / f"{NAME}.skill"
        with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
            for f in sorted(root.rglob("*")):
                if f.is_file():
                    z.write(f, f.relative_to(root.parent))
        say(f"Built {out} ({out.stat().st_size // 1024} KB): one skill for the Claude app.")
    if separate:
        for stage in STAGES:
            out = dist / f"{stage}.skill"
            with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
                for f in sorted((SUITE / stage).rglob("*")):
                    if f.is_file() and "__pycache__" not in f.parts and not f.name.endswith(".pyc"):
                        z.write(f, f.relative_to(SUITE))
        say("Also built one .skill per stage in dist/ (only needed if you prefer separate skills).")


def add_claude_md(path):
    path = Path(path).expanduser()
    text = path.read_text(encoding="utf-8") if path.exists() else ""
    if "## Client Hunter" in text:
        say(f"{path} already has a Client Hunter section")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + "\n" + CLAUDE_MD_SECTION, encoding="utf-8")
    say(f"Added Client Hunter section to {path}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--target", help="skills folder to install into")
    ap.add_argument("--project", action="store_true", help="install into ./.claude/skills")
    ap.add_argument("--copy", action="store_true", help="copy instead of symlink")
    ap.add_argument("--bundle", action="store_true", help="build dist/client-hunter.skill for the Claude app")
    ap.add_argument("--separate", action="store_true", help="with --bundle, also build one .skill per stage")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--uninstall", action="store_true")
    ap.add_argument("--claude-md", help="path of a CLAUDE.md to add a Client Hunter section to")
    a = ap.parse_args()

    if a.bundle:
        build_bundle(a.separate)
        return
    target = Path(a.target).expanduser() if a.target else (Path.cwd() / ".claude" / "skills" if a.project else Path.home() / ".claude" / "skills")
    if a.check:
        check(target)
    elif a.uninstall:
        uninstall(target)
    else:
        install(target, a.copy)
    if a.claude_md:
        add_claude_md(a.claude_md)


if __name__ == "__main__":
    main()
