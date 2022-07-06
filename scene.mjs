"use strict";
import * as THREE from 'three';
import {GLTFLoader} from 'GLTFLoader';
import {helper} from './helper.mjs';
//  Adapted from Daniel Rohmer tutorial
//
// 		https://imagecomputing.net/damien.rohmer/teaching/2019_2020/semester_1/MPRI_2-39/practice/threejs/content/000_threejs_tutorial/index.html
//
// 		J. Madeira - April 2021

// To store the scene graph, and elements usefull to rendering the scene
const sceneElements = {
    sceneGraph: null,
    camera: null,
    renderer: null,
};

var rates = {sawmill: 1, masonry: 1};
const upgradeCosts = {sawmill: [30, 10], masonry: [10, 30]};
const upgradeScaling = {sawmill: 1.15, masonry: 1.15};
const upgradeBenefit = {sawmill: 2, masonry: 2};
var upgradeLevels = {sawmill: 0, masonry: 0};
var limitF = Date.now();
var tick = Date.now();
var currentRes = {wood: 0, stone: 0}

// Functions are called
//  1. Initialize the empty scene
//  2. Add elements within the scene
//  3. Render the scene
helper.initEmptyScene(sceneElements);
load3DObjects(sceneElements.sceneGraph);
requestAnimationFrame(computeFrame);

//To keep track of the keyboard - WASD
var keyD = false, keyA = false, keyS = false, keyW = false, keyQ = false, keyE = false, keyF = false, keyC = false, keyX = false;
document.addEventListener('keydown', onDocumentKeyDown, false);
document.addEventListener('keyup', onDocumentKeyUp, false);

function onDocumentKeyDown(event) {
    switch (event.keyCode) {
        case 68: //d
            keyD = true;
            break;
        case 83: //s
            keyS = true;
            break;
        case 65: //a
            keyA = true;
            break;
        case 87: //w
            keyW = true;
            break;
        case 69: //e
            keyE = true;
            break;
        case 81: //q
            keyQ = true;
            break;
        case 70: //f
            keyF = true;
            break;
        case 67: //c
            keyC = true;
            break;
        case 88: //x
            keyX = true;
            break;
    }
}
function onDocumentKeyUp(event) {
    switch (event.keyCode) {
        case 68: //d
            keyD = false;
            break;
        case 83: //s
            keyS = false;
            break;
        case 65: //a
            keyA = false;
            break;
        case 87: //w
            keyW = false;
            break;
        case 69: //e
            keyE = false;
            break;
        case 81: //q
            keyQ = false;
            break;
        case 70: //f
            keyF = false;
            break;
        case 67: //c
            keyC = false;
            break;
        case 88: //x
            keyX = false;
            break;
    }
}

var pivot = new THREE.Object3D();
pivot.position.set(0,0,0);
pivot.add(sceneElements.camera);

let mixer

