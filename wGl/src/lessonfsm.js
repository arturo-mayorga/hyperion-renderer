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
 * @param {GScene} scene Scene that is driven by the returned state machine
 * @param {GHudController}
 */
function createLesson( scene, hud )
{
	var ret = new FsmMachine();
	
	ret.addState("Load", new LoadState( scene, hud ));
	ret.addState("Explore", new ExploreState( scene, hud ));
	ret.addState("Asm", new AsmState( scene, hud ));
	
	//ret.addTransition( "Load", "loadComplete", "Asm" );
	ret.addTransition( "Load", "loadComplete", "Explore" );
	ret.addTransition( "Asm", "exitAsm", "Explore" );
	ret.addTransition( "Explore", "startAsm", "Asm" );
	ret.setState("Load");
	return ret;
}

var __pgGroup = undefined;

/**
 * @constructor
 * @implements {FsmState}
 * @implements {GObjLoaderObserver}
 * @implements {ThreejsLoaderObserver}
 * @param {GScene} scene Scene that is driven by this state
 * @param {GHudController}
 */
function LoadState( scene, hud ) 
{
    this.scene = scene;
	this.hud = hud;
	
	this.officeGroup = new GGroup( "officeGroup" );
	this.penGroup = new GGroup( "penGroup" );
	this.humanoidGroup = new GGroup( "humanoidGroup" );
	
	var officeTransform = mat4.create();
	mat4.scale(officeTransform, officeTransform, [4, 4, 4]);
	this.officeGroup.setMvMatrix(officeTransform);
	
	this.penTransform = mat4.create();
	mat4.translate(this.penTransform, this.penTransform, [1.5, 5.609, 11.5]);
	this.penGroup.setMvMatrix(this.penTransform);
	__pgGroup = this.penGroup;
	
	var humanoidTransform = mat4.create();
	mat4.scale(humanoidTransform, humanoidTransform, [4, 4, 4]);
	mat4.rotate(humanoidTransform, humanoidTransform, -2, [0, 1, 0]);
	mat4.translate(humanoidTransform, humanoidTransform, [30, 0, 25]);
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
}

/**
 * Set the signal observer
 * @param {FsmSignalObserver} observer The new observer to be used
 */
LoadState.prototype.setSignalObserver = FsmState.prototype.setSignalObserver;

/**
 * Fire the transition signal
 * @param {string} signal Name of the signal to fire
 */
LoadState.prototype.fireSignal = FsmState.prototype.fireSignal;

/**
 * This function is called each time this state is entered
 */
LoadState.prototype.enter = function () 
{
	this.envLoader.loadObj("assets/3d/office3d/18361-obj-4/", "OfficeOBJ.obj");
	this.penLoader.loadObj("assets/3d/stylus/", "stylus.obj");
	this.tjsLoader.loadJson( "assets/3d/animtest/", "humanoid.js" );

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
	    
	    if (i == 3)
	    {
	        newGroup.addChild(childrenTemp[++i]);
	    }
	}
	
	len = this.penGroup.children.length;
	
	for (var i = 0; i < len; ++i)
	{    
	    var penTransform = mat4.create();
	    mat4.translate(penTransform, penTransform, [0, 0, i*0.1]);
	    this.penGroup.children[i].setMvMatrix(penTransform);
	}
	
	var light0 = new GLight();
	var light1 = new GLight();
	var light2 = new GLight();
	var light3 = new GLight();
	var light4 = new GLight();
	var light5 = new GLight();
	var light6 = new GLight();
	var light7 = new GLight();
	var light8 = new GLight();
	
	light0.setPosition(-18, 19.21, 8);
	light1.setPosition(-12, 19.21, -2);
	light2.setPosition(-6, 19.21, 8);
	light3.setPosition(0, 19.21, -2);
	light4.setPosition(6, 19.21, 8);
	light5.setPosition(12, 19.21, -2);
	light6.setPosition(18, 19.21, 8);
	light7.setPosition(24, 19.21, -2);
	light8.setPosition(30, 19.21, 8);
	
	//this.scene.addLight(light0);
	//this.scene.addLight(light1);
	//this.scene.addLight(light2);
	this.scene.addLight(light3);
	//this.scene.addLight(light4);
	//this.scene.addLight(light5);
	//this.scene.addLight(light6);
	//this.scene.addLight(light7);
	//this.scene.addLight(light8);
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
  * @param {GObjLoader} Loader object that just finished loading its assets
  */
