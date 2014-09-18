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
 * @interface
 */
function IGRenderPassCmd() {}
IGRenderPassCmd.prototype.run = function( scene ) {};

/**
 * @interface
 */
function IGRenderPassCmdCameraController() {}

/**
 * Get the camera managed by this controller
 * @return {GCamera} camera being managed by this controller
 */
IGRenderPassCmdCameraController.prototype.getCamera = function() {};

/**
 * Bind the controller to a context for rendering
 * @param {WebGLRenderingContext} context to use for this controller
 */
IGRenderPassCmdCameraController.prototype.bindToContext = function( gl ) {};

/**
 * @constructor
 * @implements {IGRenderPassCmdCameraController}
 */
function GLightBasedCamCtrl()
{
    this.camera = new GCamera();
    this.camera.setFovy( Math.PI/1.5 );
    this.camera.setAspect( 1 );
    
    
    this.lightLocation = vec3.fromValues( 0, 0, 0 );
    this.lookAtDir     = vec3.fromValues( 0, 0, 1 );
    this.lookAt        = vec3.fromValues( 0, 0, 1 );
    this.upDir         = vec3.fromValues( 0, 1, 0 );
    this.lightIndex = 0;
}

/**
 * Implementation of IGRenderPassCmdCameraController.prototype.bindToContext
 * @param {WebGLRenderingContext} context to use for this controller
 */
GLightBasedCamCtrl.prototype.bindToContext = function( gl ) 
{
    this.camera.bindToContext( gl );
};

/**
 * Update this camera controller 
 * @param {GScene} scene to use while updating this controller
 */
GLightBasedCamCtrl.prototype.update = function( scene )
{
    var light = scene.getActiveLight();
     
    if ( undefined != light )
    {
        light.getPosition( this.lightLocation );
        vec3.add( this.lookAt, this.lightLocation, this.lookAtDir );
        
        this.camera.setEye( this.lightLocation[0], this.lightLocation[1], this.lightLocation[2] );
        this.camera.setUp( this.upDir[0], this.upDir[1], this.upDir[2] );
        this.camera.setLookAt( this.lookAt[0], this.lookAt[1], this.lookAt[2] );
    }
};

/** 
 * Set the up direction from the perspective of the light
 * @param {number] X component of the direction
 * @param {number} Y component of the direction
 * @param {number} Z component of the direction
 */
GLightBasedCamCtrl.prototype.setUp = function( x, y, z )
{
    this.upDir[0] = x; this.upDir[1] = y; this.upDir[2] = z;
};

/**
 * Set the look at direction from the perspective of the light
 * @param {number} X component of the direction
 * @param {number} Y component of the direction
 * @param {number} Z component of the direction
 */
GLightBasedCamCtrl.prototype.setLookAtDir = function( x, y, z )
{
    this.lookAtDir[0] = x; this.lookAtDir[1] = y; this.lookAtDir[2] = z;
};

/**
 * Implementation of IGRenderPassCmdCameraController.prototype.getCamera
 * @return {GCamera} camera being managed by this controller
 */
GLightBasedCamCtrl.prototype.getCamera = function() 
{
    return this.camera;
};

/**
 * @constructor
 */
function GRenderPassClearCmd( gl, frameBuffer )
{
     this.frameBuffer = frameBuffer;
     this.gl = gl;
}

/**
 * @constructor
 * @param {GScene} Scene object to run this pass command against
 */
GRenderPassClearCmd.prototype.run = function( scene )
{
    var gl = this.gl;
    this.frameBuffer.bindBuffer(); 
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT ); 
    this.frameBuffer.unbindBuffer();
};

/**
 * @constructor
 * @param {WebGLRenderingContext} Context to use for rendering
 * @param {ShaderComposite} Shader program composite to use for this pass
 * @param {GFrameBuffer} Target frame buffer object for this pass
 */
function GGeometryRenderPassCmd( gl, program, frameBuffer )
{
    this.gl = gl;
    this.shaderProgram = program;
    this.frameBuffer = frameBuffer;
}

/**
 * Execute this pass
 * @param {GScene} Scene object to run this pass command against
 */
GGeometryRenderPassCmd.prototype.run = function( scene )
{
    var gl = this.gl; 
    gl.enable( this.gl.DEPTH_TEST );
    
    this.frameBuffer.bindBuffer();
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    scene.draw( this.shaderProgram );
    
    this.frameBuffer.unbindBuffer();
};

/**
 * @constructor
 * @param {WebGLRenderingContext} Context to use for rendering
 * @param {ShaderComposite} Shader program composite to use for this pass
 * @param {GFrameBuffer} Target frame buffer object for this pass
 * @param {IGRenderPassCmdCameraController} camera controller for this pass
 */
