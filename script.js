// Get the modal
var modal = document.getElementById("myModal");
var profilModal = document.getElementById("profil-modal");

var getProfil = document.getElementById("get-profil");
// When the user clicks anywhere outside of the modal, close it


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

            console.log(type)

            var card = document.createElement('article');
            card.setAttribute('class', 'card')

            card.innerHTML = `
            <div class="card-header">
                <div>
                    <h2 class="heading-card-name">`+ name + `</h2>
                    <h3 class="heading-card-type">Type : `+ type +`</h3>
                </div>
                <img  class="card-type" src="img/activity_type/`+type+`.png">
            </div>    
            <img class="card-track" src="img/tracks/activity_`+id+`.png" alt="Tracks image">
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


    var url2 = new URL("http://127.0.0.1:5000/startstop")
    url2.searchParams.append('id', id);
    const response2 = await fetch(url2);
    const myJson2 = await response2.json(); //extract JSON from the http response
    const points = myJson2[0]

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
    console.log(points)

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
    console.log(properties)

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


 getProfil.onclick = function(event){
    display(profilModal)
}