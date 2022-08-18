const $ = document.querySelector.bind(document);

const full            = $("#full-folder");
const send_button     = $(".button.send");
const download_button = $(".button.download");
const prompt          = $(".prompt");
const background_folder = $("#background-folder");

const front = $(".front");

(function() {
	send_button.addEventListener("click", () => {
		Extend_prompt();
	});

	download_button.addEventListener("click", () => {
		full.classList.add("pulled-up")
		background_folder.classList.add("revealed")
	});
})()

function Collapse_prompt() {
	button.innerText = "Send more!";

	prompt.classList.remove("centered");
	setTimeout(() => {
		prompt.classList.remove("extended");
		$("BODY").classList.remove("blurred");
	}, 1200);

	document.body.removeEventListener("click", minimize_prompt)
}

function Extend_prompt() {
	send_button.classList.add("pressed");

	prompt.classList.add("extended");

	setTimeout(() => {
		prompt.classList.add("centered");
		document.body.classList.add("blurred");

		document.body.addEventListener("click", minimize_prompt)
	}, 800)
}

function minimize_prompt(ev) {
	if (ev.target == prompt || prompt.contains(ev.target))
		return

	prompt.classList.remove("extended");
	document.body.classList.remove("blurred");
	prompt.classList.remove("centered");
}
