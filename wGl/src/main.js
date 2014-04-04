

var rPyramid = 0;
var rCube = 0;

var lastTime = 0;

function animate() {
	
	var timeNow = new Date().getTime();
	var elapsed = 0;
	if (lastTime != 0) 
	{
		elapsed = timeNow - lastTime;
	}
	lastTime = timeNow;

	if (context.isReady())
	{
        lesson.update(elapsed);
        context.draw(elapsed);
	}
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
var camera;
var lesson;



window.onload=mainLoop;

function mainLoop()
{
	context = new GContext(document.getElementById("glcanvas"));
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