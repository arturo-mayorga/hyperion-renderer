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
var PenAssembly = new function()
{

/**
 * @return {FsmState}
 * @param {GContext} contex
 */
this.createState = function( context )
{
    var scene = context.getScene();
    var hud = context.getHud();
	var ret = new FsmMachine();
	var oData = new PenLessonOperatingData( context );

    /** @type {FsmMachine} */ var loadState = new LoadState( oData );
    /** @type {FsmMachine} */ var exploreState = new ExploreState( oData );
    /** @type {FsmMachine} */ var asmState = new AsmState( oData );
    /** @type {FsmMachine} */ var cleanState = new CleanState( oData );
	
	ret.addState("Load", loadState );
	ret.addState("Explore", exploreState);
	ret.addState("Asm", asmState );
	ret.addState("Clean", cleanState );
	
	ret.addTransition( "Load", "loadComplete", "Asm" );
	//ret.addTransition( "Load", "loadComplete", "Explore" );
	ret.addTransition( "Asm", "exitAsm", "Explore" );
	ret.addTransition( "Explore", "startAsm", "Asm" );
	
	ret.addTransition( "Load", "exitReq", "Clean" );
	ret.addTransition( "Asm", "exitReq", "Clean" );
	ret.addTransition( "Explore", "exitReq", "Clean" );
	
	ret.setName("Pen");
	ret.setEnterState("Load");
	return ret;
};

/**
 * @constructor
 * @param {GContext} context
 */
function PenLessonOperatingData( context )
{
    this.context = context;
    this.humanoidAnimator = undefined;
}
 
/**
 * @param {ArmatureAnimator} animator
 */
PenLessonOperatingData.prototype.setHAnimator = function ( animator )
{
    this.humanoidAnimator = animator;
};

/**
 * @return {ArmatureAnimator}
 */
PenLessonOperatingData.prototype.getHAnimator = function ()
{
    return this.humanoidAnimator;
};

/**
 * @constructor
 * @extends {FsmMachine}
 * @param {PenAssembly.PenLessonOperatingData} oData
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
 * @implements {ThreejsLoaderObserver}
 * @param {PenAssembly.PenLessonOperatingData} oData
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
	this.penGroup = new GGroup( "penGroup" );
	this.humanoidGroup = new GGroup( "humanoidGroup" );
	
	var officeTransform = mat4.create();
	mat4.scale(officeTransform, officeTransform, new Float32Array([4, 4, 4]));
	this.officeGroup.setMvMatrix(officeTransform);
	
	this.penTransform = mat4.create();
	mat4.translate(this.penTransform, this.penTransform, new Float32Array([1.5, 5.609, 11.5]));
	this.penGroup.setMvMatrix(this.penTransform);
	
	var humanoidTransform = mat4.create();
	mat4.scale(humanoidTransform, humanoidTransform, new Float32Array([4, 4, 4]));
	mat4.rotate(humanoidTransform, humanoidTransform, -2, new Float32Array([0, 1, 0]));
	mat4.translate(humanoidTransform, humanoidTransform, new Float32Array([30, 0, 25]));
	this.humanoidGroup.setMvMatrix(humanoidTransform);
	
	this.scene.addChild(this.officeGroup);
	this.scene.addChild(this.penGroup);
	this.scene.addChild(this.humanoidGroup);
	
	this.envLoader = new GObjLoader(this.scene, this.officeGroup);
	this.envLoader.setObserver(this);
	this.envLoader.enableAutoMergeByMaterial();
	
	this.penLoader = new GObjLoader(this.scene, this.penGroup);
	this.penLoader.setObserver(this);
	
	this.tjsLoader = new ThreejsLoader(this.scene, this.humanoidGroup );
	this.tjsLoader.setObserver(this);
    
    
	this.envLoader.loadObj("assets/3d/office3d/", "object.obj");
	this.penLoader.loadObj("assets/3d/stylus/", "object.obj");
	this.tjsLoader.loadJson( "assets/3d/animtest/", "object.js" );

	this.ui = {};
	var bg = new GHudRectangle();
	bg.setColor(0, .2, 0, 1);
	this.hud.addChild(bg);
	
	var bg2 = new GHudRectangle();
	bg2.setColor(.1, .2, .1, .9);
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
	camera.setLookAt(4.232629776000977*4, 2.6432266235351562*4, 0.2486426830291748*4);
	camera.setUp(-0.09341227263212204, 0.9805285334587097, 0.17273758351802826);
	camera.setEye(9.44430160522461*4, 4.382470607757568*4, -3.9111077785491943*4);
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
	
	var childrenTemp = [];
	
	var len = this.penGroup.children.length;
	for (var i = 0; i < len; ++i)
	{
	    childrenTemp.push(this.penGroup.removeChild(this.penGroup.children[0]));
	}
	
	for (var i = 0; i < len; ++i)
	{
	    var newGroup = new GGroup( "group__" + childrenTemp[i].getName() );
	    newGroup.addChild(childrenTemp[i]);
	    this.penGroup.addChild(newGroup);
	    
	    if (i === 3)
	    {
	        newGroup.addChild(childrenTemp[++i]);
	    }
	}
	
	len = this.penGroup.children.length;
	
	for (var i = 0; i < len; ++i)
	{    
	    var penTransform = mat4.create();
	    mat4.translate(penTransform, penTransform, new Float32Array([0, 0, i*0.1]));
	    this.penGroup.children[i].setMvMatrix(penTransform);
	}
	
	var light0 = new GLight();
	var light1 = new GLight();
	var light2 = new GLight();
	var light3 = new GLight();
	var light4 = new GLight();
	var light5 = new GLight();
	/*var light6 = new GLight();
	var light7 = new GLight();
	var light8 = new GLight();
	
	light0.setPosition(-18, 28.25, 16);
	light1.setPosition(-12, 28.25, -22);
	light2.setPosition(-6, 28.25, 16);
	light3.setPosition(0, 28.25, -22);*/
	
	
	light0.setPosition(-18, 28.25, 16);
	light1.setPosition(-18, 28.25, -20);
	light2.setPosition(6, 28.25, 16);
	light3.setPosition(6, 28.25, -20);
	light4.setPosition(30, 28.25, 16);
	light5.setPosition(30, 28.25, -20);
	
	
	
	//light0.setPosition(-18, 28.25, 8);
	//light1.setPosition(-12, 28.25, -2);
	//light2.setPosition(-6, 28.25, 8);
	//light3.setPosition(0, 28.25, -2);
	//light4.setPosition(6, 28.25, 8);
	//light5.setPosition(12, 28.25, -2);
	/*light6.setPosition(18, 28.25, 8);
	light7.setPosition(24, 28.25, -2);
	light8.setPosition(30, 28.25, 8);*/
	
	
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
 * @param {number} Number of milliseconds since the last update
 */
LoadState.prototype.update = function ( time ) 
{
    this.envLoader.update(time);
	this.penLoader.update(time);
	this.tjsLoader.update(time);
};
 
 /**
  * This function gets called whenever the observed loader completes the loading process
  * @param {GObjLoader} loader Loader object that just finished loading its assets
  */
LoadState.prototype.onObjLoaderCompleted = function ( loader ) 
{
	// wait for 3 loaders
	if (this.loadCount === undefined)
	{
		this.loadCount = 1;
	}
	else
	{
		++this.loadCount;
	}
	
	if (this.loadCount >= 3)
	{
		this.fireSignal("loadComplete");
	}
};

/**
 * This function gets called whenever the observed loader makes progress
 * @param {GObjLoader} loader Loader object that is being observed
 * @param {number} progress Progress value
 */
LoadState.prototype.onObjLoaderProgress = function ( loader, progress ) 
{
	var tProgress = (this.penLoader.totalProgress + this.envLoader.totalProgress + this.tjsLoader.totalProgress)/3;
	this.ui.pFg.setDrawRec( .7*(tProgress-1), 0, tProgress*.7, .05);
};

/**
  * This function gets called whenever the observed loader completes the loading process
  * @param {ThreejsLoader} loader Loader object that just finished loading its assets
  */
LoadState.prototype.onThreejsLoaderCompleted = function ( loader ) 
{
	this.onObjLoaderCompleted( loader );
};

/**
 * This function gets called whenever the observed loader makes progress
 * @param {ThreejsLoader} loader Loader object that is being observed
 * @param {number} progress Progress value
 */
LoadState.prototype.onThreejsLoaderProgress = function ( loader, progress ) 
{
    this.onObjLoaderProgress( loader, progress );
};


/**
 * @param {ArmatureAnimator} animator New armature animator connected to the loaded mesh
 */
LoadState.prototype.onThreejsLoaderArmatureAnimatorLoaded = function ( animator ) 
{
    this.oData.setHAnimator( animator );
};





/**
 * @constructor
 * @extends {FsmState}
 * @implements {IContextMouseObserver}
 * @param {PenAssembly.PenLessonOperatingData} oData
 */
function ExploreState( oData ) 
{
    this.scene = oData.context.getScene();
	this.hud = oData.context.getHud();
	this.oData = oData;
	this.timeR = 0;
	
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
 * @param {MouseEvent} ev
 */
ExploreState.prototype.onMouseDown = function( ev )
{
    this.fireSignal("exitReq");
};

/**
 * @param {MouseEvent} ev
 */
ExploreState.prototype.onMouseUp = function( ev ) {};

/**
 * @param {MouseEvent} ev
 */
ExploreState.prototype.onMouseMove = function( ev ) {};

/**
 * This function is called whenever we enter the explore state
 */
ExploreState.prototype.enter = function () 
{
	this.camController = new KeyboardDbgCameraController();
	this.camController.bindCamera(this.scene.getCamera());
    this.oData.getHAnimator().play();
    
    this.oData.context.addMouseObserver( this );
    
    // this.scene.addChild( new Cuboid(1.5, 1.5, 1.5, "cube") );
    // this.scene.addChild( new Cylinder(0.5, 2, 50, "cylinder") );
    // this.scene.addChild( new Torus(1, .25, 50, 50, "torus") );
    // this.scene.addChild( new Sphere(1, 50, 25, "sphere") );
    // this.scene.addChild( new Cone(0.5, 2, 50, "cone") );
};

/**
 * This function is called whenever we exit the explore state
 */
ExploreState.prototype.exit = function () 
{
	this.camController = undefined;
	
	this.oData.context.removeMouseObserver( this );
};

/**
 * This is the update function for the explore state
 * @param {number} time number of milliseconds since the last update
 */
ExploreState.prototype.update = function ( time ) 
{
	this.camController.update( time );
    this.oData.getHAnimator().update( time );
};


/**
 * @constructor
 */
function Vec3Animator( inVector, target, targetLapseTime )
{
	this.startVec = vec3.fromValues(inVector[0], inVector[1], inVector[2]);
	this.inVector = inVector;
	this.target = target;
	this.lapseTime = 0;
	this.targetLapseTime = targetLapseTime;
	this.isComplete = false;
}

/**
 * This updates the animation state
 * @param {number} time  Time since the last update
 */
Vec3Animator.prototype.update = function( time )
{
	this.lapseTime += time;
	if ( this.lapseTime > this.targetLapseTime )
	{
		this.lapseTime = this.targetLapseTime;
	}
	
	var percent = this.lapseTime / this.targetLapseTime;
	
	if (percent >= 1)
	{
		percent = 1;
		this.isComplete = true;
	}
	
	for (var i = 0; i < 3; ++i)
	{
		this.inVector[i] = this.startVec[i] + (this.target[i] - this.startVec[i])*percent;
	}
};

/**
 * Determines if the current animation has completed
 * @return {boolean}
 */
Vec3Animator.prototype.getIsComplete = function()
{
	return this.isComplete;
};

/**
 * @constructor
 * @extends {FsmMachine}
 * @implements {IContextMouseObserver}
 * @param {PenAssembly.PenLessonOperatingData} oData
 */
function AsmState( oData ) 
{
    this.scene = oData.context.getScene();
	this.hud = oData.context.getHud();
	this.oData = oData;
	FsmMachine.call( this );
	this.needsSubStateInit = true;
	this.lastObjIdClicked = -1;
	
	this.autoAdvanceAssembly = false;
	
	this.floatTarget = vec3.fromValues( -0.0, 2.4, 3.8 );
	this.floatLrOffset = 0.7;
}

AsmState.prototype = Object.create( FsmMachine.prototype );

/**
 * @param {PointingEvent} ev
 */
AsmState.prototype.onMouseDown = function( ev ) 
{
    this.lastObjIdClicked = this.oData.context.getSceneObjectIdAt(ev);
};

/**
 * @param {PointingEvent} ev
 */
AsmState.prototype.onMouseUp = function( ev ) {};

/**
 * @param {PointingEvent} ev
 */
AsmState.prototype.onMouseMove = function( ev ) {};

/**
 * @param {number} targetObj
 * @return {boolean}
 */
AsmState.prototype.stepTransitionCheck = function( targetObj )
{
    if ( this.autoAdvanceAssembly )
    {
        return true;
    }
    
    return ( targetObj === this.lastObjIdClicked );
};

/**
 * This function is called whenever we enter the assembly state
 */
AsmState.prototype.enter = function () 
{	
    this.oData.context.addMouseObserver( this );
    
    this.autoAdvanceAssembly = !(this.autoAdvanceAssembly);
    
	if ( this.needsSubStateInit )
	{
        this.createSubState( "moveCam", this.moveCamEnter, this.moveCam, this.moveCamExit );
        this.createSubState( "grabInk", this.grabInkEnter, this.grabInk, this.grabInkExit );
        this.createSubState( "grabSpring", this.grabSpringEnter, this.grabSpring, this.grabSpringExit );
        this.createSubState( "installSpring", this.installSpringEnter, this.installSpring, this.installSpringExit );
        this.createSubState( "grabAxle", this.grabAxleEnter, this.grabAxle, this.grabAxleExit );
        this.createSubState( "installAxle", this.installAxleEnter, this.installAxle, this.installAxleExit );
        this.createSubState( "grabHousing", this.grabHousingEnter, this.grabHousing, this.grabHousingExit );
        this.createSubState( "installHousing", this.installHousingEnter, this.installHousing, this.installHousingExit );
        this.createSubState( "grabGrip", this.grabGripEnter, this.grabGrip, this.grabGripExit );
        this.createSubState( "installGrip", this.installGripEnter, this.installGrip, this.installGripExit );
        this.createSubState( "grabCylinder", this.grabCylinderEnter, this.grabCylinder, this.grabCylinderExit );
        this.createSubState( "installCylinder", this.installCylinderEnter, this.installCylinder, this.installCylinderExit );
        this.createSubState( "grabClip", this.grabClipEnter, this.grabClip, this.grabClipExit );
        this.createSubState( "installClip", this.installClipEnter, this.installClip, this.installClipExit );
        this.createSubState( "grabGum", this.grabGumEnter, this.grabGum, this.grabGumExit );
        this.createSubState( "installGum", this.installGumEnter, this.installGum, this.installGumExit );
        this.createSubState( "testOut", this.testOutEnter, this.testOut, this.testOutExit );
        this.createSubState( "holdBeforeTestIn", this.holdBeforeTestInEnter, this.holdBeforeTestIn, this.holdBeforeTestInExit );
        this.createSubState( "testIn", this.testInEnter, this.testIn, this.testInExit );
        this.createSubState( "idle", this.idleEnter, this.idle, this.idleExit );
        this.createSubState( "placeOnTable", this.placeOnTableEnter, this.placeOnTable, this.placeOnTableExit );
        this.createSubState( "done", this.doneEnter, this.done, this.doneExit );
        
         
        this.addTransition( "moveCam",         "done", "grabInk" );
        this.addTransition( "grabInk",         "done", "grabSpring" );
        this.addTransition( "grabSpring",      "done", "installSpring" );
        this.addTransition( "installSpring",   "done", "grabAxle" );
        this.addTransition( "grabAxle",        "done", "installAxle" );
        this.addTransition( "installAxle",     "done", "grabHousing" );
        this.addTransition( "grabHousing",     "done", "installHousing" );
        this.addTransition( "installHousing",  "done", "grabGrip" );
        this.addTransition( "grabGrip",        "done", "installGrip" );
        this.addTransition( "installGrip",     "done", "grabCylinder" );
        this.addTransition( "grabCylinder",    "done", "installCylinder" );
        this.addTransition( "installCylinder", "done", "grabClip" );
        this.addTransition( "grabClip",        "done", "installClip" );
        this.addTransition( "installClip",     "done", "grabGum" );
        this.addTransition( "grabGum",         "done", "installGum" );
        this.addTransition( "installGum",      "done", "testOut" );
        this.addTransition( "testOut",         "done", "holdBeforeTestIn" );
        this.addTransition( "holdBeforeTestIn","done", "testIn" );
        this.addTransition( "testIn",          "done", "idle" );
        this.addTransition( "idle",            "done", "placeOnTable" );
        this.addTransition( "placeOnTable",    "done", "done" ); 
        this.needsSubStateInit = false;
    }

	var children = this.scene.getChildren();
	var len = children.length;
	for (var i = 0; i < len; ++i)
	{
		if (children[i].getName() === "penGroup")
		{
			this.penGroup = children[i];
		}
	}
	
	this.camera = this.scene.getCamera();
	this.tempEye = vec3.create();
	this.tempUp = vec3.create();
	this.tempLookAt = vec3.create();
	
	this.clip     = this.penGroup.children[0];
	this.gum      = this.penGroup.children[1];
	this.spring   = this.penGroup.children[2];
	this.ink      = this.penGroup.children[3];
	this.cylinder = this.penGroup.children[4];
	this.axle     = this.penGroup.children[5];
	this.housing  = this.penGroup.children[6];
	this.grip     = this.penGroup.children[7];
	
	this.handler = this.moveCam;
	
	this.asmContext = 
	{
	    penGroup: this.penGroup,
	    clip: this.clip,
	    gum: this.gum,
	    spring: this.spring,
	    ink: this.ink,
	    cylinder: this.cylinder,
	    axle: this.axle,
	    housing: this.housing,
	    grip: this.grip   
	};
	
    this.setState( "moveCam" );
};

/**
 * This function is called whenever we exit the assembly state
 */
AsmState.prototype.exit = function () 
{
    this.oData.context.removeMouseObserver( this );
};

/**
 * enter the move cam state
 */
AsmState.prototype.moveCamEnter = function()
{
    this.camera.getEye(this.tempEye);
    this.camera.getUp(this.tempUp);
    this.camera.getLookAt(this.tempLookAt);
    
    var targetEye    = [1.3583784103393555, 9.672802925109863, 17.14227294921875];
    var targetLookAt = [1.1498558521270752, -6.496527671813965, -5.181362152099609];
    var targetUp     = [-0.0014136419631540775, 0.8503075838088989, -0.5262849926948547];
    
    this.eyeAnimator    = new Vec3Animator( this.tempEye, targetEye, 3000 );
    this.upAnimator     = new Vec3Animator( this.tempUp, targetUp, 3000 );
    this.lookAtAnimator = new Vec3Animator( this.tempLookAt, targetLookAt, 3000 );
};

/**
 * exit the move cam state
 */
AsmState.prototype.moveCamExit = function()
{
    delete this.lookAtAnimator;
    delete this.upAnimator;
    delete this.eyeAnimator;
};

/**
 * Assembly sub state: move the camera in front of the desk
 * @param {number} time Number of milliseconds since the last update
 */
AsmState.prototype.moveCam = function (time)
{	
	this.lookAtAnimator.update( time );
	this.upAnimator.update( time );
	this.eyeAnimator.update( time );
	
	if (this.lookAtAnimator.getIsComplete() && 
		this.upAnimator.getIsComplete() && 
	    this.eyeAnimator.getIsComplete() && 
	    this.stepTransitionCheck(this.ink.children[1].getObjId()) )
	{
		this.fireSignal("done");
	}
	
	this.camera.setEye(this.tempEye[0], this.tempEye[1], this.tempEye[2]);
	this.camera.setUp(this.tempUp[0], this.tempUp[1], this.tempUp[2]);
	this.camera.setLookAt(this.tempLookAt[0], this.tempLookAt[1], this.tempLookAt[2]);
};

/**
 * Enter the grab ink state
 */
AsmState.prototype.grabInkEnter = function()
{
    this.trans = vec3.fromValues( 0, 0, 0.3 );
    var target = vec3.fromValues( this.floatTarget[0] + this.floatLrOffset, 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    this.inkAnimator = new Vec3Animator( this.trans, target, 1000 );
};

/**
 * Exit the grab ink state
 */
AsmState.prototype.grabInkExit = function()
{
    delete this.trans;
    delete this.inkAnimator;
};
/**
 * Assembly sub state: pick up the ink container from the table
 * @param {number} time Number of milliseconds since the last update
 */
AsmState.prototype.grabInk = function (time)
{
	this.inkAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.ink.setMvMatrix(transform);
	
	if ( this.inkAnimator.getIsComplete() )
	{
		this.fireSignal("done");
	}
};

/**
 * Enter the grab spring state
 */
AsmState.prototype.grabSpringEnter = function()
{
    this.trans = vec3.fromValues( 0, 0, 0.2 );
    var target = vec3.fromValues( this.floatTarget[0] - this.floatLrOffset, 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    this.springAnimator = new Vec3Animator( this.trans, target, 1000 );
};

/**
 * Exit the grab spring state
 */
AsmState.prototype.grabSpringExit = function()
{
    delete this.trans;
    delete this.springAnimator;
};


/**
 * Assembly sub state: pick up the spring from the table
 * @param {number} time Number of milliseconds since the last update
 */
AsmState.prototype.grabSpring = function (time)
{	
	this.springAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.spring.setMvMatrix(transform);
	
	if ( this.springAnimator.getIsComplete() )
	{
		this.fireSignal("done");
	}
};


/**
 * Enter the install spring state
 */
AsmState.prototype.installSpringEnter = function ()
{
    this.trans = vec3.fromValues( this.floatTarget[0] + this.floatLrOffset, 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    var target = vec3.fromValues( this.floatTarget[0] - this.floatLrOffset, 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    this.inkAnimator = new Vec3Animator( this.trans, target, 1000 );
};

/**
 * Exit the install spring state
 */
AsmState.prototype.installSpringExit = function ()
{
    delete this.trans;
    delete this.inkAnimator;
};

/**
 * Assembly sub state: install the spring on the ink container
 * @param {number} time Number of milliseconds since the last update
 */
AsmState.prototype.installSpring = function (time)
{
	this.inkAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.ink.setMvMatrix(transform);
	
	if ( this.inkAnimator.getIsComplete() && 
	     this.stepTransitionCheck(this.axle.children[0].getObjId()) )
	{
		
		this.fireSignal("done");
	}
};

/**
 * Enter the grab axle state
 */
AsmState.prototype.grabAxleEnter = function()
{
    this.trans = vec3.fromValues( 0, 0, 0.5 );
    var target = vec3.fromValues( this.floatTarget[0] + this.floatLrOffset, 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    this.axleAnimator = new Vec3Animator( this.trans, target, 1000 );
};

/**
 * Exit the grab axle state
 */
AsmState.prototype.grabAxleExit = function()
{
    delete this.trans;
    delete this.axleAnimator;
};

/**
 * Assembly sub state: pick up the axle form the table and line up for installation
 * @param {number} time Number of milliseconds since the last update
 */
AsmState.prototype.grabAxle = function (time)
{
	this.axleAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.axle.setMvMatrix(transform);
	
	if ( this.axleAnimator.getIsComplete() )
	{
		this.fireSignal("done");
	}
};

/**
 * enter the install axle state
 */
AsmState.prototype.installAxleEnter = function()
{
    this.trans = vec3.fromValues( this.floatTarget[0] + this.floatLrOffset, 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    var target = vec3.fromValues( this.floatTarget[0] - this.floatLrOffset, 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    this.axleAnimator = new Vec3Animator( this.trans, target, 1000 ); 
};

/**
 * Exit the instal axle state
 */
AsmState.prototype.installAxleExit = function()
{
    delete this.trans;
    delete this.axleAnimator;
};

/**
 * Assembly sub state: Install the axle to the current assembly
 * @param {number} time Number of milliseconds since the last update
 */
AsmState.prototype.installAxle = function (time)
{
	this.axleAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.axle.setMvMatrix(transform);
	
	if ( this.axleAnimator.getIsComplete() && 
	     this.stepTransitionCheck(this.housing.children[0].getObjId()) )
	{
		this.fireSignal("done");
	}
};

/**
 * Enter the grab housing state
 */
AsmState.prototype.grabHousingEnter = function()
{
    this.trans = vec3.fromValues( 0, 0, 0.6 );
    var target = vec3.fromValues( this.floatTarget[0] + this.floatLrOffset, 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    this.housingAnimator = new Vec3Animator( this.trans, target, 1000 );
};

/**
 * Exit the grab housing state
 */
AsmState.prototype.grabHousingExit = function()
{
    delete this.trans;
    delete this.housingAnimator;
};

/**
 * Assembly sub state: pick up the housin from the table and align it for installation
 * @param {number} time Number of milliseconds since the last update
 */
AsmState.prototype.grabHousing = function (time)
{
	this.housingAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.housing.setMvMatrix(transform);
	
	if ( this.housingAnimator.getIsComplete() )
	{
		this.fireSignal("done");
	}
};

/**
 * Enter the install housing state
 */
AsmState.prototype.installHousingEnter = function()
{
    this.trans = vec3.fromValues( this.floatTarget[0] - this.floatLrOffset, 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    this.trans2 = vec3.fromValues( this.floatTarget[0] + this.floatLrOffset, 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    var target = vec3.fromValues( this.floatTarget[0], 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    this.inkAnimator = new Vec3Animator( this.trans, target, 1000 );
    this.asmAnimator = new Vec3Animator( this.trans2,target, 1000 );
};

/**
 * Exit the install housing state
 */
AsmState.prototype.installHousingExit = function()
{
    delete this.trans;
    delete this.asmAnimator;
    delete this.inkAnimator;
};

/**
 * Assembly sub state: Install the housing to the current assembly
 * @param {number} time Number of milliseconds since the last update
 */
AsmState.prototype.installHousing = function (time)
{	
	this.inkAnimator.update(time);
	this.asmAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.ink.setMvMatrix(transform);
	this.spring.setMvMatrix(transform);
	this.axle.setMvMatrix(transform);
	
	mat4.identity(transform);
	mat4.translate(transform, transform, this.trans2);
	this.housing.setMvMatrix(transform);
	
	if ( this.asmAnimator.getIsComplete() &&
         this.inkAnimator.getIsComplete() && 
	     this.stepTransitionCheck(this.grip.children[0].getObjId()) )
	{
		this.fireSignal("done");
	}
};

/**
 * Enter the grab grip state
 */
AsmState.prototype.grabGripEnter = function()
{
    this.trans = vec3.fromValues( 0, 0, 0 );
    var target = vec3.fromValues( this.floatTarget[0] - this.floatLrOffset, 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    this.housingAnimator = new Vec3Animator( this.trans, target, 1000 );
};

/**
 * Exit the grab grip state
 */
AsmState.prototype.grabGripExit = function ()
{
    delete this.trans;
    delete this.housingAnimator;
};

/**
 * Assembly sub state: pick up the grip from the table and line it up for installation
 * @param {number} time Number of milliseconds since the last update
 */
AsmState.prototype.grabGrip = function (time)
{
	this.housingAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.grip.setMvMatrix(transform);
	
	if ( this.housingAnimator.getIsComplete() )
	{
		this.fireSignal("done");
	}
};

/**
 * Enter the install grip state
 */
AsmState.prototype.installGripEnter = function()
{
    this.trans = vec3.fromValues( this.floatTarget[0] - this.floatLrOffset, 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    var target = vec3.fromValues( this.floatTarget[0], 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    this.housingAnimator = new Vec3Animator( this.trans, target, 1000 );
};

/**
 * Exit the install grip state
 */
AsmState.prototype.installGripExit = function()
{
    delete this.trans;
    delete this.housingAnimator;
};

/**
 * Assembly sub state: Install the grip to the rest of the assembly
 * @param {number} time Number of milliseconds since the last update
 */
AsmState.prototype.installGrip = function (time)
{	
	this.housingAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.grip.setMvMatrix(transform);
	
	if ( this.housingAnimator.getIsComplete() && 
	     this.stepTransitionCheck(this.cylinder.children[0].getObjId()) )
	{
		this.fireSignal("done");
	}
};

/**
 * Enter the grab cylinder state
 */
AsmState.prototype.grabCylinderEnter = function()
{
    this.trans = vec3.fromValues( 0.0, 0.0, 0.0 );
    var target = vec3.fromValues( this.floatTarget[0] + 0.4, 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    this.cylinderAnimator = new Vec3Animator( this.trans, target, 1000 );
};

/**
 * Exti the grab cylinder state
 */
AsmState.prototype.grabCylinderExit = function()
{
    delete this.trans;
    delete this.cylinderAnimator;
};


/**
 * Assembly sub state: Pick up the cylinder from the table and align for installation
 * @param {number} time Number of milliseconds since the last update.
 */
AsmState.prototype.grabCylinder = function (time)
{
	this.cylinderAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.cylinder.setMvMatrix(transform);
	
	if ( this.cylinderAnimator.getIsComplete() )
	{
		this.fireSignal("done");
	}
};

/** 
 * Enter the install cylinder state
 */
AsmState.prototype.installCylinderEnter = function()
{
    this.trans = vec3.fromValues( this.floatTarget[0] + 0.4, 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    var target = vec3.fromValues( this.floatTarget[0], 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    this.cylinderAnimator = new Vec3Animator( this.trans, target, 1000 );
};

/**
 * Exit the install cylinder state
 */
AsmState.prototype.installCylinderExit = function()
{
    delete this.trans;
    delete this.cylinderAnimator;
};

/**
 * Assembly sub state: Install the cylinder to the assembly
 * @param {number} time Number of milliseconds since the last update
 */
AsmState.prototype.installCylinder = function (time)
{
	this.cylinderAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.cylinder.setMvMatrix(transform);
	
	if ( this.cylinderAnimator.getIsComplete() && 
	     this.stepTransitionCheck(this.clip.children[0].getObjId()) )
	{
		this.fireSignal("done");
	}
};

/**
 * Enter the grab clip state
 */
AsmState.prototype.grabClipEnter = function ()
{
    this.trans = vec3.fromValues( 0.0, 0.0, 0.0 );
    var target = vec3.fromValues( this.floatTarget[0] + 0.4, 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    this.clipAnimator = new Vec3Animator( this.trans, target, 1000 );
};

/**
 * Exit the grab clip state
 */
AsmState.prototype.grabClipExit = function()
{
    delete this.trans;
    delete this.clipAnimator;
};

/** 
 * Assembly sub state: Pick up the clip from the table
 * @param {number} time Number of milliseconds since the last update.
 */
AsmState.prototype.grabClip = function (time)
{
	this.clipAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.clip.setMvMatrix(transform);
	
	if ( this.clipAnimator.getIsComplete() )
	{
		this.fireSignal("done");
	}
};

/**
 * Enter the install clip state
 */
AsmState.prototype.installClipEnter = function()
{
    this.trans = vec3.fromValues( this.floatTarget[0] + 0.4, 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    var target = vec3.fromValues( this.floatTarget[0], 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    this.clipAnimator = new Vec3Animator( this.trans, target, 1000 );
};

/**
 * Exit the install clip state
 */
AsmState.prototype.installClipExit = function()
{
    delete this.trans;
    delete this.clipAnimator;
};

/**
 * Assembly sub state: Install the clip to the assembly
 * @param {number} time Number of milliseconds since the last update.
 */
AsmState.prototype.installClip = function (time)
{
	if ( undefined === this.trans )
	{
		this.trans = vec3.fromValues( this.floatTarget[0] + 0.4, 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
		
		var target = vec3.fromValues( this.floatTarget[0] + this.floatLrOffset, 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
		
		this.clipAnimator = new Vec3Animator( this.trans, target, 1000 );
	}
	
	this.clipAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.clip.setMvMatrix(transform);
	
	if ( this.clipAnimator.getIsComplete() && 
	     this.stepTransitionCheck(this.gum.children[0].getObjId()) )
	{
		this.fireSignal("done");
	}
};

/**
 * Enter the grab gum state 
 */
AsmState.prototype.grabGumEnter = function ()
{
    this.trans = vec3.fromValues( 0.0, 0.0, 0.0 );
    var target = vec3.fromValues( this.floatTarget[0] - this.floatLrOffset, 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    this.gumAnimator = new Vec3Animator( this.trans, target, 1000 );
};

/**
 * Exit the grab gum state
 */
AsmState.prototype.grabGumExit = function()
{
    delete this.trans;
    delete this.gumAnimator;
};

/**
 * Assembly sub state: Pick up the gum from the table and align it for isntallation.
 * @param {number} time Number of milliseconds since the last update
 */
AsmState.prototype.grabGum = function (time)
{
	this.gumAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.gum.setMvMatrix(transform);
	
	if ( this.gumAnimator.getIsComplete() )
	{
		this.fireSignal("done");
	}
};

/**
 * Enter the grab gum state
 */
AsmState.prototype.installGumEnter = function()
{
    this.trans = vec3.fromValues( this.floatTarget[0] - this.floatLrOffset, 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    var target = vec3.fromValues( this.floatTarget[0], 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    this.gumAnimator = new Vec3Animator( this.trans, target, 1000 );
};

/**
 * Exit the grab gum state
 */
AsmState.prototype.installGumExit = function()
{
    delete this.trans;
    delete this.gumAnimator;
};

/**
 * Assembly sub state: Install the gum to the assembly
 * @param {number} time Number of milliseconds since the last update.
 */
AsmState.prototype.installGum = function (time)
{
	this.gumAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.gum.setMvMatrix(transform);
	
	if ( this.gumAnimator.getIsComplete() )
	{
		this.fireSignal("done");
	}
};

/**
 * Enter the test out state
 */
AsmState.prototype.testOutEnter = function()
{
    this.trans = vec3.fromValues( this.floatTarget[0] - 0.09, 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    var target = vec3.fromValues( this.floatTarget[0] - 0.075, 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    this.inkAnimator = new Vec3Animator( this.trans, target, 1000 );
};

/**
 * Exit the test out state
 */
AsmState.prototype.testOutExit = function()
{
    delete this.trans;
    delete this.inkAnimator;
};

/**
 * Assembly sub state: Animate testing of the pen (going out)
 * @param {number} time Number of milliseconds since the last update.
 */
AsmState.prototype.testOut = function (time)
{
	this.inkAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans); 
	
	this.clip.setMvMatrix(transform);
	this.cylinder.setMvMatrix(transform);
	this.axle.setMvMatrix(transform);
	this.ink.setMvMatrix(transform);
	
	if ( this.inkAnimator.getIsComplete() )
	{
		this.fireSignal("done");
	}
};

/**
 * Enter the hold before test in event
 */
AsmState.prototype.holdBeforeTestInEnter = function()
{
    this.currentLapse = 0;
};

/**
 * Exit the hold before test in event
 */
AsmState.prototype.holdBeforeTestInExit = function()
{
    delete this.currentLapse;
};

/**
 * Assembly sub state: hold the assembly in position.
 * @param {number} time Number of milliseconds since the last update.
 */
AsmState.prototype.holdBeforeTestIn = function (time)
{
	this.currentLapse += time;
	
	if ( this.currentLapse >= 3000 )
	{
		this.fireSignal("done");
	}
};

/**
 * Enter the test in state
 */
AsmState.prototype.testInEnter = function()
{
    this.trans = vec3.fromValues( this.floatTarget[0] - 0.09, 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    var target = vec3.fromValues( this.floatTarget[0], 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    this.inkAnimator = new Vec3Animator( this.trans, target, 1000 );
};

/**
 * Exit the test in state
 */
AsmState.prototype.testInExit = function()
{
    delete this.trans;
    delete this.inkAnimator;
};

/**
 * Assembly sub state: Animate testing of the pen (going in)
 * @param {number} time Number of milliseconds since the last update.
 */
AsmState.prototype.testIn = function (time)
{
	this.inkAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans); 
	
	this.clip.setMvMatrix(transform);
	this.cylinder.setMvMatrix(transform);
	this.axle.setMvMatrix(transform);
	this.ink.setMvMatrix(transform);
	
	if ( this.inkAnimator.getIsComplete() )
	{
		this.fireSignal("done");
	}
};

/**
 * Enter the idle state
 */
AsmState.prototype.idleEnter = function()
{
    this.currentLapse = 0;
};

/**
 * Exit the idle state
 */
AsmState.prototype.idleExit = function()
{
    delete this.currentLapse;
};

/**
 * Assembly sub state: hold the assembly in position.
 * @param {number} time Number of milliseconds since the last update.
 */
AsmState.prototype.idle = function (time)
{
	this.currentLapse += time;
	
	if ( this.currentLapse >= 300 )
	{
		this.fireSignal("done");
	}
};

/**
 * Enter the place on table state
 */
AsmState.prototype.placeOnTableEnter = function()
{
    this.trans = vec3.fromValues( this.floatTarget[0], 
                                  this.floatTarget[1], 
                                  this.floatTarget[2] );
    
    var target = vec3.fromValues( 0.0, 0.0, 0.0 );
    
    this.inkAnimator = new Vec3Animator( this.trans, target, 1000 );
};

/**
 * Exit the place on table state
 */
AsmState.prototype.placeOnTableExit = function()
{
    delete this.lookAtAnimator;
    delete this.upAnimator;
    delete this.eyeAnimator;
    delete this.trans;
    delete this.inkAnimator;
};

/**
 * Assembly sub state: Place the assembly on the table and move the camera away from the desk
 * in preparation for exiting the assembly state
 * @param {number} time Number of milliseconds since the last update.
 */
AsmState.prototype.placeOnTable = function (time)
{
	this.inkAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans); 
	
	this.clip.setMvMatrix(transform);     
	this.gum.setMvMatrix(transform);      
	this.spring.setMvMatrix(transform);   
	this.ink.setMvMatrix(transform);      
	this.cylinder.setMvMatrix(transform); 
	this.axle.setMvMatrix(transform);     
	this.housing.setMvMatrix(transform);  
	this.grip.setMvMatrix(transform);     
	
	if (this.lookAtAnimator === undefined)
	{	
		this.camera.getEye(this.tempEye);
		this.camera.getUp(this.tempUp);
		this.camera.getLookAt(this.tempLookAt);
		
		var targetEye    = [0, 9, 0];
		var targetLookAt = [1.5, 5.609, 11.5];
		var targetUp     = [-0, 1, 0];
		
		this.eyeAnimator    = new Vec3Animator( this.tempEye, targetEye, 1000 );
		this.upAnimator     = new Vec3Animator( this.tempUp, targetUp, 1000 );
		this.lookAtAnimator = new Vec3Animator( this.tempLookAt, targetLookAt, 100 );
	}
	
	this.lookAtAnimator.update( time );
	this.upAnimator.update( time );
	this.eyeAnimator.update( time );
	
	if (this.lookAtAnimator.getIsComplete() && 
		this.upAnimator.getIsComplete() && 
	    this.eyeAnimator.getIsComplete() && 
		this.inkAnimator.getIsComplete())
	{
		this.fireSignal("done");
	}
	
	this.camera.setEye(this.tempEye[0], this.tempEye[1], this.tempEye[2]);
	this.camera.setUp(this.tempUp[0], this.tempUp[1], this.tempUp[2]);
	this.camera.setLookAt(this.tempLookAt[0], this.tempLookAt[1], this.tempLookAt[2]);
};

/**
 * Enter the done state
 */
AsmState.prototype.doneEnter = function() {};

/** 
 * Exit the done state
 */
AsmState.prototype.doneExit = function() {};

/**
 * Assembly sub state: Fire the signal to leave the assembly state
 * @param {number} time Number of milliseconds since the last update
 */
AsmState.prototype.done = function (time)
{
	this.fireSignal("exitAsm");
};

};
