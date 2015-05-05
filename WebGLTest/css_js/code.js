//<!--some varules-->
var lon = 90, lat = 0, pni = 0, theta = 0;//控制相机朝向的垂直角度与水平角度
var maxABSofLat = 50;//限制相机垂直角度的绝对值
var renderer;//THREE.js 渲染器
var scene;//THREE.js场景
var light;//THREE.js灯光
var camera;//THREE.js相机
var twoBalls = [];//球数组，用于切换景点，只有两个元素
var current = 0;//当前球的索引，每切换一次场景自增1，取模2后得到球数字里的索引值
var currentID = 0;//标识当前场景的ID号，值来自于DataStructor.js
var lerpFrame = null; //帧动画
var downedTexture = new Array(0);//已经下载的贴图索引数组//热点出问题
var createdGotos = new Array(Textures.length);//用于保存每个场景的热点
var r;//球的直径
var isDown = false;
var p1 = { x: 0, y: 0 }, autorotate = 0.04;//p1:用于拖动鼠标时保存本次坐标，与下次计算比较。autorotate:自动浏览速度
var isPC = false;//标识当前平台是否为PC平台
var isControl = false;//标识是否处于方向设备控制   

//some functions of event
    function onClick(e) {//点击，计算是否落在热点上
        var obj = raycast(e.pageX, e.pageY);
        if (obj != undefined) {
            var userData = obj.name;
            if (userData == "goto") {
                switchBallsShow(obj.userData);
            }
        }
    }