LoadState.prototype.onObjLoaderCompleted = function ( loader ) 
{
	// wait for 3 loaders
	if (this.loadCount == undefined)
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
 * @param {GObjLoader} Loader object that is being observed
 * @param {number} progress Progress value
 */
LoadState.prototype.onObjLoaderProgress = function ( loader, progress ) 
{
	var tProgress = (this.penLoader.totalProgress + this.envLoader.totalProgress + this.tjsLoader.totalProgress)/3;
	this.ui.pFg.setDrawRec( .7*(tProgress-1), 0, tProgress*.7, .05);
};

/**
  * This function gets called whenever the observed loader completes the loading process
  * @param {ThreejsLoader} Loader object that just finished loading its assets
  */
LoadState.prototype.onThreejsLoaderCompleted = function ( loader ) 
{
	this.onObjLoaderCompleted( loader );
};

/**
 * This function gets called whenever the observed loader makes progress
 * @param {ThreejsLoader} Loader object that is being observed
 * @param {number} progress Progress value
 */
LoadState.prototype.onThreejsLoaderProgress = function ( loader, progress ) 
{
    this.onObjLoaderProgress( loader, progress );
};




/**
 * @constructor
 * @implements {FsmState}
 * @param {GScene} scene Scene that is driven by this state
 * @param {GHudController} hud  Hud to be driven by this state
 */
function ExploreState( scene, hud ) 
{
    this.scene = scene;
	this.hud = hud;
	
	
}
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
	console.debug("entering ExploreState");
	this.camController = new GCameraController();
	this.camController.bindCamera(this.scene.getCamera());
};

/**
 * This function is called whenever we exit the explore state
 */
ExploreState.prototype.exit = function () 
{
	this.camController = undefined;
	console.debug("exiting ExploreState");
};

/**
 * This is the update function for the explore state
 * @param {number} number of milliseconds since the last update
 */
ExploreState.prototype.update = function (time) 
{
	//this.fireSignal("startAsm");
	this.camController.update(time);
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
	
	var percent = this.lapseTime / this.targetLapseTime;;
	
	if (percent >= 1)
	{
		percent = 1;
		this.isComplete = true;
	}
	
	for (var i = 0; i < 3; ++i)
	{
		this.inVector[i] = this.startVec[i] + (this.target[i] - this.startVec[i])*percent;
	}
}

/**
 * Determines if the current animation has completed
 * @return {boolean}
 */
Vec3Animator.prototype.getIsComplete = function()
{
	return this.isComplete;
}

/**
 * @constructor
 * @implements {FsmState}
 * @param {GScene} scene Scene that is driven by this state
 * @param {GHudController} hud  Hud to be driven by this state
 */
function AsmState( scene, hud ) 
{
    this.scene = scene;
	this.hud = hud;
	this.camera = scene.getCamera();
	this.tempEye = vec3.create();
	this.tempUp = vec3.create();
	this.tempLookAt = vec3.create();
}
/**
 * Set the signal observer
 * @param {FsmSignalObserver} observer The new observer to be used
 */
AsmState.prototype.setSignalObserver = FsmState.prototype.setSignalObserver;
/**
 * Fire the transition signal
 * @param {string} signal Name of the signal to fire
 */
AsmState.prototype.fireSignal = FsmState.prototype.fireSignal;

/**
 * This function is called whenever we enter the assembly state
 */
AsmState.prototype.enter = function () 
{
	console.debug("entering AsmState");

	var children = this.scene.getChildren();
	var len = children.length;
	for (var i = 0; i < len; ++i)
	{
		if (children[i].getName() == "penGroup")
		{
			this.penGroup = children[i];
		}
	}
	
	this.clip     = this.penGroup.children[0];
	this.gum      = this.penGroup.children[1];
	this.spring   = this.penGroup.children[2];
	this.ink      = this.penGroup.children[3];
	this.cylinder = this.penGroup.children[4];
	this.axle     = this.penGroup.children[5];
	this.housing  = this.penGroup.children[6];
	this.grip     = this.penGroup.children[7];
	
	this.handler = this.moveCam;
};

