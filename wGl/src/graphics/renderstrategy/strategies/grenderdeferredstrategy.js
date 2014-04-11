/**
 * @constructor
 */
function GFrameBufferContainer(gl, buffer, textures)
{
    this.textures = textures;
    this.buffer = buffer;
    this.gl = gl;
}

GFrameBufferContainer.prototype.bindBuffer = function ()
{
    var gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffer);
};

GFrameBufferContainer.prototype.unbindBuffer = function ()
{
    var gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

GFrameBufferContainer.prototype.bindTexture = function (id, name)
{
    var gl = this.gl;
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
        "deferred-vs.c":undefined,
        "deferred-fs.c":undefined,
        "light-vs.c":undefined,
        "light-fs.c":undefined,
        "fullscr-vs.c":undefined,
        "fullscr-fs.c":undefined
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

GRenderDeferredStrategy.prototype.create2dTexture = function(filter, format, type)
{
    var gl = this.gl;
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, format, 1024, 1024, 0, format, type, null);
    
    return texture;
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
    
    this.lightProgram = light;
    this.fullScreenProgram = fullScr;
    this.phongShader = phong;
};

GRenderDeferredStrategy.prototype.drawScreenBuffer = function(shader)
{
    var gl = this.gl;
	
    
    
   
   // this.frameBuffers.renderToTexture.bindTexture(gl.TEXTURE0, "phong");
    
    
    gl.uniform1i(shader.uniforms.mapKd, 0);
    
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
    this.phongShader.activate();
    this.frameBuffers.prePass.bindBuffer();
   
    gl.viewport(0, 0, 1024, 1024);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);	
    scene.draw(this.phongShader);
    
    this.frameBuffers.prePass.unbindBuffer();
    this.phongShader.deactivate();
    
    this.lightProgram.activate();
    
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    
    this.frameBuffers.prePass.bindTexture(gl.TEXTURE0, "depthRGBTexture");
    this.setHRec(-0.5, 0.5, 0.5, 0.5);
    this.drawScreenBuffer(this.lightProgram);
    this.frameBuffers.prePass.bindTexture(gl.TEXTURE0, "normalTexture");
    this.setHRec(0.5, 0.5, 0.5, 0.5);
    this.drawScreenBuffer(this.lightProgram);
    this.frameBuffers.prePass.bindTexture(gl.TEXTURE0, "positionTexture");  
    this.setHRec(-0.5, -0.5, 0.5, 0.5);
    this.drawScreenBuffer(this.lightProgram);
    this.frameBuffers.prePass.bindTexture(gl.TEXTURE0, "colorTexture");
    this.setHRec(0.5, -0.5, 0.5, 0.5);
    this.drawScreenBuffer(this.lightProgram);
    this.lightProgram.deactivate();
    
    this.fullScreenProgram.activate();    	
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
    
    framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    
    var texture = this.create2dTexture(gl.LINEAR, gl.RGBA, gl.UNSIGNED_BYTE);
    
    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 1024, 1024);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
    {
        console.debug("incomplete famebuffer");
    }
    
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    var container = new GFrameBufferContainer(gl, framebuffer, {phong:texture});
    
    this.frameBuffers = 
    {
        renderToTexture: container
    };
};

GRenderDeferredStrategy.prototype.initializeFBO = function() 
{
    var gl = this.gl;
    console.log("initFBO");
    
    var FBO;
      
    var ext = this.gl.getExtension('WEBGL_draw_buffers');
    
    gl.getExtension("OES_texture_float");
    gl.getExtension("OES_texture_float_linear");
    var extDepth = gl.getExtension("WEBGL_depth_texture");

    if(!extDepth){
        console.log("Extension Depth texture is not working");
        console.debug(":( Sorry, Your browser doesn't support depth texture extension. Please browse to webglreport.com to see more information.");
        return;
    }
     
    
   // var depthTexture    = this.create2dTexture(gl.NEAREST, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT); 
    //var depthTexture    = this.create2dTexture(gl.NEAREST, gl.DEPTH_COMPONENT16, gl.UNSIGNED_SHORT); 
    var normalTexture   = this.create2dTexture(gl.LINEAR, gl.RGBA, gl.FLOAT); 
    var positionTexture = this.create2dTexture(gl.LINEAR, gl.RGBA, gl.FLOAT); 
    var colorTexture    = this.create2dTexture(gl.LINEAR, gl.RGBA, gl.UNSIGNED_BYTE); 
    var depthRGBTexture = this.create2dTexture(gl.LINEAR, gl.RGBA, gl.UNSIGNED_BYTE);

    
    FBO = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
    var bufs = [];
    bufs[0] = ext.COLOR_ATTACHMENT0_WEBGL;
    bufs[1] = ext.COLOR_ATTACHMENT1_WEBGL;
    bufs[2] = ext.COLOR_ATTACHMENT2_WEBGL;
    bufs[3] = ext.COLOR_ATTACHMENT3_WEBGL;
    ext.drawBuffersWEBGL(bufs);
    
    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 1024, 1024);
   // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

   // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, bufs[0], gl.TEXTURE_2D, depthRGBTexture, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, bufs[1], gl.TEXTURE_2D, normalTexture, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, bufs[2], gl.TEXTURE_2D, positionTexture, 0);    
    gl.framebufferTexture2D(gl.FRAMEBUFFER, bufs[3], gl.TEXTURE_2D, colorTexture, 0);    
    
    var textures = 
    {
      //  depthTexture    :depthTexture,
        depthRGBTexture :depthRGBTexture,
        normalTexture   :normalTexture,
        positionTexture :positionTexture,    
        colorTexture    :colorTexture
    };
    
    var container = new GFrameBufferContainer(gl, FBO, textures);
    
    this.frameBuffers.prePass = container;

     
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
};



