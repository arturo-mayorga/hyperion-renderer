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
 * @implements {GRenderStrategy}
 */
function GRenderDeferredStrategy( gl )
{
    this.gl = gl;
    this.configure();
    
    this.extensions = {};
    this.extensions.stdDeriv = gl.getExtension('OES_standard_derivatives');
    
    this.renderLevel = 0;
}

GRenderDeferredStrategy.prototype = Object.create( GRenderStrategy.prototype );

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
        "colorspec-vs.c":undefined,
        "colorspec-fs.c":undefined,
        "depth-fs.c":undefined,
        "depth-vs.c":undefined,
        "fullscr-vs.c":undefined,
        "fullscr-fs.c":undefined,
        "light-fs.c":undefined,
        "light-vs.c":undefined,
        "normaldepth-fs.c":undefined,
        "normaldepth-vs.c":undefined,
        "fxaa-vs.c":undefined,
        "fxaa-fs.c":undefined,
        "objid-fs.c":undefined,
        "objid-vs.c":undefined,
        "objidscr-fs.c":undefined,
        "objidscr-vs.c":undefined,
        "position-fs.c":undefined,
        "position-vs.c":undefined,
        "shadowmap-vs.c":undefined,
        "shadowmap-fs.c":undefined,
        "ssao-vs.c":undefined,
        "ssao-fs.c":undefined,
        "tonemap-fs.c":undefined,
        "tonemap-vs.c":undefined
    };
    
    for (var key in map)
    {
        this.loadShader(key);
    }
};

/**
 * Called to delete all the resources under this buffer
 */
GRenderDeferredStrategy.prototype.deleteResources = function()
{
    this._isReady = false;
    
    for ( var fKey in this.frameBuffers )
    {
        this.frameBuffers[fKey].deleteResources();
    }
    
    for ( var key in this.programs )
    {
        this.programs[key].destroy();
        this.programs[key] = undefined;
    }
    
    this.deleteScreenVBOs();
}

/**
 * Free and reload all the resource for this strategy
 */