function onMouseDown(e) {//配合MouseMove来实现鼠标拖动浏览
    autorotate = 0;
    isDown = true;
    document.getElementById('canvas-frame').addEventListener('mousemove', onMouseMove, false);
    document.getElementById('canvas-frame').addEventListener('mouseup', onMouseUp);
    p1 = { x: e.pageX, y: e.pageY };
    window.clearTimeout("autorotate=0", 1000);
}
function onMouseMove(e) {//配合MouseDown来实现鼠标拖动浏览
    var offset = { x: e.pageX, y: e.pageY };
    offset.x -= p1.x;
    offset.y -= p1.y;
    var x = Math.max(-100, Math.min(100, offset.x));
    var y = Math.max(-100, Math.min(100, offset.y));
    p1 = { x: e.pageX, y: e.pageY }
    lon -= x * window.innerHeight / window.innerWidth * 0.1;
    lat += y * window.innerHeight / window.innerWidth / 2 * 0.1;
}
function onMouseUp(e) {//配合MouseMove来实现鼠标拖动浏览
    isDown = false;
    if (!isControl) window.setTimeout("autorotate = 0.04", 2000);
    document.getElementById('canvas-frame').removeEventListener('mousemove', onMouseMove);
    document.getElementById('canvas-frame').removeEventListener('mouseup', onMouseUp);

}
document.onkeydown = function (e) {//当按下ctrl按键的时候恢复视角到40度
    if (e.keyCode == 17) {
        width = document.getElementById('canvas-frame').clientWidth;
        height = document.getElementById('canvas-frame').clientHeight;
        camera.fov = 45;
        camera.projectionMatrix.makePerspective(45, width / height, 0.01, 10000);
    }
}
function onMouseOver(e) {//当鼠标移到canvas上的时候添加必要的事件监听器
    document.getElementById('canvas-frame').addEventListener('mouseout', onMouseOut, false);
    document.getElementById('canvas-frame').addEventListener('click', onClick, false);
    document.getElementById('canvas-frame').addEventListener('mousedown', onMouseDown, false);
}
function onMouseOut(e) {//当鼠标移到canvas上的时候移除必要的事件监听器
    document.getElementById('canvas-frame').removeEventListener('mouseout', onMouseOut);
    document.getElementById('canvas-frame').removeEventListener('click', onClick);
    document.getElementById('canvas-frame').removeEventListener('mousedown', onMouseDown);
}
function onMouseWheel(e) {//鼠标中键滚动控制视角
    //e.preventDefault();
    width = document.getElementById('canvas-frame').clientWidth;
    height = document.getElementById('canvas-frame').clientHeight;
    var d = Math.max(10, Math.min(camera.fov + e.wheelDelta * 0.01, 60));
    camera.fov = d;
    camera.projectionMatrix.makePerspective(d, width / height, 0.01, 10000);
}
var timeout = null;
function onTouchStart(e) {//触摸，每当有一个触点产生是出发，用于检测三种状态:1个触点则添加拖动场景浏览，2个触点则添加视角控制，3个触点则恢复视角
    if (3 == e.touches.length) {
        width = document.getElementById('canvas-frame').clientWidth;
        height = document.getElementById('canvas-frame').clientHeight;
        camera.fov = 45;
        camera.projectionMatrix.makePerspective(45, width / height, 0.01, 10000);
    }
    if (1 == e.touches.length) {
        e.preventDefault();
        window.clearTimeout("autorotate = 0", 1000);
        autorotate = 0;
        p1 = { x: e.touches[0].pageX, y: e.touches[0].pageY };
        var obj = raycast(e.touches[0].pageX, e.touches[0].pageY);
        if (obj != undefined) {
            var userData = obj.name;
            if (userData == "goto") {
                switchBallsShow(obj.userData);
            }
        }
        var w = document.getElementById('Tool1').offsetWidth;
        document.getElementById('Tool1').style.left = "-"+(w-10)+"px";
        document.getElementById('Tool1').style.opacity = "0.3";
        document.getElementById('canvas-frame').removeEventListener("touchmove", doubleTouchMove);
        document.getElementById('canvas-frame').addEventListener("touchmove", onDocumentTouchMove, false);
    }
    else if (2 == e.touches.length) {
        document.getElementById('canvas-frame').removeEventListener("touchmove", onDocumentTouchMove);
        document.getElementById('canvas-frame').addEventListener("touchmove", doubleTouchMove, false);
    }
}
function onTouchEnd(e) {//触摸完毕后移除相关监听器
    //e.preventDefault();
    document.getElementById('canvas-frame').addEventListener("touchstart", onTouchStart);
    document.getElementById('canvas-frame').removeEventListener("touchmove", doubleTouchMove);
    document.getElementById('canvas-frame').removeEventListener("touchmove", onDocumentTouchMove);
    if (!isControl) window.setTimeout("autorotate = 0.04;", 2000);
}
var tl = 0;
function onDocumentTouchMove(e) {//当一个触点时TouchStart添加此监听器，用于拖动场景浏览
    if (event.touches.length == 1) {
        event.preventDefault();
        document.getElementById('canvas-frame').removeEventListener("touchstart", onTouchStart);
        //setTimeout("autorotate = 0.06;", 2000);
        var offset = { x: e.touches[0].pageX, y: e.touches[0].pageY };
        offset.x -= p1.x;
        offset.y -= p1.y;
        offset.x = Math.max(-100, Math.min(100, offset.x));
        offset.y = Math.max(-100, Math.min(100, offset.y));
        lon -= offset.x * 0.06;
        lat += offset.y * 0.03;
        p1 = { x: e.touches[0].pageX, y: e.touches[0].pageY };
    }
}
function doubleTouchMove(e) {//当两个触点时TouchStart添加 此监听器，用于缩放视角
    if (event.touches.length == 2) {
        event.preventDefault();
        document.body.removeEventListener("touchstart", onTouchStart);
        var xl = event.touches[0].pageX - event.touches[1].pageX;
        var yl = event.touches[0].pageY - event.touches[1].pageY;
        var l = Math.pow(xl * xl + yl * yl, 0.5);
        if (0 == tl) {
            tl = l;
        }
        if (Math.abs(tl - l) > 0.1) {
            var direction = -(l - tl) / Math.abs(l - tl) * 0.5;
            width = document.getElementById('canvas-frame').clientWidth;
            height = document.getElementById('canvas-frame').clientHeight;
            var d = Math.max(10, Math.min(camera.fov + direction, 60));
            //alert(tl);
            camera.fov = d;
            camera.projectionMatrix.makePerspective(d, width / height, 0.01, 10000);
        }
        tl = l;
    }
}
function raycast(x, y) {//拾取函数，返回拾取到的对象
    //event.preventDefault();
    var onHitObj;
    var mx = (x / document.getElementById('canvas-frame').clientWidth) * 2 - 1;
    var my = -(y / document.getElementById('canvas-frame').clientHeight) * 2 + 1;
    var vec = new THREE.Vector3(mx, my, 1);
    projector.unprojectVector(vec, camera);
    var ray = new THREE.Raycaster(camera.position, vec.sub(camera.position).normalize());
    var intersects = ray.intersectObjects(scene.children);
    if (onHitObj == null && intersects.length > 0 && intersects[0].object.visible == true) {
        onHitObj = intersects[0].object;
    }
    else if (intersects.length == 0) {
        onHitObj = null;
    }
    return onHitObj;
}
function onWindowResize() {//当窗口大小改变时调整场景大小和相机视口大小
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (!isPC) {
        closeDirection();
        showDirection();
    }
}