/**
 * This function is called whenever we exit the assembly state
 */
AsmState.prototype.exit = function () 
{
	console.debug("exiting AsmState");
};

/**
 * This updates the assembly state by calling into the currently
 * active sub state
 */
AsmState.prototype.update = function (time) 
{
	this.handler(time);
};

/**
 * Assembly sub state: move the camera in front of the desk
 * @param {number} Number of milliseconds since the last update
 */
AsmState.prototype.moveCam = function (time)
{	
	if (this.lookAtAnimator == undefined)
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
	}
	
	this.lookAtAnimator.update( time );
	this.upAnimator.update( time );
	this.eyeAnimator.update( time );
	
	if (this.lookAtAnimator.getIsComplete() && 
		this.upAnimator.getIsComplete() && 
	    this.eyeAnimator.getIsComplete())
	{
		this.lookAtAnimator = undefined;
		this.upAnimator = undefined;
		this.eyeAnimator = undefined;
		this.handler = this.grabInk;
	}
	
	this.camera.setEye(this.tempEye[0], this.tempEye[1], this.tempEye[2]);
	this.camera.setUp(this.tempUp[0], this.tempUp[1], this.tempUp[2]);
	this.camera.setLookAt(this.tempLookAt[0], this.tempLookAt[1], this.tempLookAt[2]);
}

/**
 * Assembly sub state: pick up the ink container from the table
 * @param {number} Number of milliseconds since the last update
 */
AsmState.prototype.grabInk = function (time)
{
    if ( undefined == this.trans )
	{
		this.trans = vec3.fromValues( 0, 0, 0.3 );
		var target = vec3.fromValues( 0.7, 2.8, 3.8 );
		
		this.inkAnimator = new Vec3Animator( this.trans, target, 1000 );
	}
	
	this.inkAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.ink.setMvMatrix(transform);
	
	if ( this.inkAnimator.getIsComplete() )
	{
		this.trans = undefined;
		this.inkAnimator = undefined;
		this.handler = this.grabSpring;
	}
}

/**
 * Assembly sub state: pick up the spring from the table
 * @param {number} Number of milliseconds since the last update
 */
AsmState.prototype.grabSpring = function (time)
{
    if ( undefined == this.trans )
	{
		this.trans = vec3.fromValues( 0, 0, 0.2 );
		var target = vec3.fromValues( -0.7, 2.8, 3.8 );
		
		this.springAnimator = new Vec3Animator( this.trans, target, 1000 );
	}
	
	this.springAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.spring.setMvMatrix(transform);
	
	if ( this.springAnimator.getIsComplete() )
	{
		this.trans = undefined;
		this.springAnimator = undefined;
		this.handler = this.installSpring;
	}
}

/**
 * Assembly sub state: install the spring on the ink container
 * @param {number} Number of milliseconds since the last update
 */
AsmState.prototype.installSpring = function (time)
{
    if ( undefined == this.trans )
	{
		this.trans = vec3.fromValues( 0.7, 2.8, 3.8 );
		var target = vec3.fromValues( -0.7, 2.8, 3.8 );
		
		this.inkAnimator = new Vec3Animator( this.trans, target, 1000 );
	}
	
	this.inkAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.ink.setMvMatrix(transform);
	
	if ( this.inkAnimator.getIsComplete() )
	{
		this.trans = undefined;
		this.inkAnimator = undefined;
		this.handler = this.grabAxle;
	}
}

/**
 * Assembly sub state: pick up the axle form the table and line up for installation
 * @param {number} Number of milliseconds since the last update
 */
AsmState.prototype.grabAxle = function (time)
{
	if ( undefined == this.trans )
	{
		this.trans = vec3.fromValues( 0, 0, 0.5 );
		var target = vec3.fromValues( 0.7, 2.8, 3.8 );
		
		this.axleAnimator = new Vec3Animator( this.trans, target, 1000 );
	}
	
	this.axleAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.axle.setMvMatrix(transform);
	
	if ( this.axleAnimator.getIsComplete() )
	{
		this.trans = undefined;
		this.axleAnimator = undefined;
		this.handler = this.installAxle;
	}
}