GRenderDeferredStrategy.prototype.reload = function()
{
    this.deleteResources();
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
        if ( client.readyState === 4 )
        {
            var devS = (_this.extensions.stdDeriv != null)?
                    "#define HAS_OES_DERIVATIVES\n":
                    "";
                    
            _this.shaderSrcMap[srcName] = devS + client.responseText; 
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
        if (this.shaderSrcMap[key] === undefined)
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
    return true === this._isReady;
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
 * Create the screen VBOs for drawing the screen
 */
GRenderDeferredStrategy.prototype.deleteScreenVBOs = function()
{
    for ( var key in this.screen )
    {
        this.gl.deleteBuffer( this.screen[key] );
    }
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
    this.programs.light       = new GShader( shaderSrcMap["light-vs.c"],       shaderSrcMap["light-fs.c"]       );
    this.programs.toneMap     = new GShader( shaderSrcMap["tonemap-vs.c"],     shaderSrcMap["tonemap-fs.c"]     );
    this.programs.fxaa        = new GShader( shaderSrcMap["fxaa-vs.c"],        shaderSrcMap["fxaa-fs.c"]        );
    this.programs.objidscr    = new GShader( shaderSrcMap["objidscr-vs.c"],    shaderSrcMap["objidscr-fs.c"]       );
    
    this.programs.colorspec   = new ShaderComposite( shaderSrcMap["colorspec-vs.c"],   shaderSrcMap["colorspec-fs.c"]   );
    this.programs.normaldepth = new ShaderComposite( shaderSrcMap["normaldepth-vs.c"], shaderSrcMap["normaldepth-fs.c"] );
    this.programs.position    = new ShaderComposite( shaderSrcMap["position-vs.c"],    shaderSrcMap["position-fs.c"]    );
    this.programs.depth       = new ShaderComposite( shaderSrcMap["depth-vs.c"],       shaderSrcMap["depth-fs.c"]       );
    this.programs.objid       = new ShaderComposite( shaderSrcMap["objid-vs.c"],       shaderSrcMap["objid-fs.c"]       );
    

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
    var objidPass = new GGeometryRenderPassCmd( this.gl, this.programs.objid, this.frameBuffers.objid );
    var clearPhongLightPong = new GRenderPassClearCmd( this.gl, this.frameBuffers.phongLightPong );
    
    var clearShadowmap = new GRenderPassClearCmd( this.gl, this.frameBuffers.shadowmapPong );
     
    var downCtrl = new GLightBasedCamCtrl(); downCtrl.bindToContext( this.gl );
    downCtrl.setUp( 1, 0, 0 ); downCtrl.setLookAtDir( 0, -1, 0 );
    this.lightCamControlers.down = downCtrl;
    var normalSource = new GCustomCamGeometryRenderPassCmd( this.gl, this.programs.depth, this.frameBuffers.lightNormal, downCtrl ); 
    var shadowmapPass = new GPostEffectLitRenderPassCmd( this.gl, this.programs.shadowmap, this.frameBuffers.shadowmapPong, this.screen, downCtrl.getCamera() );
    shadowmapPass.addInputTexture( this.frameBuffers.position.getGTexture(),    gl.TEXTURE0 );
    shadowmapPass.addInputTexture( this.frameBuffers.lightNormal.getGTexture(), gl.TEXTURE1 );
    shadowmapPass.addInputTexture( this.gl.whiteCircleTexture, gl.TEXTURE2 );
 
    var phongLightPassPing = new GPostEffectLitRenderPassCmd( this.gl, this.programs.light, this.frameBuffers.phongLightPing, this.screen );
    phongLightPassPing.addInputTexture( this.frameBuffers.normal.getGTexture(),        gl.TEXTURE0 );
    phongLightPassPing.addInputTexture( this.frameBuffers.position.getGTexture(),      gl.TEXTURE1 );
    if ( 1 >= this.renderLevel )
    {
        phongLightPassPing.addInputTexture( this.gl.whiteTexture, gl.TEXTURE2 );
    }
    else
    {
        phongLightPassPing.addInputTexture( this.frameBuffers.shadowmapPong.getGTexture(), gl.TEXTURE2 );
    }
    phongLightPassPing.addInputTexture( this.frameBuffers.phongLightPong.getGTexture(),gl.TEXTURE3 );
    
    var phongLightPassPong = new GPostEffectLitRenderPassCmd( this.gl, this.programs.light, this.frameBuffers.phongLightPong, this.screen );
    phongLightPassPong.addInputTexture( this.frameBuffers.normal.getGTexture(),        gl.TEXTURE0 );
    phongLightPassPong.addInputTexture( this.frameBuffers.position.getGTexture(),      gl.TEXTURE1 );
    if ( 1 >= this.renderLevel )
    {
        phongLightPassPong.addInputTexture( this.gl.whiteTexture, gl.TEXTURE2 );
    }
    else
    {
        phongLightPassPong.addInputTexture( this.frameBuffers.shadowmapPong.getGTexture(), gl.TEXTURE2 );
    }
    phongLightPassPong.addInputTexture( this.frameBuffers.phongLightPing.getGTexture(),gl.TEXTURE3 );
    
    var saoPass = new GPostEffectRenderPassCmd( this.gl, this.programs.ssao, this.frameBuffers.ssao, this.screen );
    saoPass.addInputFrameBuffer( this.frameBuffers.position, gl.TEXTURE0 );
    saoPass.addInputTexture( this.gl.randomTexture, gl.TEXTURE1 );
    
    var saoBlurPing = new GPostEffectRenderPassCmd( this.gl, this.programs.blur, this.frameBuffers.blurPing, this.screen );
    saoBlurPing.setHRec( 0, 0, 1, 1, 3.14159/2 );
    saoBlurPing.addInputFrameBuffer( this.frameBuffers.ssao, gl.TEXTURE0 );
   
    var saoBlurPong = new GPostEffectRenderPassCmd( this.gl, this.programs.blur, this.frameBuffers.ssao, this.screen );
    saoBlurPong.setHRec( 0, 0, 1, 1, -3.14159/2 );
    saoBlurPong.addInputFrameBuffer( this.frameBuffers.blurPing, gl.TEXTURE0 )
    
    var toneMapPassPing = new GPostEffectRenderPassCmd( this.gl, this.programs.toneMap, this.frameBuffers.phongLightPong, this.screen );
    toneMapPassPing.addInputFrameBuffer( this.frameBuffers.color, gl.TEXTURE0 );
    toneMapPassPing.addInputFrameBuffer( this.frameBuffers.phongLightPing, gl.TEXTURE1 );
    if ( 0 >= this.renderLevel )
    {
        toneMapPassPing.addInputTexture( this.gl.whiteTexture, gl.TEXTURE2 );
    }
    else
    {
        toneMapPassPing.addInputFrameBuffer( this.frameBuffers.ssao, gl.TEXTURE2 );
    }
    
    var toneMapPassPong = new GPostEffectRenderPassCmd( this.gl, this.programs.toneMap, this.frameBuffers.phongLightPing, this.screen );
    toneMapPassPong.addInputFrameBuffer( this.frameBuffers.color, gl.TEXTURE0 );
    toneMapPassPong.addInputFrameBuffer( this.frameBuffers.phongLightPong, gl.TEXTURE1 );
    if ( 0 >= this.renderLevel )
    {
        toneMapPassPong.addInputTexture( this.gl.whiteTexture, gl.TEXTURE2 );
    }
    else
    {
        toneMapPassPong.addInputFrameBuffer( this.frameBuffers.ssao, gl.TEXTURE2 );
    }
    
    
    var cmds = [];
    
    var preCmds = [];
    var shadowCmds = [];
    
    var lightCmds = [];
    
    var toneMapCmds = [];
    
    preCmds.push( normalPass );
    preCmds.push( positionPass );
    preCmds.push( colorPass );
    preCmds.push( objidPass );
    preCmds.push( clearPhongLightPong );
    
    if ( this.renderLevel >= 2 )
    {
        shadowCmds.push( clearShadowmap );
        shadowCmds.push( normalSource );
        shadowCmds.push( shadowmapPass );
    }
    
    lightCmds.push( phongLightPassPing );
    lightCmds.push( phongLightPassPong );
    
    toneMapCmds.push( toneMapPassPing );
    toneMapCmds.push( toneMapPassPong );
     
    this.preCmds = preCmds;
    this.shadowCmds = shadowCmds;
    
    this.lightCmds = lightCmds;
    
    this.toneMapCmds = toneMapCmds;
    
    if ( 0 >= this.renderLevel )
    {
        this.sao = [];
    }
    else
    {
        this.sao = [ saoPass, saoBlurPing, saoBlurPong ];
    }
};

/**
 * Get the current render level
 * @return {number}
 */
GRenderDeferredStrategy.prototype.getRenderLevel = function ()
{
    return this.renderLevel;
};

/**
 * Set the render level to use
 * @param {number} the new render level
 * @return {boolean} true if the change was applied false otherwise
 */
GRenderDeferredStrategy.prototype.setRenderLevel = function ( newLevel )
{
    if ( newLevel !== this.renderLevel &&
         newLevel >= 0 &&
         newLevel <= 2 )
    {
        this.renderLevel = newLevel;
        
        if ( this._isReady )
        {
            this.initPassCmds();
        }
        
        return true;
    }
    
    return false;
}

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
    
    for ( var pIdx in this.sao )
    {
        this.sao[pIdx].run( scene );
    }
    
    this.toneMapCmds[(lCount + 1)%2].run( scene );
    
    // HUD
    this.gl.disable( this.gl.DEPTH_TEST );
    this.programs.fxaa.activate(); 
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    
	if ( lCount % 2 )
	{
	    this.frameBuffers.phongLightPong.bindTexture(gl.TEXTURE0, "color");
	}
	else
	{
	    this.frameBuffers.phongLightPing.bindTexture(gl.TEXTURE0, "color");
    }
    
    this.setHRec(0, 0, 1, 1);
    this.drawScreenBuffer(this.programs.fxaa); 
    
    /*this.frameBuffers.objid.bindTexture(gl.TEXTURE0, "color");
    this.setHRec(-0.125+0.75, 0.125-0.75, 0.125, 0.125);
    this.drawScreenBuffer(this.programs.fxaa);*/
    
    /*this.frameBuffers.phongLightPong.bindTexture(gl.TEXTURE0, "color");
    this.setHRec(0.125+0.75, 0.125-0.75, 0.125, 0.125);
    this.drawScreenBuffer(this.programs.fxaa); */
    
    /*this.frameBuffers.phongLightPong.bindTexture(gl.TEXTURE0, "color");  
    this.setHRec(-0.125+0.75, -0.125-0.75, 0.125, 0.125);
    this.drawScreenBuffer(this.programs.fullScr); */
    /*this.frameBuffers.position.bindTexture(gl.TEXTURE0, "color");
    this.setHRec(0.125+0.75, -0.125-0.75, 0.125, 0.125);
    this.drawScreenBuffer(this.programs.fullScr);*/
    
    if (hud != undefined)
    {
        this.programs.fullScr.activate();
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);
        
        hud.draw(this.programs.fullScr);
        this.programs.fullScr.deactivate();
        
        this.frameBuffers.objidHud.bindBuffer();
        this.programs.objidscr.activate();
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
        
        hud.draw( this.programs.objidscr );
        this.programs.objidscr.deactivate();
    }
};

