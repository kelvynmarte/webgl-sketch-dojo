
var raf = require('raf');
var getStats = require('../../../lib/stats').getStats;
var glslify = require('glslify');
require('../../../../src/js/vendors/controls/TrackballControls');
var stats;
var dat = require('dat-gui');
var gui = new dat.GUI();

var scene, camera, renderer;
var material;
var plane;
var width = window.innerWidth;
var height = window.innerHeight;
var SwapRenderer = require('./swapRenderer'), swapRenderer;
var GPURenderer = require('./gpuRenderer'), gpuRenderer;
var LookUpMesh = require('./lookUpMesh'), lookUpMesh;
var mesh;

var controls;

var spObj = {
    damping : 1,
    friction   : 1,
}

var clock;
var loader = new THREE.TextureLoader();
var SIZE = 64;

var simulationUniforms = {

    dT:{ type:"f" , value: 0 },
    noiseSize: { type:"f" , value: .1 },


}
var renderUniforms = {
    tPos : { type:"t" , value: null }
}

function init(){
    scene = new THREE.Scene();


    // camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 );
    // camera.position.z = 1000;
    var ar = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera( 75, ar , 1, 10000 );
    camera.position.z = 1000;

    clock = new THREE.Clock();

    scene.add( camera );

    renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000);
    document.body.appendChild(renderer.domElement);
    
    gpuRenderer = new GPURenderer({size : SIZE, shader: glslify("./shaders/curl.frag"), renderer : renderer });
    gpuRenderer.setUniforms({
        dT:{ type:"f" , value: 0 },
        noiseSize: { type:"f" , value: .1 },
        damping : {type: "f", value: 0.9},
        friction : {type: "f", value: 1},
    });
    gpuRenderer.addBoundTexture( renderUniforms.tPos , 'output' );
    gpuRenderer.resetRand( 5 );

    swapRenderer = new SwapRenderer()

    lookUpMesh = new LookUpMesh({size : SIZE, renderer : renderer, uniforms : renderUniforms });
    scene.add(lookUpMesh);

    controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 5.0;
    controls.zoomSpeed = 2.2;
    controls.panSpeed = 1;
    controls.dynamicDampingFactor = 0.3;

    // var controller0 =  gui.add(gpuRenderer.simulation.uniforms.damping, 'value', 0, 1);
    // console.log(gpuRenderer.simulation.uniforms);

    spObj.damping = gpuRenderer.simulation.uniforms.damping.value;
    spObj.friction = gpuRenderer.simulation.uniforms.friction.value;

    var dampingController = gui.add( spObj,"damping", 0, 1);
    dampingController.onChange(function(value){
        gpuRenderer.simulation.uniforms.damping.value = spObj.damping;
    });

    var frictController = gui.add(spObj, "friction", 0.8, 1.01);
    frictController.onChange(function(value){
        gpuRenderer.simulation.uniforms.friction.value = spObj.friction;
    });


    stats = getStats();

    raf(animate);
}

function animate() {
    renderer.render(scene, camera);

    controls.update();

    simulationUniforms.dT.value = clock.getDelta();
    gpuRenderer.update();
    lookUpMesh.update();

    stats.update();

    raf(animate);
}

init();