/**
 * @constructor
 */
function GFrameBuffer( config )
{
    var gl = config.gl;
    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    
    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, config.width, config.height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    
    this.textures = {};
    this.fBuffer = framebuffer;
    this.rBuffer = renderbuffer;
    this.cfg = config;
}

GFrameBuffer.prototype.create2dTexture = function (filter, format, type)
{
    var gl = this.cfg.gl;
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, format, this.cfg.width, this.cfg.height, 0, format, type, null);
    
    return texture;
};

GFrameBuffer.prototype.addBufferTexture = function ( cfg )
{ 
    var gl = this.cfg.gl;
    var texture = this.create2dTexture(cfg.filter, cfg.format, cfg.type);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, cfg.attachment, gl.TEXTURE_2D, texture, 0);
    this.textures[cfg.name] = texture;
    
      if ( undefined != this.cfg.extensions &&
           undefined != this.cfg.extensions.WEBGL_draw_buffers &&
           cfg.attachment >= this.cfg.extensions.WEBGL_draw_buffers.COLOR_ATTACHMENT0_WEBGL &&
           cfg.attachment <= this.cfg.extensions.WEBGL_draw_buffers.COLOR_ATTACHMENT15_WEBGL )
      {
          if ( undefined == this.WEBGL_draw_buffers_drawBuffersList )
          {
              this.WEBGL_draw_buffers_drawBuffersList = [];
          }
          
          this.WEBGL_draw_buffers_drawBuffersList.push(cfg.attachment);
      }
};

GFrameBuffer.prototype.complete = function ()
{
    var gl = this.cfg.gl;
    
    if ( undefined != this.WEBGL_draw_buffers_drawBuffersList )
    {
        this.cfg.extensions.WEBGL_draw_buffers.drawBuffersWEBGL(this.WEBGL_draw_buffers_drawBuffersList);
    }
    
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
    {
        console.debug("incomplete famebuffer");
    }
    
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

GFrameBuffer.prototype.bindBuffer = function ()
{
    var gl = this.cfg.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fBuffer);
    gl.viewport(0, 0, this.cfg.width, this.cfg.width);
};

GFrameBuffer.prototype.unbindBuffer = function ()
{
    var gl = this.cfg.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

GFrameBuffer.prototype.bindTexture = function (id, name)
{
    var gl = this.cfg.gl;
    gl.activeTexture(id);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[name]);
};

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
    this.shaderSrcMap = 
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
    
    for (var key in this.shaderSrcMap)
    {
        this.loadShader(key);
    }
};

GRenderDeferredStrategy.prototype.reload = function()
{
    this._isReady = false;
    this.phongShader.destroy();
    this.fullScreenProgram.destroy();
    
    this.phongShader = undefined;
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
    
    
    this.screenVertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.screenVertBuffer);
    
    gl.bufferData(gl.ARRAY_BUFFER,
                  new Float32Array([-1,-1,1,
                                    1,-1,1,
                                    1,1,1,
                                    -1,1,1]),
                  gl.STATIC_DRAW);
    
    this.screenVertBuffer.itemSize = 3;
    this.screenVertBuffer.numItems = 4;
    
    this.screenTextBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.screenTextBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 
                  new Float32Array([0,0,  
                                    1,0,  
                                    1,1,  
                                    0,1]), 
                  gl.STATIC_DRAW);
    this.screenTextBuffer.itemSize = 2;
    this.screenTextBuffer.numItems = 4;
    
    this.screenIndxBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.screenIndxBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, 
                  new Uint16Array([0, 1, 2, 2, 3, 0]),
                  gl.STATIC_DRAW);
    this.screenIndxBuffer.itemSize = 1;
    this.screenIndxBuffer.numItems = 6;
	
	this.hMatrix = mat3.create();
};

GRenderDeferredStrategy.prototype.initShaders = function (shaderSrcMap) 
{
    var gl = this.gl;
      
    var phong = new GShader(shaderSrcMap["deferred-vs.c"], shaderSrcMap["deferred-fs.c"]);
    phong.bindToContext(gl);
    
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
    this.phongShader = phong;
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
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.screenVertBuffer);
    gl.vertexAttribPointer(shader.attributes.positionVertexAttribute, 
                           this.screenVertBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.screenTextBuffer);
    gl.vertexAttribPointer(shader.attributes.textureVertexAttribute, 
                           this.screenTextBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.screenIndxBuffer);
	
	if ( null != shader.uniforms.hMatrixUniform )
    {
        gl.uniformMatrix3fv(shader.uniforms.hMatrixUniform, false, this.hMatrix);
    }
	
    gl.drawElements(gl.TRIANGLES, this.screenIndxBuffer.numItems, gl.UNSIGNED_SHORT, 0);
};

