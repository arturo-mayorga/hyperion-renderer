/** 
 * @interface
 */
function IGRenderPassCmd() {}
IGRenderPassCmd.prototype.run = function( scene ) {};

/**
 * @interface
 */
function IGRenderPassCmdCameraController() {}
IGRenderPassCmdCameraController.prototype.getCamera = function() {};
IGRenderPassCmdCameraController.prototype.bindToContext = function( gl ) {};

/**
 * @implements {IGRenderPassCmdCameraController}
 */
function GLightBasedCamCtrl()
{
    this.camera = new GCamera();
    this.camera.setFovy( 3.14159/2 );
    this.camera.setAspect( 1 );
    
    
    this.lightLocation = vec3.fromValues( 0, 0, 0 );
    this.lookAtDir     = vec3.fromValues( 0, 0, 1 );
    this.lookAt        = vec3.fromValues( 0, 0, 1 )
    this.upDir         = vec3.fromValues( 0, 1, 0 );
    this.lightIndex = 0;
}

GLightBasedCamCtrl.prototype.bindToContext = function( gl ) 
{
    this.camera.bindToContext( gl );
};

GLightBasedCamCtrl.prototype.update = function( scene )
{
    var light = scene.getLights()[this.lightIndex];
    
    if ( undefined != light )
    {
        light.getPosition( this.lightLocation );
        vec3.add( this.lookAt, this.lightLocation, this.lookAtDir );
        
        this.camera.setEye( this.lightLocation[0], this.lightLocation[1], this.lightLocation[2] );
        this.camera.setUp( this.upDir[0], this.upDir[1], this.upDir[2] );
        this.camera.setLookAt( this.lookAt[0], this.lookAt[1], this.lookAt[2] );
    }
};

GLightBasedCamCtrl.prototype.setUp = function( x, y, z )
{
    this.upDir[0] = x; this.upDir[1] = y; this.upDir[2] = z;
};

GLightBasedCamCtrl.prototype.setLookAtDir = function( x, y, z )
{
    this.lookAtDir[0] = x; this.lookAtDir[1] = y; this.lookAtDir[2] = z;
};

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

GRenderPassClearCmd.prototype.run = function( scene )
{
    var gl = this.gl;
    this.frameBuffer.bindBuffer(); 
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT ); 
    this.frameBuffer.unbindBuffer();
};

/**
 * @constructor
 */
function GGeometryRenderPassCmd( gl, program, frameBuffer )
{
    this.gl = gl;
    this.shaderProgram = program;
    this.frameBuffer = frameBuffer;
}

GGeometryRenderPassCmd.prototype.run = function( scene )
{
    var gl = this.gl; 
    gl.enable( this.gl.DEPTH_TEST );
    
    this.shaderProgram.activate();
    this.frameBuffer.bindBuffer();
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    scene.draw( this.shaderProgram );
    
    this.frameBuffer.unbindBuffer();
    this.shaderProgram.deactivate();
};

/**
 * @constructor
 */
function GCustomCamGeometryRenderPassCmd( gl, program, frameBuffer, cameraController )
{
    this.gl = gl;
    this.shaderProgram = program;
    this.frameBuffer = frameBuffer;
    this.customCameraController = cameraController;
}

GCustomCamGeometryRenderPassCmd.prototype.run = function( scene )
{
    var gl = this.gl; 
    gl.enable( this.gl.DEPTH_TEST );
    
    this.shaderProgram.activate();
    this.frameBuffer.bindBuffer();
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    scene.drawThroughCamera( this.customCameraController.getCamera(), this.shaderProgram );
    
    this.frameBuffer.unbindBuffer();
    this.shaderProgram.deactivate();
};



