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
function GRenderPhongStrategy( gl )
{
    this.gl = gl;
    this.configure();
    
    this.extensions = {};
    this.extensions.stdDeriv = this.checkNavigatorProfile("OES_standard_derivatives")?
                                    gl.getExtension('OES_standard_derivatives'):null;
    
}

GRenderPhongStrategy.prototype = Object.create( GRenderStrategy.prototype );

/**
 * Some devices don't play nice with some extensions eve if the claim support
 * this function returns true if the known hardware support for a particular extension
 * is good enough for the extension in question
 * @param {string}
 * @return {boolean}
 */
GRenderPhongStrategy.prototype.checkNavigatorProfile = function( extensionName )
{
   if ( "OES_standard_derivatives" === extensionName )
   {
       // for now just make sure we are not on some android device.
       return -1 === navigator.userAgent.toLowerCase().indexOf("android");
   }
   
   return true;
};

/**
 * Configures the strategy and starts the download process for the shader source
 */
GRenderPhongStrategy.prototype.configure = function()
{
    this.shaderSrcMap = 
    {
        "phong-vs.c":undefined,
        "phong-fs.c":undefined,
        "fullscr-vs.c":undefined,
        "fullscr-fs.c":undefined,
        "fxaa-vs.c":undefined,
        "fxaa-fs.c":undefined
    };
    
    for (var key in this.shaderSrcMap)
    {
        this.loadShader(key);
    }
};

/**
 * Free and reload all the resource for this strategy
 */
GRenderPhongStrategy.prototype.reload = function()
{
    this._isReady = false;
    this.phongComposite.destroy();
    this.fullScreenProgram.destroy();
    
    this.phongComposite = undefined;
    this.fullScreenProgram = undefined;
    this.configure();
};

/**
 * Start the download process for the requested shader
 * @param {string} source name of the shader that needs to be loaded
 */
GRenderPhongStrategy.prototype.loadShader = function(srcName)
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
GRenderPhongStrategy.prototype.checkShaderDependencies = function()
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
GRenderPhongStrategy.prototype.initialize = function()
{   
    this.initTextureFramebuffer();
    this.initShaders(this.shaderSrcMap);
    
    this.initScreenVBOs();
    this._isReady = true;
};

/**
 * Returns true if this strategy has loaded all required resource (shaders)
 * and is ready for use
 * @return {boolean}
 */
GRenderPhongStrategy.prototype.isReady = function()
{
    return true === this._isReady;
};

/**
 * Create the screen VBOs for drawing the screen
 */
GRenderPhongStrategy.prototype.initScreenVBOs = function()
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

/**
 * initialize the frame buffer and it's textures
 */
GRenderPhongStrategy.prototype.initTextureFramebuffer = function()
{
    var gl = this.gl;
    this.rttFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFramebuffer);
    this.rttFramebuffer.width = 1024;
    this.rttFramebuffer.height = 1024;
    
    this.rttTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.rttTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.rttFramebuffer.width, this.rttFramebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    
    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.rttFramebuffer.width, this.rttFramebuffer.height);
    
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.rttTexture, 0);
    
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
    {
        alert("incomplete famebuffer");
    }
    
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

/**
 * Helper function to compile the shaders after all the source has been
 * downloaded
 */
GRenderPhongStrategy.prototype.initShaders = function (shaderSrcMap) 
{
    var gl = this.gl;
    
    
      
    var phongComposite = new ShaderComposite( shaderSrcMap["phong-vs.c"], shaderSrcMap["phong-fs.c"]);
    phongComposite.bindToContext(gl);
    
    var fullScr = new GShader( shaderSrcMap["fullscr-vs.c"], shaderSrcMap["fullscr-fs.c"]);
    fullScr.bindToContext(gl);
    
    var fxaa = new GShader( shaderSrcMap["fxaa-vs.c"], shaderSrcMap["fxaa-fs.c"]);
    fxaa.bindToContext(gl);
    
    this.fullScreenProgram = fullScr;
    this.fxaaProgram = fxaa;
   
    
    this.phongComposite = phongComposite;
};

/**
 * Draw the screen buffer using the provided shader
 * @param {GShader} Shader to use for drawing the screen buffer
 */
GRenderPhongStrategy.prototype.drawScreenBuffer = function(shader)
{
    var gl = this.gl;
	
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.rttTexture);
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

/**
 * Draw the scene and hud elements using this strategy
 * @param {GScene} Scene to draw with this strategy
 * @param {GHudController} Hud to draw with this strategy
 */
GRenderPhongStrategy.prototype.draw = function ( scene, hud )
{
    var gl = this.gl;
   
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFramebuffer);
    gl.viewport(0, 0, 1024, 1024);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);	
    
    
    scene.draw(this.phongComposite);
    
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    this.fxaaProgram.activate();
    this.drawScreenBuffer(this.fxaaProgram);	
    
    this.fullScreenProgram.activate();
    if (hud != undefined)
    {
        hud.draw(this.fullScreenProgram);
    }
    this.fullScreenProgram.deactivate();
}; 

