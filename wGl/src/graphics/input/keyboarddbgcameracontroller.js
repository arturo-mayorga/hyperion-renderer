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
 */
function KeyboardDbgCameraController()
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
    
    this.moveSize = .015;
    this.rotSize = .001;
    
    this.camera = undefined;
	
	var KEY_CODES = 
	{
		LEFT:65, BACK:83, RIGHT:68, FORWARD:87, YAW_LEFT:74,
		YAW_RIGHT:76, PITCH_UP:75, PITCH_DOWN:73, MOVE_UP:82,
		MOVE_DOWN:70, ROLL_LEFT:85, ROLL_RIGHT:79	
	};
	
	this.keydownMap = {}; this.keyupMap = {};
	this.keydownMap[KEY_CODES.LEFT]       = function() { this.dX = -1 };
	this.keyupMap  [KEY_CODES.LEFT]       = function() { if (this.dX === -1) {this.dX = 0;} };
	this.keydownMap[KEY_CODES.BACK]       = function() { this.dZ = -1 };
	this.keyupMap  [KEY_CODES.BACK]       = function() { if (this.dZ === -1) {this.dZ = 0;} };
	this.keydownMap[KEY_CODES.RIGHT]      = function() { this.dX = 1 };
	this.keyupMap  [KEY_CODES.RIGHT]      = function() { if (this.dX === 1) {this.dX = 0;} };
	this.keydownMap[KEY_CODES.FORWARD]    = function() { this.dZ = 1 };
	this.keyupMap  [KEY_CODES.FORWARD]    = function() { if (this.dZ === 1) {this.dZ = 0;} };
	this.keydownMap[KEY_CODES.YAW_LEFT]   = function() { this.dYaw = 1 };
	this.keyupMap  [KEY_CODES.YAW_LEFT]   = function() { if (this.dYaw === 1) {this.dYaw = 0;} };
	this.keydownMap[KEY_CODES.YAW_RIGHT]  = function() { this.dYaw = -1 };
	this.keyupMap  [KEY_CODES.YAW_RIGHT]  = function() { if (this.dYaw === -1) {this.dYaw = 0;} };
	this.keydownMap[KEY_CODES.PITCH_UP]   = function() { this.dPitch = 1 };
	this.keyupMap  [KEY_CODES.PITCH_UP]   = function() { if (this.dPitch === 1) {this.dPitch = 0;} };
	this.keydownMap[KEY_CODES.PITCH_DOWN] = function() { this.dPitch = -1 };
	this.keyupMap  [KEY_CODES.PITCH_DOWN] = function() { if (this.dPitch === -1) {this.dPitch = 0;} };
	this.keydownMap[KEY_CODES.MOVE_UP]    = function() { this.dY = 1 };
	this.keyupMap  [KEY_CODES.MOVE_UP]    = function() { if (this.dY === 1) {this.dY = 0;} };
	this.keydownMap[KEY_CODES.MOVE_DOWN]  = function() { this.dY = -1 };
	this.keyupMap  [KEY_CODES.MOVE_DOWN]  = function() { if (this.dY === -1) {this.dY = 0;} };
	this.keydownMap[KEY_CODES.ROLL_LEFT]  = function() { this.dRoll = -1 };
	this.keyupMap  [KEY_CODES.ROLL_LEFT]  = function() { if (this.dRoll === -1) {this.dRoll = 0;} };
	this.keydownMap[KEY_CODES.ROLL_RIGHT] = function() { this.dRoll = 1 };
	this.keyupMap  [KEY_CODES.ROLL_RIGHT] = function() { if (this.dRoll === 1) {this.dRoll = 0;} };
    
	this.dEyePos[0] = this.dEyePos[1] = this.dEyePos[2] = 0;
    this.dX = this.dY = this.dZ = 0;
    this.dPitch = this.dRoll = this.dYaw = 0;
    
    document.addEventListener('keydown',this.onKeyDown.bind(this),false);
    document.addEventListener("keyup",this.onKeyUp.bind(this),false);
}

/**
 * Called when a key is pressed on the keyboard
 * @param {KeyboardEvent} e Event containing the key that was pressed
 */ 
KeyboardDbgCameraController.prototype.onKeyDown = function ( e )
{
    this.handler = this.keydownMap[e.keyCode];
    if (this.handler) { this.handler(); }
};

/**
 * Called when a key is released on the keyboard
 * @param {KeyboardEvent} e Event containing the key that was pressed
 */ 
KeyboardDbgCameraController.prototype.onKeyUp = function (e)
{
    this.handler = this.keyupMap[e.keyCode];
    if (this.handler) { this.handler(); }
};

