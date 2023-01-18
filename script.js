// Get the modal
var modal = document.getElementById("myModal");
var profilModal = document.getElementById("profil-panel");
var profilChart = document.getElementById("profil-chart");

var getProfil = document.getElementById("get-profil");
// When the user clicks anywhere outside of the modal, close it

profilModal.style.height = "0";
profilModal.style.display = "none";

window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

const body = document.querySelector('body'),
sidebar = body.querySelector('.panel'),
toggle = body.querySelector(".open-close"),
textStat = body.querySelectorAll(".nav-link span");

toggle.addEventListener("click" , () =>{
    sidebar.classList.toggle("close")
    toggle.classList.toggle("close")
    textStat.forEach(el => {
        el.classList.toggle("close")
    });
    ;
})


// Replace `your_access_token` with your Cesium ion access token.
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1ZmI0YWE1MC1lYTM5LTQ5MDQtYTg2My1iZDJhYjYwZDc4MzciLCJpZCI6NTkyNjMsImlhdCI6MTYyMzkzOTc5Nn0.MxUs_tlMxAFcUboV2PDkv4nve2SbZDcw5iQ91KaQ4k4';

// Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
const viewer = new Cesium.Viewer('cesiumContainer', {
    terrainProvider: Cesium.createWorldTerrain()
}); 

// Fly the camera to San Francisco at the given longitude, latitude, and height.
viewer.camera.flyTo({
    destination : Cesium.Cartesian3.fromDegrees(5.7, 45.2, 3000),
    orientation : {
        heading : Cesium.Math.toRadians(0.0),
        pitch : Cesium.Math.toRadians(-15.0),
    }
});

viewer.animation.container.style.visibility = 'hidden';
viewer.timeline.container.style.visibility = 'hidden';
viewer.forceResize();

var count

const promiseOfSomeData = fetch("http://127.0.0.1:5000/all").then(r=>r.json()).then(data => {

    var cards = document.getElementById('cards')
    var all_id = data

    count = data.length

    countDiv = document.getElementById("numberActivities")
    countDiv.innerHTML = "Nombre d'activités : "+ count

    for (var i = 0; i<= all_id.length; i++){
        if (typeof all_id[i] !== "undefined"){

            // console.log(all_id[i][0].activity.id)

            const id = all_id[i][0].activity.id
            const name = all_id[i][0].activity.name
            const type = all_id[i][0].activity.type
            const date = all_id[i][0].activity.date

            var card = document.createElement('article');
            card.setAttribute('class', 'card')

            card.innerHTML = `
            <div class="card-header">
                <div>
                    <h2 class="heading-card-name">`+ name + `</h2>
                    <h3 class="heading-card-type">Type : `+ type +`</h3>
                </div>
                <img  class="card-type" src="img/activity_type/`+type+`.png" onerror="this.onerror=null;this.src='img/activity_type/other.png';">
            </div>    
            <img class="card-track" src="img/tracks/activity_`+id+`.png" alt="Tracks image" onerror="this.onerror=null;this.src='img/logo.png'; this.width='50';">
            <div class="content">
            </div>
            <footer class="footer-card">
            <h2 class="footer-header">
                `+date+`
            </h2>
            </footer>
            `;
            card.id = id
            cards.appendChild(card)
        }
    }
});

cards 
window.onload = function(){ 
    cards = document.getElementsByClassName("card");

};

var display = function(mod){
    mod.style.display = "block"
}


cards.onclick = function(event){
    var id
    for ( var i = 0; i < event.path.length; i++ ) {
        if (event.path[i].nodeName == "ARTICLE"){
            id = event.path[i].id
            display(modal)
            userAction(id)
        }
    }
}


const userAction = async (id) => {
    var url = new URL("http://127.0.0.1:5000/activity_id")
    url.searchParams.append('id', id);
    const response = await fetch(url);
    const myJson = await response.json(); //extract JSON from the http response
    const track = myJson[0]

    currentDate = track.features[0].properties.date

    var url2 = new URL("http://127.0.0.1:5000/startstop")
    url2.searchParams.append('id', id);
    const response2 = await fetch(url2);
    const myJson2 = await response2.json(); //extract JSON from the http response
    const points = myJson2[0]


    var url3 = new URL("http://127.0.0.1:5000/profil")
    url3.searchParams.append('id', id);
    const response3 = await fetch(url3);
    const myJson3 = await response3.json(); //extract JSON from the http response
    // console.log(myJson3)

    const elevationList = []
    const timeList = []

    var shortDate = currentDate.split(' ')[0];
    let ele 
    let time
    var longTime
    for (var pt = 0; pt<= myJson3.length; pt++){
        if (typeof pt !== 'undefined' ){
            ele = myJson3[pt]?.[0]?.ele
            longTime = myJson3[pt]?.[0]?.time

            time = new Date(shortDate + 'T' + longTime);
            
            elevationList.push(ele)
            timeList.push(time)
        }
    }


    console.log(timeList)
    // console.log(elevationList)
    filledProfil(elevationList, timeList)

    properties = track.features[0].properties
    filledPanel(properties)

    viewer.dataSources.removeAll();
    viewer.entities.removeAll();

    const col = Cesium.Color.fromCssColorString('#f39200');

    const dataSource = Cesium.GeoJsonDataSource.load(track, {
        stroke: col,
        strokeWidth: 3,
        clampToGround: true
    });
    
    // viewer.dataSources.add(dataSource);

    var depart = points.features[0].geometry.coordinates
    var depart_ele = points.features[0].ele
    var depart_time = points.features[0].time

    var arrive = points.features[1].geometry.coordinates
    var arrive_ele = points.features[1].ele
    var arrive_time = points.features[1].time
    
    viewer.dataSources.add(dataSource);
    
    var bbox = turf.bbox(track);
    
    viewer.camera.flyTo({
        destination : Cesium.Rectangle.fromDegrees(bbox[0], bbox[1], bbox[2], bbox[3])
    });

    const pinBuilder = new Cesium.PinBuilder();

    logoUrl = 'img\logo.png'
    viewer.entities.add({
        id:'Départ : ' + depart_time+' à '+ depart_ele+'m',
        position: Cesium.Cartesian3.fromDegrees(depart[0], depart[1]),
        billboard: {
            image: pinBuilder.fromText("D", col, 30).toDataURL(),
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM
        }
    });
    viewer.entities.add({
        id:'Arrivée : ' + arrive_time +' à '+ arrive_ele+'m',
        position: Cesium.Cartesian3.fromDegrees(arrive[0], arrive[1]),
        billboard: {
            image: pinBuilder.fromText("A", col, 30).toDataURL(),
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM
        }
    });
};