// Create and insert in the scene graph the models of the 3D scene
function load3DObjects(sceneGraph) {

    document.getElementById("UpgradeButton").addEventListener("click", () => {
        Upgrade()
    });

    // ************************** //
    // Create a ground plane
    // ************************** //
    const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
    const planeMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(50, 100, 50)', side: THREE.DoubleSide });
    const planeObject = new THREE.Mesh(planeGeometry, planeMaterial);
    sceneGraph.add(planeObject);

    // Change orientation of the plane using rotation
    planeObject.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    // Set shadow property
    planeObject.receiveShadow = true;

    const cubeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const cubeMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(255,0,0)' });
    const cubeObject = new THREE.Mesh(cubeGeometry, cubeMaterial);
    sceneGraph.add(cubeObject);
    cubeObject.position.y = 2;
    cubeObject.name = "cube"

    // Create spotlight for the cube
    const spotLight = new THREE.SpotLight('rgb(200, 200, 200)', 50);
    spotLight.position.set(0, 20, 0);
    sceneGraph.add(spotLight);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
    spotLight.shadow.camera.top = 1000
    spotLight.shadow.camera.bottom = -1000
    spotLight.shadow.camera.near = 1
    spotLight.shadow.camera.far = 4000000
    spotLight.name = "light"
    spotLight.target = cubeObject;
    spotLight.penumbra = 0.75
    //sceneElements.camera.lookAt(cubeObject)

    //Create trees
    const loader = new GLTFLoader();
    loader.load(
        "./models/MainScene.glb",

        function(obj) {
            const model = obj.scene
            model.position.set(0,0,0)
            sceneGraph.add(model)
            model.traverse( function( node ) {
                if ( node.isMesh ) { node.castShadow = true;node.receiveShadow=true;}
            mixer = new THREE.AnimationMixer(model);
            const clips = obj.animations
            const clip = THREE.AnimationClip.findByName(clips, 'HammerHit')
            const action = mixer.clipAction(clip)
            action.play()
            const clip3 = THREE.AnimationClip.findByName(clips, 'SawRotation')
            const action3 = mixer.clipAction(clip3)
            action3.play()
            } );
        },
        
        function ( xhr ) {
            console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
        },
    
        // onError callback
        function ( err ) {
            console.error( 'An error happened' );
        }
    )
    loader.load(
        "./models/MainCharacter.glb",

        function(obj) {
            const model = obj.scene
            model.position.set(0,0,0)
            sceneGraph.add(model)
            model.traverse( function( node ) {
                if ( node.isMesh ) { node.castShadow = true;node.rotation.y += 1.6}
            } );
        },

        function ( xhr ) {
            console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
        },
    
        // onError callback
        function ( err ) {
            console.error( 'An error happened' );
        }
    )

    //Create rocks

    //Create roadblock
}

// Displacement value

var delta = 0.04;

var dispX = 0.2, dispZ = 0.2;
const clock = new THREE.Clock();
const clock2 = new THREE.Clock();
function computeFrame(time) {

    // THE SPOT LIGHT

    // Can extract an object from the scene Graph from its name
    const light = sceneElements.sceneGraph.getObjectByName("light");

    // Apply a small displacement

    // CONTROLING THE CUBE WITH THE KEYBOARD

    const cube = sceneElements.sceneGraph.getObjectByName("Character");
    const sawmill = sceneElements.sceneGraph.getObjectByName("Lumber_house");
    const masonry = sceneElements.sceneGraph.getObjectByName("Mine_house");
    const acCube = sceneElements.sceneGraph.getObjectByName("cube");


    if (keyD) {
        cube.translateX(dispX);
        light.translateX(dispX);
        pivot.translateX(dispX);
        acCube.translateX(dispX);
    }
    if (keyW) {
        cube.translateZ(-dispZ);
        light.translateZ(-dispZ);
        pivot.translateZ(-dispZ);
        acCube.translateZ(-dispZ);
    }
    if (keyA) {
        cube.translateX(-dispX);
        light.translateX(-dispX);
        pivot.translateX(-dispX);
        acCube.translateX(-dispX);
    }
    if (keyS) {
        cube.translateZ(dispZ);
        light.translateZ(dispZ);
        pivot.translateZ(dispZ);
        acCube.translateZ(dispZ);
    }
    if (keyE){
        cube.rotation.y += -delta;
        light.rotation.y += -delta;
        pivot.rotation.y += -delta;
        acCube.rotation.y += -delta;
    }
    if (keyQ){
        cube.rotation.y += delta;
        light.rotation.y += delta;
        pivot.rotation.y += delta;
        acCube.rotation.y += delta;
    }
    if (keyC && pivot.position.y > -1){
        pivot.position.y -= delta;
    }
    if (keyX && pivot.position.y < 1){
        pivot.position.y += delta;
    }
    if (keyF){
        var x=document.getElementById("level_menu");
        if (x.style.visibility==="hidden"){
        if (Date.now() > limitF + 250 && (acCube.position.distanceTo(sawmill.position) < 20 || acCube.position.distanceTo(masonry.position) < 20) ){
            limitF = Date.now()
            var x=document.getElementById("level_menu");
            //figure out which building is closer
            if(cube.position.distanceTo(sawmill.position) < pivot.position.distanceTo(masonry.position)){
                //Update Menu
                document.getElementById("current").textContent = "Current rate: " + rates.sawmill + " Wood/s"
                document.getElementById("future").textContent = "Rate after upgrade: " + (rates.sawmill + upgradeBenefit.sawmill) + " Wood/s"
                document.getElementById("woodCost").textContent = "Wood: " + upgradeCosts.sawmill[0]
                document.getElementById("stoneCost").textContent = "Stone: " + upgradeCosts.sawmill[1]
            }
            else{
                document.getElementById("current").textContent = "Current rate: " + rates.masonry + " Stone/s"
                document.getElementById("future").textContent = "Rate after upgrade: " + (rates.masonry + upgradeBenefit.masonry) + " Stone/s"
                document.getElementById("woodCost").textContent = "Wood: " + upgradeCosts.masonry[0]
                document.getElementById("stoneCost").textContent = "Stone: " + upgradeCosts.masonry[1]
            }

            
            //show menu
            x.style.visibility="visible"; 
            }
        }
        else{
            if (Date.now() > limitF + 250){
                limitF = Date.now()
                x.style.visibility="hidden";
            }
        }
        
    }

    sceneElements.camera.position.y = 15
    var position = new THREE.Vector3().copy( acCube.position );
    sceneElements.camera.lookAt( position );

    if (tick + 1000 < Date.now()){
        tick = Date.now();
        currentRes.wood += rates.sawmill;
        currentRes.stone += rates.masonry;
        var wood=document.getElementById("wood");
        var stone=document.getElementById("stone");
        wood.textContent = "Wood: " + currentRes.wood
        stone.textContent = "Stone: " + currentRes.stone
    }

    if(mixer){
        mixer.update(clock.getDelta());
    }

    // Rendering
    helper.render(sceneElements);

    // Call for the next frame
    requestAnimationFrame(computeFrame);
}

