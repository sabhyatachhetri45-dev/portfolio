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
});

if (hasMotion) addEventListener("scroll", walk, { passive: true });
