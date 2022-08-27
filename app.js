"use strict";

const MAX_MSG_SIZE = 400

const file_input         = $("DIV.form INPUT[type='file']");
const file_dropzone      = $("#drop-zone");
const send_submit_btn = $(".form.send BUTTON");
const bg_folder          = $("#bg-folder");
const get_submit_btn  = $("#bg-folder BUTTON");
const ws_input           = $("DIV.form.get  INPUT.ws")
const http_input         = $("DIV.form.send INPUT.http")

const usr_tok_input = $(".form.send INPUT.token")

const errbar = $(".errbar")

let received_file = ""

const get_headers = (token) => new Headers({
	"Content-Type":   "application/json",
	"Accept-Content": "application/json",
	"Authorization":  "Basic " + btoa(token),
});

const request_data = {


};

const pctage = (num, ofnum) => `${(num / ofnum * 100).toFixed(0)}%`

function set_errbar(text) {
	errbar.textContent = text
	
	errbar.classList.add("active")

	setTimeout(() => {
		errbar.classList.remove("active")
		errbar.textContent = ""
	}, 3000)
}

(function()
{
	const params = new URLSearchParams(window.location.search)

	//let this_page = new URL(window.location)
	//this_page.searchParams.append("apiEndpoint", "foo")
	//this_page.searchParams.append("apiToken",    "bar")

	if (!params) {
		return
	}

	const api_token    = params.get("apiEndpoint")
	const api_endpoint = params.get("apiToken")

	http_input.value    = api_endpoint
	usr_tok_input.value = api_token
	ws_input.value      = api_endpoint
	$("DIV.form.get INPUT.token").value = api_token
})();

(async function()
{
	let file;

	file_dropzone.addEventListener("dragover", ev => {
		ev.preventDefault()
	})
	file_dropzone.addEventListener("drop", ev => {
		file = get_file_drop(ev)
	});
	file_input.addEventListener("change", () => {
		if (file = file_input.files[0])
			console.log(file)
			update_file_input(file)
	});

	send_submit_btn.addEventListener("click", async () => {
		const target_http    = $(".form.send INPUT.http ").value
		const target_token   = $(".form.send INPUT.token").value
		const target_address = $(".form.send INPUT.address").value

		if (!file || !target_http || !target_token || !target_address) {
			set_errbar("Please fill out all fields.")
			//send_submit_btn.textContent = "Something's wrong!"
		}

		if (!await send_file(file, target_http, target_token, target_address)) {
			send_submit_btn.textContent = "somethings wrong"
			//send_submit_button.classList.add("err")

			return
		}

		send_submit_btn.textContent = "File Sent!"
		Collapse_prompt()
	});

	get_submit_btn.addEventListener("click", async () => {
		const from_ws    = $(".form.get INPUT.ws").value
		const from_token = $(".form.get INPUT.token").value
		
		console.log("trying to fetch")
		
		if (!from_ws && !from_token)
			set_errbar("Please fill out all fields.")

		if (await fetch_file(from_ws, from_token))
			console.log("done?")

		get_submit_btn.textContent = "Please Wait..."
	});
})();