function GCustomCamGeometryRenderPassCmd( gl, program, frameBuffer, cameraController )
{
    this.gl = gl;
    this.shaderProgram = program;
    this.frameBuffer = frameBuffer;
    this.customCameraController = cameraController;
}

/**
 * Execute this pass
 * @param {GScene} Scene object to run this pass command against
 */
GCustomCamGeometryRenderPassCmd.prototype.run = function( scene )
{
    var gl = this.gl; 
    gl.enable( this.gl.DEPTH_TEST );
    
    this.frameBuffer.bindBuffer();
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    scene.drawThroughCamera( this.customCameraController.getCamera(), this.shaderProgram );
    
    this.frameBuffer.unbindBuffer();
};



/**
 * @constructor
 * @param {WebGLRenderingContext} Context to use for rendering
 * @param {GShader} Shader program to use for this pass
 * @param {GFrameBuffer} Target frame buffer object for this pass
 * @param {Object} Object containing the screen geometry
 */
function GPostEffectRenderPassCmd( gl, program, frameBuffer, screenGeometry )
{
    this.gl = gl;
    this.shaderProgram = program;
    this.frameBuffer = frameBuffer;
    this.nextTextureInput = gl.TEXTURE0;
    this.textureList = [];
    this.screen = screenGeometry;
    this.hMatrix = mat3.create();
    this.setHRec( 0, 0, 1, 1, 0 );
}

/**
 * Define the rendering rectangle for this pass
 * @param {number} X component reprecenting the center of the rectangle
 * @param {number} Y component reprecenting the center of the rectangle
 * @param {number} With component in screen size percentage
 * @param {number} Height component in screen size percentage
 * @param {number} Rotation in radians
 */
GPostEffectRenderPassCmd.prototype.setHRec = function( x, y, w, h, r )
{
    mat3.identity( this.hMatrix);
	mat3.translate( this.hMatrix, this.hMatrix, new Float32Array([x, y]) );
	mat3.scale( this.hMatrix,this.hMatrix, new Float32Array([w, h]) );
	mat3.rotate( this.hMatrix,this.hMatrix, r );
};

/**
 * Add an input frame buffer that contains a texture that can be used as rendering input
 * @param {GFrameBuffer}
 */
GPostEffectRenderPassCmd.prototype.addInputFrameBuffer = function( frameBuffer )
{
    this.addInputTexture( frameBuffer.getGTexture() );
};

/**
 * Add an input texture to use while rendering this pass
 * @param {GTexture} texture to use for input
 */
GPostEffectRenderPassCmd.prototype.addInputTexture = function( texture )
{
    this.textureList.push( {gTexture:texture, glTextureTarget:this.nextTextureInput++} );
};

/**
 * Execute this pass
 * @param {GScene} Scene objec to run tihs pass command against
 */
GPostEffectRenderPassCmd.prototype.run = function( scene )
{ 
    this.shaderProgram.activate();
    this.frameBuffer.bindBuffer();
    
    var texCount = this.textureList.length;
    
    for (var i = 0; i < texCount; ++i)
    {
        this.textureList[i].gTexture.draw( this.textureList[i].glTextureTarget, null, null );
    }
    
    this.drawScreenBuffer(this.shaderProgram);
    
    this.frameBuffer.unbindBuffer();
    this.shaderProgram.deactivate();
};

/**
 * Helper function to draw the screen geometry
 * @param {GShader} Shader program to use while drawing the screen
 */
GPostEffectRenderPassCmd.prototype.drawScreenBuffer = function( shader )
{   
    var gl = this.gl;
	
	var mapIdx = 0;
    
    if ( null != shader.uniforms.mapKd )
    {
        gl.uniform1i( shader.uniforms.mapKd, mapIdx++ );
    }
 
    if ( null != shader.uniforms.mapNormal )
    {
        gl.uniform1i( shader.uniforms.mapNormal, mapIdx++ );
    }
  
    if ( null != shader.uniforms.mapPosition )
    {
        gl.uniform1i( shader.uniforms.mapPosition, mapIdx++ );
    }
    
    if ( null != shader.uniforms.mapLight )
    {
        gl.uniform1i( shader.uniforms.mapLight, mapIdx++ );
    }
    
    if ( null != shader.uniforms.mapShadow )
    {
        gl.uniform1i( shader.uniforms.mapShadow, mapIdx++ );
    }
    
    if ( null != shader.uniforms.mapPing )
    {
        gl.uniform1i( shader.uniforms.mapPing, mapIdx++ );
    }
    
    if ( null != shader.uniforms.mapRandom )
    {
        gl.uniform1i( shader.uniforms.mapRandom, mapIdx++ );
    }
    
    gl.bindBuffer( gl.ARRAY_BUFFER, this.screen.vertBuffer);
    gl.vertexAttribPointer( shader.attributes.positionVertexAttribute, 
                            this.screen.vertBuffer.itemSize, gl.FLOAT, false, 0, 0 );
     
    gl.bindBuffer( gl.ARRAY_BUFFER, this.screen.textBuffer);
    gl.vertexAttribPointer( shader.attributes.textureVertexAttribute, 
                            this.screen.textBuffer.itemSize, gl.FLOAT, false, 0, 0 );

    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.screen.indxBuffer );
	
	if ( null != shader.uniforms.hMatrixUniform )
    {
        gl.uniformMatrix3fv( shader.uniforms.hMatrixUniform, false, this.hMatrix );
    }
	
    gl.drawElements( gl.TRIANGLES, this.screen.indxBuffer.numItems, gl.UNSIGNED_SHORT, 0 );
};


