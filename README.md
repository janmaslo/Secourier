SeCourier
=====

*Did you really send it if noone saw it? Yes you did.*

Secourier - a web app that sends your files over the [HOPR](https://hoprnet.org/) network;
no IP, no snooping, no fluff. Anonymity by default.

The security and anonimity of HOPR is made possible thanks to people like you,
that's why we make sure you get rewarded for keeping fast and secure.

[Learn more about getting paid for participating in the HOPR network](https://hoprnet.org/token)


Demo
=====

https://user-images.githubusercontent.com/93952256/186887583-e53dfa03-5244-4408-95e9-b06091cf5d37.mp4

Technicals
=====

Secourier is written in pure javascript, ensuring high performance and
less bandwidth required from the user due to small file sizes.

Most byte-wise operations are performed by the webAPI, ensuring optimal performance.

Base-64 encoding in particular is achieved using the dataURL WebAPI and
the decoding of character values by the TextDecoder API, among others.

As I found the ethereum implementation subpar, I made an effort to reimplement
an [RLP]() decoder myself, but eventually settled on the official one as it proved
sufficient and time was better spent on other aspects of the application.


Upload
-----

Each selected file is converted to a dataURL and sliced into 400 byte chunks,
each one of which is sent to the `/api/v2/messages` endpoint of the requested node.

Additional meta-data is sent as the first Websocket message in the following JSON object

```
{
	"filename": "foo.bar",
	"nchunks":  "123",
}
```
where nchunks is the number of 400-byte-long pieces of the file being transferred.

Download
-----

A websocket connection to the appropriate endpoint is made (`/api/v2/messages/websocket`
as of the latest commit) and each incoming message is handled by `handle_ws_message()`
which:
	* upon receiving the first message, parses the JSON object to extract the metadata
	  (as shown in the previous subsection)
	* dispatches each following message to `handle_received_message`

`handle_received_message` then invokes `decode_ws_message` to decode the data and
appends the result to the file buffer, from which the complete file is eventually formed.

Messages coming over the websocket connection are RLP preencoded and serialized into a
stringified array -- essentially CSV -- of bytes by the target HOPR node.

Hence, `decode_ws_message` deserializes the comma seperated byte values into a Uint8Array;
decode the RLP encoded array; and decodes the character values, forming a string.

Upon receiving all chunks, as siginified by the `nchunks` metadata field, an element
containing the file is displayed to the user.


Possible additions
----

* Display Upload and Download progress percentage
* Handling the sending/receiving of multiple files
* Code cleanups -- reducing the line count and file sizes
* General UI improvements including:
	- layout adjustments
	- colorscheme changes
* Allow logging in with the user's HOPR node credentials
