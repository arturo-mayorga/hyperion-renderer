/** 
 * @constructor
 * @implements {GRenderStrategy}
 */
function GRenderDeferredStrategy( gl )
{
    this.gl = gl;
    this.configure();
    
}

/**
 * Configures the strategy and starts the download process for the shader source
 */
GRenderDeferredStrategy.prototype.configure = function()
{
    // this map variable is to keep the closure compiler from getting confused.
    var map = this.shaderSrcMap = 
    {
        "blur-vs.c":undefined,
        "blur-fs.c":undefined,
        "fullscr-vs.c":undefined,
        "fullscr-fs.c":undefined,
        "shadowmap-vs.c":undefined,
        "shadowmap-fs.c":undefined,
        "ssao-vs.c":undefined,
        "ssao-fs.c":undefined,
        "colorspec-vs.c":undefined,
        "colorspec-fs.c":undefined,
        "normaldepth-fs.c":undefined,
        "normaldepth-vs.c":undefined,
        "position-fs.c":undefined,
        "position-vs.c":undefined,
        "light-fs.c":undefined,
        "light-vs.c":undefined
    };
    
    for (var key in map)
    {
        this.loadShader(key);
    }
};

/**
 * Free and reload all the resource for this strategy
 */
GRenderDeferredStrategy.prototype.reload = function()
{
    this._isReady = false;
    
    for ( var key in this.programs )
    {
        this.programs[key].destroy();
        this.programs[key] = undefined;
    }
    
    this.configure();
};

/**
 * Start the download process for the requested shader
 * @param {string} source name of the shader that needs to be loaded
 */
GRenderDeferredStrategy.prototype.loadShader = function( srcName )
{
    var client = new XMLHttpRequest();
    var _this = this;
    client.open('GET', "assets/shaders/" + srcName);
    client.onreadystatechange = function() 
    {
        if ( client.readyState == 4 )
        {
            _this.shaderSrcMap[srcName] = client.responseText; 
            _this.checkShaderDependencies();
        }
    }
    client.send();
};

/**
 * Checks if all the shader code has been downloaded from the web server
 * and if so it starts the initilization process
 */
GRenderDeferredStrategy.prototype.checkShaderDependencies = function()
{
    for (var key in this.shaderSrcMap)
    {
        if (this.shaderSrcMap[key] == undefined)
        {
            return;
        }
    }
    
    this.initialize();
};

/**
 * Initialize this render strategy
 */
GRenderDeferredStrategy.prototype.initialize = function()
{   
    this.initTextureFramebuffer();
    this.initScreenVBOs();
    this.initShaders();
    this.initPassCmds();
    
    this._isReady = true;
};

/**
 * Returns true if this strategy has loaded all required resource (shaders)
 * and is ready for use
 * @return {boolean}
 */
GRenderDeferredStrategy.prototype.isReady = function()
{
    return true == this._isReady;
};

/**
 * Create the screen VBOs for drawing the screen
 */
GRenderDeferredStrategy.prototype.initScreenVBOs = function()
{
    var gl = this.gl;
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    
    
    var screenVertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, screenVertBuffer);
    
    gl.bufferData(gl.ARRAY_BUFFER,
                  new Float32Array([-1,-1,1,
                                    1,-1,1,
                                    1,1,1,
                                    -1,1,1]),
                  gl.STATIC_DRAW);
    
    screenVertBuffer.itemSize = 3;
    screenVertBuffer.numItems = 4;
    
    var screenTextBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, screenTextBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 
                  new Float32Array([0,0,  
                                    1,0,  
                                    1,1,  
                                    0,1]), 
                  gl.STATIC_DRAW);
    screenTextBuffer.itemSize = 2;
    screenTextBuffer.numItems = 4;
    
    var screenIndxBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, screenIndxBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, 
                  new Uint16Array([0, 1, 2, 2, 3, 0]),
                  gl.STATIC_DRAW);
    screenIndxBuffer.itemSize = 1;
    screenIndxBuffer.numItems = 6;
    
    this.screen = {};
    
    this.screen.vertBuffer = screenVertBuffer;
    this.screen.textBuffer = screenTextBuffer;
    this.screen.indxBuffer = screenIndxBuffer;
    
	
	this.hMatrix = mat3.create();
};

