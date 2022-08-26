const $ = document.querySelector.bind(document);

const full            = $("#full-folder");
const send_button     = $(".btn.send");
const download_button = $(".btn.download");
const prompt          = $(".prompt");

const front = $(".front");

(function() {
	send_button.addEventListener("click", () => {
		console.log("adding pressed")
		send_button.classList.add("pressed");
		console.log("added pressed?")
		setTimeout(Extend_prompt, 200)
	});

	download_button.addEventListener("click", () => {
		download_button.classList.add("pressed");
		full.classList.add("open")

		let x = document.createElement("div")
		x.classList = "close-button"

		x.onclick = () => {
			download_button.classList.remove("pressed");
			full.classList.remove("open")
			x.remove()
		}

		front.appendChild(x)
	});
})()

function Collapse_prompt() {
	send_button.classList.remove("pressed")
	send_button.innerText = "Send more!";

	prompt.classList.remove("centered");
	setTimeout(() => {
		prompt.classList.remove("extended");
		$("BODY").classList.remove("blurred");
	}, 1200);

	document.body.removeEventListener("click", minimize_prompt)
}

function Extend_prompt() {
	prompt.classList.add("extended");

	setTimeout(() => {
		prompt.classList.add("centered");
		document.body.classList.add("blurred");

		document.body.addEventListener("click", minimize_prompt)
	}, 800)
}

function minimize_prompt(ev) {
	send_button.classList.remove("pressed")

	if (prompt.contains(ev.target) || ev.target.classList.contains("prompt-item"))
		return

	prompt.classList.remove("extended");
	document.body.classList.remove("blurred");
	prompt.classList.remove("centered");
}
