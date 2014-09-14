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
 */
function MouseFpCameraController()
{
    FsmState.debugEnable = true;
    FsmMachine.call( this );

    this.dEyePos = vec3.create();
    this.dX = this.dY = this.dZ = undefined;
    this.dPitch = this.dRoll = this.dYaw = undefined;
    
    this.eyePos = vec3.create();
	this.eyeLookAtDir = vec3.create();
	this.eyeUp = vec3.create();
	this.eyeLookAt = vec3.create();
	this.eyeRight = vec3.create();
	this.tempDEyePos = vec3.create();
	
	this.isDragging = false;
	
	this.eyePosStart = vec3.create();
    this.eyeLookAtStart = vec3.create();
    this.eyeUpStart = vec3.create();


	this.viewPortOrigin = vec2.create();
	this.viewPortDrag = vec2.create();
	
	this.horizontalAxis = vec3.create();
	this.verticalAxis = vec3.fromValues(0,1,0);

    this.mouseDown = false;
    this.mouseUp = false;
    this.mouseMove = false;

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
 * Enter the fly state
 */
MouseFpCameraController.prototype.flyEnter = function()
{
    this.flyTime = 0;
};

/**
 * Update the fly state
 * @param {number} time
 */
MouseFpCameraController.prototype.flyUpdate = function( time )
{
    this.flyTime += time;

    if ( 1000 <= this.flyTime )
    {
        this.fireSignal( "reachedTarget" );
    }
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
     var viewportX = ev.getX();
     var viewportY = ev.getY();
    
    this.isDragging = true;
    this.viewPortOrigin[0] = viewportX;
    this.viewPortOrigin[1] = viewportY;
    
    this.viewPortDrag[0] = 0;
    this.viewPortDrag[1] = 0;
    
    this.getValuesFromCam();
    


    var clickTarget = context.getScene3dPossAt(ev);
    var target2Cam = vec3.create();
    vec3.subtract( target2Cam, this.eyePos, clickTarget );
    vec3.normalize( target2Cam, target2Cam );
    vec3.add( this.eyePos, target2Cam, clickTarget );
    vec3.copy( this.eyeLookAt,  clickTarget );

    vec3.subtract( this.eyeLookAtDir, this.eyeLookAt, this.eyePos );
    vec3.cross( this.eyeRight, this.eyeLookAtDir, this.eyeUp );
    vec3.copy( this.horizontalAxis, this.eyeRight );


    vec3.copy( this.eyePosStart, this.eyePos );



    vec3.copy( this.eyeLookAtStart, this.eyeLookAt );
    vec3.copy( this.eyeUpStart, this.eyeUp );

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