var filledPanel = function(properties){

    var count = Object.keys(properties).length;

    var timestat = document.getElementById("clock"),
    diststat = document.getElementById("travel"),
    upstat = document.getElementById("up"),
    downstat = document.getElementById("down"),
    heartstat = document.getElementById("heart"),
    heartmaxstat = document.getElementById("heart-max"),
    kcalstat = document.getElementById("kcal");

    timestat.innerHTML = properties.duree
    diststat.innerHTML = properties.distance +" km"
    upstat.innerHTML = properties.ascension_totale +" m"
    downstat.innerHTML = properties.descente_totale+" m"
    heartstat.innerHTML = properties.frequence_cardiaque_moyenne +" bpm"
    heartmaxstat.innerHTML = properties.frequence_cardiaque_maximale +" bpm"
    kcalstat.innerHTML = properties.calories +" cal"

}

var filledProfil = function(ele, time){

    var startTimestamp = time[0]
    var endTimestamp = time[time.length - 2]

    console.log(startTimestamp)
    console.log(endTimestamp)

    let chartStatus = Chart.getChart("profil-chart"); // <canvas> id
    if (chartStatus != undefined) {
        chartStatus.destroy();
    }

    const ctx = document.getElementById('profil-chart');

    new Chart(ctx, {
    type: 'line',
    data: {
        labels: time,
        datasets: [{
            data: ele,
        }]
    },
    options: {
        scales: {
        x:{
            type: "time",                                          
            distribution: 'linear',
            time: {
                unit: 'minute', 
                stepSize:100
            },
            ticks: {
                display: false
            },
            min: startTimestamp,
            max: endTimestamp
        },
        },
        responsive: true,
        maintainAspectRatio: false,
        elements: {
            point:{
                radius: 0
            }
        },
        plugins: {
            legend: {
                display: false
            }
        }
    }
    });
}

getProfil.onclick = function(event){
    if (profilModal.style.display === "none") {
        profilModal.style.display = "block";
        profilModal.style.height = "25%";
    } else {
        profilModal.style.height = "0";
        profilModal.style.display = "none";
    }
}
// Get a reference to the input element
const input = document.getElementById('import-input');
input.className = "cesium-button cesium-button-toolbar"

// Get a reference to the CesiumJS canvas element
const canvas = document.getElementById('cesium-viewer');

function getRandomRGB() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r}, ${g}, ${b})`;
  }

// Set up an event listener for when the user selects a GPX file
// Create the widget and pass the button as the container element

input.addEventListener('change', (event) => {
    // Get the selected file
    const file = event.target.files[0];
    
    // Check that the file is a GPX file
    if (file && file.name.endsWith('.gpx')) {
      // Read the contents of the GPX file
      const reader = new FileReader();
      reader.onload = (e) => {
        // Parse the GPX file contents
        const gpx = new DOMParser().parseFromString(e.target.result, 'text/xml');
        
        // Extract the track points from the GPX file
        const trackPoints = Array.from(gpx.getElementsByTagName('trkpt')).map((point) => {
            const lat = point.getAttribute('lat');
            const lon = point.getAttribute('lon');
            return Cesium.Cartesian3.fromDegrees(lon, lat);
        });

        let randomColor = getRandomRGB()
        // Create a polyline for the track points
        const polyline = viewer.entities.add({
            polyline: {
            positions: trackPoints,
            width: 3,
            material: new Cesium.Color.fromCssColorString(randomColor),
            clampToGround: true
            }
        });

        // Calculate the bounding sphere of the track points
        const boundingSphere = Cesium.BoundingSphere.fromPoints(trackPoints);
        // Fly the camera to the bounding sphere of the track points
        viewer.camera.flyTo({
            destination: boundingSphere
        });
      };
      reader.readAsText(file);
    }
});
  