GRenderDeferredStrategy.tempObjIdA = new Uint8Array(4);

/**
 * Get the object id of the object at the provided mouse location
 * @param {number}
 * @param {number}
 */
GRenderDeferredStrategy.prototype.getObjectIdAt = function ( x, y )
{
    this.frameBuffers.objid.getColorValueAt(x, y, GRenderDeferredStrategy.tempObjIdA);
    
    return ( GRenderDeferredStrategy.tempObjIdA[0] << 16 |
             GRenderDeferredStrategy.tempObjIdA[1] << 8  |
             GRenderDeferredStrategy.tempObjIdA[2] );
};

/**
 * Get the object id of the object at the provided mouse location
 * @param {number}
 * @param {number}
 */
GRenderDeferredStrategy.prototype.getHudObjectIdAt = function ( x, y )
{
    this.frameBuffers.objidHud.getColorValueAt(x, y, GRenderDeferredStrategy.tempObjIdA);
    
    return ( GRenderDeferredStrategy.tempObjIdA[0] << 16 |
             GRenderDeferredStrategy.tempObjIdA[1] << 8  |
             GRenderDeferredStrategy.tempObjIdA[2] );
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
    var tfl = gl.getExtension("OES_texture_float_linear"); // this is for softer shadows
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
    
   
    
    var frameBuffer = new GFrameBuffer({ gl: this.gl, width: 1024, height: 1024 });
    frameBuffer.addBufferTexture(texCfg);
    frameBuffer.complete();
   
    this.frameBuffers = 
    {
        ssao: frameBuffer
    };
    
    frameBuffer = new GFrameBuffer({ gl: this.gl, width: 1024, height: 1024 });
    frameBuffer.addBufferTexture(texCfg);
    frameBuffer.complete();
    this.frameBuffers.blurPing = frameBuffer;
    
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
    
    frameBuffer = new GFrameBuffer({ gl: this.gl, width: 1024, height: 1024 });
    frameBuffer.addBufferTexture(texCfg);
    frameBuffer.complete();
    this.frameBuffers.objid = frameBuffer;
    
    frameBuffer = new GFrameBuffer({ gl: this.gl, width: 1024, height: 1024 });
    frameBuffer.addBufferTexture(texCfg);
    frameBuffer.complete();
    this.frameBuffers.objidHud = frameBuffer;
    
    frameBuffer = new GFrameBuffer({ gl: this.gl, width: 1024, height: 1024 });
    frameBuffer.addBufferTexture(texCfgFloat);
    frameBuffer.complete();
    this.frameBuffers.lightNormal = frameBuffer;
    
    frameBuffer = new GFrameBuffer({ gl: this.gl, width: 1024, height: 1024 });
    frameBuffer.addBufferTexture(texCfg);
    frameBuffer.complete();
    this.frameBuffers.shadowmapPing = frameBuffer;
    
    frameBuffer = new GFrameBuffer({ gl: this.gl, width: 1024, height: 1024 });
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



