"""Headless walkthrough of index.html.

Holds the up arrow to walk to the first letter, checks the rope holds, opens and closes
the letter, and checks the counter. Then checks that dragging turns the camera without
moving her, and that holding the on-screen arrow walks her. Last, loads a phone-sized viewport. Screenshots go to scripts/out/. Exits non-zero on a page
error or a failed check.

Usage:
    pip install playwright && python -m playwright install chromium
    python3 scripts/smoke_test.py

Optional environment variables:
    THREE_LOCAL  path to a local three.min.js (r128), served instead of cdnjs
    CHROME_PATH  path to a Chromium binary, if not using Playwright's own
"""

import asyncio
import functools
import http.server
import os
import pathlib
import sys
import threading

from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "scripts" / "out"
THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
# Software WebGL is slow, so wait on page state with generous timeouts.
SLOW = 120_000


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def serve(root: pathlib.Path) -> tuple[http.server.ThreadingHTTPServer, str]:
    handler = functools.partial(QuietHandler, directory=str(root))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, f"http://127.0.0.1:{server.server_address[1]}/index.html"


async def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    server, url = serve(ROOT)
    errors: list[str] = []
    failures: list[str] = []

    async with async_playwright() as p:
        launch = {"args": ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]}
        if os.environ.get("CHROME_PATH"):
            launch["executable_path"] = os.environ["CHROME_PATH"]
        browser = await p.chromium.launch(**launch)

        async def new_page(**ctx_opts):
            ctx = await browser.new_context(**ctx_opts)
            page = await ctx.new_page()
            page.set_default_timeout(SLOW)  # screenshots wait for a frame, and software frames can take many seconds
            page.on("pageerror", lambda e: errors.append(str(e)))
            local = os.environ.get("THREE_LOCAL")
            if local:
                body = pathlib.Path(local).read_bytes()
                await page.route(THREE_URL, lambda route: route.fulfill(body=body, content_type="application/javascript"))
            return ctx, page

        # Desktop: intro -> walk -> first letter -> unlock
        ctx, page = await new_page(viewport={"width": 1100, "height": 690})
        await page.goto(url)
        await page.wait_for_selector("#intro:not([hidden])", timeout=SLOW)
        await page.wait_for_timeout(1500)
        await page.screenshot(path=OUT / "1_intro.png")

        await page.click("#enterBtn")
        await page.wait_for_selector("#firstHint:not([hidden])", timeout=SLOW)
        await page.keyboard.down("ArrowUp")
        await page.wait_for_selector("#prompt:not([hidden])", timeout=SLOW)
        await page.wait_for_timeout(3000)
        await page.screenshot(path=OUT / "2_first_letter.png")

        # Holding the arrow against a closed rope must not move the gate.
        gate_before = await page.evaluate("document.querySelector('#chCount').textContent")
        await page.wait_for_timeout(2500)
        gate_after = await page.evaluate("document.querySelector('#chCount').textContent")
        await page.keyboard.up("ArrowUp")
        if gate_after != gate_before:
            failures.append(f"walked past a locked letter: {gate_before} -> {gate_after}")

        await page.click("#promptBtn")
        await page.click("#sealBtn")
        await page.wait_for_selector(".env-stage.read", timeout=SLOW)
        await page.wait_for_timeout(2000)
        await page.screenshot(path=OUT / "3_letter.png")
        await page.click("#closeLetter")
        await page.wait_for_selector("#letter[hidden]", state="attached", timeout=SLOW)
        count = await page.evaluate("document.querySelector('#readCount').textContent")
        if count != "1":
            failures.append(f"expected 1 letter opened, page shows {count}")

        # Dragging turns the camera around her; it must not walk her.
        rail = "parseFloat(document.querySelector('#railHer').style.left)"
        before = await page.evaluate(rail)
        await page.mouse.move(300, 300)
        await page.mouse.down()
        for k in range(12):
            await page.mouse.move(300 + k * 30, 300 + k * 6)
            await page.wait_for_timeout(60)
        await page.mouse.up()
        await page.wait_for_timeout(1500)
        await page.screenshot(path=OUT / "3b_looking_around.png")
        if abs(await page.evaluate(rail) - before) > 0.5:
            failures.append("dragging the view moved her along the path")

        # Holding the on-screen forward arrow walks her.
        box = await page.locator("#padFwd").bounding_box()
        await page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        await page.mouse.down()
        try:
            await page.wait_for_function(f"{rail} > {before + 1}", timeout=SLOW)
        except Exception:
            failures.append("holding the on-screen arrow did not walk her")
        await page.mouse.up()
        await ctx.close()

        # Phone: intro and first steps
        ctx, page = await new_page(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
        await page.goto(url)
        await page.wait_for_selector("#intro:not([hidden])", timeout=SLOW)
        await page.wait_for_selector("#loader[hidden]", state="attached", timeout=SLOW)
        await page.screenshot(path=OUT / "4_phone_intro.png")
        await page.click("#enterBtn")
        await page.wait_for_selector("#firstHint:not([hidden])", timeout=SLOW)
        await page.wait_for_timeout(2500)
        await page.screenshot(path=OUT / "5_phone_walk.png")
        await ctx.close()

        await browser.close()
    server.shutdown()

    for e in errors:
        print("PAGE ERROR:", e)
    for f in failures:
        print("FAILED:", f)
    if errors or failures:
        return 1
    print(f"OK. Screenshots in {OUT.relative_to(ROOT)}/")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
