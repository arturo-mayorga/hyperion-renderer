/** 
 * @constructor
 * @implements {GRenderStrategy}
 */
function GRenderDeferredStrategy( gl )
{
    this.gl = gl;
    this.configure();
    
}

GRenderDeferredStrategy.prototype.configure = function()
{
    // this map variable is to keep the closure compiler from getting confused.
    var map = this.shaderSrcMap = 
    {
        "blur-vs.c":undefined,
        "blur-fs.c":undefined,
        "deferred-vs.c":undefined,
        "deferred-fs.c":undefined,
        "fullscr-vs.c":undefined,
        "fullscr-fs.c":undefined,
        "light-vs.c":undefined,
        "light-fs.c":undefined,
        "ssao-vs.c":undefined,
        "ssao-fs.c":undefined
    };
    
    for (var key in map)
    {
        this.loadShader(key);
    }
};

GRenderDeferredStrategy.prototype.reload = function()
{
    this._isReady = false;
    this.deferredShader.destroy();
    this.fullScreenProgram.destroy();
    
    this.deferredShader = undefined;
    this.fullScreenProgram = undefined;
    this.configure();
};

GRenderDeferredStrategy.prototype.loadShader = function(srcName)
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

GRenderDeferredStrategy.prototype.initialize = function()
{   
    this.initTextureFramebuffer();
    
    
    this.initScreenVBOs();
    
    this.initializeFBO();
    
    this.initShaders(this.shaderSrcMap);
    
    this.initPassCmds();
    
    this._isReady = true;
};

GRenderDeferredStrategy.prototype.isReady = function()
{
    return true == this._isReady;
};

