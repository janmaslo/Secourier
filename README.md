SeCourier
----


A courier that doesn't open your boxes (can't)
Did you really send it if noone saw it? Yes you did.

SeCourier - a web app that sends your files over the hopr network;
no IP, no ..., no fluff. Anonymity by default.

HELP US ... Make it stronger

HOPR, and hence SeCourier depends on people like you to achieve
...decentralization

secure decentralized storage


Technicals
----

Each uploaded file is sliced into 400 byte chunks () each one of which
is sent to the requested node.

Additional meta-data is sent as the first Websocket message in the following JSON

```
{
	"filename": "foo.bar",
	"nchunks":  "123",
}

```

All byte-wise operations are performed by the webAPI, ensuring highest performance
base64 encoding in particular is achieved using the dataURL WebAPI

SeCourier
---



This is a development version; the readme is yet to be written.