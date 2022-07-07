async function foo() {

	`$()api/v2/messages`

	await fetch("https://cat-fact.herokuapp.com/facts").then(response => 
		{ console.log(response); }).catch(err =>
		{ console.log(error); });
	
}

foo();

async function send_message() {
	const headers = new Headers({"Content-Type": "application/json",
	                             "Accept-Content": "application/json"});
	await fetch(`$(http_endpoint)/api/v2/messages`, {
	            method: "POST";
	            headers: headers;
	            body: JSON.stringify({
	                recipient:
	                body:
	            });

function() {
	
}();
