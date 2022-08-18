"use strict";

const MAX_MSG_SIZE = 400

const send_form          = $(".prompt FORM");
const file_input         = $("FORM input[type='file']");
const file_dropzone      = $("#drop-zone");
const send_submit_button = $(".prompt BUTTON");
const bg_folder          = $("#background-folder");
const get_form           = $("#background-folder FORM");
const get_submit_button  = $("#background-folder BUTTON");

let received_file = "";

(async function main() {
	let file;

	file_dropzone.addEventListener("dragover", ev => {
		ev.preventDefault()
		console.log("dragged over")
	})
	file_input.addEventListener("change", () => {
		if (file = file_input.files[0])
			update_file_input(file)
	});
	file_dropzone.addEventListener("drop", ev => {
		file = get_file_drop(ev)
	});

	send_submit_button.addEventListener("click", async () => {
		console.log($("FORM.send INPUT.http "))
		let target_http  = $("FORM.send INPUT.http ").value
		let target_token = $("FORM.send INPUT.token").value

		console.log(target_http)

		if (!file) {
			console.log("file null ffs")
			console.log("please choose a file")
		}

		console.log(file)

		if (!await send_file(file, target_http)) {
			console.log("fucked up!")
			send_submit_button.textContent = "somethings wrong"
			send_submit_button.classList.add("err")

			return
		}

		Collapse_prompt()
	});

	get_submit_button.addEventListener("click", async () => {
		console.log($("FORM.get INPUT.ws"))
		console.log($("FORM.get INPUT.token"))

		const from_ws    = $("FORM.get INPUT.ws").value
		const from_token = $("FORM.get INPUT.token").value
		
		fetch_file(from_ws, from_token)
	});
})()

function get_file_drop(ev) {
	ev.preventDefault()
	let file;

        console.log("dropped something in")

        if (!ev.dataTransfer.items) {
                return;
        }

        for (let i = 0; i < ev.dataTransfer.items.length; i++) {
                if (ev.dataTransfer.items[i].kind !== "file") {
                        return;
                }
                file = ev.dataTransfer.items[i].getAsFile();
		update_file_input(file)
        }
	return file
}


function gen_download_link(name, dataURL) {
	const link       = document.createElement("A")
	link.download    = name
	link.href        = dataURL
	link.textContent = name
	link.className   = "download-icon"

	bg_folder.appendChild(link)

	//link.click()

	//document.body.removeChild(link)
}

async function file_to_dataURL(file) {
	return new Promise((resolve,reject) => {
		const reader = new FileReader()

		reader.readAsDataURL(file)

		reader.onload  = _   => resolve(reader.result)
		reader.onerror = err => reject(err)
	})
}

async function update_file_input(file) {
	let reader = new FileReader()
	let text   = await file.text()

	let file_icon = document.createElement("DIV")

	file_icon.className   = "file-icon"
	file_icon.textContent = file.name
	//file_icon.onclick     = this.remove

	file_dropzone.appendChild(file_icon)
}

async function handle_received_chunk() {
	received_file += event.data
}

async function send_file(file, http_endpoint) {
	const dataURL = await file_to_dataURL(file)
	const address = await fetch_hopr_address(http_endpoint, "")

	if (!dataURL) {
		return false
	}

	let nchunks = Math.ceil(dataURL.length / MAX_MSG_SIZE)
	let acc     = new Array(nchunks)

	let i = 0, from = 0
	while (i < nchunks) {
		acc[i] = dataURL.substr(from, MAX_MSG_SIZE)

		await send_message(http_endpoint,
		                   acc[i],
		                   address,
		                   "foo-token")
		      .catch(() => {return false})

		from += MAX_MSG_SIZE
		i++
	}

	return true
}

async function fetch_hopr_address(http_endpoint, token) {
	const headers = new Headers({"Content-Type":   "application/json",
	                             "Accept-Content": "application/json",
	                             "Authorization":  "Basic " + btoa(token)});

	const account = await fetch(`http://${http_endpoint}/api/v2/account/address`, {
	            method: "POST",
	            headers: headers,
	}).then(res => res.json())

	console.log(account.hoprAddress)

	return account.hoprAddress
}

async function send_message(to_http, message, address, token) {
	const headers = new Headers({
		"Content-Type":   "application/json",
		"Accept-Content": "application/json"
	});

	const recipient = address;

	await fetch(`http://${to_http}/api/v2/messages`, {
	            method: "POST",
	            headers: headers,
	            body: JSON.stringify({
                    	recipient: recipient,
                    	body:      message,
	            })}).catch(err => {return false; console.log("?")});
}

async function fetch_file(from_ws, token) {
	const URL    = `ws://${from_ws}/ws`
	const socket = new WebSocket(URL)

	socket.onerror = (ev) => {
		socket.removeEventListener("close", close)
		console.log("socket error: ", ev)

		get_submit_button.textContent = "Can't reach that websocket. Sorry! <BR/> Click to try again"
		get_submit_button.classList.add("err")
	}

	socket.addEventListener("message", async (event) => {
		handle_received_chunk()
	});

	const close = () => {
		gen_download_link("name", received_file)
	}

	socket.onclose = close;
}
