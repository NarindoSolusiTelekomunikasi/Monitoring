const API_URL = "PASTE_API_URL_DISINI";

fetch(API_URL)
.then(res=>res.json())
.then(data=>{

document.getElementById("total").innerText = data.length;

let open = 0;
let close = 0;

let jenisStats = {};

data.forEach(d=>{

let status = d["STATUS TIKET"].toUpperCase();

if(status.includes("OPEN")) open++;
if(status.includes("CLOSE")) close++;

let jenis = d["JENIS TIKET"];

jenisStats[jenis] = (jenisStats[jenis] || 0) + 1;

});

document.getElementById("open").innerText = open;
document.getElementById("close").innerText = close;

/* STATUS CHART */

new Chart(document.getElementById("statusChart"),{

type:"doughnut",

data:{
labels:["OPEN","CLOSE"],
datasets:[{
data:[open,close]
}]
}

});

/* JENIS TIKET CHART */

new Chart(document.getElementById("jenisChart"),{

type:"pie",

data:{
labels:Object.keys(jenisStats),
datasets:[{
data:Object.values(jenisStats)
}]
}

});

/* TABLE */

let tbody = document.querySelector("#table tbody");

data.forEach(d=>{

let tr = document.createElement("tr");

tr.innerHTML = `

<td>${d.AREA}</td>
<td>${d.INCIDENT}</td>
<td>${d.SUMMARY}</td>
<td>${d["STATUS TIKET"]}</td>
<td>${d.TEKNISI}</td>
<td>${d.TANGGAL}</td>

`;

tbody.appendChild(tr);

});

/* SEARCH */

document.getElementById("search").addEventListener("keyup",function(){

let keyword = this.value.toLowerCase();

let rows = tbody.querySelectorAll("tr");

rows.forEach(r=>{

let text = r.innerText.toLowerCase();

r.style.display = text.includes(keyword) ? "" : "none";

});

});

});
