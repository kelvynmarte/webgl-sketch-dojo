
var raf = require('raf');
var createCaption = require('../../dom/caption');
var glslify = require('glslify');

var ShaderOdangoSet = require('vendors/shader-odango-set/main');
var copyShader = ShaderOdangoSet.copy;

var blurShader = require('./blur/main');
var blurEffect;

var scene, camera, renderer;
var material, light;
var cubes = [];
var object, id;
var stats, wrapper;
var composer;
var mouse = new THREE.Vector2(-9999, -9999);

var isAnimation = true;
var orthShaderMaterial;
var orthScene, orthCamera, orthPlane;

var renderPlane, renderMaterial;
var renderScene, renderCamera;

var texture = {
    front : null,
    back  : null
};

function init(){
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 200;

    renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    texture.front = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { minFilter: THREE.NearestFilter, maxFilter: THREE.NearestFilter, stencilBuffer: false, depthBuffer: false });
    texture.back  = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { minFilter: THREE.NearestFilter, maxFilter: THREE.NearestFilter, stencilBuffer: false, depthBuffer: false });
    texture.front.texture.wrapS = texture.front.texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.back.texture.wrapS = texture.back.texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.front.texture.magFilter = THREE.NearestFilter;
    texture.back.texture.magFilter = THREE.NearestFilter;

    // setup a reference to hold whatever the current RT is
    texture.currentFront = texture.front;
    texture.currentTarget = texture.back;

    light = new THREE.PointLight(0xFFFFFF, 1);
    light.position.copy(camera.position);
    scene.add(light);

    material = new THREE.MeshPhongMaterial({color: 0x3a9ceb});

    var c;
    for(var i = 0; i < 300; i++) {
        c = addCube();
        cubes.push(c);
        scene.add(c);
    }
    c.position.set(0, 0, 50);

    setComponent();

    raf(animate);
}

function setComponent(){
    var title = 'SWAP RENDERING without EffectComposer';
    var caption = 'rendering back and front buffer(texture) every frame to add effect without effectcomposer.';
    var url = 'https://github.com/kenjiSpecial/webgl-sketch-dojo/tree/master/sketches/basic/swap-rendering1';

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


    for(var i = 0; i < cubes.length; i++) {
        cubes[i].rotation.y += 0.01 + ((i - cubes.length) * 0.00001);
        cubes[i].rotation.x += 0.01 + ((i - cubes.length) * 0.00001);
    }

    renderer.render(scene, camera, texture.currentFront );

    orthScene = new THREE.Scene();
    orthCamera = new THREE.OrthographicCamera( -window.innerWidth/2, window.innerWidth/2, -window.innerHeight/2, window.innerHeight/2, -10000, 10000 );
    orthShaderMaterial = new THREE.ShaderMaterial({
        side : THREE.DoubleSide,
        uniforms: {
            "uTexture" : { type: "t", value: null },
            "uWindow"  : { type: "v2", value: null },
            "uMouse"  : { type: "v2", value: null }
        },
        vertexShader   : glslify('./blur/shader.vert'),
        fragmentShader : glslify('./blur/shader.frag')
    });


    orthShaderMaterial.uniforms.uTexture.value = texture.currentFront;
    orthShaderMaterial.uniforms.uWindow.value  = new THREE.Vector2( window.innerWidth, window.innerHeight );
    orthShaderMaterial.uniforms.uMouse.value   = mouse;

    orthPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(window.innerWidth, window.innerHeight),
        orthShaderMaterial
    );

    orthScene.add(orthPlane);

    //orthCamera.position.z = -100;

    /** --------------------- **/

    renderScene = new THREE.Scene();
    renderCamera = new THREE.OrthographicCamera( -window.innerWidth/2, window.innerWidth/2, -window.innerHeight/2, window.innerHeight/2, -10000, 10000 );

    renderMaterial = new THREE.ShaderMaterial({
        depthTest : false,
        side : THREE.DoubleSide,
        uniforms : {
            "tDiffuse" : {type: "t", value: texture.currentTarget }
        },
        vertexShader : glslify('./display/shader.vert'),
        fragmentShader : glslify('./display/shader.frag')
    });

    renderPlane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight),
        renderMaterial
    );

    renderScene.add(renderPlane);

    id = raf(loop);
    //
}

function loop(){
    stats.begin();

    renderer.render( orthScene, orthCamera, texture.currentTarget );
    renderer.render( renderScene, renderCamera );

    if(texture.currentFront == texture.front){
        texture.currentFront = texture.back;
        texture.currentTarget = texture.front;

    }else{
        texture.currentFront = texture.front;
        texture.currentTarget = texture.back;
    }

    orthShaderMaterial.uniforms.uTexture.value = texture.currentFront;
    renderMaterial.uniforms.tDiffuse.value = texture.currentTarget;


    stats.end();

    raf(loop);
}

function addCube() {
    var cube = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), material);
    cube.position.set(
        Math.random() * 600 - 300,
        Math.random() * 600 - 300,
        Math.random() * -500
    );
    cube.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
    );
    return cube;
}


window.addEventListener('click', function(ev){

    for(var i = 0; i < cubes.length; i++) {
        cubes[i].rotation.y = Math.random() * Math.PI * 2;
        cubes[i].rotation.x = Math.random() * Math.PI * 2;
    }

    renderer.render(scene, camera,texture.currentTarget);
});


window.addEventListener('keydown', function(ev){
    if(ev.keyCode == 27){
        if(isAnimation) raf.cancel(id);
        else    id = raf(animate);

        isAnimation = !isAnimation;
    }
});

window.addEventListener('mousemove', function(ev){
    mouse.x = ev.clientX;
    mouse.y = window.innerHeight - ev.clientY;
    orthShaderMaterial.uniforms.uMouse.value =  mouse;
});

init();