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


// JS namespace...
var OrbitingViewer = new function()
{
    
/**
 * @return {FsmState}
 * @param {GContext} context
 * @param {string} hash
 */
this.createState = function( context, hash )
{
    var scene = context.getScene();
    var hud = context.getHud();
	var ret = new FsmMachine();
	var oData = new StateOperatingData( context, hash );

    /** @type {FsmMachine} */ var loadState = new LoadState( oData );
    /** @type {FsmMachine} */ var exploreState = new ExploreState( oData );
    /** @type {FsmMachine} */ var cleanState = new CleanState( oData );
	
	ret.addState("Load", loadState);
	ret.addState("Explore", exploreState);
	ret.addState("Clean", cleanState);
	
	ret.addTransition( "Load", "loadComplete", "Explore" );
	
	ret.addTransition( "Load", "exitReq", "Clean" );
	ret.addTransition( "Explore", "exitReq", "Clean" );
	
	ret.setName("OrbitingViewer");
	ret.setEnterState("Load");
	return ret;
};

/**
 * @constructor
 * @param {GContext}
 */
function StateOperatingData( context, hash )
{
    this.context = context;
    this.hash = hash;
}

/**
 * @constructor
 * @extends {FsmMachine}
 * @param {OrbitingViewer.StateOperatingData} oData
 */
function CleanState( oData )
{
    this.scene = oData.context.getScene();
}

CleanState.prototype = Object.create( FsmMachine.prototype );

/**
 * This function is called each time this state is entered
 */
CleanState.prototype.enter = function () 
{
    var children = this.scene.getChildren();
	for ( var len = children.length; len > 0; 
	      children = this.scene.getChildren(), 
	      len = children.length )
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
CleanState.prototype.exit = function () 
{
};

/**
 * Update this state
 * @param {number} time Number of milliseconds since the last update
 */
CleanState.prototype.update = function ( time ) 
{
    this.fireSignal("cleanComplete");
};

/**
 * @constructor
 * @extends {FsmMachine}
 * @implements {GObjLoaderObserver}
 * @param {OrbitingViewer.StateOperatingData} oData
 */
function LoadState( oData ) 
{
    this.scene = oData.context.getScene();
	this.hud = oData.context.getHud();
	this.oData = oData;
}

LoadState.prototype = Object.create( FsmMachine.prototype );

/**
 * This function is called each time this state is entered
 */
LoadState.prototype.enter = function () 
{
    var hChildren = this.hud.children;
	var len = hChildren.length;
	for (var i = 0; i < len; ++i)
	{
		this.hud.removeChild(hChildren[i]);
	} 
    
    
    this.loadCount = 0;
    this.officeGroup = new GGroup( "officeGroup" ); 
	
	var officeTransform = mat4.create();
	mat4.scale(officeTransform, officeTransform, new Float32Array([4, 4, 4]));
	this.officeGroup.setMvMatrix(officeTransform);
	
	this.scene.addChild(this.officeGroup); 
	
	this.envLoader = new GObjLoader(this.scene, this.officeGroup);
	this.envLoader.setObserver(this);
	this.envLoader.enableAutoMergeByMaterial(); 
    
    
	//this.envLoader.loadObj("assets/3d/apartment/a1/", "sheldon.obj"); 
	//this.envLoader.loadObj("assets/3d/0f69d966978a46df96cd1c8a9b05da76/", "0f69d966978a46df96cd1c8a9b05da76.obj"); 
	var hash = "bluefalcon";
	
	if ( undefined !== this.oData.hash )
	{
	    hash = this.oData.hash;
	}
	
	this.envLoader.loadObj("assets/3d/" + hash + "/", "object.obj"); 

	this.ui = {};
	var bg = new GHudRectangle();
	bg.setColor(0, 0, .2, 1);
	this.hud.addChild(bg);
	
	var bg2 = new GHudRectangle();
	bg2.setColor(.1, .1, .2, .9);
	this.hud.addChild(bg2);
	bg2.setDrawRec(0, 0, 1, .7);
	
	var progressBg = new GHudRectangle();
	progressBg.setColor(1, 1, 1, .02);
	progressBg.setDrawRec(0, 0, .7, .05);
	this.hud.addChild(progressBg);
	
	var progressFg = new GHudRectangle();
	progressFg.setColor(1, 1, 1, .3);
	progressFg.setDrawRec(0, 0, 0, .05);
	this.hud.addChild(progressFg);
	
	this.ui.components = [bg, bg2, progressBg, progressFg];
	this.ui.pFg = progressFg;
	
	this.scene.setVisibility( false );
	
	var camera = this.scene.getCamera();
	camera.setLookAt(0, 0, 0);
	camera.setUp(0, 1, 0);
	camera.setEye(-59, 0, -3);
};

/**
 * This function is called each time the state is exited
 */
LoadState.prototype.exit = function () 
{
	var len = this.ui.components.length;
	for (var i = 0; i < len; ++i)
	{
		this.hud.removeChild(this.ui.components[i]);
	}
	
	var light0 = new GLight();
	var light1 = new GLight();
	var light2 = new GLight();
	var light3 = new GLight();
	var light4 = new GLight();
	var light5 = new GLight();
	
	var h = 15.877;
	
	light0.setPosition(0, h, 0);
	light1.setPosition(-10, h, -7.9);
	light2.setPosition(-20.4, h, -6.4);
	light3.setPosition(9.9, h, -21.6);
	light4.setPosition(20.2, h, -6);
	light5.setPosition(3, 12, -28);
	
	this.scene.addLight(light0);
	this.scene.addLight(light1);
	this.scene.addLight(light2);
	this.scene.addLight(light3);
	this.scene.addLight(light4);
	this.scene.addLight(light5);
	
	this.scene.setVisibility( true );
};

/**
 * Update this state
 * @param {number} time Number of milliseconds since the last update
 */
LoadState.prototype.update = function ( time ) 
{
    this.envLoader.update(time);
};
 
 /**
  * This function gets called whenever the observed loader completes the loading 
  * process
  * @param {GObjLoader} loader Loader object that just finished loading its assets
  */
LoadState.prototype.onObjLoaderCompleted = function ( loader ) 
{ 
	if (this.loadCount === undefined)
	{
		this.loadCount = 1;
	}
	else
	{
		++this.loadCount;
	}
	
	if (this.loadCount >= 1)
	{
		this.fireSignal("loadComplete");
	}
};

/**
 * This function gets called whenever the observed loader makes progress
 * @param {GObjLoader} Loader object that is being observed
 * @param {number} progress Progress value
 */
LoadState.prototype.onObjLoaderProgress = function ( loader, progress ) 
{
	var tProgress = this.envLoader.totalProgress ;
	this.ui.pFg.setDrawRec( .7*(tProgress-1), 0, tProgress*.7, .05);
};

/**
 * @constructor
 * @extends {FsmMachine}
 * @param {OrbitingViewer.StateOperatingData} oData
 */
function ExploreState( oData ) 
{
    this.scene = oData.context.getScene();
	this.hud = oData.context.getHud();
	this.oData = oData;
}

ExploreState.prototype = Object.create( FsmMachine.prototype );

/**
 * Set the signal observer
 * @param {FsmSignalObserver} observer The new observer to be used
 */
ExploreState.prototype.setSignalObserver = FsmState.prototype.setSignalObserver;

/**
 * Fire the transition signal
 * @param {string} signal Name of the signal to fire
 */
ExploreState.prototype.fireSignal = FsmState.prototype.fireSignal;

/**
 * This function is called whenever we enter the explore state
 */
ExploreState.prototype.enter = function () 
{
	this.kCamController = new KeyboardDbgCameraController();
	this.mCamController = new MouseOrbitingCameraController();
	this.kCamController.bindCamera( this.scene.getCamera() );
	this.mCamController.bindCamera( this.scene.getCamera() );
	
	this.toolbar = new Toolbar( this.oData.context );
	this.toolbar.enter();
	
    this.oData.context.addMouseObserver( this.mCamController );
};

/**
 * This function is called whenever we exit the explore state
 */
ExploreState.prototype.exit = function () 
{
    this.toolbar.exit();
	this.oData.context.removeMouseObserver( this.mCamController );
	
	this.kCamController = undefined;
	this.mCamController = undefined;
};

/**
 * This is the update function for the explore state
 * @param {number} time number of milliseconds since the last update
 */
ExploreState.prototype.update = function ( time ) 
{
    this.toolbar.update( time );
	this.kCamController.update( time );
	this.mCamController.update( time );
};

/**
 * @constructor
 * @implements {IContextMouseObserver}
 * @extends {FsmMachine}
 */
function Toolbar( context )
{
    this.context = context;
    this.hud = context.getHud(); 
    this.prevHudObjId = -1;
    
    this.lowAlpha = 0.07;
    this.hiAlpha = 0.7;
    
    this.isMouseOver = false;
    
    this.alphaState = 0;
    
    
}

Toolbar.prototype = Object.create( FsmMachine.prototype );

/**
 * @param {PointingEvent}
 */
Toolbar.prototype.onMouseDown = function( ev ) 
{
    var id = this.context.getHudObjectIdAt( ev );
    if ( id === this.fullscrBtn.getObjId() )
    {
        this.context.requestFullScreen();
        return true;
    }
    //console.debug( id );
    return false;
};

/**
 * @param {PointingEvent}
 */
Toolbar.prototype.onMouseUp = function( ev ) 
{
    return false;
};

/**
 * @param {PointingEvent}
 */
Toolbar.prototype.onMouseMove = function( ev ) 
{
    var id = this.context.getHudObjectIdAt( ev );
    if ( id !== this.prevHudObjId )
    {
        if ( this.prevHudObjId === this.fullscrBtn.getObjId() )
        {
            // exited
            this.isMouseOver = false;
        }
        else if ( id === this.fullscrBtn.getObjId() )
        {
            // entered
            this.isMouseOver = true;
        }
    }
    
    this.prevHudObjId = id;
    return false;
};

/**
 * This function is called whenever we enter the toolbar state
 */
Toolbar.prototype.enter = function () 
{
    this.fullscrBtn = new GHudRectangle();
	this.fullscrBtn.setColor(1, 1, 1, 0);
	this.fullscrBtn.setDrawRec(0.87, -0.87, .1, .1);
	this.hud.addChild(this.fullscrBtn);
	this.fullscrBtn.setTexture("fscrbtn.png", "assets/2d/");
	//this.fullscrBtn.setTexture("noise_256.jpg", "assets/2d/");
	
	this.context.addMouseObserver( this );
};

/**
 * This function is called whenever we exit the toolbar state
 */
Toolbar.prototype.exit = function () 
{
    this.context.removeMouseObserver( this );
    this.hud.removeChild( this.fullscrBtn );
};

/**
 * This is the update function for the toolbar state
 * @param {number} number of milliseconds since the last update
 */
Toolbar.prototype.update = function ( time ) 
{
    if ( this.context.isFullScreen() )
    {
        this.fullscrBtn.setColor(1, 1, 1, 0);
    }
    else
    {
        var factor = time / 100;
        if ( 1 < factor )
        {
            factor = 1;
        }
        
        this.alphaState = this.alphaState + 
                            factor * ( ((this.isMouseOver)?this.hiAlpha:this.lowAlpha) - this.alphaState); 
                            
        this.fullscrBtn.setColor(1, 1, 1, this.alphaState);
    }
};

};

