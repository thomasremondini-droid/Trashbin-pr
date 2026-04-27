window.addEventListener("scroll", () => {
  const hero = document.querySelector(".hero");
  const about = document.querySelector(".about");

  let position = about.getBoundingClientRect().top;
  let screen = window.innerHeight;

  if (position < screen - 20) {
    hero.classList.add("shrink");
    about.classList.add("show");
  }else {
    hero.classList.remove("shrink");
    about.classList.remove("show");
  }
});