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
 * @implements {IContextMouseObserver}
 */
function MouseOrbitingCameraController()
{
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
	this.viewPortOrigin = vec2.create();
	this.viewPortDrag = vec2.create();
	
	this.horizontalAxis = vec3.create();
	this.verticalAxis = vec3.fromValues(0,1,0);
}

/**
 * @param {PointingEvent} ev
 */
MouseOrbitingCameraController.prototype.onMouseDown = function( ev ) 
{
     var viewportX = ev.getX();
     var viewportY = ev.getY();
    
    this.isDragging = true;
    this.viewPortOrigin[0] = viewportX;
    this.viewPortOrigin[1] = viewportY;
    
    this.viewPortDrag[0] = 0;
    this.viewPortDrag[1] = 0;
    
    this.getValuesFromCam();
    
    vec3.add( this.horizontalAxis, this.eyeRight, this.eyeLookAt );
    
    vec3.copy( this.eyePosStart, this.eyePos ); 
    
    return true;
};

/**
 * @param {PointingEvent} ev
 */
MouseOrbitingCameraController.prototype.onMouseUp = function( ev ) 
{
    if ( false === this.isDragging ) return false;
     
    this.isDragging = false;
    
    return true;
};

/**
 * @param {PointingEvent} ev
 */
MouseOrbitingCameraController.prototype.onMouseMove = function( ev ) 
{
    if ( false === this.isDragging ) return false;
    
    var viewPortX = ev.getX();
    var viewPortY = ev.getY();
    
    vec2.subtract( this.viewPortDrag, this.viewPortOrigin, new Float32Array([viewPortX, viewPortY]) );
    
    return true;
};

/**
 * Bind a camera to this controller
 * @param {GCamera} camera Camera object to bind to this controller
 */
MouseOrbitingCameraController.prototype.bindCamera = function( camera )
{
    this.camera = camera;
    this.getValuesFromCam();
};

MouseOrbitingCameraController.prototype.getValuesFromCam = function()
{
    this.camera.getEye( this.eyePos );
    this.camera.getLookAt( this.eyeLookAt );
    this.camera.getUp( this.eyeUp );
    vec3.subtract( this.eyeLookAtDir,
                   this.eyeLookAt, this.eyePos );
    
    vec3.cross( this.eyeRight, this.eyeLookAtDir, this.eyeUp );
};

MouseOrbitingCameraController.prototype.setValuesToCam = function()
{
    camera.setEye( this.eyePos[0], this.eyePos[1], this.eyePos[2] );
    camera.setLookAt( this.eyeLookAt[0], this.eyeLookAt[1], this.eyeLookAt[2] );
    camera.setUp( this.eyeUp[0], this.eyeUp[1], this.eyeUp[2] );
};

/**
 * Update the state of the controller
 * @param {number} time
 */
MouseOrbitingCameraController.prototype.update = function( time )
{
    if ( false === this.isDragging ) return;
    
    var mvMatrix = mat4.create();
    mat4.identity( mvMatrix );
    
    mat4.translate(mvMatrix, mvMatrix, new Float32Array([this.eyeLookAt[0]*-1, this.eyeLookAt[1]*-1, this.eyeLookAt[2]*-1]) );
    
    // allways rotate around the y axis
    mat4.rotate( mvMatrix, mvMatrix, this.viewPortDrag[0]*Math.PI, this.verticalAxis );
    
    // find the horizontal axis
    mat4.rotate( mvMatrix, mvMatrix, this.viewPortDrag[1]*Math.PI, this.horizontalAxis );
    
    mat4.translate(mvMatrix, mvMatrix, this.eyeLookAt);
    
    vec3.transformMat4(this.eyePos, this.eyePosStart, mvMatrix);
    
    this.setValuesToCam();
};