GRenderDeferredStrategy.prototype.initScreenVBOs = function()
{
    var gl = this.gl;
    
    gl.clearColor(0.1, 0.3, 0.1, 1.0);
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

GRenderDeferredStrategy.prototype.initShaders = function (shaderSrcMap) 
{
    var gl = this.gl;
      
    var deferred = new GShader(shaderSrcMap["deferred-vs.c"], shaderSrcMap["deferred-fs.c"]);
    deferred.bindToContext(gl);
    
    var fullScr = new GShader(shaderSrcMap["fullscr-vs.c"], shaderSrcMap["fullscr-fs.c"]);
    fullScr.bindToContext(gl);
    
    var light = new GShader(shaderSrcMap["light-vs.c"], shaderSrcMap["light-fs.c"]);
    light.bindToContext(gl);
    
    var ssao = new GShader(shaderSrcMap["ssao-vs.c"], shaderSrcMap["ssao-fs.c"]);
    ssao.bindToContext(gl);
    
    var blur = new GShader(shaderSrcMap["blur-vs.c"], shaderSrcMap["blur-fs.c"]);
    blur.bindToContext(gl);
    
    this.lightProgram = light;
    this.ssaoProgram = ssao;
    this.fullScreenProgram = fullScr;
    this.deferredShader = deferred;
    this.blurProgram = blur;
};

GRenderDeferredStrategy.prototype.drawScreenBuffer = function(shader)
{
    var gl = this.gl;
    
    if ( null != shader.uniforms.mapKd)
    {
        gl.uniform1i(shader.uniforms.mapKd, 0);
    }
    
    if ( null != shader.uniforms.mapRGBDepth )
    {
        gl.uniform1i(shader.uniforms.mapRGBDepth, 1);
    }
 
    if ( null != shader.uniforms.mapNormal )
    {
        gl.uniform1i(shader.uniforms.mapNormal, 2);
    }
  
    if ( null != shader.uniforms.mapPosition )
    {
        gl.uniform1i(shader.uniforms.mapPosition, 3);
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

GRenderDeferredStrategy.prototype.initPassCmds = function()
{
    this.passes = {};
    var gl = this.gl;
    
    var geometryPass = new GRenderPassCmd();
    geometryPass.setProgram( this.deferredShader );
    geometryPass.setFrameBuffer( this.frameBuffers.prePass );
    geometryPass.bindToContext( this.gl );
    if ( false == geometryPass.checkValid() )
    {
        console.debug("Geometry pass command not valid");
    }
    
    var ssaoPass = new GRenderPassCmd();
    ssaoPass.setDepthTestSwitch( GRENDERPASSCMD_DEPTH_TEST_SWITCH.DISABLE );
    ssaoPass.setSceneDrawMode( GRENDERPASSCMD_SCENE_DRAW_MODE.NO_GEOMETRY );
    ssaoPass.setProgram( this.ssaoProgram );
    ssaoPass.setFrameBuffer( this.frameBuffers.ssao );
    ssaoPass.setScreenGeometry( this.screen );
    ssaoPass.setHRec( 0, 0, 1, 1 );
    ssaoPass.bindToContext( this.gl );
    ssaoPass.addInputTexture( this.frameBuffers.prePass.createGTexture("colorTexture"),    gl.TEXTURE0 );
    ssaoPass.addInputTexture( this.frameBuffers.prePass.createGTexture("depthRGBTexture"), gl.TEXTURE1 );
    ssaoPass.addInputTexture( this.frameBuffers.prePass.createGTexture("normalTexture"),   gl.TEXTURE2 );
    ssaoPass.addInputTexture( this.frameBuffers.prePass.createGTexture("positionTexture"), gl.TEXTURE3 );
    if ( false == ssaoPass.checkValid() )
    {
        console.debug("SSAO pass command not valid");
    }
    
    var ssaoBPass = new GRenderPassCmd();
    ssaoBPass.setSceneDrawMode( GRENDERPASSCMD_SCENE_DRAW_MODE.NO_GEOMETRY );
    ssaoBPass.setProgram( this.blurProgram );
    ssaoBPass.setFrameBuffer( this.frameBuffers.ssaoBlur );
    ssaoBPass.setScreenGeometry( this.screen );
    ssaoBPass.setHRec( 0, 0, 1, 1 );
    ssaoBPass.bindToContext( this.gl );
    ssaoBPass.addInputTexture( this.frameBuffers.ssao.createGTexture("color"), gl.TEXTURE0 );
    if ( false == ssaoBPass.checkValid() )
    {
        console.debug("SSAO blur pass command not valid");
    }
    
    var lightPass = new GRenderPassCmd();
    lightPass.setSceneDrawMode( GRENDERPASSCMD_SCENE_DRAW_MODE.LIGHTS_ONLY );
    lightPass.setProgram( this.lightProgram );
    lightPass.setFrameBuffer( this.frameBuffers.light );
    lightPass.setScreenGeometry( this.screen );
    lightPass.setHRec( 0, 0, 1, 1 );
    lightPass.bindToContext( this.gl );
    lightPass.addInputTexture( this.frameBuffers.prePass.createGTexture("colorTexture"),    gl.TEXTURE0 );
    lightPass.addInputTexture( this.frameBuffers.prePass.createGTexture("depthRGBTexture"), gl.TEXTURE1 );
    lightPass.addInputTexture( this.frameBuffers.prePass.createGTexture("normalTexture"),   gl.TEXTURE2 );
    lightPass.addInputTexture( this.frameBuffers.prePass.createGTexture("positionTexture"), gl.TEXTURE3 );
 
    if ( false == ssaoBPass.checkValid() )
    {
        console.debug("SSAO blur pass command not valid");
    }
    
    this.passes.geometry = geometryPass;
    this.passes.ssao = ssaoPass;
    this.passes.ssaoBlur = ssaoBPass;
    this.passes.light = lightPass;
};

GRenderDeferredStrategy.prototype.draw = function ( scene, hud )
{
    var gl = this.gl;
    gl.disable(gl.BLEND);
    
    this.passes.geometry.run( scene );
    this.passes.ssao.run( scene );
    this.passes.ssaoBlur.run( scene );
    this.passes.light.run( scene );
    
    
    // HUD
    this.fullScreenProgram.activate(); 
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    
    this.frameBuffers.light.bindTexture(gl.TEXTURE0, "color");
    this.setHRec(0, 0, 1, 1);
    this.drawScreenBuffer(this.fullScreenProgram);
    this.frameBuffers.prePass.bindTexture(gl.TEXTURE0, "depthRGBTexture");
    this.setHRec(-0.125+0.75, 0.125-0.75, 0.125, 0.125);
    this.drawScreenBuffer(this.fullScreenProgram);
    this.frameBuffers.prePass.bindTexture(gl.TEXTURE0, "normalTexture");
    this.setHRec(0.125+0.75, 0.125-0.75, 0.125, 0.125);
    this.drawScreenBuffer(this.fullScreenProgram);
    this.frameBuffers.ssaoBlur.bindTexture(gl.TEXTURE0, "color");  
    this.setHRec(-0.125+0.75, -0.125-0.75, 0.125, 0.125);
    this.drawScreenBuffer(this.fullScreenProgram);
    this.frameBuffers.prePass.bindTexture(gl.TEXTURE0, "colorTexture");
    this.setHRec(0.125+0.75, -0.125-0.75, 0.125, 0.125);
    this.drawScreenBuffer(this.fullScreenProgram);
    
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
       	
    if (hud != undefined)
    {
        hud.draw(this.fullScreenProgram);
    }
    this.fullScreenProgram.deactivate();
};

GRenderDeferredStrategy.prototype.setHRec = function( x, y, width, height )
{
	// the values passed in are meant to be between 0 and 1
	// currently there are no plans to add debug assertions
    mat3.identity(this.hMatrix);
	mat3.translate(this.hMatrix, this.hMatrix, [x, y]);
	mat3.scale(this.hMatrix,this.hMatrix, [width, height]);  
}

GRenderDeferredStrategy.prototype.initTextureFramebuffer = function()
{
    var gl = this.gl;
    
    var texCfg = 
    {
        filter: gl.LINEAR,
        format: gl.RGBA,
        type: gl.UNSIGNED_BYTE,
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
    
    frameBuffer = new GFrameBuffer({ gl: this.gl, width: 256, height: 256 });
    frameBuffer.addBufferTexture(texCfg);
    frameBuffer.complete();
    
    this.frameBuffers.ssaoBlur = frameBuffer;
    
    frameBuffer = new GFrameBuffer({ gl: this.gl, width: 1024, height: 1024 });
    frameBuffer.addBufferTexture(texCfg);
    frameBuffer.complete();
    
    this.frameBuffers.light = frameBuffer;
};

GRenderDeferredStrategy.prototype.initializeFBO = function() 
{
    var gl = this.gl;
    console.log("initFBO");
    
    var FBO;
      
    var db = gl.getExtension("WEBGL_draw_buffers");
    var tf = gl.getExtension("OES_texture_float");
    var tfl = gl.getExtension("OES_texture_float_linear");
    var dt = gl.getExtension("WEBGL_depth_texture");
    
    var glExtensions = 
    {
        WEBGL_draw_buffers:db,
        OES_texture_float:tf,
        OES_texture_float_linear:tfl,
        WEBGL_depth_texture:dt
    };

    if(!dt){
        console.log("Extension Depth texture is not working");
        console.debug(":( Sorry, Your browser doesn't support depth texture extension. Please browse to webglreport.com to see more information.");
        return;
    }
    
    var fbCfg = 
    {
        gl: this.gl,
        extensions: glExtensions,
        width: 1024,
        height: 1024
    };
    
    var texCfgs = [
        { filter: gl.NEAREST, format: gl.DEPTH_COMPONENT, type: gl.UNSIGNED_INT,  attachment: gl.DEPTH_ATTACHMENT,        name: "depthTexture" },
        // The closure compiler has problems accessing members of extensions unless they are called like this
        { filter: gl.LINEAR,  format: gl.RGBA,            type: gl.UNSIGNED_BYTE, attachment: db['COLOR_ATTACHMENT0_WEBGL'], name: "depthRGBTexture" },
        { filter: gl.LINEAR,  format: gl.RGBA,            type: gl.FLOAT,         attachment: db['COLOR_ATTACHMENT1_WEBGL'], name: "normalTexture" },
        { filter: gl.LINEAR,  format: gl.RGBA,            type: gl.FLOAT,         attachment: db['COLOR_ATTACHMENT2_WEBGL'], name: "positionTexture" },
        { filter: gl.LINEAR,  format: gl.RGBA,            type: gl.UNSIGNED_BYTE, attachment: db['COLOR_ATTACHMENT3_WEBGL'], name: "colorTexture" }
    ];
    
    var frameBuffer = new GFrameBuffer(fbCfg);
    
    
    for (var i = 0; i < texCfgs.length; ++i)
    {
        frameBuffer.addBufferTexture(texCfgs[i]); 
    }
    
    frameBuffer.complete(); 
    
    this.frameBuffers.prePass = frameBuffer; 
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
};



