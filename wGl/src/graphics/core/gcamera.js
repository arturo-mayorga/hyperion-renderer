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
function GCamera()
{
    this.gl = undefined;
	this.pMatrix = mat4.create();
	
	
	this.rotMat  = mat4.create();
	this.tranMat = mat4.create();
	
	this.eye = vec3.fromValues(0, 0, 0);
	this.up = vec3.fromValues(0, 1, 0);
	this.lookAt = vec3.fromValues(0, 0, 1);
	
	this.mvMatrix = mat4.create();
	
	this.aspect = 1.7777777777777777;
	this.fovy = 0.8*(3.14159/4);
}
	
/**
 * Draw the current camera and populate the view matrix
 * @param {Array.<number>} Out parameter containing the view matrix
 * @param {GShader} Shader to use for drawing this camera
 */
GCamera.prototype.draw = function( ouMvMatrix, shader )
{
    /** @type {WebGLRenderingContext} */ var gl = this.gl;
    this.updateMatrices();
    
    mat4.copy(ouMvMatrix, this.mvMatrix);
    
    gl.uniformMatrix4fv( shader.uniforms.pMatrixUniform, false, this.pMatrix );
};

/**
 * Get the view matrix calculated by this camera
 * @param {Array.<number>} Numbers representing the 4 by 4 view matrix
 */
GCamera.prototype.getMvMatrix = function( outMvMatrix )
{
    mat4.copy( outMvMatrix, this.mvMatrix );
};

/**
 * Get the projection matrix calculated by this camera
 * @param {Array.<number>} Numbers representing the 4 by 4 projection matrix
 */
GCamera.prototype.getPMatrix = function ( outPMatrix )
{
    mat4.copy( outPMatrix, this.pMatrix );
};

/**
 * Called to bind this camera to a gl context
 * @param {WebGLRenderingContext} Context to bind to this camera
 */
GCamera.prototype.bindToContext = function(gl_)
{
    this.gl = gl_;
};

/**
 * Set the field of view on the y-axis
 * @param {number} Field of view
 */
GCamera.prototype.setFovy = function( fovy )
{
    this.fovy = fovy;
};

/**
 * Set the aspect ration for this camera
 * @param {number} Aspect ratio
 */
GCamera.prototype.setAspect = function( aspect )
{
    this.aspect = aspect;
};

/**
 * Set the eye value for this camera
 * @param {number} X component of the eye value for this camera.
 * @param {number} Y component of the eye value for this camera.
 * @param {number} Z component of the eye value for this camera.
 */
GCamera.prototype.setEye = function ( x, y, z )
{
    this.eye[0] = x; this.eye[1] = y; this.eye[2] = z;
};

/**
 * Get the up vector for this camera
 * @param {Arra.<number>} This array will be populated with the up value
 */
GCamera.prototype.getEye = function ( outA )
{
    outA[0] = this.eye[0];
    outA[1] = this.eye[1];
    outA[2] = this.eye[2];
};

/**
 * Set the up value for this camera
 * @param {number} X component of the up value for this camera.
 * @param {number} Y component of the up value for this camera.
 * @param {number} Z component of the up value for this camera.
 */
GCamera.prototype.setUp = function ( x, y, z )
{
    this.up[0] = x; this.up[1] = y; this.up[2] = z;
};

/**
 * Get the up vector for this camera
 * @param {Arra.<number>} This array will be populated with the up value
 */
GCamera.prototype.getUp = function ( outA )
{
    outA[0] = this.up[0];
    outA[1] = this.up[1];
    outA[2] = this.up[2];
};

/**
 * Set the look at value for this camera.
 * @param {number} X component of the look at value for this camera.
 * @param {number} Y component of the look at value for this camera.
 * @param {number} Z component of the look at value for this camera.
 */
GCamera.prototype.setLookAt = function ( x, y, z )
{
    this.lookAt[0] = x; this.lookAt[1] = y; this.lookAt[2] = z;
};

/**
 * Get the look at vector for this camera
 * @param {Arra.<number>} This array will be populated with the look at value
 */
GCamera.prototype.getLookAt = function ( outA )
{
    outA[0] = this.lookAt[0];
    outA[1] = this.lookAt[1];
    outA[2] = this.lookAt[2];
};

/**
 * Calculate the matrices for the current update cycle
 */
GCamera.prototype.updateMatrices = function()
{ 
    mat4.lookAt(this.mvMatrix, this.eye, this.lookAt, this.up);
    mat4.perspective(this.pMatrix, this.fovy, this.aspect, 0.1, 100.0);
};