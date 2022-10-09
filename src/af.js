function xhrSuccess() {
    if (this.readyState === 4) {
        if (this.status === 200) {
            //console.log(this);
            // TODO
        } else {
            //console.error(this.statusText);
        }
        this.callback.apply(this, this.arguments);
    }
}

function xhrError() {
    console.error(this.statusText);
}

function request(method, url, data, callback) {
    //url = url.replace(/(^https?:\/\/.*)(\/\/)(.*$)/, '$1/$3');
    var xhr = new XMLHttpRequest();
    xhr.callback = callback;
    xhr.arguments = Array.prototype.slice.call(arguments, 4);
    xhr.onload = xhrSuccess;
    xhr.onerror = xhrError;
    xhr.open(method, url, true);
    if (method != 'GET') {
        xhr.setRequestHeader('Content-Type', 'application/json')
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
    //console.log(requestObj);
    request(link.method, apiRoot + link.link, JSON.stringify(requestObj), setHeader);
}

function setHeader() {
    //console.log(this.status);
    //console.log(this.responseText);
    response = parseResp(this.responseText);
    if (this.status != 200) {
        alert(response.code);
        return;
    }
    clear();
    window.afAuthHeader = response.jwt;
    callRoot();
}

function root() {
    response = parseResp(this.responseText);
    //console.log(this.status);
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
        //console.log(error);
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

function getNavArea() {
    return document.getElementById("nav");
}

function callRoot() {
    request("GET", apiRoot, null, root, "the hell");
}

function printRootSection(response) {
    // TODO: leak
    document.getElementById("name").innerHTML = response.application;
    document.getElementById("title").innerHTML
        = response.application + ' | ' + response.user_name;
    getContentArea().innerHTML = "Welcome!";
    nav(response.links);
}

function nav(links) {
    for (i in links) {
        linkEl = spawnLink(links[i]);
        getNavArea().appendChild(linkEl);
        emptySpan = document.createElement("span");
        emptySpan.innerHTML = "&nbsp;";
        getNavArea().appendChild(emptySpan);
    }
}

function redraw() {
    link = JSON.parse(this.dataset.meta);
    request(link.method, apiRoot + link.link, null /*TODO*/, printSection);
}

function printSection() {
    response = parseResp(this.responseText);
    //console.log(response);
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
            //console.log(`${key}: ${value}`);
            if (!hasHeadRow) {
                hcell = document.createElement("th");
                hcell.innerHTML = key;
                hrow.appendChild(hcell);
            }
            bcell = document.createElement("td");
            if (key == "links") {
                for (j in value) {
                    // TODO: solve empty span shit
                    rowLink = spawnLink(value[j]);
                    bcell.appendChild(rowLink);
                    emptySpan = document.createElement("span");
                    emptySpan.innerHTML = "&nbsp;";
                    bcell.appendChild(emptySpan);
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
    return linkEl;
}

// TODO
var apiRoot = window.location.href + "rest";
//var apiRoot = "http://127.0.0.1:8078/invoice/rest";

callRoot();