/**
 * Assembly sub state: Install the axle to the current assembly
 * @param {number} Number of milliseconds since the last update
 */
AsmState.prototype.installAxle = function (time)
{
	if ( undefined == this.trans )
	{
		this.trans = vec3.fromValues( 0.7, 2.8, 3.8 );
		var target = vec3.fromValues( -0.7, 2.8, 3.8 );
		
		this.axleAnimator = new Vec3Animator( this.trans, target, 1000 );
	}
	
	this.axleAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.axle.setMvMatrix(transform);
	
	if ( this.axleAnimator.getIsComplete() )
	{
		this.trans = undefined;
		this.axleAnimator = undefined;
		this.handler = this.grabHousing;
	}
}

/**
 * Assembly sub state: pick up the housin from the table and align it for installation
 * @param {number} Number of milliseconds since the last update
 */
AsmState.prototype.grabHousing = function (time)
{
	if ( undefined == this.trans )
	{
		this.trans = vec3.fromValues( 0, 0, 0.6 );
		var target = vec3.fromValues( 0.7, 2.8, 3.8 );
		
		this.housingAnimator = new Vec3Animator( this.trans, target, 1000 );
	}
	
	this.housingAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.housing.setMvMatrix(transform);
	
	if ( this.housingAnimator.getIsComplete() )
	{
		this.trans = undefined;
		this.housingAnimator = undefined;
		this.handler = this.installHousing;
	}
}

/**
 * Assembly sub state: Install the housing to the current assembly
 * @param {number} Number of milliseconds since the last update
 */
AsmState.prototype.installHousing = function (time)
{
	if ( undefined == this.trans )
	{
		this.trans = vec3.fromValues( -0.7, 2.8, 3.8 );
		this.trans2 = vec3.fromValues( 0.7, 2.8, 3.8 );
		var target = vec3.fromValues( 0.0, 2.8, 3.8 );
		
		this.inkAnimator = new Vec3Animator( this.trans, target, 1000 );
		this.asmAnimator = new Vec3Animator( this.trans2,target, 1000 );
	}
	
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
         this.inkAnimator.getIsComplete() )
	{
		this.trans = undefined;
		this.asmAnimator = undefined;
		this.inkAnimator = undefined;
		this.handler = this.grabGrip;
	}
}

/**
 * Assembly sub state: pick up the grip from the table and line it up for installation
 * @param {number} Number of milliseconds since the last update
 */
AsmState.prototype.grabGrip = function (time)
{
	if ( undefined == this.trans )
	{
		this.trans = vec3.fromValues( 0, 0, 0.7 );
		var target = vec3.fromValues( -0.7, 2.8, 3.8 );
		
		this.housingAnimator = new Vec3Animator( this.trans, target, 1000 );
	}
	
	this.housingAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.grip.setMvMatrix(transform);
	
	if ( this.housingAnimator.getIsComplete() )
	{
		this.trans = undefined;
		this.housingAnimator = undefined;
		this.handler = this.installGrip;
	}
}

/**
 * Assembly sub state: Install the grip to the rest of the assembly
 * @param {number} Number of milliseconds since the last update
 */
AsmState.prototype.installGrip = function (time)
{
	if ( undefined == this.trans )
	{
		this.trans = vec3.fromValues( -0.7, 2.8, 3.8 );
		var target = vec3.fromValues(  0.0, 2.8, 3.8 );
		
		this.housingAnimator = new Vec3Animator( this.trans, target, 1000 );
	}
	
	this.housingAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.grip.setMvMatrix(transform);
	
	if ( this.housingAnimator.getIsComplete() )
	{
		this.trans = undefined;
		this.housingAnimator = undefined;
		this.handler = this.grabCylinder;
	}
}

/**
 * Assembly sub state: Pick up the cylinder from the table and align for installation
 * @param {number} Number of milliseconds since the last update.
 */
