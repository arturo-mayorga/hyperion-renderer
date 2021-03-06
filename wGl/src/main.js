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


var _appArgs = function () 
{
  // This function is anonymous, is executed immediately and 
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    	// If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
    	// If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      query_string[pair[0]] = [ query_string[pair[0]], pair[1] ];
    	// If third or later entry with this name
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  } 
    return query_string;
} ();

var _releaseMode = true;
var _appMode = "orbiting";//"pen";

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
    }
    if (context.isReady())
	{
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
    var profileState = createProfiler(context);
    var penState = PenAssembly.createState(context);

    lesson = new FsmMachine();
    lesson.addState("Pen", penState);
    lesson.addState("Profile", profileState);
    lesson.addTransition("Profile", "cleanComplete", "Pen");
    lesson.addTransition("Pen", "cleanComplete", "Pen");
    lesson.setState("Profile");
}

function createOrbitingViewerApp()
{
    var profileState = createProfiler(context);
    var orbitingViewerState = OrbitingViewer.createState(context, _appArgs["h"]);

    lesson = new FsmMachine();
    lesson.addState("OrbitingViewer", orbitingViewerState);
    lesson.addState("Profile", profileState);
    lesson.addTransition("Profile", "cleanComplete", "OrbitingViewer");
    lesson.addTransition("OrbitingViewer", "cleanComplete", "OrbitingViewer");
    lesson.setState("Profile");
}

function creteFirstPersonViewerApp()
{
    var profileState = createProfiler(context);
    var firstPersonViewerState = FirstPersonViewer.createState(context, _appArgs["h"]);

    lesson = new FsmMachine();
    lesson.addState("FirstPersonViewer", firstPersonViewerState);
    lesson.addState("Profile", profileState);
    lesson.addTransition("Profile", "cleanComplete", "FirstPersonViewer");
    lesson.addTransition("FirstPersonViewer", "cleanComplete", "FirstPersonViewer");
    lesson.setState("Profile");
}

var _appCreator = 
{
    "pen":createPenApp,
    "orbiting":createOrbitingViewerApp,
    "firstperson":creteFirstPersonViewerApp
};    

function createAppFSM()
{
    if ( undefined !== _appArgs["mode"] )
    {
        _appMode = _appArgs["mode"];
    }
    
    _appCreator[_appMode]();
}

function mainLoop()
{
	context = new GContext(document.getElementById("glcanvas"));
	scene   = new GScene();
	camera  = new GCamera();
	hud     = new GHudController();
    
	scene.setCamera(camera);
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