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
 * @constructor
 * @extends {FsmMachine}
 * @implements {IContextMouseObserver}
 * @param {GContext} context
 */
function MouseFpCameraController( context )
{
    FsmMachine.call( this );

    this.context = context;
    
    this.eyePos = vec3.create();
	this.eyeLookAtDir = vec3.create();
	this.eyeUp = vec3.create();
	this.eyeLookAt = vec3.create();
	this.eyeRight = vec3.create();
	
	this.eyePosStart = vec3.create();
    this.eyeLookAtStart = vec3.create();

    this.targetEyePos = vec3.create();
    this.targetEyeLookAt = vec3.create();

	this.viewPortOrigin = vec2.create();
	this.viewPortDrag = vec2.create();
	
	this.horizontalAxis = vec3.create();
	this.verticalAxis = vec3.fromValues(0,1,0);

    this.mouseDown = false;
    this.mouseUp = false;
    this.mouseMove = false;

    this.latestMouseDown = undefined;

    this.flyTime = 0;

    this.initStateMachine();
}

MouseFpCameraController.prototype = Object.create( FsmMachine.prototype );

/**
 *  Initialize the state transitions
 */
MouseFpCameraController.prototype.initStateMachine = function ()
{
    this.createSubState( "idle", this.idleEnter, this.idleUpdate, function(){} );
    this.createSubState( "mouseDnRec", this.mouseDnRecEnter, this.mouseDnRecUpdate, function(){} );
    this.createSubState( "fly", this.flyEnter, this.flyUpdate, function(){} );
    this.createSubState( "observe", this.observeEnter, this.observeUpdate, function(){} );

    this.addTransition( "idle", "mouseDown", "mouseDnRec" );
    this.addTransition( "mouseDnRec", "mouseUp", "fly" );
    this.addTransition( "mouseDnRec", "mouseMove", "observe" );
    this.addTransition( "fly", "reachedTarget", "idle" );
    this.addTransition( "observe", "mouseUp", "idle" );

    this.setName( "mouseFpCameraController" );
    this.setState( "idle" );
};

/**
 * Enter the observe state
 */
MouseFpCameraController.prototype.observeEnter = function()
{
    this.mouseUp = false;

    this.getValuesFromCam();

    vec3.copy( this.eyePosStart, this.eyePos );
    vec3.copy( this.eyeLookAtStart, this.eyeLookAt );
    vec3.copy( this.horizontalAxis, this.eyeRight );
};

/**
 * Update the observe state
 */
MouseFpCameraController.prototype.observeUpdate = function()
{
    if ( this.mouseUp )
    {
        this.fireSignal( "mouseUp" );
        return;
    }

    var mvMatrix = mat4.create();
    mat4.identity( mvMatrix );

    vec3.subtract( this.eyeLookAt, this.eyeLookAtStart, this.eyePosStart );

    // allways rotate around the y axis
    mat4.rotate( mvMatrix, mvMatrix, this.viewPortDrag[0]*Math.PI, this.verticalAxis );

    // find the horizontal axis
    mat4.rotate( mvMatrix, mvMatrix, this.viewPortDrag[1]*Math.PI, this.horizontalAxis );

    vec3.transformMat4(this.eyeLookAt, this.eyeLookAt, mvMatrix);

    vec3.add( this.eyeLookAt, this.eyeLookAt, this.eyePosStart );

    this.setValuesToCam();
};

/**
 * Set to constant heightMode
 * @param {number} constantHeight
 */
MouseFpCameraController.prototype.setConstantHeight = function ( constantHeight )
{
    this.constantHeight = constantHeight;
};

/**
 * Enter the fly state
 */
MouseFpCameraController.prototype.flyEnter = function()
{
    this.flyTime = 0;

    this.getValuesFromCam();



    var clickTarget = this.context.getScene3dPossAt( this.latestMouseDown );
    var target2Cam = vec3.create();

    vec3.copy( this.eyePosStart, this.eyePos );
    vec3.copy( this.eyeLookAtStart, this.eyeLookAt );


    if ( undefined !== this.constantHeight )
    {
        clickTarget[1] = this.constantHeight;
        this.eyePos[1] = this.constantHeight;
    }

    vec3.subtract( target2Cam, this.eyePos, clickTarget );


    vec3.normalize( target2Cam, target2Cam );
    vec3.add( this.targetEyePos, target2Cam, clickTarget );
    vec3.copy( this.targetEyeLookAt,  clickTarget );
};

/**
 * Update the fly state
 * @param {number} time
 */
