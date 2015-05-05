
var renderer;//THREE.js 渲染器
var scene;//THREE.js场景
var light;//THREE.js灯光
var camera;//THREE.js相机
       


    function initThree() {//初始化THREE库
        width = document.getElementById('canvas-frame').clientWidth;
        height = document.getElementById('canvas-frame').clientHeight;
        try{
            renderer = new THREE.CanvasRenderer();
            alert(renderer);
        } catch (e) { alert(e.description) }
        renderer.setSize(width, height);
        document.getElementById('canvas-frame').appendChild(renderer.domElement);
        renderer.setClearColor(new THREE.Color("rgb(46,109,150)"));

    }
function initCamera() {//初始化相机
    camera = new THREE.PerspectiveCamera(40, width / height, 0.01, 10000);
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 0;
    camera.up.x = 0;
    camera.up.y = 1;
    camera.up.z = 0;
    camera.name = "camera";
    camera.lookAt({ x: 0, y: 0, z: 0 });
}
function animation() {//回调函数，用于渲染，由系统调用

    renderer.clear();

    renderer.render(scene, camera);
    requestAnimationFrame(animation);
}
function initLight() {//初始化灯光
    light = new THREE.AmbientLight(0xffffff);
    light.position.set(0, 0, 0);
    light.name = "light";
    scene.add(light);
}
function initScene() {//初始化场景
    scene = new THREE.Scene();
}
function threeStart() {//开始执行初始化，由body标签的onload触发，并检查当前平台
    alert(2);
    //canvas_div = document.createElement("div");
    //canvas_div.id = "canvas-frame";
    //document.body.appendChild(canvas_div);
    projector = new THREE.Projector();
    initThree();
    initCamera();
    initScene();
    initLight();
    animation();

}
threeStart();