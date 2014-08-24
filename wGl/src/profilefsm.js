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

/**
 * @return {FsmState}
 * @param {GContext}
 */
function createProfiler( context )
{
    var scene = context.getScene();
    var hud = context.getHud();
	var ret = new FsmMachine();
	var oData = new ProfilerOperatingData( context );
	
	ret.addState("Load", new ProfilerLoadState( oData ));
	ret.addState("Explore", new ProfilerExploreState( oData ));
	ret.addState("Clean", new ProfilerCleanState( oData ));
	
	ret.addTransition( "Load", "loadComplete", "Explore" );
	
	ret.addTransition( "Load", "exitReq", "Clean" );
	ret.addTransition( "Explore", "exitReq", "Clean" );
	
	ret.setName("Profiler");
	ret.setEnterState("Load");
	return ret;
}

/**
 * @constructor
 * @param {GContext}
 */
function ProfilerOperatingData( context )
{
    this.context = context;
}
 
 

/**
 * @constructor
 * @extends {FsmMachine}
 * @implements {GObjLoaderObserver}
 * @implements {ThreejsLoaderObserver}
 * @param {ProfilerExploreState}
 */
function ProfilerCleanState( oData )
{
    this.scene = oData.context.getScene();
}

ProfilerCleanState.prototype = Object.create( FsmMachine.prototype );

/**
 * This function is called each time this state is entered
 */
ProfilerCleanState.prototype.enter = function () 
{
    var children = this.scene.getChildren();
	for (var len = children.length; len > 0; children = this.scene.getChildren(), len = children.length )
	{
		children[0].deleteResources(); 
		this.scene.removeChild( children[0] );
	}
	
	while ( this.scene.removeLight(0) );
	
	var materials = this.scene.getMaterials();
	
	for ( var i in materials )
	{
	    this.scene.removeMaterial( materials[i] );
	    materials[i].deleteResources();
	}
};

/**
 * This function is called each time the state is exited
 */
ProfilerCleanState.prototype.exit = function () 
{
};

/**
 * Update this state
 * @param {number} Number of milliseconds since the last update
 */
ProfilerCleanState.prototype.update = function ( time ) 
{
    this.fireSignal("cleanComplete");
};

/**
 * @constructor
 * @extends {FsmMachine}
 * @implements {GObjLoaderObserver}
 * @implements {ThreejsLoaderObserver}
 * @param {ProfilerOperatingData}
 */
function ProfilerLoadState( oData ) 
{
    this.scene = oData.context.getScene();
	this.hud = oData.context.getHud();
	this.oData = oData;
	
	
}

ProfilerLoadState.prototype = Object.create( FsmMachine.prototype );

/**
 * This function is called each time this state is entered
 */
ProfilerLoadState.prototype.enter = function () 
{ 
	this.scene.setVisibility( false );
	
	var camera = this.scene.getCamera();
	camera.setLookAt(4.232629776000977*4, 2.6432266235351562*4, 0.2486426830291748*4);
	camera.setUp(-0.09341227263212204, 0.9805285334587097, 0.17273758351802826);
	camera.setEye(0, 0, 0);
	
	var light0 = new GLight();
	var light1 = new GLight();
	var light2 = new GLight();
	var light3 = new GLight();
	var light4 = new GLight();
	var light5 = new GLight(); 
	
	
	light0.setPosition(-18, 28.25, 16);
	light1.setPosition(-18, 28.25, -20);
	light2.setPosition(6, 28.25, 16);
	light3.setPosition(6, 28.25, -20);
	light4.setPosition(30, 28.25, 16);
	light5.setPosition(30, 28.25, -20);
    
    this.scene.addChild( new Cuboid(1.5, 1.5, 1.5, "cube") );
    this.scene.addChild( new Cylinder(0.5, 2, 50, "cylinder") );
    this.scene.addChild( new Torus(1, .25, 50, 50, "torus") );
    this.scene.addChild( new Sphere(1, 50, 25, "sphere") );
    this.scene.addChild( new Cone(0.5, 2, 50, "cone") );
    
    this.scene.addLight(light0);
	this.scene.addLight(light1);
	this.scene.addLight(light2);
	this.scene.addLight(light3);
	this.scene.addLight(light4);
	this.scene.addLight(light5);
};

/**
 * This function is called each time the state is exited
 */
ProfilerLoadState.prototype.exit = function () 
{	
	this.scene.setVisibility( true );
};

/**
 * Update this state
 * @param {number} Number of milliseconds since the last update
 */
ProfilerLoadState.prototype.update = function ( time ) 
{
    this.fireSignal("loadComplete");
};

/**
 * @constructor
 * @implements {FsmState}
 * @implements {IContextMouseObserver}
 * @param {ProfilerOperatingData}
 */
function ProfilerExploreState( oData ) 
{
    this.scene = oData.context.getScene();
	this.hud = oData.context.getHud();
	this.oData = oData;
	this.timeR = 0;
	
}

ProfilerExploreState.prototype = Object.create( FsmMachine.prototype );

/**
 * Set the signal observer
 * @param {FsmSignalObserver} observer The new observer to be used
 */
ProfilerExploreState.prototype.setSignalObserver = FsmState.prototype.setSignalObserver;

/**
 * Fire the transition signal
 * @param {string} signal Name of the signal to fire
 */
ProfilerExploreState.prototype.fireSignal = FsmState.prototype.fireSignal;

/**
 * @param {MouseEvent}
 * @param {number}
 */
ProfilerExploreState.prototype.onMouseDown = function( ev, objid ) 
{
    this.fireSignal("exitReq");
};

/**
 * @param {MouseEvent}
 */
ProfilerExploreState.prototype.onMouseUp = function( ev ) {};

/**
 * @param {MouseEvent}
 */
ProfilerExploreState.prototype.onMouseMove = function( ev ) {};

/**
 * This function is called whenever we enter the explore state
 */
ProfilerExploreState.prototype.enter = function () 
{
	this.camController = new GCameraController();
	this.camController.bindCamera(this.scene.getCamera());
    
    this.oData.context.addMouseObserver( this );
    
    
	
	this.scene.setVisibility( true );
};

/**
 * This function is called whenever we exit the explore state
 */
ProfilerExploreState.prototype.exit = function () 
{
	this.camController = undefined;
	
	this.oData.context.removeMouseObserver( this );
};

/**
 * This is the update function for the explore state
 * @param {number} number of milliseconds since the last update
 */
ProfilerExploreState.prototype.update = function ( time ) 
{
	this.camController.update( time );
	this.fireSignal("exitReq");
};