GRenderDeferredStrategy.prototype.draw = function ( scene, hud )
{
    var gl = this.gl;
    gl.disable(gl.BLEND);
    this.phongShader.activate();
    this.frameBuffers.prePass.bindBuffer();
   
    gl.viewport(0, 0, 1024, 1024);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);	
    scene.draw(this.phongShader);
    
    this.frameBuffers.prePass.unbindBuffer();
    this.phongShader.deactivate();
    
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // ssao
    this.ssaoProgram.activate();
    this.frameBuffers.ssao.bindBuffer();
     
    this.frameBuffers.prePass.bindTexture(gl.TEXTURE0, "colorTexture");
    this.frameBuffers.prePass.bindTexture(gl.TEXTURE1, "depthRGBTexture");
    this.frameBuffers.prePass.bindTexture(gl.TEXTURE2, "normalTexture");
    this.frameBuffers.prePass.bindTexture(gl.TEXTURE3, "positionTexture"); 
    this.setHRec(0, 0, 1, 1);
    this.drawScreenBuffer(this.ssaoProgram);
    this.frameBuffers.ssao.unbindBuffer();
    this.ssaoProgram.deactivate();
    
    // ssao blur
    this.blurProgram.activate();
    this.frameBuffers.ssaoBlur.bindBuffer();
    this.frameBuffers.ssao.bindTexture(gl.TEXTURE0, "color");
    this.setHRec(0, 0, 1, 1);
    this.drawScreenBuffer(this.blurProgram);
    this.frameBuffers.ssaoBlur.unbindBuffer();
    this.blurProgram.deactivate();
    
    // light
    this.lightProgram.activate();
    this.frameBuffers.light.bindBuffer();
    scene.drawLights( this.lightProgram );
    
     
    this.frameBuffers.prePass.bindTexture(gl.TEXTURE0, "colorTexture");
    this.frameBuffers.prePass.bindTexture(gl.TEXTURE1, "depthRGBTexture");
    this.frameBuffers.prePass.bindTexture(gl.TEXTURE2, "normalTexture");
    this.frameBuffers.prePass.bindTexture(gl.TEXTURE3, "positionTexture"); 
    this.setHRec(0, 0, 1, 1);
    this.drawScreenBuffer(this.lightProgram);
    this.frameBuffers.light.unbindBuffer();
    this.lightProgram.deactivate();
    
    
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
    this.frameBuffers.prePass.bindTexture(gl.TEXTURE0, "positionTexture");  
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
    
    var fbCfg = 
    {
        gl: this.gl, 
        width: 256,
        height: 256
    };
    
    var texCfg = 
    {
        filter: gl.LINEAR,
        format: gl.RGBA,
        type: gl.UNSIGNED_BYTE,
        attachment: gl.COLOR_ATTACHMENT0,
        name: "color"
    };
    
    var frameBuffer = new GFrameBuffer(fbCfg);
    frameBuffer.addBufferTexture(texCfg);
    frameBuffer.complete();
   
    this.frameBuffers = 
    {
        ssao: frameBuffer
    };
    
    frameBuffer = new GFrameBuffer(fbCfg);
    frameBuffer.addBufferTexture(texCfg);
    frameBuffer.complete();
    
    this.frameBuffers.ssaoBlur = frameBuffer;
    
    fbCfg.width = fbCfg.height = 1024;
    frameBuffer = new GFrameBuffer(fbCfg);
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
        { filter: gl.LINEAR,  format: gl.RGBA,            type: gl.UNSIGNED_BYTE, attachment: db.COLOR_ATTACHMENT0_WEBGL, name: "depthRGBTexture" },
        { filter: gl.LINEAR,  format: gl.RGBA,            type: gl.FLOAT,         attachment: db.COLOR_ATTACHMENT1_WEBGL, name: "normalTexture" },
        { filter: gl.LINEAR,  format: gl.RGBA,            type: gl.FLOAT,         attachment: db.COLOR_ATTACHMENT2_WEBGL, name: "positionTexture" },
        { filter: gl.LINEAR,  format: gl.RGBA,            type: gl.UNSIGNED_BYTE, attachment: db.COLOR_ATTACHMENT3_WEBGL, name: "colorTexture" }
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