/**
 * Helper function to compile the shaders after all the source has been
 * downloaded
 */
GRenderDeferredStrategy.prototype.initShaders = function () 
{
    var shaderSrcMap = this.shaderSrcMap;
    var gl = this.gl;
    this.programs = {};
  
    this.programs.fullScr     = new GShader( shaderSrcMap["fullscr-vs.c"],     shaderSrcMap["fullscr-fs.c"]     );
    this.programs.shadowmap   = new GShader( shaderSrcMap["shadowmap-vs.c"],   shaderSrcMap["shadowmap-fs.c"]   );
    this.programs.ssao        = new GShader( shaderSrcMap["ssao-vs.c"],        shaderSrcMap["ssao-fs.c"]        );
    this.programs.blur        = new GShader( shaderSrcMap["blur-vs.c"],        shaderSrcMap["blur-fs.c"]        );
    this.programs.colorspec   = new GShader( shaderSrcMap["colorspec-vs.c"],   shaderSrcMap["colorspec-fs.c"]   );
    this.programs.normaldepth = new GShader( shaderSrcMap["normaldepth-vs.c"], shaderSrcMap["normaldepth-fs.c"] );
    this.programs.position    = new GShader( shaderSrcMap["position-vs.c"],    shaderSrcMap["position-fs.c"]    );
    this.programs.light       = new GShader( shaderSrcMap["light-vs.c"],       shaderSrcMap["light-fs.c"]       );

    for ( var key in this.programs )
    {
        this.programs[key].bindToContext(gl);
    }
};

/**
 * Draw the screen buffer using the provided shader
 * @param {GShader} Shader to use for drawing the screen buffer
 */
GRenderDeferredStrategy.prototype.drawScreenBuffer = function( shader )
{
    var gl = this.gl;
    
    if ( null != shader.uniforms.mapKd)
    {
        gl.uniform1i(shader.uniforms.mapKd, 0);
    }
 
    if ( null != shader.uniforms.mapNormal )
    {
        gl.uniform1i(shader.uniforms.mapNormal, 1);
    }
  
    if ( null != shader.uniforms.mapPosition )
    {
        gl.uniform1i(shader.uniforms.mapPosition, 2);
    }
    
    if ( null != shader.uniforms.Kd )
    {
        gl.uniform4fv(shader.uniforms.Kd, [1, 1, 1, 1]);
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.screen.vertBuffer);
    gl.vertexAttribPointer(shader.attributes.positionVertexAttribute, 
                           this.screen.vertBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.screen.textBuffer);
    gl.vertexAttribPointer(shader.attributes.textureVertexAttribute, 
                           this.screen.textBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.screen.indxBuffer);
	
	if ( null != shader.uniforms.hMatrixUniform )
    {
        gl.uniformMatrix3fv(shader.uniforms.hMatrixUniform, false, this.hMatrix);
    }
	
    gl.drawElements(gl.TRIANGLES, this.screen.indxBuffer.numItems, gl.UNSIGNED_SHORT, 0);
};

/**
 * Create the pass command pipeline
 */