//<!--init anything in three.js-->
function initThree() {//初始化THREE库
        width = document.getElementById('canvas-frame').clientWidth;
        height = document.getElementById('canvas-frame').clientHeight;
        try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch (e) { alert(e.description) }
        renderer.setSize(width, height);
        document.getElementById('canvas-frame').appendChild(renderer.domElement);
        renderer.setClearColor(new THREE.Color("rgb(46,109,150)"));

    }
function initCamera() {//初始化相机
    camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 10000);
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
    if (lerpFrame != null) {
        lerpFrame();
    }
    renderer.clear();
    lon += autorotate;
    lat = Math.max(-maxABSofLat, Math.min(maxABSofLat, lat));
    pni = THREE.Math.degToRad(90 - lat);
    theta = THREE.Math.degToRad(lon);

    var target = new THREE.Vector3(0, 0, 0);
    target.x = Math.sin(pni) * Math.cos(theta);
    target.y = Math.cos(pni);
    target.z = Math.sin(pni) * Math.sin(theta);
    camera.lookAt(target);
    if (touchstate >= 0)
    {
        switch (touchstate)
        {
            case 0:
                lat += 1;
                break;
            case 1:
                lat -= 1;
                break;
            case 2:
                lon -= 1;
                break;
            case 3:
                lon += 1;
                break;
        }
    }
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

    projector = new THREE.Projector();
    initThree();
    initCamera();
    initScene();
    initLight();
    makeTwoBalls();
    animation();
    var deviceAgent = navigator.userAgent.toLocaleLowerCase();
    var agentID = deviceAgent.match(/(iphone|ipod|ipad|android|wp|blackberry)/);
    if (agentID) {
        document.getElementById('canvas-frame').addEventListener("touchstart", onTouchStart, false);
        document.getElementById('canvas-frame').addEventListener("touchend", onTouchEnd, false);
        isPC = false;
    }
    else {
        //document.getElementById('canvas-frame').addEventListener("keypress", onKeyDown);
        document.getElementById('canvas-frame').addEventListener("mousewheel", onMouseWheel, false);
        document.getElementById('canvas-frame').addEventListener("mouseover", onMouseOver, false);
        window.addEventListener('resize', onWindowResize, false);
        //document.getElementById('canvas-frame').addEventListener("keypress", onKeyDown);
        isPC = true;
    }
    window.addEventListener('resize', onWindowResize, false);
    showTitle();//显示屏幕顶部的状态栏
}
function makeTwoBalls() {//加载球形模型到twoBalls数组里
    showWait();
    var loader = new THREE.JSONLoader(false);
    loader.load("obj/ball.js", function (geometry, material) {//加载ball网格
        var texture = THREE.ImageUtils.loadTexture("images/"+(isPC?"HD_":"") + Textures[0].Map, THREE.UVMapping);//加载第一张贴图
        downedTexture[0] = texture;//记录贴图
        material = new THREE.MeshLambertMaterial({ map: texture });//生成材质
        twoBalls[0] = new THREE.Mesh(geometry, material);//创建球形网格
        twoBalls[0].material.needsUpdate = true;
        twoBalls[0].scale.set(15, 15, 15);//设置缩放
        twoBalls[0].name = "ball1";
        scene.add(twoBalls[0]);//添加到场景中显示
        currentID = Textures[0].ID;//设置当前场景ID

        //创建第二个球体，不贴图
        material = new THREE.MeshLambertMaterial({ color: 0x000000 });
        twoBalls[1] = new THREE.Mesh(geometry, material);
        twoBalls[1].scale.set(15, 15, 15);
        scene.add(twoBalls[1]);
        twoBalls[1].visible = false;
        twoBalls[1].name = "ball2";
        //获取球的直径长度
        var box = new THREE.Box3().setFromObject(twoBalls[1]);
        r = box.max;
        //////////////////////////////
        var loader = new THREE.JSONLoader(false);//创建加载器
        loader.load("obj/goto.js", makeGotos);//加载热点
    });
}
function makeGotos(geometry, material) {//为当前球形添加对应的热点
    if (createdGotos[currentID - 1024] == null) {
        var currentGotos = createdGotos[currentID - 1024] = new Array();
        console.log("not created");
        var material = new THREE.MeshBasicMaterial({ color: 0x2183c2 });//创建红色材质
        var goto_set = gotos[currentID - 1024];//获取与当前场景ID对应的热点信息到goto_set
        for (var i = 0; i < goto_set.TargetID.length - 1 ; i++) {//循环创建
            var Mesh = new THREE.Mesh(geometry, material);//创建网格
            var thePosition = goto_set.Position[i];//获取goto_set中的热点位置向量
            thePosition.x *= r.x * 0.8;//利用计算好的直径的80%的位置乘位置向量得到场景中的实际位置
            thePosition.y = -1.5;
            thePosition.z *= r.z * 0.8;
            var tarID = goto_set.TargetID[i];//获取场景ID
            Mesh.userData = tarID;//标识该网格为热点网格，用于拾取时区分球与热点
            //Mesh.id = tarID;//设置ID
            Mesh.position.set(thePosition.x, thePosition.y, thePosition.z);//设置位置
            Mesh.lookAt(camera.position);//朝向相机
            Mesh.name = "goto";
            Mesh.scale.set(1.5, 1.5, 1.5);
            Mesh.rotateX(25 * 3.14 / 180);
            currentGotos.push(Mesh);
            currentGotos.push(showGotosInfo(unescape(Textures[tarID - 1024].ViewName), thePosition, tarID)); scene.add(Mesh);//添加到场景显示
        }
        closeWait();
    }
    else {
        for (var l = 0; l < createdGotos[currentID - 1024].length; l++)//将当前球的热点设置为不可见
            createdGotos[currentID - 1024][l].visible = true;
    }
    var cdiv = document.getElementById("cdiv");
    if (cdiv != null)
        cdiv.innerHTML = unescape(Textures[currentID - 1024].ViewName);
}