/**
 * Bind a camera to this controller
 * @param {GCamera} camera Camera object to bind to this controller
 */
KeyboardDbgCameraController.prototype.bindCamera = function( camera )
{
    var lookAt = vec3.create();
    this.camera = camera;
    this.getValuesFromCam();
};

KeyboardDbgCameraController.prototype.getValuesFromCam = function()
{
    this.camera.getEye(this.eyePos);
    this.camera.getLookAt(this.eyeLookAtDir);
    this.camera.getUp(this.eyeUp);
    vec3.subtract( this.eyeLookAtDir,
                   this.eyeLookAtDir, this.eyePos );
    
    vec3.cross(this.eyeRight, this.eyeLookAtDir, this.eyeUp);
};

KeyboardDbgCameraController.prototype.setValuesToCam = function()
{
    camera.setEye(this.eyePos[0], this.eyePos[1], this.eyePos[2]);
    camera.setLookAt(this.eyeLookAt[0], this.eyeLookAt[1], this.eyeLookAt[2]);
    camera.setUp(this.eyeUp[0], this.eyeUp[1], this.eyeUp[2]);
};

/**
 *
 * @param {number} elapsedTime
 */
KeyboardDbgCameraController.prototype.calcRotations = function ( elapsedTime )
{
    var mvMatrix = mat4.create();
    mat4.identity(mvMatrix);
    mat4.rotate(mvMatrix, mvMatrix, this.dYaw*this.rotSize*elapsedTime,   this.eyeUp);
    mat4.rotate(mvMatrix, mvMatrix, this.dPitch*this.rotSize*elapsedTime, this.eyeRight);
    mat4.rotate(mvMatrix, mvMatrix, this.dRoll*this.rotSize*elapsedTime,  this.eyeLookAtDir);
    
    var tVec = vec4.create();
    vec4.set(tVec, this.eyeUp[0], this.eyeUp[1], this.eyeUp[2], 0);
    vec4.transformMat4(tVec, tVec, mvMatrix);
    vec3.set(this.eyeUp, tVec[0], tVec[1], tVec[2]);
    
    vec4.set(tVec, this.eyeRight[0], this.eyeRight[1], this.eyeRight[2], 0);
    vec4.transformMat4(tVec, tVec, mvMatrix);
    vec3.set(this.eyeRight, tVec[0], tVec[1], tVec[2]);
    
    vec4.set(tVec, this.eyeLookAtDir[0], this.eyeLookAtDir[1], this.eyeLookAtDir[2], 0);
    vec4.transformMat4(tVec, tVec, mvMatrix);
    vec3.set(this.eyeLookAtDir, tVec[0], tVec[1], tVec[2]);
};

KeyboardDbgCameraController.prototype.calcTrans = function( elapsedTime )
{
    vec3.set(this.tempDEyePos, 0,0,0);
    
    if (this.dZ === 1)
    {
        vec3.add(this.tempDEyePos, this.tempDEyePos, this.eyeLookAtDir);
    }
    else if (this.dZ === -1)
    {
        vec3.subtract(this.tempDEyePos, this.tempDEyePos, this.eyeLookAtDir);
    }
    
    if (this.dX === 1)
    {
        vec3.add(this.tempDEyePos, this.tempDEyePos, this.eyeRight);
    }
    else if (this.dX === -1)
    {
        vec3.subtract(this.tempDEyePos, this.tempDEyePos, this.eyeRight);
    }
    
    if (this.dY === 1)
    {
        vec3.add(this.tempDEyePos, this.tempDEyePos, this.eyeUp);
    }
    else if (this.dY === -1)
    {
        vec3.subtract(this.tempDEyePos, this.tempDEyePos, this.eyeUp);
    }
    
    vec3.normalize(this.tempDEyePos,this.tempDEyePos);
    vec3.scale(this.tempDEyePos, this.tempDEyePos, this.moveSize*elapsedTime);
    vec3.add(this.eyePos, this.eyePos, this.tempDEyePos);
    
    vec3.add(this.eyeLookAt, this.eyePos, this.eyeLookAtDir);
};

/**
 * Update the camera state
 * @param {number} elapsedTime Number of milliseconds since the last call.
 */
KeyboardDbgCameraController.prototype.update = function( elapsedTime )
{
    if ( this.camera === undefined ) return;
    
    this.getValuesFromCam(); 
    this.calcRotations( elapsedTime ); 
    this.calcTrans( elapsedTime ); 
    this.setValuesToCam();
};

