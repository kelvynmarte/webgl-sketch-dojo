
var raf = require('raf');
var createCaption = require('vendors/caption');
var glslify = require('glslify');

var windowSize = new THREE.Vector2(window.innerWidth, window.innerHeight);

var SwapRenderer = require('vendors/swapRenderer'), swapRenderer;
var velocityRenderer, pressureRenderer;

var Solver = require('./fluid/solver');
var solver;

var scene, camera, renderer;
var object, id;
var stats, wrapper;
var mouse = new THREE.Vector2(-9999, -9999);

var isAnimation = true;
var orthShaderMaterial;
var orthScene, orthCamera, orthPlane;

var loader = new THREE.TextureLoader();
var renderPlane, renderMaterial;    
var renderScene, renderCamera;
var clock;
var textureScene;
var outputRenderer;
var randomMesh, texturePlane, textureCamera;

var grid = {
    size : new THREE.Vector2(window.innerWidth/2, window.innerHeight/2),
    scale : 1
};

var time = {
    step : 1
};




function init(){

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 200;

    renderer = new THREE.WebGLRenderer({alpha: false});
    renderer.atuoClear = true;
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    solver = Solver.make(grid, time, windowSize, renderer)

    outputRenderer = new SwapRenderer({
        width : grid.size.width, height : grid.size.height,
        renderer : renderer
    });

    swapRenderer = new SwapRenderer({
        shader : glslify('./shaders/advect.frag'),

        width : window.innerWidth,
        height: window.innerHeight,
        uniforms: {
            "target" : { type: "t", value: null },
            "velocity" : { type: "t", value:  solver.velocity.output},
            // "randomTex" : { type: "t", value: velocityRenderer.target },
            "invresolution" : {type : "v2", value: new THREE.Vector2(1/window.innerWidth, 1/window.innerHeight)},
            "resolution" : {type : "v2", value: new THREE.Vector2(window.innerWidth, window.innerHeight)},
            "aspectRatio" : {type: "f", value:  window.innerWidth/window.innerHeight },
            "dt" : {type : "f", value: 0.0},
            "rdx" : {type: "f", value: 1.0},
            "uWindow"  : { type: "v2", value: null },
            "uMouse"   : { type: "v2", value: null }

        },
        renderer : renderer
    });

    swapRenderer.uniforms.target.value =  swapRenderer.target;
    swapRenderer.uniforms.uWindow.value  = new THREE.Vector2( window.innerWidth, window.innerHeight );
    swapRenderer.uniforms.uMouse.value   = mouse;


    setComponent();



    // raf(animate);
    /**
    loader.load('assets/texture04.jpg', function(texture){
        var image = texture.image;
        var width  = image.width;
        var height = image.height;

        textureScene = new THREE.Scene();
        // randomMesh.position.y = 500;

        var geometry = new THREE.PlaneGeometry( width - 20, height -20 );
        var material = new THREE.MeshBasicMaterial( {side: THREE.DoubleSide, map: texture} );
        texturePlane = new THREE.Mesh( geometry, material );
        texturePlane.rotation.z = Math.PI;
        texturePlane.rotation.y = Math.PI;

        textureScene.add( texturePlane );

        textureCamera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2,
            window.innerHeight / 2, window.innerHeight / - 2, 1, 10000 );
        textureCamera.position.z =  3000;
        textureScene.add( textureCamera );

        // swapRenderer.resetRand( 255 * Math.random());
        renderer.render(textureScene, textureCamera, swapRenderer.target, false);
        renderer.render(textureScene, textureCamera, swapRenderer.output, false);

        raf(animate);
    }); */
}

function setComponent(){
    var title = 'Swap Rendering with the texture of random color';
    var caption = 'Swap rendering with the texture of random color.';
    var url = 'https://github.com/kenjiSpecial/webgl-sketch-dojo/tree/master/sketches/theme/swap-renderer/app00';

    wrapper = createCaption(title, caption, url);
    wrapper.style.position = "absolute";
    wrapper.style.top = '50px';
    wrapper.style.left = '30px';

    stats = new Stats();
    stats.setMode( 0 ); // 0: fps, 1: ms, 2: mb

    // align top-left
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom  = '30px';
    stats.domElement.style.left = '30px';
    stats.domElement.style.zIndex= 9999;

    document.body.appendChild( stats.domElement );
}

function animate() {

    /** --------------------- **/

    renderScene = new THREE.Scene();
    renderCamera = new THREE.OrthographicCamera( -window.innerWidth/2, window.innerWidth/2, window.innerHeight/2, -window.innerHeight/2, -10000, 10000 );
    // console.log(solver.density.output);

    renderMaterial = new THREE.ShaderMaterial({
        depthTest : false,
        side : THREE.DoubleSide,
        uniforms : {
            // "tDiffuse" : {type: "t", value: swapRenderer.output }
            "tDiffuse" : {type: "t", value: solver.velocity.output }
        },
        vertexShader : glslify('./display/shader.vert'),
        fragmentShader : glslify('./display/shader.frag')
    });

    renderPlane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight),
        renderMaterial
    );

    renderScene.add(renderPlane);

    clock = new THREE.Clock();
    clock.start();

    id = raf(loop);
    //
}

function loop(){
    stats.begin();
    var dt = clock.getDelta();
    renderer.clear();
    
    solver.step(mouse);
    //
    swapRenderer.uniforms.velocity.value = solver.velocity.output;
    swapRenderer.update();

    renderer.render(renderScene, renderCamera);
    //
    swapRenderer.swap();
    swapRenderer.uniforms.target.value = swapRenderer.target;

    swapRenderer.uniforms.dt.value = dt;
    renderMaterial.uniforms.tDiffuse.value = swapRenderer.output;
    
    

    stats.end();
    id=raf(loop);
}

window.addEventListener('click', function(ev){


    // renderer.render(scene, camera, swapRenderer.target);
});


window.addEventListener('keydown', function(ev){
    if(ev.keyCode == 27){
        if(isAnimation) raf.cancel(id);
        else    id = raf(animate);

        isAnimation = !isAnimation;
    }
});

window.addEventListener('resize', function(ev){
    renderer.setSize( window.innerWidth, window.innerHeight );
});

window.addEventListener('mousemove', function(ev){
    mouse.x = ev.clientX;
    mouse.y = ev.clientY;
    // swapRenderer.uniforms.uMouse.value   = mouse;

});

init();