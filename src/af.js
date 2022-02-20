function xhrSuccess() {
    if (this.readyState === 4) {
        if (this.status === 200) {
            //console.log(this);
            // TODO
        } else {
            console.error(this.statusText);
        }
        this.callback.apply(this, this.arguments);
    }
}

function xhrError() {
    console.error(this.statusText);
}

function request(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.callback = callback;
    xhr.arguments = Array.prototype.slice.call(arguments, 2);
    xhr.onload = xhrSuccess;
    xhr.onerror = xhrError;
    xhr.open("GET", url, true);
    xhr.send(null);
}

function callbackTest(arg1) {
    alert(this.status + ": " + this.arguments + ": " + this.responseText);
}

request("https://ip.zhouba.cz", callbackTest, "TODO");
