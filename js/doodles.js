const root = document.documentElement;
const hasMotion = root.classList.contains("has-motion");

function stampNameLetters() {
  const name = document.querySelector(".tag--name");
  const word = name.firstChild;
  const letters = [...word.textContent].map((letter, index) => {
    const span = document.createElement("span");
    span.className = "name-letter";
    span.textContent = letter;
    span.setAttribute("aria-hidden", "true");
    span.style.setProperty("--index", index);
    return span;
  });
  word.replaceWith(...letters);
}

if (hasMotion) stampNameLetters();

const walker = document.querySelector(".walker");
const me = walker.querySelector(".me");
const bubble = walker.querySelector(".bubble");
const pages = [...document.querySelectorAll("[data-spread]")];

const STRIDE = ["stride-a", "pass", "stride-b", "pass"];
const STRIDE_LENGTH = 70;
const BUBBLE_TIME = 3400;

const spreadLines = [
  "psst, scroll to turn the page",
  "try drawing on the paper!",
  "ooh, Seoul!",
  "a cookie is hiding on page 3",
  "semicolons: 1, me: 0",
  "thanks for reading!",
];

let lastScroll = scrollY;
let walked = 0;
let standTimer = 0;
let quietTimer = 0;
let currentSpread = 0;

function say(line) {
  bubble.textContent = line;
  bubble.classList.add("is-saying");
  clearTimeout(quietTimer);
  quietTimer = setTimeout(() => bubble.classList.remove("is-saying"), BUBBLE_TIME);
}

function hop() {
  walker.classList.remove("is-hopping");
  // Reading layout restarts the animation when she is clicked again mid-hop.
  void walker.offsetWidth;
  walker.classList.add("is-hopping");
  me.dataset.pose = "wave";
  clearTimeout(standTimer);
  standTimer = setTimeout(() => { me.dataset.pose = "stand"; }, 700);
}

function walk() {
  const distance = scrollY - lastScroll;
  lastScroll = scrollY;
  if (!distance) return;

  walked += Math.abs(distance);
  walker.classList.toggle("is-back", distance < 0);
  me.dataset.pose = STRIDE[Math.floor(walked / STRIDE_LENGTH) % STRIDE.length];

  const scrollable = root.scrollHeight - innerHeight;
  walker.style.setProperty("--walk", scrollable > 0 ? scrollY / scrollable : 0);

  clearTimeout(standTimer);
  standTimer = setTimeout(() => { me.dataset.pose = "stand"; }, 140);
}

me.addEventListener("click", () => {
  hop();
  say(spreadLines[currentSpread]);
});

document.addEventListener("spreadchange", ({ detail }) => {
  currentSpread = detail.spread;
  say(spreadLines[currentSpread]);
  redrawSketch();
  pages.forEach((page) => page.classList.toggle("is-current", Number(page.dataset.spread) === currentSpread));
});

if (hasMotion) addEventListener("scroll", walk, { passive: true });

const cookie = document.querySelector(".cookie");
const BITE_LINES = ["another one appeared!", "you found the cookie!", "mmm, one more", "last bite!"];
const CRUMBS = 7;

function scatterCrumbs() {
  for (let index = 0; index < CRUMBS; index += 1) {
    const crumb = document.createElement("span");
    const angle = Math.random() * Math.PI * 2;
    const reach = 30 + Math.random() * 40;

    crumb.className = "crumb";
    cookie.after(crumb);
    crumb.style.setProperty("left", `${cookie.offsetLeft + cookie.offsetWidth / 2}px`);
    crumb.style.setProperty("top", `${cookie.offsetTop + cookie.offsetHeight / 2}px`);
    crumb
      .animate(
        [
          { translate: "0 0", opacity: 1 },
          { translate: `${Math.cos(angle) * reach}px ${Math.sin(angle) * reach + 30}px`, opacity: 0 },
        ],
        { duration: 600, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      )
      .finished.then(() => crumb.remove());
  }
}

cookie.addEventListener("click", () => {
  const bites = (Number(cookie.dataset.bites) + 1) % BITE_LINES.length;
  cookie.dataset.bites = bites;
  say(BITE_LINES[bites]);
  if (hasMotion) {
    hop();
    scatterCrumbs();
  }
});

const stage = document.querySelector(".stage");
const sketch = document.querySelector(".sketch");
const eraser = document.querySelector(".eraser");
const pen = sketch.getContext("2d");
const strokesBySpread = new Map();
const PEN_WIDTH = 2.4;
const TURNING_AFTER = 0.2;

let activeStroke = null;

const strokesHere = () => strokesBySpread.get(currentSpread) ?? [];

function drawSegment(from, to) {
  pen.beginPath();
  pen.moveTo(from.x, from.y);
  pen.lineTo(to.x, to.y);
  pen.stroke();
}

function redrawSketch() {
  pen.clearRect(0, 0, innerWidth, innerHeight);
  strokesHere().forEach((stroke) => {
    stroke.forEach((point, index) => {
      if (index > 0) drawSegment(stroke[index - 1], point);
    });
  });
  eraser.hidden = strokesHere().length === 0;
}

function fitSketch() {
  const scale = devicePixelRatio;
  sketch.width = innerWidth * scale;
  sketch.height = innerHeight * scale;
  pen.setTransform(scale, 0, 0, scale, 0, 0);
  pen.lineCap = "round";
  pen.lineJoin = "round";
  pen.lineWidth = PEN_WIDTH;
  pen.strokeStyle = getComputedStyle(root).getPropertyValue("--ink");
  redrawSketch();
}

// Only bare paper starts a stroke, so selecting text and clicking links keep working as normal.
function startStroke(event) {
  const onBarePaper = event.target.classList.contains("page");
  if (!root.classList.contains("is-book") || !onBarePaper) return;
  if (event.pointerType === "touch" || event.button !== 0) return;

  event.preventDefault();
  activeStroke = [{ x: event.clientX, y: event.clientY }];
  strokesBySpread.set(currentSpread, [...strokesHere(), activeStroke]);
  stage.setPointerCapture(event.pointerId);
  eraser.hidden = false;
}

function continueStroke(event) {
  if (!activeStroke) return;
  const point = { x: event.clientX, y: event.clientY };
  drawSegment(activeStroke.at(-1), point);
  activeStroke.push(point);
}

function endStroke() {
  activeStroke = null;
}

function hideSketchWhileTurning() {
  const position = scrollY / innerHeight;
  sketch.classList.toggle("is-turning", Math.abs(position - Math.round(position)) >= TURNING_AFTER);
}

eraser.addEventListener("click", () => {
  strokesBySpread.delete(currentSpread);
  redrawSketch();
});
stage.addEventListener("pointerdown", startStroke);
stage.addEventListener("pointermove", continueStroke);
stage.addEventListener("pointerup", endStroke);
stage.addEventListener("pointercancel", endStroke);
addEventListener("scroll", hideSketchWhileTurning, { passive: true });
addEventListener("resize", fitSketch);
fitSketch();