MouseFpCameraController.prototype.flyUpdate = function( time )
{
    var timeToFly = 500;
    var someConstant = 10/timeToFly;
    var offset = 2;

    // the limit of atan(x) -> infinity is PI/2 but since it never actually gets there
    // we have to normalize the end value to avoid any pops to the target positions.
    var linearProgress = Math.atan( this.flyTime*someConstant - offset)/Math.PI + 0.5;
    linearProgress /= Math.atan( timeToFly*someConstant - offset)/Math.PI + 0.5;

    if ( timeToFly <= this.flyTime )
    {
        this.fireSignal( "reachedTarget" );
        linearProgress = 1;
    }

    this.eyePos[0] = this.eyePosStart[0] + (this.targetEyePos[0] - this.eyePosStart[0])*linearProgress;
    this.eyePos[1] = this.eyePosStart[1] + (this.targetEyePos[1] - this.eyePosStart[1])*linearProgress;
    this.eyePos[2] = this.eyePosStart[2] + (this.targetEyePos[2] - this.eyePosStart[2])*linearProgress;
    this.eyeLookAt[0] = this.eyeLookAtStart[0] + (this.targetEyeLookAt[0] - this.eyeLookAtStart[0])*linearProgress;
    this.eyeLookAt[1] = this.eyeLookAtStart[1] + (this.targetEyeLookAt[1] - this.eyeLookAtStart[1])*linearProgress;
    this.eyeLookAt[2] = this.eyeLookAtStart[2] + (this.targetEyeLookAt[2] - this.eyeLookAtStart[2])*linearProgress;

    this.setValuesToCam();

    this.flyTime += time;
};

/**
 * Enter the mouseDnRec state
 */
MouseFpCameraController.prototype.mouseDnRecEnter = function()
{
    this.mouseUp = false;
    this.mouseMove = false;
};

/**
 * Update the mouseDnRec state
 * @param {number} time
 */
MouseFpCameraController.prototype.mouseDnRecUpdate = function( time )
{
    if ( this.mouseUp )
    {
        this.fireSignal( "mouseUp" );
    }
    else if ( this.mouseMove )
    {
        this.fireSignal( "mouseMove" );
    }
};

/**
 * Enter the idle state
 */
MouseFpCameraController.prototype.idleEnter = function()
{
    this.mouseDown = false;
};

/**
 * Update the idle state
 * @param {number} time
 */
MouseFpCameraController.prototype.idleUpdate = function( time )
{
    if ( this.mouseDown )
    {
        this.fireSignal("mouseDown");
    }
};

/**
 * @param {PointingEvent} ev
 */
MouseFpCameraController.prototype.onMouseDown = function( ev )
{
    this.latestMouseDown = ev;

     var viewportX = ev.getX();
     var viewportY = ev.getY();
    
    this.isDragging = true;
    this.viewPortOrigin[0] = viewportX;
    this.viewPortOrigin[1] = viewportY;
    
    this.viewPortDrag[0] = 0;
    this.viewPortDrag[1] = 0;
    

    this.mouseDown = true;

    return true;
};

/**
 * @param {PointingEvent} ev
 */
MouseFpCameraController.prototype.onMouseUp = function( ev )
{
    if ( false === this.isDragging ) return false;
     
    this.isDragging = false;

    this.mouseUp = true;
    
    return true;
};

/**
 * @param {PointingEvent} ev
 */
MouseFpCameraController.prototype.onMouseMove = function( ev )
{
    if ( false === this.isDragging ) return false;
    
    var viewPortX = ev.getX();
    var viewPortY = ev.getY();
    
    vec2.subtract( this.viewPortDrag, this.viewPortOrigin, new Float32Array([viewPortX, viewPortY]) );

    this.mouseMove = true;
    
    return true;
};

/**
 * Bind a camera to this controller
 * @param {GCamera} camera Camera object to bind to this controller
 */
MouseFpCameraController.prototype.bindCamera = function( camera )
{
    this.camera = camera;
    this.getValuesFromCam();
};

MouseFpCameraController.prototype.getValuesFromCam = function()
{
    this.camera.getEye( this.eyePos );
    this.camera.getLookAt( this.eyeLookAt );
    this.camera.getUp( this.eyeUp );
    vec3.subtract( this.eyeLookAtDir, this.eyeLookAt, this.eyePos );
    
    vec3.cross( this.eyeRight, this.eyeLookAtDir, this.eyeUp );
};

MouseFpCameraController.prototype.setValuesToCam = function()
{
    camera.setEye( this.eyePos[0], this.eyePos[1], this.eyePos[2] );
    camera.setLookAt( this.eyeLookAt[0], this.eyeLookAt[1], this.eyeLookAt[2] );
    camera.setUp( this.eyeUp[0], this.eyeUp[1], this.eyeUp[2] );
};
