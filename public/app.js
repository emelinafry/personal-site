const NOT_SET_UP = "The assistant is not set up yet.";

const section = document.querySelector(".ask");
const form = document.querySelector("#ask-form");
const input = document.querySelector("#ask-input");
const button = form.querySelector("button");
const answer = document.querySelector("#ask-answer");

document.querySelector("#year").textContent = new Date().getFullYear();

function show(text, state) {
  answer.textContent = text;
  answer.dataset.state = state;
}

function disable() {
  input.disabled = true;
  button.disabled = true;
}

if (section.dataset.ready !== "true") {
  disable();
  show(NOT_SET_UP, "muted");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = input.value.trim();
  if (!question) return;

  button.disabled = true;
  show("Thinking…", "muted");

  try {
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await response.json().catch(() => ({}));

    if (response.ok && data.answer) {
      show(data.answer, "answer");
    } else {
      show(data.error || "Something went wrong. Try again.", "error");
      if (response.status === 503) {
        disable();
        return;
      }
    }
  } catch {
    show("Couldn't reach the site. Check your connection and try again.", "error");
  }

  button.disabled = false;
});