AsmState.prototype.grabCylinder = function (time)
{
	if ( undefined == this.trans )
	{
		this.trans = vec3.fromValues( 0.0, 0.0, 0.4 );
		var target = vec3.fromValues( 0.4, 2.8, 3.8 );
		
		this.cylinderAnimator = new Vec3Animator( this.trans, target, 1000 );
	}
	
	this.cylinderAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.cylinder.setMvMatrix(transform);
	
	if ( this.cylinderAnimator.getIsComplete() )
	{
		this.trans = undefined;
		this.cylinderAnimator = undefined;
		this.handler = this.installCylinder;
	}
}

/**
 * Assembly sub state: Install the cylinder to the assembly
 * @param {number} Number of milliseconds since the last update
 */
AsmState.prototype.installCylinder = function (time)
{
	if ( undefined == this.trans )
	{
		this.trans = vec3.fromValues( 0.4, 2.8, 3.8 );
		var target = vec3.fromValues( 0.0, 2.8, 3.8 );
		
		this.cylinderAnimator = new Vec3Animator( this.trans, target, 1000 );
	}
	
	this.cylinderAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.cylinder.setMvMatrix(transform);
	
	if ( this.cylinderAnimator.getIsComplete() )
	{
		this.trans = undefined;
		this.cylinderAnimator = undefined;
		this.handler = this.grabClip;
	}
}

/** 
 * Assembly sub state: Pick up the clip from the table
 * @param {number} Number of milliseconds since the last update.
 */
AsmState.prototype.grabClip = function (time)
{
	if ( undefined == this.trans )
	{
		this.trans = vec3.fromValues( 0.0, 0.0, 0.0 );
		var target = vec3.fromValues( 0.4, 2.8, 3.8 );
		
		this.clipAnimator = new Vec3Animator( this.trans, target, 1000 );
	}
	
	this.clipAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.clip.setMvMatrix(transform);
	
	if ( this.clipAnimator.getIsComplete() )
	{
		this.trans = undefined;
		this.clipAnimator = undefined;
		this.handler = this.installClip;
	}
}

/**
 * Assembly sub state: Install the clip to the assembly
 * @param {number} Number of milliseconds since the last update.
 */
AsmState.prototype.installClip = function (time)
{
	if ( undefined == this.trans )
	{
		this.trans = vec3.fromValues( 0.4, 2.8, 3.8 );
		var target = vec3.fromValues( 0.0, 2.8, 3.8 );
		
		this.clipAnimator = new Vec3Animator( this.trans, target, 1000 );
	}
	
	this.clipAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.clip.setMvMatrix(transform);
	
	if ( this.clipAnimator.getIsComplete() )
	{
		this.trans = undefined;
		this.clipAnimator = undefined;
		this.handler = this.grabGum;
	}
}

/**
 * Assembly sub state: Pick up the gum from the table and align it for isntallation.
 * @param {number} Number of milliseconds since the last update
 */
AsmState.prototype.grabGum = function (time)
{
	if ( undefined == this.trans )
	{
		this.trans = vec3.fromValues( 0.0, 0.0, 0.0 );
		var target = vec3.fromValues(-0.7, 2.8, 3.8 );
		
		this.gumAnimator = new Vec3Animator( this.trans, target, 1000 );
	}
	
	this.gumAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.gum.setMvMatrix(transform);
	
	if ( this.gumAnimator.getIsComplete() )
	{
		this.trans = undefined;
		this.gumAnimator = undefined;
		this.handler = this.installGum;
	}
}
/**
 * Assembly sub state: Install the gum to the assembly
 * @param {number} Number of milliseconds since the last update.
 */
AsmState.prototype.installGum = function (time)
{
    if ( undefined == this.trans )
	{
		this.trans = vec3.fromValues(-0.7, 2.8, 3.8 );
		var target = vec3.fromValues( 0.0, 2.8, 3.8 );
		
		this.gumAnimator = new Vec3Animator( this.trans, target, 1000 );
	}
	
	this.gumAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans);
	this.gum.setMvMatrix(transform);
	
	if ( this.gumAnimator.getIsComplete() )
	{
		this.trans = undefined;
		this.gumAnimator = undefined;
		this.handler = this.testOut;
	}
}