function Upgrade(){
    //figure out which building
    var woodCostEle = document.getElementById("woodCost")
    var stoneCostEle = document.getElementById("stoneCost")
    const woodCost = woodCostEle.textContent.split(" ")[1]
    const stoneCost = stoneCostEle.textContent.split(" ")[1]
    if (woodCost == upgradeCosts.sawmill[0] && stoneCost == upgradeCosts.sawmill[1] && upgradeCosts.sawmill[0] < currentRes.wood && upgradeCosts.sawmill[1] < currentRes.stone){
    //Change values in this script
        upgradeLevels.sawmill += 1
        rates.sawmill += upgradeBenefit.sawmill
        currentRes.wood -= upgradeCosts.sawmill[0]
        currentRes.stone -= upgradeCosts.sawmill[1]
        upgradeCosts.sawmill[0] = Math.ceil(upgradeCosts.sawmill[0] * upgradeScaling.sawmill)
        upgradeCosts.sawmill[1] = Math.ceil(upgradeCosts.sawmill[1] * upgradeScaling.sawmill)
        var x=document.getElementById("level_menu");
        x.style.visibility = "hidden"
    }
    else if (woodCost == upgradeCosts.masonry[0] && stoneCost == upgradeCosts.masonry[1] && upgradeCosts.masonry[0] < currentRes.wood && upgradeCosts.masonry[1] < currentRes.stone){
    //Change values in this script
        upgradeLevels.masonry += 1
        rates.masonry += upgradeBenefit.masonry
        currentRes.wood -= upgradeCosts.masonry[0]
        currentRes.stone -= upgradeCosts.masonry[1]
        upgradeCosts.masonry[0] = Math.ceil(upgradeCosts.masonry[0] * upgradeScaling.masonry)
        upgradeCosts.masonry[1] = Math.ceil(upgradeCosts.masonry[1] * upgradeScaling.masonry)
        var x=document.getElementById("level_menu");
        x.style.visibility = "hidden"
    }
    else{
    //comes here either if there's an error or if the player doesnt have enough resources
    }
}
