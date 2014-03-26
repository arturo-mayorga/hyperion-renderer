

var rPyramid = 0;
var rCube = 0;

var lastTime = 0;

function animate() {
	
	var timeNow = new Date().getTime();
	var elapsed = 0;
	if (lastTime != 0) {
		elapsed = timeNow - lastTime;

		rPyramid += (90 * elapsed) / 1000.0;
		rCube -= (75 * elapsed) / 1000.0;
	}
	lastTime = timeNow;

	lesson.update(elapsed);
	context.draw(elapsed);
}


function tick() {
	window.requestAnimFrame(tick);
	animate();
}

window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
           window.setTimeout(callback, 1000/60);
         };
})();

var context;
var scene;
var hud;
var camController;
var camera;
var lesson;

var shaderSrcMap =
{
    "phong-vs.c":undefined,
    "phong-fs.c":undefined,
    "fullscr-vs.c":undefined,
    "fullscr-fs.c":undefined
};


function start() 
{
    for (var key in shaderSrcMap)
    {
        loadShader(key);
    }
}

window.onload=start;

function loadShader(srcName)
{
    var client = new XMLHttpRequest();
    client.open('GET', "assets/shaders/" + srcName);
    client.onreadystatechange = function() 
    {
        if ( client.readyState == 4 )
        {
            shaderSrcMap[srcName] = client.responseText; 
            checkShaderDependencies();
        }
    }
    client.send();
}

function checkShaderDependencies()
{
    for (var key in shaderSrcMap)
    {
        if (shaderSrcMap[key] == undefined)
        {
            return;
        }
    }
    
    // if all the shaders are loaded move on
    // to the main loop
    mainLoop();
}

function mainLoop()
{
	context = new GContext(document.getElementById("glcanvas"), shaderSrcMap);
	scene   = new GScene();
	camera  = new GCamera();
	hud     = new GHudController();
	
	
	scene.setCamera(camera);
	
	camera.setLookAt(4.232629776000977*4, 2.6432266235351562*4, 0.2486426830291748*4);
	camera.setUp(-0.09341227263212204, 0.9805285334587097, 0.17273758351802826);
	camera.setEye(9.44430160522461*4, 4.382470607757568*4, -3.9111077785491943*4);
	
	context.setScene(scene);
	context.setHud(hud);
	
	
	lesson = createLesson(scene, hud);
	
	tick();
}