/**
 * Assembly sub state: Animate testing of the pen (going out)
 * @param {number} Number of milliseconds since the last update.
 */
AsmState.prototype.testOut = function (time)
{
    if ( undefined == this.trans )
	{
		this.trans = vec3.fromValues(-0.09, 2.8, 3.8 );
		var target = vec3.fromValues(-0.075, 2.8, 3.8 );
		
		this.inkAnimator = new Vec3Animator( this.trans, target, 1000 );
	}
	
	this.inkAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans); 
	
	this.clip.setMvMatrix(transform);
	this.cylinder.setMvMatrix(transform);
	this.axle.setMvMatrix(transform);
	this.ink.setMvMatrix(transform);
	
	if ( this.inkAnimator.getIsComplete() )
	{
		this.trans = undefined;
		this.inkAnimator = undefined;
		this.handler = this.holdBeforeTestIn;
	}
}

/**
 * Assembly sub state: hold the assembly in position.
 * @param {number} Number of milliseconds since the last update.
 */
AsmState.prototype.holdBeforeTestIn = function (time)
{
	if ( this.currentLapse == undefined )
	{
		this.currentLapse = 0;
	}
	
	this.currentLapse += time;
	
	if ( this.currentLapse >= 3000 )
	{
		this.currentLapse = undefined;
		this.handler = this.testIn;
	}
}

/**
 * Assembly sub state: Animate testing of the pen (going in)
 * @param {number} Number of milliseconds since the last update.
 */
AsmState.prototype.testIn = function (time)
{
	if ( undefined == this.trans )
	{
		this.trans = vec3.fromValues(-0.09, 2.8, 3.8 );
		var target = vec3.fromValues(-0.0, 2.8, 3.8 );
		
		this.inkAnimator = new Vec3Animator( this.trans, target, 1000 );
	}
	
	this.inkAnimator.update(time);
	
	var transform = mat4.create();
	mat4.translate(transform, transform, this.trans); 
	
	this.clip.setMvMatrix(transform);
	this.cylinder.setMvMatrix(transform);
	this.axle.setMvMatrix(transform);
	this.ink.setMvMatrix(transform);
	
	if ( this.inkAnimator.getIsComplete() )
	{
		this.trans = undefined;
		this.inkAnimator = undefined;
		this.handler = this.idle;
	}
}

/**
 * Assembly sub state: hold the assembly in position.
 * @param {number} Number of milliseconds since the last update.
 */
AsmState.prototype.idle = function (time)
{
	if ( this.currentLapse == undefined )
	{
		this.currentLapse = 0;
	}
	
	this.currentLapse += time;
	
	if ( this.currentLapse >= 300 )
	{
		this.currentLapse = undefined;
		this.handler = this.placeOnTable;
	}
}

/**
 * Assembly sub state: Place the assembly on the table and move the camera away from the desk
 * in preparation for exiting the assembly state
 * @param {number} Number of milliseconds since the last update.
 */
AsmState.prototype.placeOnTable = function (time)
{
	if ( undefined == this.trans )
	{
		this.trans = vec3.fromValues( 0.0, 2.8, 3.8 );
		var target = vec3.fromValues( 0.0, 0.0, 0.0 );
		
		this.inkAnimator = new Vec3Animator( this.trans, target, 1000 );
	}
	
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
	
	if (this.lookAtAnimator == undefined)
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
		this.lookAtAnimator = undefined;
		this.upAnimator = undefined;
		this.eyeAnimator = undefined;
		this.trans = undefined;
		this.inkAnimator = undefined;
		this.handler = this.done;
	}
	
	this.camera.setEye(this.tempEye[0], this.tempEye[1], this.tempEye[2]);
	this.camera.setUp(this.tempUp[0], this.tempUp[1], this.tempUp[2]);
	this.camera.setLookAt(this.tempLookAt[0], this.tempLookAt[1], this.tempLookAt[2]);
}

/**
 * Assembly sub state: Fire the signal to leave the assembly state
 * @param {number} Number of milliseconds since the last update
 */
AsmState.prototype.done = function (time)
{
	this.fireSignal("exitAsm");
}
