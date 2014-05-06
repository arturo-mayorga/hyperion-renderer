var GRENDERPASSCMD_SCENE_DRAW_MODE = 
{
    DEFAULT       : 0,
    LIGHTS_ONLY   : 1,
    NO_GEOMETRY   : 2,
    CUSTOM_CAMERA : 3
};

var GRENDERPASSCMD_DEPTH_TEST_SWITCH = 
{
    NO_CHANGE : 0,
    ENABLE    : 1,
    DISABLE   : 2
};

/**
 * @interface
 */
function GRenderPassCmdCameraController() {}
GRenderPassCmdCameraController.prototype.getCamera = function() {};
GRenderPassCmdCameraController.prototype.bindToContext = function( gl ) {};

/**
 * @implements {GRenderPassCmdCameraController}
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
        
        tempGlobalLightCamera = this.camera;
    }
};

var tempGlobalLightCamera;

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
function GRenderPassCmd()
{
    this.hMatrix = mat3.create();
    this.sceneDrawMode = GRENDERPASSCMD_SCENE_DRAW_MODE.DEFAULT;
    this.depthTestSwitch = GRENDERPASSCMD_DEPTH_TEST_SWITCH.NO_CHANGE;
}

GRenderPassCmd.prototype.setSceneDrawMode = function( drawMode )
{
    this.sceneDrawMode = drawMode;
};

GRenderPassCmd.prototype.checkValid = function()
{
    if ( undefined == this.shaderProgram ||
         undefined == this.frameBuffer ||
         undefined == this.gl )
    {
        return false;
    }
    
    return true;
};

GRenderPassCmd.prototype.bindToContext = function ( gl )
{
    this.gl = gl;
};

GRenderPassCmd.prototype.setProgram = function( program )
{
    this.shaderProgram = program;
};

GRenderPassCmd.prototype.setFrameBuffer = function( frameBuffer )
{
    this.frameBuffer = frameBuffer;
};

GRenderPassCmd.prototype.setScreenGeometry = function( screenG )
{
    this.screen = screenG;
};

GRenderPassCmd.prototype.setHRec = function( x, y, w, h )
{
    this.hRec = { x:x, y:y, w:w, h:h };
};

GRenderPassCmd.prototype.setDepthTestSwitch = function( testSwitch )
{
    this.depthTestSwitch = testSwitch;
};

GRenderPassCmd.prototype.processDepthTestSwitch = function()
{    
    switch ( this.depthTestSwitch )
    {
        case GRENDERPASSCMD_DEPTH_TEST_SWITCH.NO_CHANGE:
            break;
        case GRENDERPASSCMD_DEPTH_TEST_SWITCH.ENABLE:
            this.gl.enable( this.gl.DEPTH_TEST );
            break;
        case GRENDERPASSCMD_DEPTH_TEST_SWITCH.DISABLE:
            this.gl.disable( this.gl.DEPTH_TEST );
            break;
    }
};
 
GRenderPassCmd.prototype.run = function( scene )
{
    this.runDependencies( scene );
    this.processDepthTestSwitch();
    
    this.shaderProgram.activate();
    this.frameBuffer.bindBuffer();
    
    this.drawGeometry( scene );
    
    this.bindTextures();
    this.drawScreenBuffer(this.shaderProgram);
    
    this.frameBuffer.unbindBuffer();
    this.shaderProgram.deactivate();
};

GRenderPassCmd.prototype.bindTextures = function()
{
    if ( undefined == this.textureList ) return;
    
    var texCount = this.textureList.length;
    
    for (var i = 0; i < texCount; ++i)
    {
        this.textureList[i].gTexture.draw( this.textureList[i].glTextureTarget, null, null );
    }
};

GRenderPassCmd.prototype.drawScreenBuffer = function(shader)
{
    if ( undefined == this.hRec ||
         undefined == this.screen )
    {
        return;
    }
    
    var gl = this.gl;
    
    mat3.identity( this.hMatrix);
	mat3.translate( this.hMatrix, this.hMatrix, [this.hRec.x, this.hRec.y] );
	mat3.scale( this.hMatrix,this.hMatrix, [this.hRec.w, this.hRec.h] ); 
    
    if ( null != shader.uniforms.mapKd )
    {
        gl.uniform1i( shader.uniforms.mapKd, 0 );
    }
 
    if ( null != shader.uniforms.mapNormal )
    {
        gl.uniform1i( shader.uniforms.mapNormal, 1 );
    }
  
    if ( null != shader.uniforms.mapPosition )
    {
        gl.uniform1i( shader.uniforms.mapPosition, 2 );
    }
    
    if ( null != shader.uniforms.mapShadow )
    {
        gl.uniform1i( shader.uniforms.mapShadow, 3 );
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

GRenderPassCmd.prototype.addInputTexture = function( gTexture, glTextureTarget )
{
    if ( undefined == this.textureList )
    {
        this.textureList = [];
    }
    
    this.textureList.push( {gTexture:gTexture, glTextureTarget:glTextureTarget} );
};

GRenderPassCmd.prototype.addDependency = function( dependencyPass )
{
    if ( undefined == this.dependencyPasses )
    {
        this.dependencyPasses = [];
    }
    
    this.dependencyPasses.push( dependencyPass );
};

GRenderPassCmd.prototype.runDependencies = function( scene )
{
    if ( undefined != this.dependencyPasses )
    {
        var dependencyLen = this.dependencyPasses.length;
        
        for ( var i = 0; i < dependencyLen; ++i )
        {
            this.dependencyPasses[i].run( scene );
        }
    }
};

GRenderPassCmd.prototype.drawGeometry = function( scene )
{
    if ( undefined == scene ) return;
    
    var gl = this.gl;
    
    switch ( this.sceneDrawMode )
    {
        case GRENDERPASSCMD_SCENE_DRAW_MODE.CUSTOM_CAMERA:
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            scene.drawThroughCamera( this.getCustomCamera(), this.shaderProgram );
            break;
        case GRENDERPASSCMD_SCENE_DRAW_MODE.DEFAULT:
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            scene.draw( this.shaderProgram );
            break;
        case GRENDERPASSCMD_SCENE_DRAW_MODE.LIGHTS_ONLY:
        {
            scene.drawLights( this.shaderProgram );
            var light = scene.getLights()[0];
            var lightLocation = vec3.fromValues( 0, 0, 0 );
            var lookAtDir     = vec3.fromValues( 0, -1, 0 );
            var lookAt        = vec3.fromValues( 0, 0, 1 )
            var upDir         = vec3.fromValues( 1, 0, 0 );
    
            if ( undefined != light )
            {
                
                light.getPosition( lightLocation );
                vec3.add( lookAt, lightLocation, lookAtDir );
                
                var camera = new GCamera();
                camera.setEye( lightLocation[0], lightLocation[1], lightLocation[2] );
                camera.setUp( upDir[0], upDir[1], upDir[2] );
                camera.setLookAt( lookAt[0], lookAt[1], lookAt[2] );
                camera.setFovy( (3.14159/2) * 1 );
                camera.setAspect( 1 );
                camera.updateMatrices();
                
                
               // camera = tempGlobalLightCamera;
                
                
                var gCamera = scene.getCamera();
                gCamera.updateMatrices();
                
                var sceneMvMatrix = mat4.create();
                var lMvMatrix = mat4.create();
                var lPMatrix = mat4.create();
                var uniformMatrix = mat4.create();
                
                gCamera.getMvMatrix( sceneMvMatrix );
                camera.getMvMatrix( lMvMatrix );
                camera.getPMatrix( lPMatrix );
                
                mat4.invert( sceneMvMatrix, sceneMvMatrix );
				
				//mat4.multiply( uniformMatrix, uniformMatrix, lPMatrix );
				mat4.multiply( uniformMatrix, uniformMatrix, lMvMatrix );
				mat4.multiply( uniformMatrix, uniformMatrix, sceneMvMatrix );
                
                if ( undefined != this.shaderProgram.uniforms.shadowMatrix )
                {
                    gl.uniformMatrix4fv( this.shaderProgram.uniforms.shadowMatrix, false, uniformMatrix );
                }
                
                if ( undefined != this.shaderProgram.uniforms.pMatrixUniform )
                {
                    gl.uniformMatrix4fv( this.shaderProgram.uniforms.pMatrixUniform, false, lPMatrix );
                }
            }
    
            break;
        }
        case GRENDERPASSCMD_SCENE_DRAW_MODE.NO_GEOMETRY:
            break;
    }
};

/**
 * {GRenderPassCmdCameraController}
 */
GRenderPassCmd.prototype.setCustomCameraController = function( cameraController )
{
    this.customCameraController = cameraController;
};

GRenderPassCmd.prototype.getCustomCamera = function()
{
    return this.customCameraController.getCamera();
};

GRenderPassCmd.prototype.drawFullScreen = function()
{
    this.setHRec( 0, 0, 1, 1 );
    this.drawScreenBuffer( this.shaderProgram );
};


