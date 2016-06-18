
var raf     = require('raf');
var glslify = require('glslify');
// var createCaption = require('../../dom/caption');
var createCaption = require('vendors/caption');

var scene, camera, renderer;
var object, id;
var stats, wrapper;

var isAnimation = true;

function init(){
    scene = new THREE.Scene();

    camera = new THREE.OrthographicCamera( -window.innerWidth/2, window.innerWidth/2, -window.innerHeight/2, window.innerHeight/2, -10000, 10000 );
    //camera.position.z = -10;

    renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    var geometry = new THREE.PlaneGeometry( window.innerWidth, window.innerHeight );
    var shaderMaterial = new THREE.ShaderMaterial( {
        uniforms: {
            time: { type: "f", value: 1.0 },
            resolution: { type: "v2", value: new THREE.Vector2() }
        },
        vertexShader   : glslify('./shader.vert'),
        fragmentShader : glslify('./shader.frag'),
        side : THREE.DoubleSide
    } );

    var mesh = new THREE.Mesh( geometry, shaderMaterial );
    scene.add(mesh);

    setComponent();

    raf(animate);
}

function setComponent(){
    var title = 'Boilerplate: Shader';
    var caption = 'Boilerplate Three.js shader app';
    var url = 'https://github.com/kenjiSpecial/webgl-sketch-dojo/tree/master/sketches/boilerplate/shader';

    wrapper = createCaption(title, caption, url);

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
    stats.begin();

    renderer.render(scene, camera);

    stats.end();

    id = raf(animate);
}


window.addEventListener('keydown', function(ev){
    if(ev.keyCode == 27){
        if(isAnimation) raf.cancel(id);
        else    id = raf(animate);

        isAnimation = !isAnimation;
    }
});

init();