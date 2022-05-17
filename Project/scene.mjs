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

let mixer
let mixer2
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


    // ************************** //
    // Create a cube (character for now)
    // ************************** //
    // Cube center is at (0,0,0)
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(255,0,0)' });
    const cubeObject = new THREE.Mesh(cubeGeometry, cubeMaterial);
    sceneGraph.add(cubeObject);

    // Set position of the cube
    // The base of the cube will be on the plane 
    cubeObject.translateY(0.5);

    // Set shadow property
    cubeObject.castShadow = true;
    cubeObject.receiveShadow = true;


    // Name
    cubeObject.name = "cube";
    
    // Create spotlight for the cube

    const spotLight = new THREE.SpotLight('rgb(200, 200, 200)', 50);
    spotLight.position.set(0, 20, 0);
    sceneGraph.add(spotLight);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
    spotLight.name = "light"
    spotLight.target = cubeObject
    spotLight.penumbra = 0.75
    //sceneElements.camera.lookAt(cubeObject)

    // ************************** //
    // Create a sphere (one of the buildings)
    // ************************** //
    // Sphere center is at (0,0,0)
    const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const sphereMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(180,180,255)' });
    const sphereObject = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sceneGraph.add(sphereObject);
    sphereObject.name = "sawmill"

    // Set position of the sphere
    // Move to the left and away from (0,0,0)
    // The sphere touches the plane
    sphereObject.translateX(-9).translateY(0.5).translateZ(6);

    // Set shadow property
    sphereObject.castShadow = true;


    // ************************** //
    // Create a cylinder (one of the buildings)
    // ************************** //
    const cylinderGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 25, 1);
    const cylinderMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(200,255,150)' });
    const cylinderObject = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    sceneGraph.add(cylinderObject);
    cylinderObject.name="masonry"

    // Set position of the cylinder
    // Move to the right and towards the camera
    // The base of the cylinder is on the plane
    cylinderObject.translateX(5).translateY(0.75).translateZ(-7.5);

    // Set shadow property
    cylinderObject.castShadow = true;

    //Create trees
    const loader = new GLTFLoader();
    loader.load(
        "./models/tree.glb",

        function(obj) {
            sceneGraph.add(obj.scene)
            obj.scene.position.set(-13, 0, 9)
            obj.scene.traverse( function( node ) {
                if ( node.isMesh ) { node.castShadow = true; node.receiveShadow = true }
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
        "./models/rock.glb",

        function(obj) {
            sceneGraph.add(obj.scene)
            obj.scene.position.set(10, 0, -13)
            obj.scene.traverse( function( node ) {
                if ( node.isMesh ) { node.castShadow = true; node.receiveShadow = true}
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
        "./models/masonry.glb",

        function(obj) {
            const model = obj.scene
            sceneGraph.add(model)
            model.position.set(5, 0, -7.5)
            model.rotation.y += 0.961
            model.traverse( function( node ) {
                if ( node.isMesh ) { node.castShadow = true;}
            } );
            mixer = new THREE.AnimationMixer(model);
            const clips = obj.animations
            const clip = THREE.AnimationClip.findByName(clips, 'hammerHit')
            const action = mixer.clipAction(clip)
            action.play()
            const clip2 = THREE.AnimationClip.findByName(clips, 'hammerHeadHit')
            const action2 = mixer.clipAction(clip2)
            action2.play()
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
        "./models/sawmill.glb",

        function(obj) {
            const model = obj.scene
            sceneGraph.add(model)
            model.position.set(-9, 0, 6)
            model.rotation.y += 0.937
            model.traverse( function( node ) {
                if ( node.isMesh ) { node.castShadow = true;}
            } );
            mixer2 = new THREE.AnimationMixer(model);
            const clips = obj.animations
            const clip = THREE.AnimationClip.findByName(clips, 'SawRotation')
            const action = mixer2.clipAction(clip)
            action.play()
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

var dispX = 0.1, dispZ = 0.1;

var pivot = new THREE.Object3D();
pivot.add(sceneElements.camera);

const clock = new THREE.Clock();
const clock2 = new THREE.Clock();
function computeFrame(time) {

    // THE SPOT LIGHT

    // Can extract an object from the scene Graph from its name
    const light = sceneElements.sceneGraph.getObjectByName("light");

    // Apply a small displacement

    // CONTROLING THE CUBE WITH THE KEYBOARD

    const cube = sceneElements.sceneGraph.getObjectByName("cube");
    const sawmill = sceneElements.sceneGraph.getObjectByName("sawmill");
    const masonry = sceneElements.sceneGraph.getObjectByName("masonry");


    if (keyD) {
        cube.translateX(dispX);
        light.translateX(dispX);
        pivot.translateX(dispX);
    }
    if (keyW) {
        cube.translateZ(-dispZ);
        light.translateZ(-dispZ);
        pivot.translateZ(-dispZ);
    }
    if (keyA) {
        cube.translateX(-dispX);
        light.translateX(-dispX);
        pivot.translateX(-dispX);
    }
    if (keyS) {
        cube.translateZ(dispZ);
        light.translateZ(dispZ);
        pivot.translateZ(dispZ);
    }
    if (keyE){
        cube.rotation.y += -delta;
        light.rotation.y += -delta;
        pivot.rotation.y += -delta;
    }
    if (keyQ){
        cube.rotation.y += delta;
        light.rotation.y += delta;
        pivot.rotation.y += delta;
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
        if (Date.now() > limitF + 250 && (cube.position.distanceTo(sawmill.position) < 4 || cube.position.distanceTo(masonry.position) < 4) ){
            limitF = Date.now()
            var x=document.getElementById("level_menu");
            //figure out which building is closer
            if(cube.position.distanceTo(sawmill.position) < cube.position.distanceTo(masonry.position)){
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

    sceneElements.camera.position.y = 7.5
    var position = new THREE.Vector3().copy( cube.position );
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
    if(mixer2){
        mixer2.update(clock2.getDelta());
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