GRenderDeferredStrategy.prototype.initPassCmds = function()
{
    this.passes = {};
    var gl = this.gl;
    
    this.lightCamControlers = {};
    
    var colorPass = new GGeometryRenderPassCmd( this.gl, this.programs.colorspec, this.frameBuffers.color );
    var normalPass = new GGeometryRenderPassCmd( this.gl, this.programs.normaldepth, this.frameBuffers.normal );
    var positionPass = new GGeometryRenderPassCmd( this.gl, this.programs.position, this.frameBuffers.position );
    var clearPhongLightPong = new GRenderPassClearCmd( this.gl, this.frameBuffers.phongLightPong );
    
    var clearShadowmapPong = new GRenderPassClearCmd( this.gl, this.frameBuffers.shadowmapPong );
    
    
    var leftCtrl = new GLightBasedCamCtrl(); leftCtrl.bindToContext( this.gl ); 
    leftCtrl.setUp( 0, 1, 0 ); leftCtrl.setLookAtDir( -1, 0, 0 );
    this.lightCamControlers.left = leftCtrl;
    var normalLSource = new GCustomCamGeometryRenderPassCmd( this.gl, this.programs.normaldepth, this.frameBuffers.lightNormal, leftCtrl );
    var shadowmapPassL = new GPostEffectLitRenderPassCmd( this.gl, this.programs.shadowmap, this.frameBuffers.shadowmapPing, this.screen, leftCtrl.getCamera() );
    shadowmapPassL.addInputTexture( this.frameBuffers.position.getGTexture(),      gl.TEXTURE0 );
    shadowmapPassL.addInputTexture( this.frameBuffers.lightNormal.getGTexture(),   gl.TEXTURE1 );
    shadowmapPassL.addInputTexture( this.frameBuffers.shadowmapPong.getGTexture(), gl.TEXTURE2 );
    
    
    var rightCtrl = new GLightBasedCamCtrl(); rightCtrl.bindToContext( this.gl );
    rightCtrl.setUp( 0, 1, 0 ); rightCtrl.setLookAtDir( 1, 0, 0 );
    this.lightCamControlers.right = rightCtrl;
    var normalRSource = new GCustomCamGeometryRenderPassCmd( this.gl, this.programs.normaldepth, this.frameBuffers.lightNormal, rightCtrl );
  
    var shadowmapPassR = new GPostEffectLitRenderPassCmd( this.gl, this.programs.shadowmap, this.frameBuffers.shadowmapPong, this.screen, rightCtrl.getCamera() );
    shadowmapPassR.addInputTexture( this.frameBuffers.position.getGTexture(),    gl.TEXTURE0 );
    shadowmapPassR.addInputTexture( this.frameBuffers.lightNormal.getGTexture(), gl.TEXTURE1 );
    shadowmapPassR.addInputTexture( this.frameBuffers.shadowmapPing.getGTexture(),   gl.TEXTURE2 );
   
    
    ////
    
    var frontCtrl = new GLightBasedCamCtrl(); frontCtrl.bindToContext( this.gl );
    frontCtrl.setUp( 0, 1, 0 ); frontCtrl.setLookAtDir( 0, 0, 1 );
    this.lightCamControlers.front = frontCtrl;
    var normalFSource = new GCustomCamGeometryRenderPassCmd( this.gl, this.programs.normaldepth, this.frameBuffers.lightNormal, frontCtrl );
    var shadowmapPassF = new GPostEffectLitRenderPassCmd( this.gl, this.programs.shadowmap, this.frameBuffers.shadowmapPing, this.screen, frontCtrl.getCamera() );
    shadowmapPassF.addInputTexture( this.frameBuffers.position.getGTexture(),      gl.TEXTURE0 );
    shadowmapPassF.addInputTexture( this.frameBuffers.lightNormal.getGTexture(),   gl.TEXTURE1 );
    shadowmapPassF.addInputTexture( this.frameBuffers.shadowmapPong.getGTexture(), gl.TEXTURE2 );
 
    
    var backCtrl = new GLightBasedCamCtrl(); backCtrl.bindToContext( this.gl );
    backCtrl.setUp( 0, 1, 0 ); backCtrl.setLookAtDir( 0, 0, -1 );
    this.lightCamControlers.back = backCtrl;
    var normalBSource = new GCustomCamGeometryRenderPassCmd( this.gl, this.programs.normaldepth, this.frameBuffers.lightNormal, backCtrl );
    var shadowmapPassB = new GPostEffectLitRenderPassCmd( this.gl, this.programs.shadowmap, this.frameBuffers.shadowmapPong, this.screen, backCtrl.getCamera() );
    shadowmapPassB.addInputTexture( this.frameBuffers.position.getGTexture(),    gl.TEXTURE0 );
    shadowmapPassB.addInputTexture( this.frameBuffers.lightNormal.getGTexture(), gl.TEXTURE1 );
    shadowmapPassB.addInputTexture( this.frameBuffers.shadowmapPing.getGTexture(),   gl.TEXTURE2 );
   
    
    ////
    
    var upCtrl = new GLightBasedCamCtrl(); upCtrl.bindToContext( this.gl );
    upCtrl.setUp( 1, 0, 0 ); upCtrl.setLookAtDir( 0, 1, 0 );
    this.lightCamControlers.up = upCtrl;
    var normalUSource = new GCustomCamGeometryRenderPassCmd( this.gl, this.programs.normaldepth, this.frameBuffers.lightNormal, upCtrl );
    var shadowmapPassU = new GPostEffectLitRenderPassCmd( this.gl, this.programs.shadowmap, this.frameBuffers.shadowmapPing, this.screen, upCtrl.getCamera() );
    shadowmapPassU.addInputTexture( this.frameBuffers.position.getGTexture(),       gl.TEXTURE0 );
    shadowmapPassU.addInputTexture( this.frameBuffers.lightNormal.getGTexture(),    gl.TEXTURE1 );
    shadowmapPassU.addInputTexture( this.frameBuffers.shadowmapPong.getGTexture(),  gl.TEXTURE2 );
   
    
    var downCtrl = new GLightBasedCamCtrl(); downCtrl.bindToContext( this.gl );
    downCtrl.setUp( 1, 0, 0 ); downCtrl.setLookAtDir( 0, -1, 0 );
    this.lightCamControlers.down = downCtrl;
    var normalDSource = new GCustomCamGeometryRenderPassCmd( this.gl, this.programs.normaldepth, this.frameBuffers.lightNormal, downCtrl ); 
    var shadowmapPassD = new GPostEffectLitRenderPassCmd( this.gl, this.programs.shadowmap, this.frameBuffers.shadowmapPong, this.screen, downCtrl.getCamera() );
    shadowmapPassD.addInputTexture( this.frameBuffers.position.getGTexture(),    gl.TEXTURE0 );
    shadowmapPassD.addInputTexture( this.frameBuffers.lightNormal.getGTexture(), gl.TEXTURE1 );
    shadowmapPassD.addInputTexture( this.frameBuffers.shadowmapPing.getGTexture(),   gl.TEXTURE2 );
    
    var clearShadowmap = new GRenderPassClearCmd(this.gl, this.frameBuffers.shadowmapPing );
    
    var shadowBlurPing = new GPostEffectRenderPassCmd( this.gl, this.programs.blur, this.frameBuffers.shadowmapPing, this.screen );
    shadowBlurPing.setHRec( 0, 0, 1, 1, 3.14159/2 );
    shadowBlurPing.addInputFrameBuffer( this.frameBuffers.shadowmapPong, gl.TEXTURE0 );
   
    var shadowBlurPong = new GPostEffectRenderPassCmd( this.gl, this.programs.blur, this.frameBuffers.shadowmapPong, this.screen );
    shadowBlurPong.setHRec( 0, 0, 1, 1, -3.14159/2 );
    shadowBlurPong.addInputFrameBuffer( this.frameBuffers.shadowmapPing, gl.TEXTURE0 );
    
    var phongLightPassPing = new GPostEffectLitRenderPassCmd( this.gl, this.programs.light, this.frameBuffers.phongLightPing, this.screen );
    phongLightPassPing.addInputTexture( this.frameBuffers.normal.getGTexture(),        gl.TEXTURE0 );
    phongLightPassPing.addInputTexture( this.frameBuffers.position.getGTexture(),      gl.TEXTURE1 );
    phongLightPassPing.addInputTexture( this.frameBuffers.shadowmapPong.getGTexture(), gl.TEXTURE2 );
    phongLightPassPing.addInputTexture( this.frameBuffers.phongLightPong.getGTexture(),gl.TEXTURE3 );
    
    var phongLightPassPong = new GPostEffectLitRenderPassCmd( this.gl, this.programs.light, this.frameBuffers.phongLightPong, this.screen );
    phongLightPassPong.addInputTexture( this.frameBuffers.normal.getGTexture(),        gl.TEXTURE0 );
    phongLightPassPong.addInputTexture( this.frameBuffers.position.getGTexture(),      gl.TEXTURE1 );
    phongLightPassPong.addInputTexture( this.frameBuffers.shadowmapPong.getGTexture(), gl.TEXTURE2 );
    phongLightPassPong.addInputTexture( this.frameBuffers.phongLightPing.getGTexture(),gl.TEXTURE3 );
    
    
    var cmds = [];
    
    var preCmds = [];
    var shadowCmds = [];
    
    var lightCmds = [];
    
    preCmds.push( normalPass );
    preCmds.push( positionPass );
    preCmds.push( colorPass );
    preCmds.push( clearPhongLightPong );
    
    shadowCmds.push( clearShadowmapPong );
    
    shadowCmds.push( normalLSource );
    shadowCmds.push( shadowmapPassL );
    shadowCmds.push( normalRSource );
    shadowCmds.push( shadowmapPassR );
    
    shadowCmds.push( normalFSource );
    shadowCmds.push( shadowmapPassF );
    shadowCmds.push( normalBSource );
    shadowCmds.push( shadowmapPassB );
    
    shadowCmds.push( normalUSource );
    shadowCmds.push( shadowmapPassU );
    shadowCmds.push( normalDSource );
    shadowCmds.push( shadowmapPassD );
    
    shadowCmds.push( clearShadowmap );
    shadowCmds.push( shadowBlurPing );
    shadowCmds.push( shadowBlurPong );
    
    lightCmds.push( phongLightPassPing );
    lightCmds.push( phongLightPassPong );
     
    this.preCmds = preCmds;
    this.shadowCmds = shadowCmds;
    
    this.lightCmds = lightCmds;
};

