const button = document.querySelector(".button");
const prompt = document.querySelector(".prompt");
const promptKids = document.querySelectorAll(".prompt *");

const submit_button = document.querySelector("FORM>BUTTON");

function extend_prompt() {
	button.classList.add("pressed");
	/* prompt.hidden = false; */
	prompt.classList.add("extended");
	promptKids.forEach(child => {
		child.style.visibility = "visible";
		child.style.opacity = 100;
	});
}
	
function collapse_prompt() {
	prompt.style.height = 0;
	promptKids.forEach(child => {
		child.style.visibility = "hidden";
		child.style.opacity = 0;
	});
	prompt.innerText = "Your Files Have Been Sent!";
	button.innerText = "Spread The Word [ico]";
	button.style.background = "#4429E0";
}


button.onclick = extend_prompt;
submit_button.onclick = collapse_prompt;