/**
 * @constructor
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

GPostEffectRenderPassCmd.prototype.setHRec = function( x, y, w, h, r )
{
    mat3.identity( this.hMatrix);
	mat3.translate( this.hMatrix, this.hMatrix, [x, y] );
	mat3.scale( this.hMatrix,this.hMatrix, [w, h] ); 
	mat3.rotate( this.hMatrix,this.hMatrix, r );
};

GPostEffectRenderPassCmd.prototype.addInputFrameBuffer = function( frameBuffer )
{
    this.addInputTexture( frameBuffer.getGTexture() );
};

GPostEffectRenderPassCmd.prototype.addInputTexture = function( texture )
{
    this.textureList.push( {gTexture:texture, glTextureTarget:this.nextTextureInput++} );
};

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
    
    if ( null != shader.uniforms.mapShadow )
    {
        gl.uniform1i( shader.uniforms.mapShadow, mapIdx++ );
    }
    
    if ( null != shader.uniforms.mapPing )
    {
        gl.uniform1i( shader.uniforms.mapPing, mapIdx++ );
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
    
    GRenderPassCmd_sceneMvMatrix = mat4.create();
    GRenderPassCmd_lMvMatrix = mat4.create();
    GRenderPassCmd_lPMatrix = mat4.create();
    GRenderPassCmd_uniformMatrix = mat4.create();
    
    this.sendShadowMatrix = ( undefined == this.shaderProgram.uniforms.shadowMatrix ||
                              undefined == lightCamera  )?function(){}:function()
    {
        var camera = this.lightCamera;
    
        var gCamera = scene.getCamera();
        gCamera.updateMatrices();
        
        mat4.identity(GRenderPassCmd_uniformMatrix);
        
        gCamera.getMvMatrix( GRenderPassCmd_sceneMvMatrix );
        camera.getMvMatrix( GRenderPassCmd_lMvMatrix );
        camera.getPMatrix( GRenderPassCmd_lPMatrix );
        
        mat4.invert( GRenderPassCmd_sceneMvMatrix, GRenderPassCmd_sceneMvMatrix );
        
        mat4.multiply( GRenderPassCmd_uniformMatrix, GRenderPassCmd_uniformMatrix, GRenderPassCmd_lPMatrix );
        mat4.multiply( GRenderPassCmd_uniformMatrix, GRenderPassCmd_uniformMatrix, GRenderPassCmd_lMvMatrix );
        mat4.multiply( GRenderPassCmd_uniformMatrix, GRenderPassCmd_uniformMatrix, GRenderPassCmd_sceneMvMatrix );
    
        this.gl.uniformMatrix4fv( this.shaderProgram.uniforms.shadowMatrix, false, GRenderPassCmd_uniformMatrix );
    };
}

var GRenderPassCmd_sceneMvMatrix;
var GRenderPassCmd_lMvMatrix;
var GRenderPassCmd_lPMatrix;
var GRenderPassCmd_uniformMatrix;

GPostEffectLitRenderPassCmd.prototype.setHRec = 
    GPostEffectRenderPassCmd.prototype.setHRec;
GPostEffectLitRenderPassCmd.prototype.addInputFrameBuffer = 
    GPostEffectRenderPassCmd.prototype.addInputFrameBuffer;
GPostEffectLitRenderPassCmd.prototype.addInputTexture = 
    GPostEffectRenderPassCmd.prototype.addInputTexture;
GPostEffectLitRenderPassCmd.prototype.drawScreenBuffer = 
    GPostEffectRenderPassCmd.prototype.drawScreenBuffer;

GPostEffectLitRenderPassCmd.prototype.run = function( scene )
{ 
    this.shaderProgram.activate();
    this.frameBuffer.bindBuffer();
    
    var texCount = this.textureList.length;
    
    for (var i = 0; i < texCount; ++i)
    {
        this.textureList[i].gTexture.draw( this.textureList[i].glTextureTarget, null, null );
    }
    
  
    
    scene.drawLights( this.shaderProgram );
 
    this.sendShadowMatrix();
    
    
    this.gl.disable( this.gl.DEPTH_TEST );
    this.drawScreenBuffer(this.shaderProgram);
    
    this.frameBuffer.unbindBuffer();
    this.shaderProgram.deactivate();
};