//<!--usefull function-->
    //Switch wich ball show

    function switchBallsShow(id) {//切换景点
        var isDowned = downedTexture[id - 1024];//查询目的景点的贴图是否已经加载
        var temp = twoBalls[current % 2];//获取当前球
        temp.scale.set(0.05, 0.05, 0.05);//缩放当前球
        for (var l = 0; l < createdGotos[currentID - 1024].length; l++)//将当前球的热点设置为不可见
            createdGotos[currentID - 1024][l].visible = false;
        currentID = id;//设置当前景点的ID
        if (isDowned != null)//如果目的贴图已经加载
        {
            twoBalls[(current + 1) % 2].material.map = isDowned;//更换贴图
            twoBalls[(current + 1) % 2].material.needsUpdate = true;//设置更新
            twoBalls[(current + 1) % 2].visible = true;//设置可见
            //stopWatch.x = 1;//设置帧动画计时
            lerpFrame = switching;//启动帧动画
        }
        else//否则下载贴图，并更换贴图
        {
            showWait();
            var tt = THREE.ImageUtils.loadTexture("images/"+(isPC?"HD_":"") + Textures[id - 1024].Map, THREE.UVMapping, function () {
                twoBalls[(current + 1) % 2].material.map = tt;//下载完贴图后执行更换贴图
                downedTexture[id - 1024] = tt;//记录一下载的贴图
                twoBalls[(current + 1) % 2].material.needsUpdate = true;//设置更新
                twoBalls[(current + 1) % 2].visible = true;//可见为真
                //stopWatch.x = 1;
                lerpFrame = switching;        //启动帧动画            
            });
        }
    }
    function showGotosInfo(str, p, tarID) {//显示每个热点的目标位置
        var canvas = document.createElement("canvas");
        canvas.height = 30;
        var ctx = canvas.getContext("2d");
        ctx.font = "24px 微软雅黑";
        var pwidth = ctx.measureText(str).width
        canvas.width = pwidth + 20;
        ctx.fillStyle = "rgba(33,131,194,1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.fillRect(1, 1, canvas.width - 2, canvas.height - 2);
        ctx.font = "24px 微软雅黑";
        ctx.fillStyle = "rgba(255,255,255,1)";
        ctx.fillText(str, 10, 23);

        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        var material = new THREE.MeshBasicMaterial({ map: texture });
        material.transparent = true;
        var geometry = new THREE.PlaneGeometry(canvas.width, canvas.height, 1, 1);
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(p.x, p.y - 0.8, p.z);
        mesh.lookAt(camera.position);
        mesh.scale.set(0.015, 0.015, 0.015);
        mesh.name = "info";
        scene.add(mesh);
        return mesh;
    }
    switchBallcallback = switchBallsShow;//此变量在DataStructor.js中，用于场景左侧的Map按钮目的景点切换的函数指针，指向了switchBallShow函数
    beCalledFunction = function () { document.body.removeChild(win); };//此变量在DataStructor.js中，用于切换后调用的函数，指向一个匿名函数：关闭窗口
    function switching() {//切换场景特效，帧动画
        //计算相机朝向
        lat = Math.max(-85, Math.min(85, lat));
        pni = THREE.Math.degToRad(90 - lat);
        var target = new THREE.Vector3(0, 0, 0);
        target.x = Math.sin(pni) * Math.cos(theta);
        target.y = Math.cos(pni);
        target.z = Math.sin(pni) * Math.sin(theta);
        theta = THREE.Math.degToRad(lon);
        //根据计算机朝向得到球的移动方向
        twoBalls[current % 2].position.x += target.x * 0.04; //移动x轴
        twoBalls[current % 2].position.z += target.z * 0.04;//移动z轴
        twoBalls[current % 2].position.y += 0.04 * target.y; //移动y轴
        //改变移动轨迹当球的位置与相机的位置距离大于0.2时
        if (Math.pow(Math.pow(twoBalls[current % 2].position.x, 2) + Math.pow(twoBalls[current % 2].position.z, 2), 0.5) > 0.2)
            twoBalls[current % 2].position.y += Math.pow(Math.pow(Math.pow(twoBalls[current % 2].position.z * 2, 2) + Math.pow(twoBalls[current % 2].position.x * 2, 2), 0.5), 2) * 0.04 * (lat < 0 ? -1 : 1);
        //当相机与球的距离大于1时间执行下面代码
        if (Math.pow(Math.pow(twoBalls[current % 2].position.x, 2) + Math.pow(twoBalls[current % 2].position.z, 2) + Math.pow(twoBalls[current % 2].position.y, 2), 0.5) > 1) {
            lerpFrame = null;//取消帧动画
            twoBalls[current % 2].visible = false;//设置当前球的可视为假
            twoBalls[current % 2].position.set(0, 0, 0);//设置当前
            twoBalls[current % 2].scale.set(15, 15, 15);//设置当前球的缩放
            current++;//当前球的索引自增1
            var loader = new THREE.JSONLoader(false);//开始加载热点（goto）
            loader.load("obj/goto.js", makeGotos);
        }
    }

    function Look() {//待用。。。
        lat = Math.max(-70, Math.min(70, lat));
        pni = THREE.Math.degToRad(90 - lat);
        theta = THREE.Math.degToRad(lon);
        var target = new THREE.Vector3(0, 0, 0);
        target.x = Math.sin(pni) * Math.cos(theta);
        target.y = Math.cos(pni);
        target.z = Math.sin(pni) * Math.sin(theta);
    }

    //<!--UI-->

        function showWait() {//显示加载中提示
            var waitDiv = document.createElement("div");
            waitDiv.id = "wait";
            var waitPic = document.createElement("img");
            waitPic.id = "waitPicture";
            waitPic.src = "/SysImages/wait.gif";
            waitPic.style.width = window.innerHeight / 2+"px";
            waitPic.style.height = window.innerHeight / 2 + "px";
            waitDiv.appendChild(waitPic);
            document.body.appendChild(waitDiv);
        }
    function closeWait() {//关闭加载中提示
        var wait = document.getElementById("wait");
        document.body.removeChild(wait);
    }
    var statue = unescape(Textures[0].ViewName);//获取第一个景点的名字，用于状态栏的显示
    function showTitle() {//显示状态栏
        var div = document.createElement("div");
        div.id = "StatueTitle";
        var cdiv = document.createElement("div");
        cdiv.id = "cdiv";
        cdiv.style.margin = "auto";
        cdiv.style.width = "50%";
        cdiv.style.height = "100%";
        cdiv.style.background = "#000000";
        cdiv.style.color = "#ffffff";
        cdiv.style.fontSize = "22px";
        cdiv.innerHTML = statue;
        div.appendChild(cdiv);

        document.body.appendChild(div);
        showTool1();
    }
    function showTool1() {//显示左侧工具栏
        var tool1 = document.createElement("div");
        tool1.id = "Tool1";

        var map = document.createElement("input");
        map.id = "toolButton";
        map.type = "button";
        map.value = "map";
        map.style.bottom = "15%";
        map.addEventListener("click", mapButtonClick, false);
        tool1.appendChild(map);

        var about = document.createElement("input");
        about.id = "toolButton";
        about.type = "button";
        about.value = "about";
        about.style.bottom = "30%";
        about.addEventListener("click", aboutButtonClick, false);
        tool1.appendChild(about);

        var help = document.createElement("input");
        help.id = "toolButton";
        help.type = "button";
        help.value = "help";
        help.style.bottom = "45%";
        help.addEventListener("click", helpButtonClick, false);
        help.addEventListener("mousepress", function () { console.log(1); }, false);
        help.mou
        tool1.appendChild(help);

        var ctrl = document.createElement("input");
        ctrl.id = "toolButton";
        ctrl.type = "button";
        ctrl.value = "control";
        ctrl.style.bottom = "60%";
        ctrl.addEventListener("click", controlButtonClick, false);
        tool1.appendChild(ctrl);

        document.body.appendChild(tool1);
        tool1.addEventListener(isPC ? "mousemove" : "touchstart", overTool1, false);
        var w = document.getElementById('Tool1').offsetWidth;
        document.getElementById('Tool1').style.left = "-1px";
        window.setTimeout("document.getElementById('Tool1').style.left ='-"+(w-10)+"px';document.getElementById('Tool1').style.opacity = '0.3';", 3500);
    }
    function overTool1(e) {//当鼠标移到左侧的工具栏的时候 触发：显示工具栏（完全移出工具栏即完全显示，一开始是显示一部分，透明度调高）
        document.getElementById("Tool1").style.left = "-1px";
        document.getElementById("Tool1").style.opacity = "0.85";
        if (isPC)
            document.getElementById("Tool1").addEventListener("mouseout", outTool1, false);
    }
    function outTool1() {//当鼠标移出左侧工具栏时候触发：只显示工具栏的一小部分，透明度调低
        document.getElementById("Tool1").style.opacity = "0.3";
        var w = document.getElementById('Tool1').offsetWidth;
        document.getElementById("Tool1").style.left = "-"+(w-10)+"px";
    }
    var currentMapID = 0;
    function mapButtonClick() {//Map按钮的click事件
        var win = createWin();
        var childOfWin = createChildWin("Total View");
        win.appendChild(childOfWin);
        var nextButton = document.createElement("input");
        var preButton = document.createElement("input");
        nextButton.type = "button";
        preButton.type = "button";
        nextButton.style.position = "absolute";
        nextButton.style.width = "9%";
        nextButton.style.height = "7%";
        nextButton.style.right = "10px";
        nextButton.style.bottom = "10px";
        nextButton.style.background = "#555555";
        nextButton.style.color = "#ffffff";
        nextButton.style.border = "double";
        nextButton.value = "next";
        preButton.style.position = "absolute";
        preButton.style.width = "9%";
        preButton.style.height = "7%";
        preButton.style.left = "10px";
        preButton.style.bottom = "10px";
        preButton.style.background = "#555555";
        preButton.style.color = "#ffffff";
        preButton.style.border = "double";
        preButton.value = "pre";
        preButton.style.fontSize = "12px";
        nextButton.style.fontSize = "12px";
        childOfWin.appendChild(preButton);
        childOfWin.appendChild(nextButton);
        preButton.onclick = function () {
            for (var i = 0; i < childOfWin.children.length ; i++) {
                if (childOfWin.children[i].id == "button") {
                    childOfWin.removeChild(childOfWin.children[i]);
                    i = 0;
                }
            }
            if (currentMapID > 0) {
                currentMapID--;
            }
            showButtons(childOfWin);
        };
        nextButton.onclick = function () {
            for (var i = 0; i < childOfWin.children.length ; i++) {
                if (childOfWin.children[i].id == "button") {
                    childOfWin.removeChild(childOfWin.children[i]);
                    i = 0;
                }
            }
            if (currentMapID < parseInt(Textures.length / 6)) {
                currentMapID++;
            }
            showButtons(childOfWin);
        };
        showButtons(childOfWin);

    }
    function showButtons(ele) {
        for (var i = currentMapID * 6 ; i < currentMapID + 6 ; i++) {
            if (i >= Textures.length)
                break;
            var button = document.createElement("input");
            button.id = "button";
            button.type = "button";
            button.value = unescape(Textures[i].ViewName);

            ele.appendChild(button);
            button.style.top = parseInt((i % 6) / 3) * 20 + 15 + "%";
            button.style.width = "20%";
            button.style.left = (parseInt(i % 3) * 25) + 15 + "%";
            button.onclick = clickFunctions[i];
        }

    }

    function aboutButtonClick() {//About按钮的click事件
        var win = createWin();
        var childOfWin = createChildWin("About");
        win.appendChild(childOfWin);
        var text = document.createElement("div");
        text.style.fontSize = "22px";
        text.innerHTML = unescape("<br>" + aboutString + "<br/>");
        childOfWin.appendChild(text);
    }
    function helpButtonClick() {//Help按钮的click事件
        var win = createWin();
        var childOfWin = createChildWin("Help");
        win.appendChild(childOfWin);
        var text = document.createElement("div");
        text.style.fontSize = "18px";
        if (isPC)
            text.innerHTML = unescape("<br>当前是PC平台，操作如下：<br/><br>鼠标拖动浏览场景，鼠标滚轮缩放视角<br/><br>ctrl键恢复视角，左侧菜单'control'启动键盘方向键控制<br/><br>左侧菜单'map'可以查看全部景点<br/>");
        else
            text.innerHTML = unescape("<br>当前是移动平台，操作如下：<br/><br>触摸拖动屏幕浏览场景，两点触控缩放视角<br/><br>同时按下三个手指恢复视角<br/><br>左侧菜单'map'可以查看全部景点<br/>");
        childOfWin.appendChild(text);
    }
    function controlButtonClick() {//启动与关闭方向设备的控制
        isControl = !isControl;
        if (isControl) {
            if (isPC) {
                alert("Key control : Enable");
                autorotate = 0;
                document.body.onkeydown = function (e) {
                    if (82 != e.keyCode) {
                        switch (e.keyCode) {
                            case 37:
                                lon -= 1;
                                break;
                            case 39:
                                lon += 1;
                                break;
                            case 38:
                                lat += 1;
                                break;
                            case 40:
                                lat -= 1;
                                break;
                        }
                    }
                }
            }
            else {
                showDirection();
            }
        } else {
            if (isPC) {
                alert("Key control : Disable");
                document.body.onkeydown = null;
                autorotate = 0.04;
            }
            else {
                closeDirection();
            }
        }
    }
    function createWin() {//创建一个窗口
        var w = document.getElementById('Tool1').offsetWidth;
        document.getElementById('Tool1').style.left = "-"+(w-10)+"px";
        document.getElementById('Tool1').style.opacity = "0.3";
        {
            win = document.createElement("div");
            win.id = "win";
            document.body.appendChild(win);
        }
        return win;
    }
    function createChildWin(title) {//创建一个win的子窗口
        var childOfWin = document.createElement("div");
        childOfWin.id = "childOfWin";
        childOfWin.innerHTML = unescape(title);
        var close = document.createElement("div");
        close.id = "close";
        close.innerHTML = "C";
        close.addEventListener("click", function () { document.body.removeChild(win); }, false);
        childOfWin.appendChild(close);
        return childOfWin;
    }
    function showDirection() {//待用。。。
        alert(unescape("控制手柄用于微调视觉角度，浏览请滑动屏幕"));
        var direction = document.createElement("div");
        direction.id = "direction";
        direction.style.width = window.innerWidth * 0.2 + "px";
        direction.style.height = window.innerWidth * 0.2 + "px";
        var img = document.createElement("img");
        img.src = "SysImages/direct.png";
        img.id = "imgID";
        img.onmousedown = "return false;";
        direction.appendChild(img);
        img.style.width = window.innerWidth * 0.2 + "px";
        img.style.height = window.innerWidth * 0.2 + "px";
        document.body.appendChild(direction);
        var listener = document.createElement("div");
        listener.id = "listener";
        listener.style.position = "absolute";
        listener.style.height = listener.style.width = window.innerWidth * 0.2 + "px";
        listener.style.left = direction.offsetLeft+"px";
        listener.style.top = direction.offsetTop + "px";
        //listener.style.msTouchSelect = "none";
        document.body.appendChild(listener);
        listener.addEventListener("touchstart", directStart, false);
        listener.addEventListener("touchend", directEnd, false);
        r
    }
    function closeDirection() {//待用。。。
        var listener = document.getElementById("listener");
        listener.removeEventListener("touchstart", directStart);
        listener.removeEventListener("touchend", directEnd);
        document.body.removeChild(direction);
    }
    var touchstate = -1;
    var timer;
    function directStart(event) {
        event.preventDefault();
        var direction = document.getElementById("direction");
        var s = direction.offsetWidth;
        var d = new Array();
        d.push({ x: s / 3, y: 0, ox: s * (2 / 3), oy: s / 3 });
        d.push({ x: s / 3, y: s * (2 / 3), ox: s * (2 / 3), oy: s });
        d.push({ x: 0, y: s / 3, ox: s / 3, oy: s * (2 / 3) });
        d.push({ x: s * (2 / 3), y: s / 3, ox: s, oy: s * (2 / 3) });
        var p = { x: event.touches[0].pageX - direction.offsetLeft, y: event.touches[0].pageY - direction.offsetTop };
        //var p = { x: event.pageX - direction.offsetLeft, y: event.pageY - direction.offsetTop };
        for (var i = 0 ; i < d.length ; i++)
        {
            if (p.x > d[i].x && p.x < d[i].ox && p.y > d[i].y && p.y < d[i].oy) {
                touchstate = i;
                break;
            }
            else {
                touchstate = -1;
            }
                
        }
        //timer = window.setTimeout(directStart, 3000);
    }
    function directEnd(e)
    {
        event.preventDefault();
        touchstate = -1;
        return true;
    }
    threeStart();