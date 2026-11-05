const root = document.documentElement;
const leaves = [...document.querySelectorAll(".leaf")];
const pages = [...document.querySelectorAll("[data-spread]")];
const tabs = [...document.querySelectorAll("[data-spread-link]")];
const bookQuery = window.notebookQuery;

// Share of each screen of scrolling where a page rests before it starts to turn.
const REST = 0.2;

const clamp = (value) => Math.min(1, Math.max(0, value));
const easeInOut = (value) => value * value * (3 - 2 * value);
const spreadAtScroll = () => Math.round(scrollY / innerHeight);

function setActiveTab(spread) {
  const links = tabs.map((tab) => Number(tab.dataset.spreadLink));
  const current = links.findLast((link) => link <= spread);
  tabs.forEach((tab, index) => tab.setAttribute("aria-current", String(links[index] === current)));
}

function openSpread(spread) {
  if (root.classList.contains("is-opening")) return;
  pages
    .filter((page) => Number(page.dataset.spread) === spread)
    .forEach((page) => page.classList.add("is-open"));
}

function renderBook() {
  const position = scrollY / innerHeight;

  leaves.forEach((leaf, index) => {
    const turn = easeInOut(clamp((position - index - REST) / (1 - REST * 2)));
    const isTurning = turn > 0 && turn < 1;

    leaf.style.setProperty("--t", turn);
    leaf.style.setProperty("--bend", Math.sin(turn * Math.PI));
    // Unturned sheets stack first-on-top; turned sheets stack last-on-top, like a real book.
    leaf.style.setProperty("--z", isTurning ? leaves.length + 1 : turn === 0 ? leaves.length - index : index + 1);
  });

  const spread = Math.round(position);
  setActiveTab(spread);
  // Marks only draw once the sheet has settled, not while it is still swinging past.
  if (Math.abs(position - spread) < REST) openSpread(spread);
}

let frame = 0;
function onScroll() {
  if (!root.classList.contains("is-book") || frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    renderBook();
  });
}

function goToSpread(spread, behavior) {
  scrollTo({ top: spread * innerHeight, behavior });
}

function followAnchor(event) {
  const link = event.target.closest('a[href^="#"]');
  if (!link || !root.classList.contains("is-book")) return;

  const target = document.querySelector(link.hash);
  if (!target) return;

  event.preventDefault();
  history.pushState(null, "", link.hash);
  goToSpread(Number(target.dataset.spread), "smooth");
}

// Keyboard users can tab to links on a page that is still unturned, so bring that spread up.
function revealFocusedPage(event) {
  const page = event.target.closest("[data-spread]");
  if (!page || !root.classList.contains("is-book")) return;

  const spread = Number(page.dataset.spread);
  if (spread !== spreadAtScroll()) goToSpread(spread, "instant");
}

function syncMode() {
  root.classList.toggle("is-book", bookQuery.matches);
  if (bookQuery.matches) renderBook();
}

function finishOpening() {
  sessionStorage.setItem("notebook-opened", "1");
  root.classList.remove("is-opening");
  cover.remove();
  if (root.classList.contains("is-book")) renderBook();
}

// On the single-column page there is no turning, so marks draw as each page scrolls in.
const flowObserver = new IntersectionObserver((entries) => {
  entries
    .filter((entry) => entry.isIntersecting && !root.classList.contains("is-book") && !root.classList.contains("is-opening"))
    .forEach((entry) => entry.target.classList.add("is-open"));
}, { threshold: 0.3 });
pages.forEach((page) => flowObserver.observe(page));

addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", onScroll);
document.addEventListener("click", followAnchor);
document.addEventListener("focusin", revealFocusedPage);
bookQuery.addEventListener("change", syncMode);

const cover = document.querySelector(".cover");
if (root.classList.contains("is-opening")) cover.addEventListener("animationend", finishOpening, { once: true });

syncMode();
if (root.classList.contains("is-book") && location.hash) {
  const target = document.querySelector(location.hash);
  if (target) goToSpread(Number(target.dataset.spread), "instant");
}
