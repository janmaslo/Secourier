const button = document.querySelector(".button");
const prompt = document.querySelector(".prompt");
const promptKids = document.querySelectorAll(".prompt *");

button.addEventListener("click", () => {
	button.classList.add("pressed");
	/* prompt.hidden = false; */
	prompt.classList.add("extended");
	promptKids.forEach(child => {
		child.style.visibility = "visible";
		child.style.opacity = 100;
	});
});
