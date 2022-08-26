"use strict";

const MAX_MSG_SIZE = 400

const file_input         = $("DIV.form INPUT[type='file']");
const file_dropzone      = $("#drop-zone");
const send_submit_button = $(".form.send BUTTON");
const bg_folder          = $("#bg-folder");
const get_submit_button  = $("#bg-folder BUTTON");

const ws_input   = $("DIV.form.get  INPUT.ws")
const http_input = $("DIV.form.send INPUT.http")

const usr_tok_input = $(".form.send INPUT.token")

let received_file = ""

const get_headers = (token) => new Headers({
	"Content-Type":   "application/json",
	"Accept-Content": "application/json",
	"Authorization":  "Basic " + btoa(token),
});

(function()
{
	let params = new URLSearchParams(window.location.search)

	//let this_page = new URL(window.location)
	//this_page.searchParams.append("apiEndpoint", "foo")
	//this_page.searchParams.append("apiToken",    "bar")

	//console.log(this_page)
	//console.log(this_page.toString())

	if (!params) {
		return
	}

	let api_token    = params.get("apiEndpoint")
	let api_endpoint = params.get("apiToken")

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

	send_submit_button.addEventListener("click", async () => {
		let target_http    = $(".form.send INPUT.http ").value
		let target_token   = $(".form.send INPUT.token").value
		let target_address = $(".form.send INPUT.address").value

		if (!file) {
			send_submit_button.textContent = "Something's wrong!"
			send_submit_button.classList.add("err")
		}

		console.log(file)
		//send_submit_button.textContent = "Please Wait..."

		if (!await send_file(file, target_http, target_token, target_address)) {
			send_submit_button.textContent = "somethings wrong"
			send_submit_button.classList.add("err")

			return
		}

		send_submit_button.textContent = "File Sent!"
		Collapse_prompt()
	});

	get_submit_button.addEventListener("click", async () => {
		const from_ws    = $(".form.get INPUT.ws").value
		const from_token = $(".form.get INPUT.token").value
		
		
		console.log("trying to fetch")

		if (await fetch_file(from_ws, from_token))
			console.log("done?")

		get_submit_button.textContent = "Please Wait..."
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
file_to_dataURL(file)
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
	console.log("got something from the ws")
	
	received_file += decode_ws_message(data)
}

function
decode_ws_message(data)
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
send_file(file, http_endpoint, token, addr)
{
	const dataURL = await file_to_dataURL(file)
	const address = await fetch_hopr_address(http_endpoint, token)

	if (!dataURL) {
		return false
	}

	let nchunks = Math.ceil(dataURL.length / MAX_MSG_SIZE)
	let acc     = new Array(nchunks)

	const meta = JSON.stringify({
		filename: file.name,
		nchunks:  nchunks,
		/*filesize:*/
	})

	console.log("SENDING META")
	await send_message(http_endpoint,
	                   meta,
	                   address,
	                   token)

	console.log("SENT META")

	let i = 0, from = 0
	while (i < nchunks) {
		send_submit_button.innerHTML = `Please Wait...<BR/>${(i/nchunks).toFixed()*100}% Sent`
		acc[i] = dataURL.substr(from, MAX_MSG_SIZE)

		console.log(`sending chunk ${i}/${nchunks}...`)
		await send_message(http_endpoint,
		                   acc[i],
		                   address,
		                   token)

		from += MAX_MSG_SIZE
		i++
	}

	return true
}

async function
fetch_hopr_address(http_endpoint, token)
{
	const headers = get_headers(token)

	const account = await fetch(`${http_endpoint}/api/v2/account/addresses`, {
	            headers: headers,
	}).then(res => res.json())

	return account.hopr
}


async function
send_message(to_http, message, address, token)
{
	const headers = get_headers(token)

	console.log("recipient's peer id: ", address)
	console.log("message: ", message.slice(0, 25))
	console.log("message full len: ", message.length)

	const bod = JSON.stringify({
                    	recipient: address,
                    	body:      message,
	});
	console.log("body: ", bod)

	await fetch(`${to_http}/api/v2/messages`, {
	            method: "POST",
	            headers: headers,
	            body:    bod,
	            }).catch(err => {console.log("messed up!")})
}

async function
fetch_file(from_url, token)
{
	const ws_url    = new URL(from_url)
	ws_url.protocol = "wss:"
	ws_url.pathname = "/api/v2/messages/websocket"
	ws_url.search   = "?apiToken=" + token

	let meta  = null
	let first = true
	let remaining = null

	console.log(ws_url)

	const socket = new WebSocket(ws_url)
	let err;
	socket.onopen = (ev) => {
		console.log("socket opened!")
	}

	socket.onerror = (ev) => {
		err = true;

		get_submit_button.innerHTML = "Can't reach that websocket. Sorry! <BR/> Click to try again"
		get_submit_button.classList.add("err")
	}

	let handle_message = (ev) => {
		if (first) {
			let deco = decode_ws_message(ev.data)

			meta = JSON.parse(decode_ws_message(ev.data))

			console.log("deco evdata: ",   deco)
			console.log("evdata type: ",   typeof(deco))
			console.log("evdata string: ", deco.toString())

			remaining = meta.nchunks

			first = false
			return
		}

		//get_submit_button.innerHTML = `Please Wait...<BR/>
		//                               ${(meta.nchunks/remaining).toFixed()*100}% Received`

		console.log("got a chunk from the websocket")
		handle_received_chunk(ev.data)

		remaining--
		console.log(remaining, meta.nchunks)

		if (remaining <= 0) {
			get_submit_button.textContent = "Done!"
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
