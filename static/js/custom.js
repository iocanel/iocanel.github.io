document.addEventListener("DOMContentLoaded", function () {
  var box = document.querySelector(".position-relative > .Box.mt-4");
  if (!box) return;

  var article = box.querySelector("article.markdown-body");
  var textMono = box.querySelector(".text-mono");
  if (!article) return;

  // Hide the readme content during intro and crawl
  article.style.display = "none";
  if (textMono) textMono.style.display = "none";

  // Ensure the box is a positioning context
  box.style.position = "relative";
  box.style.overflow = "hidden";
  box.style.minHeight = "400px";

  // Create the Star Wars intro inside the box
  var intro = document.createElement("div");
  intro.className = "starwars-intro";
  var img = document.createElement("img");
  img.className = "starwars-intro-text";
  img.src = "/images/logo-sw.png";
  img.alt = "iocanel.com";
  intro.appendChild(img);
  box.appendChild(intro);

  // Start crawl as soon as logo fades out (70% of 2.5s = 1.75s)
  setTimeout(function () {
    intro.remove();
    article.style.display = "";
    box.classList.add("crawl-active");

    article.addEventListener("animationend", function () {
      box.classList.remove("crawl-active");
      box.style.minHeight = "";
      if (textMono) textMono.style.display = "";
    });
  }, 1750);
});