/**
 * Draw the scene and hud elements using this strategy
 * @param {GScene} Scene to draw with this strategy
 * @param {GHudController} Hud to draw with this strategy
 */
GRenderDeferredStrategy.prototype.draw = function ( scene, hud )
{
    var gl = this.gl;
    gl.disable(gl.BLEND);
    var lCount = scene.getLights().length;
    
    for ( var i in this.preCmds )
    {
        this.preCmds[i].run( scene );
    }
    
    for ( var lIdx = 0; lIdx < lCount; ++lIdx )
    {
        scene.setActiveLightIndex( lIdx );
        
        for ( var key in this.lightCamControlers )
        {
            this.lightCamControlers[key].update( scene );
        }
        
        for ( var i in this.shadowCmds )
        {
            this.shadowCmds[i].run( scene );
        }
        
        this.lightCmds[lIdx%2].run( scene );
    }
    
    // HUD
    this.gl.disable( this.gl.DEPTH_TEST );
    this.programs.fullScr.activate(); 
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    
	if ( lCount % 2 )
	{
	    this.frameBuffers.phongLightPing.bindTexture(gl.TEXTURE0, "color");
	}
	else
	{
	    this.frameBuffers.phongLightPong.bindTexture(gl.TEXTURE0, "color");
    }
    this.setHRec(0, 0, 1, 1);
    this.drawScreenBuffer(this.programs.fullScr); 
    
    /*this.frameBuffers.prePass.bindTexture(gl.TEXTURE0, "depthRGBTexture");
    this.setHRec(-0.125+0.75, 0.125-0.75, 0.125, 0.125);
    this.drawScreenBuffer(this.fullScreenProgram);*/
    
    /*this.frameBuffers.phongLightPing.bindTexture(gl.TEXTURE0, "color");
    this.setHRec(0.125+0.75, 0.125-0.75, 0.125, 0.125);
    this.drawScreenBuffer(this.programs.fullScr); */
    /*this.frameBuffers.phongLightPong.bindTexture(gl.TEXTURE0, "color");  
    this.setHRec(-0.125+0.75, -0.125-0.75, 0.125, 0.125);
    this.drawScreenBuffer(this.programs.fullScr); */
    /*this.frameBuffers.position.bindTexture(gl.TEXTURE0, "color");
    this.setHRec(0.125+0.75, -0.125-0.75, 0.125, 0.125);
    this.drawScreenBuffer(this.programs.fullScr);*/
    
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
       	
    if (hud != undefined)
    {
        hud.draw(this.programs.fullScr);
    }
    this.programs.fullScr.deactivate();
};

