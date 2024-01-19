function xhrResult() {
    if (this.readyState === 4) {
        if (!statusIsSuccess(this.status)) {
            console.error(this.statusText);
        }
        this.callback.apply(this, this.arguments);
    }
}

// TODO: verify this is sufficient
function statusIsSuccess(status) {
    return status < 300;
}

function request(method, url, data, callback) {
    var xhr = new XMLHttpRequest();
    xhr.callback = callback;
    xhr.arguments = Array.prototype.slice.call(arguments, 4);
    xhr.onload = xhrResult;
    xhr.onerror = xhrResult;
    xhr.open(method, url, true);
    if (method != 'GET') {
        xhr.setRequestHeader('Content-Type', 'application/json');
    }
    xhr.setRequestHeader('X-JWT-Assertion', window.afAuthHeader);
    xhr.send(data);
}

function callbackTest(arg1) {
    alert(this.status + ": " + this.arguments + ": " + this.responseText);
}

function loginForm(link) {
    contentDiv = getContentArea();
    inputLogin = document.createElement("input");
    inputLogin.setAttribute("id", "input-email");
    inputPassword = document.createElement("input");
    inputPassword.setAttribute("id", "input-password");
    inputPassword.setAttribute("type", "password");
    contentDiv.appendChild(inputLogin);
    inputSubmit = document.createElement("input");
    inputSubmit.setAttribute("type", "submit");
    inputSubmit.setAttribute("value", "Submit");
    inputSubmit.setAttribute("onclick", "loginSubmit();");
    inputMeta = document.createElement("input");
    inputMeta.setAttribute("id", "input-meta");
    inputMeta.setAttribute("type", "hidden");
    inputMeta.setAttribute("value", JSON.stringify(link));
    contentDiv.appendChild(document.createElement("br"));
    contentDiv.appendChild(inputPassword);
    contentDiv.appendChild(document.createElement("br"));
    contentDiv.appendChild(inputMeta);
    contentDiv.appendChild(inputSubmit);
}

function loginSubmit() {
    requestObj = {};
    requestObj.email = document.getElementById("input-email").value;
    requestObj.password = document.getElementById("input-password").value;
    link = JSON.parse(document.getElementById("input-meta").value);
    request(link.method, apiRoot + link.link, JSON.stringify(requestObj), setHeader);
}

function setHeader() {
    response = parseResp(this.responseText);
    if (this.status != 200) {
        alert(response.code);
        return;
    }
    clear();
    window.afAuthHeader = response.jwt;
    link = response.links[0]; // TODO
    request(link.method, apiRoot + link.link, null, root);
}

function root() {
    response = parseResp(this.responseText);
    if (this.status == 200) {
        printRootSection(response);
        return;
    }
    if (this.status == 401) {
        loginForm(response.links[0]);
        return;
    }
}

function parseResp(input) {
    try {
        return JSON.parse(input);
    } catch (error) {
        alert("Fatal error occurred, sorry");
        throw new Error("cannot continue");
    }
}

function clear() {
    getContentArea().innerHTML = '';
}

function getContentArea() {
    return document.getElementById("content");
}

// TODO: do this dynamically only if necessary, call from printSection()
function printRootSection(response) {
    document.getElementById("name").innerHTML = response.application;
    document.getElementById("title").innerHTML
        = response.application + ' | ' + response.user_name;
    getContentArea().innerHTML = `Welcome ${response.user_name}!`;
    navArea = document.getElementById("nav");
    for (i in response.links) {
        linkEl = spawnLink(response.links[i]);
        navArea.appendChild(linkEl);
    }
    linkEl = document.createElement("a");
    linkEl.setAttribute("href", "#");
    linkEl.setAttribute("onclick", "logout();");
    linkEl.innerHTML = "[logout]";
    navArea.appendChild(linkEl);
}

