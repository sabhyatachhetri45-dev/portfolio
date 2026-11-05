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