function
get_file_drop(ev)
{
	ev.preventDefault()
	let file;

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

function
gen_download_link(name, dataURL)
{
	const link = document.createElement("A")

	link.download    = name
	link.href        = dataURL
	link.textContent = name
	link.className   = "download-icon"

	bg_folder.appendChild(link)
}

async function
dataURL_from_file(file)
{
	return new Promise((resolve,reject) => {
		const reader = new FileReader()

		reader.readAsDataURL(file)

		reader.onload  = _   => resolve(reader.result)
		reader.onerror = err => reject(err)
	})
}

async function
update_file_input(file)
{
	let reader = new FileReader()
	let text   = await file.text()

	let file_icon = document.createElement("DIV")

	file_icon.classList += "file-icon"
	file_icon.classList += " prompt-item"

	file_icon.innerHTML = `${file.name}<BR/>
	                       ${(file.size/1024).toFixed(2)}kB`

	file_icon.onclick = () => {
		file_input.disabled = true
		file_input.value    = null
		file_dropzone.removeChild(file_icon)
		setTimeout(_ => {file_input.disabled = false}, 100)
	}

	file_dropzone.appendChild(file_icon)
}

async function
handle_received_chunk(data)
{
	received_file += get_decoded_msg(data)
}

function
get_decoded_msg(data)
{
	const td = new TextDecoder()

	console.log("decode_ws_message: raw data: ", data)

	const rlp_u8arr = new Uint8Array(JSON.parse(`[${data}]`))

	const deco_u8arr = (decode_RLP(rlp_u8arr))[0]
	console.log("decode_ws_message: deco_u8arr: ", deco_u8arr)

	let decostr = td.decode(deco_u8arr)
	console.log("decode_ws_message: decostr: ", decostr.toString())

	return decostr
}

async function
send_file(file, http_url, token, addr)
{
	const dataURL = await dataURL_from_file(file)
	const address = await fetch_hopr_address(http_url, token)

	if (!dataURL) {
		return false
	}

	const nchunks = Math.ceil(dataURL.length / MAX_MSG_SIZE)
	let acc     = new Array(nchunks)

	const meta = JSON.stringify({
		filename: file.name,
		nchunks:  nchunks,
		/*filesize:*/
	})

	/* Send the metadata first. */
	await send_msg(http_url,
	               meta,
	               address,
	               token)


	let i = 0, from = 0
	while (i < nchunks) {
		send_submit_btn.innerHTML = `Please Wait...<BR/>
		                             ${pctage(i, nchunks)} Sent`
		acc[i] = dataURL.substr(from, MAX_MSG_SIZE)

		console.log(`sending chunk ${i}/${nchunks}...`)
		await send_msg(http_url,
		               acc[i],
		               address,
		               token)

		from += MAX_MSG_SIZE
		i++
	}

	return true
}

async function
fetch_hopr_address(http_url, token)
{
	let url = new URL(http_url)
	url.protocol = "https:"
	url.pathname = "/api/v2/account/addresses"

	const headers = get_headers(token)

	const account = await fetch(url, {
	            headers: headers,
	}).then(res => res.json())

	return account.hopr
}

async function
send_msg(to_http, message, address, token)
{
	const url = new URL(to_http)
	url.pathname = "/api/v2/messages"

	const headers = get_headers(token)

	const body = JSON.stringify({
        	recipient: address,
        	body:      message,
	});

	const req = {
        	method: "POST",
        	headers: headers,
        	body:    body,
	}

	await fetch(url, req)
}

async function
fetch_file(from_url, token)
{
	const ws_url    = new URL(from_url)
	ws_url.protocol = "wss:"
	ws_url.pathname = "/api/v2/messages/websocket"
	ws_url.search   = "?apiToken=" + token

	let meta      = null
	let first     = true
	let remaining = null

	const socket = new WebSocket(ws_url)

	let err;

	socket.onopen = (ev) => {
		console.log("socket opened!")
		bg_folder.style.border    = "3px solid limegreen"
		bg_folder.style.borderTop = "none"
	}

	socket.onerror = (ev) => {
		err = true;

		set_errbar("Can't reach that HOPR node, please try again later.")
		//get_submit_btn.innerHTML = "Can't reach that websocket. Sorry! <BR/> Click to try again"
		//get_submit_btn.classList.add("err")
	}

	const handle_message = (ev) => {
		if (first) {
			const deco = get_decoded_msg(ev.data)

			meta = JSON.parse(get_decoded_msg(ev.data))

			console.log("evdata string: ", deco.toString())

			remaining = meta.nchunks

			first = false
			return
		}

		get_submit_btn.innerHTML = `Please Wait...<BR/>
		                            ${pctage(meta.nchunks, remaining)} Received`

		console.log("got a chunk from the websocket")
		handle_received_chunk(ev.data)

		remaining--
		console.log(remaining, meta.nchunks)

		if (remaining <= 0) {
			get_submit_btn.textContent = "Done!"
			gen_download_link(meta.filename, received_file)

			remaining = null
			first     = true
		}
	}

	socket.addEventListener("message", handle_message)

	const close = () => {
		console.log("CONNECTION CLOSED")
	}

	socket.onclose = () => {
		if (err) {
			return false;
		}
		close();
	}
}
