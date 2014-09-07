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
    this.hud = oData.context.getHud();
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
	
	while ( this.scene.removeLight(0) ){}
	
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
    this.ui = {};
	var bg = new GHudRectangle();
	bg.setColor(0, 0, .2, 1);
	this.hud.addChild(bg);
	
	var bg2 = new GHudRectangle();
	bg2.setColor(.1, .1, .2, .9);
	this.hud.addChild(bg2);
	bg2.setDrawRec(0, 0, 1, .7);
    
    
	this.scene.setVisibility( false );
	
	var camera = this.scene.getCamera();
	camera.setLookAt(0, 0, 0);
	camera.setUp(-0.09341227263212204, 0.9805285334587097, 0.17273758351802826);
	camera.setEye(20, 30, 10);
	
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
    
    var cube = new Cuboid(-70, -70, -70, "cube");
    var cyl = new Cylinder(0.5, 2, 50, "cylinder");
    var tor = new Torus(10, .25, 50, 50, "torus");
    var sphe = new Sphere(1, 50, 25, "sphere");
    var cone = new Cone(0.5, 2, 50, "cone");
    
    var transform = mat4.create();
	mat4.translate(transform, transform, [2, 2, 0]);
	cyl.setMvMatrix(transform);
    
    transform = mat4.create();
	mat4.translate(transform, transform, [0, -2, 2]);
	cone.setMvMatrix(transform);
    
    this.scene.addChild( cube );
    this.scene.addChild( cyl );
    this.scene.addChild( tor );
    this.scene.addChild( sphe );
    this.scene.addChild( cone );
    
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
	this.runTime = 0;
	
    // moving average of the draw time
    this.msMaPeriod = 10; 
    this.msMa = 0;
    this.msMaElem = [];
    for (var i = 0; i < this.msMaPeriod; ++i)
    {
        var v = Math.random()*100
        this.msMa += v
        this.msMaElem.push(v);
    }
    this.msMa /= this.msMaPeriod;
    
    
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
 * This function is called whenever we enter the explore state
 */
ProfilerExploreState.prototype.enter = function () 
{
	this.camController = new KeyboardDbgCameraController();
	this.scene.setVisibility( true );
};

/**
 * This function is called whenever we exit the explore state
 */
ProfilerExploreState.prototype.exit = function () 
{
};

/**
 * This is the update function for the explore state
 * @param {number} number of milliseconds since the last update
 */
ProfilerExploreState.prototype.update = function ( time ) 
{	
	// update the MA
	var oldestMa = this.msMaElem[0];
	for (var i = 0; i < this.msMaPeriod-1; ++i)
	{
	    this.msMaElem[i] = this.msMaElem[i+1];
	}
	this.msMaElem[this.msMaPeriod-1] = time;
	this.msMa = (this.msMa*this.msMaPeriod - oldestMa + time)/this.msMaPeriod;
	
	// calculate the standard deviation
	var variance = 0;
	for (var i = 0; i < this.msMaPeriod; ++i)
	{
        variance += (this.msMaElem[i]-this.msMa) * (this.msMaElem[i]-this.msMa);
	}
	variance /= this.msMaPeriod;
	var stdev = Math.sqrt(variance);
	
	//console.debug(this.msMa + ": " + stdev);
	
	//this.debugLevel = 2;
	if ( undefined !== this.debugLevel )
	{
	    while ( this.oData.context.decreaseRenderLevel() ) {}
	    for ( var i = 0; i < this.debugLevel; ++i )
	    {
	        this.oData.context.increaseRenderLevel();
	    }
	    this.fireSignal("exitReq");
	}
	
	this.runTime += time;
    
    if ( this.oData.context.renderStrategy.isReady() == false )
	{
	    this.runtime = 0;
	}
    
    if ( stdev < 10 ||
         3000 < this.runTime  )
    {
        this.runTime = 0;
        
        //console.debug(this.msMa);
        if ( this.msMa < 22 )
        {
            if ( false === this.oData.context.increaseRenderLevel() )
            {
                // even the most expensive level can be supported
                this.fireSignal("exitReq");
            }
        }
        else
        {
            this.oData.context.decreaseRenderLevel();
            this.fireSignal("exitReq");
        }
        
        this.runTime 
        
        this.msMa = 0;
        this.msMaElem = [];
        for (var i = 0; i < this.msMaPeriod; ++i)
        {
            var v = Math.random()*100;
            this.msMa += v;
            this.msMaElem.push(v);
        }
        this.msMa /= this.msMaPeriod;
    }
};


