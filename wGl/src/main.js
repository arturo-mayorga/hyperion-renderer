// Copyright (C) 2014 Arturo Mayorga
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy 
// of this software and associated documentation files (the "Software"), to deal 
// in the Software without restriction, including without limitation the rights 
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
// copies of the Software, and to permit persons to whom the Software is 
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in 
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
// SOFTWARE.

var _releaseMode = false;
var _appMode = "pen";

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
	
	if ( false === _releaseMode )
	{
	    stats.end();
	    stats.begin();
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

var stats;


window.onload=mainLoop;

function createPenApp()
{
    var penState = createLesson(context);
	
    lesson = new FsmMachine();
    lesson.addState("Pen", penState);
    lesson.addTransition("Pen", "cleanComplete", "Pen");
    lesson.setState("Pen");
}

var _appCreator = 
{
    "pen":createPenApp
};    

function createAppFSM()
{
    _appCreator[_appMode]();
}

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
	
	createAppFSM();
	
	if ( false === _releaseMode )
	{
        stats = new Stats();
        stats.setMode(1); // 0: fps, 1: ms
        stats.begin();
        
        // Align top-left
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';
        
        document.body.appendChild( stats.domElement );
    }
	
	tick();
}