/**
 * @constructor
 * @param {WebGLRenderingContext} context to use for rendering
 * @param {GShader} Shader program for rendeinrg this pass
 * @param {GFrameBuffer} Frame buffer to render onto
 * @param {Object} Object containing the screen geometry
 * @param {GCamera} Camera representing the light that we are rendering through
 */
function GPostEffectLitRenderPassCmd( gl, program, frameBuffer, screenGeometry, lightCamera )
{
    this.gl = gl;
    this.shaderProgram = program;
    this.frameBuffer = frameBuffer;
    this.nextTextureInput = gl.TEXTURE0;
    this.textureList = [];
    this.screen = screenGeometry;
    this.hMatrix = mat3.create();
    this.setHRec( 0, 0, 1, 1, 0 );
    this.lightCamera = lightCamera; 
    
    this.sceneMvMatrix = mat4.create();
    this.lMvMatrix = mat4.create();
    this.lPMatrix = mat4.create();
    this.uniformMatrix = mat4.create();
    
    this.sendShadowMatrix = ( undefined === this.shaderProgram.uniforms.shadowMatrix ||
                              undefined === lightCamera  )?function(){}:function()
    {
        var camera = this.lightCamera;
    
        var gCamera = scene.getCamera();
        gCamera.updateMatrices();
        
        mat4.identity(this.uniformMatrix);
        
        gCamera.getMvMatrix( this.sceneMvMatrix );
        camera.getMvMatrix( this.lMvMatrix );
        camera.getPMatrix( this.lPMatrix );
        
        mat4.invert( this.sceneMvMatrix, this.sceneMvMatrix );
        
        mat4.multiply( this.uniformMatrix, this.uniformMatrix, this.lPMatrix );
        mat4.multiply( this.uniformMatrix, this.uniformMatrix, this.lMvMatrix );
        mat4.multiply( this.uniformMatrix, this.uniformMatrix, this.sceneMvMatrix );
    
        this.gl.uniformMatrix4fv( this.shaderProgram.uniforms.shadowMatrix, false, this.uniformMatrix );
    };
}

/**
 * Inherited methods from GPostEffectRenderPassCmd
 */
GPostEffectLitRenderPassCmd.prototype.setHRec = 
    GPostEffectRenderPassCmd.prototype.setHRec;
GPostEffectLitRenderPassCmd.prototype.addInputFrameBuffer = 
    GPostEffectRenderPassCmd.prototype.addInputFrameBuffer;
GPostEffectLitRenderPassCmd.prototype.addInputTexture = 
    GPostEffectRenderPassCmd.prototype.addInputTexture;
GPostEffectLitRenderPassCmd.prototype.drawScreenBuffer = 
    GPostEffectRenderPassCmd.prototype.drawScreenBuffer;

/**
 * Execute this pass
 * @param {GScene} Scene object to run this pass command against
 */
GPostEffectLitRenderPassCmd.prototype.run = function( scene )
{ 
    this.shaderProgram.activate();
    this.frameBuffer.bindBuffer();
    
    var texCount = this.textureList.length;
    
    for (var i = 0; i < texCount; ++i)
    {
        this.textureList[i].gTexture.draw( this.textureList[i].glTextureTarget, null, null );
    }
    
  
    
    scene.drawActiveLight( this.shaderProgram );
 
    this.sendShadowMatrix();
    
    
    this.gl.disable( this.gl.DEPTH_TEST );
    this.drawScreenBuffer(this.shaderProgram);
    
    this.frameBuffer.unbindBuffer();
    this.shaderProgram.deactivate();
};