function redraw() {
    link = JSON.parse(this.dataset.meta);
    request(link.method, apiRoot + link.link, null /*TODO*/, printSection);
}

function logout() {
    document.getElementById("name").innerHTML = "";
    document.getElementById("nav").innerHTML = "";
    document.getElementById("title").innerHTML = "";
    window.afAuthHeader = null;
    clear();
    window.location.href = cleanRootUrl();
}

// TODO: use for general rendering, set title and initial content up
// TODO: distinguish between array and object (table vs def list) and
// render recursively
function printSection() {
    response = parseResp(this.responseText);
    tbl = document.createElement("table");
    tbl.setAttribute('border', '1');
    thead = document.createElement("thead");
    tbody = document.createElement("tbody");
    if (!Array.isArray(response)) {
        response = [response];
    }
    hasHeadRow = false;
    for (i in response) {
        if (!hasHeadRow) {
            hrow = document.createElement("tr");
        }
        brow = document.createElement("tr");
        for (const [key, value] of Object.entries(response[i])) {
            if (!hasHeadRow) {
                hcell = document.createElement("th");
                hcell.innerHTML = key;
                hrow.appendChild(hcell);
            }
            bcell = document.createElement("td");
            if (key == "links") {
                for (j in value) {
                    rowLink = spawnLink(value[j]);
                    bcell.appendChild(rowLink);
                }
            } else if (value !== null && typeof value === 'object') {
                // FFS array is object in JS
                if (Array.isArray(value)) {
                    handleArray(value, bcell);
                } else {
                    // hopefully there is not more non-object objects
                    bcell.appendChild(handleObject(value));
                }
            } else {
                bcell.innerHTML = value;
            }
            brow.appendChild(bcell);
        }
        if (!hasHeadRow) {
            thead.appendChild(hrow);
        }
        hasHeadRow = true
        tbody.appendChild(brow);
    }
    tbl.appendChild(thead);
    tbl.appendChild(tbody);
    clear();
    getContentArea().appendChild(tbl);
}

function handleObject(value, div = null, prefix = "") {
    if (div == null) {
        div = document.createElement("div");
    }
    for (const [dkey, dvalue] of Object.entries(value)) {
        if (!dvalue) {
            continue;
        }
        i++;
        span = document.createElement("div");
        span.setAttribute('id', 'dkey-' + i);
        span.innerHTML = prefix + dkey + ': ';
        if (typeof dvalue === 'object' && dvalue !== null) {
            if (Array.isArray(dvalue)) {
                handleArray(dvalue, span);
            } else {
                div.appendChild(span);
                handleObject(dvalue, div, prefix + "&nbsp&nbsp");
            }
        } else {
            b = document.createElement("b");
            b.innerHTML = dvalue;
            span.appendChild(b);
        }
        div.appendChild(span);
    }
    return div;
}

function handleArray(value, parent) {
    var moreThanOne = false;
    for (item in value) {
        if (moreThanOne) {
            parent.appendChild(document.createElement('hr'));
        }
        parent.appendChild(handleObject(value[item]));
        moreThanOne = true;
    }
}

function spawnLink(link) {
    linkEl = document.createElement("a");
    linkEl.innerHTML = link.name;
    linkEl.setAttribute("data-meta", JSON.stringify(link));
    if (link.autoredir) {
        linkEl.setAttribute("href", apiRoot + link.link);
    } else {
        linkEl.setAttribute("href", "#");
    }
    linkEl.addEventListener('click', redraw, false);
    wrapperSpan = document.createElement("span");
    wrapperSpan.appendChild(linkEl);
    wrapperSpan.appendChild(document.createTextNode(" "));
    return wrapperSpan;
}

function cleanRootUrl() {
    return window.location.href.replace("#", "");
}

// TODO: local dev shorthand
var apiRoot = cleanRootUrl() + "rest";
//var apiRoot = "http://127.0.0.1:8078/invoice/rest";

request("GET", apiRoot, null, root);