/**
 * Set the transformation parameters for rendering full screen
 * @param {number} X component of the rectangle representing the center of the rectangle
 * @param {number} Y component of the rectangle representing the center of the rectangle
 * @param {number} Width component of the rectangle in screen percentage
 * @param {number} Height component of the rectangle in screen percentage
 */
GRenderDeferredStrategy.prototype.setHRec = function( x, y, width, height )
{
	// the values passed in are meant to be between 0 and 1
	// currently there are no plans to add debug assertions
    mat3.identity(this.hMatrix);
	mat3.translate(this.hMatrix, this.hMatrix, [x, y]);
	mat3.scale(this.hMatrix,this.hMatrix, [width, height]);  
};

/**
 * Init the frame buffers and it's textures
 */
GRenderDeferredStrategy.prototype.initTextureFramebuffer = function()
{
    var gl = this.gl;
    

    var tf = gl.getExtension("OES_texture_float");
    var tfl = null;//gl.getExtension("OES_texture_float_linear"); // turning this off for now... its running better and no image difference
    var dt = gl.getExtension("WEBGL_depth_texture");
    
    var floatTexFilter = (tfl != null)?gl.LINEAR:gl.NEAREST;
    
    var texCfg = 
    {
        filter: gl.LINEAR,
        format: gl.RGBA,
        type: gl.UNSIGNED_BYTE,
        attachment: gl.COLOR_ATTACHMENT0,
        name: "color"
    };
    
    var texCfgFloat = 
    {
        filter: floatTexFilter,
        format: gl.RGBA,
        type: gl.FLOAT,
        attachment: gl.COLOR_ATTACHMENT0,
        name: "color"
    };
    
   
    
    var frameBuffer = new GFrameBuffer({ gl: this.gl, width: 256, height: 256 });
    frameBuffer.addBufferTexture(texCfg);
    frameBuffer.complete();
   
    this.frameBuffers = 
    {
        ssao: frameBuffer
    };
    
    frameBuffer = new GFrameBuffer({ gl: this.gl, width: 1024, height: 1024 });
    frameBuffer.addBufferTexture(texCfg);
    frameBuffer.complete();
    this.frameBuffers.color = frameBuffer;
    
    frameBuffer = new GFrameBuffer({ gl: this.gl, width: 1024, height: 1024 });
    frameBuffer.addBufferTexture(texCfgFloat);
    frameBuffer.complete();
    this.frameBuffers.normal = frameBuffer;
    
    frameBuffer = new GFrameBuffer({ gl: this.gl, width: 1024, height: 1024 });
    frameBuffer.addBufferTexture(texCfgFloat);
    frameBuffer.complete();
    this.frameBuffers.position = frameBuffer;
    
    frameBuffer = new GFrameBuffer({ gl: this.gl, width: 512, height: 512 });
    frameBuffer.addBufferTexture(texCfgFloat);
    frameBuffer.complete();
    this.frameBuffers.lightNormal = frameBuffer;
    
    frameBuffer = new GFrameBuffer({ gl: this.gl, width: 256, height: 256 });
    frameBuffer.addBufferTexture(texCfg);
    frameBuffer.complete();
    this.frameBuffers.shadowmapPing = frameBuffer;
    
    frameBuffer = new GFrameBuffer({ gl: this.gl, width: 256, height: 256 });
    frameBuffer.addBufferTexture(texCfg);
    frameBuffer.complete();
    this.frameBuffers.shadowmapPong = frameBuffer;
    
    frameBuffer = new GFrameBuffer({ gl: this.gl, width: 1024, height: 1024 });
    frameBuffer.addBufferTexture(texCfgFloat);
    frameBuffer.complete();
    this.frameBuffers.phongLightPing = frameBuffer;
    
    frameBuffer = new GFrameBuffer({ gl: this.gl, width: 1024, height: 1024 });
    frameBuffer.addBufferTexture(texCfgFloat);
    frameBuffer.complete();
    this.frameBuffers.phongLightPong = frameBuffer;
};



