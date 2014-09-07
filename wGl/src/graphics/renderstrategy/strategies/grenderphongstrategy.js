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
        
        "fullscr-vs.c":undefined,
        "fullscr-fs.c":undefined,
        "fxaa-vs.c":undefined,
        "fxaa-fs.c":undefined,
        "objid-fs.c":undefined,
        "objid-vs.c":undefined,
        "objidscr-fs.c":undefined,
        "objidscr-vs.c":undefined,
        "phong-vs.c":undefined,
        "phong-fs.c":undefined
    };
    
    for (var key in this.shaderSrcMap)
    {
        this.loadShader(key);
    }
};

/**
 * Called to delete all the resources under this buffer
 */
GRenderPhongStrategy.prototype.deleteResources = function()
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
GRenderPhongStrategy.prototype.reload = function()
{
    this.deleteResources();
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
    
    this.initPassCmds();
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
    
    gl.clearColor(0, 0, 0, 1.0);
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
    
    this.screen = {};
    
    this.screen.vertBuffer = this.screenVertBuffer;
    this.screen.textBuffer = this.screenTextBuffer;
    this.screen.indxBuffer = this.screenIndxBuffer;
	
	this.hMatrix = mat3.create();
};

/**
 * Create the screen VBOs for drawing the screen
 */
GRenderPhongStrategy.prototype.deleteScreenVBOs = function()
{
    for ( var key in this.screen )
    {
        this.gl.deleteBuffer( this.screen[key] );
    }
};

/**
 * initialize the frame buffer and it's textures
 */
GRenderPhongStrategy.prototype.initTextureFramebuffer = function()
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
    
    this.frameBuffers = {};
    
    var frameBuffer = new GFrameBuffer({ gl: this.gl, width: 1024, height: 1024 });
    frameBuffer.addBufferTexture(texCfg);
    frameBuffer.complete();
    this.frameBuffers.color = frameBuffer;
    
    frameBuffer = new GFrameBuffer({ gl: this.gl, width: 1024, height: 1024 });
    frameBuffer.addBufferTexture(texCfg);
    frameBuffer.complete();
    this.frameBuffers.objid = frameBuffer;
    
    frameBuffer = new GFrameBuffer({ gl: this.gl, width: 1024, height: 1024 });
    frameBuffer.addBufferTexture(texCfg);
    frameBuffer.complete();
    this.frameBuffers.objidHud = frameBuffer;
};

/**
 * Helper function to compile the shaders after all the source has been
 * downloaded
 */
GRenderPhongStrategy.prototype.initShaders = function (shaderSrcMap) 
{
    var gl = this.gl;
    this.programs = {};
    
    this.programs.phongComposite = new ShaderComposite( shaderSrcMap["phong-vs.c"], shaderSrcMap["phong-fs.c"] ); 
    this.programs.objidComposite = new ShaderComposite( shaderSrcMap["objid-vs.c"], shaderSrcMap["objid-fs.c"] );
    
    this.programs.fullScr  = new GShader( shaderSrcMap["fullscr-vs.c"],  shaderSrcMap["fullscr-fs.c"] );
    this.programs.fxaa     = new GShader( shaderSrcMap["fxaa-vs.c"],     shaderSrcMap["fxaa-fs.c"] );
    this.programs.objidscr = new GShader( shaderSrcMap["objidscr-vs.c"], shaderSrcMap["objidscr-fs.c"]       );
    
    for ( var key in this.programs )
    {
        this.programs[key].bindToContext(gl);
    }
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
 * Create the pass command pipeline
 */
GRenderPhongStrategy.prototype.initPassCmds = function()
{   
    var colorPass = new GGeometryRenderPassCmd( this.gl, this.programs.phongComposite, this.frameBuffers.color );
    var objidPass = new GGeometryRenderPassCmd( this.gl, this.programs.objidComposite, this.frameBuffers.objid );
    
    this.passes = [ colorPass, objidPass ];
};
    

/**
 * Draw the scene and hud elements using this strategy
 * @param {GScene} Scene to draw with this strategy
 * @param {GHudController} Hud to draw with this strategy
 */
GRenderPhongStrategy.prototype.draw = function ( scene, hud )
{
    var gl = this.gl;
    
    for ( var key in this.passes )
    {
        this.passes[key].run( scene );
    }
    
    this.frameBuffers.color.bindTexture(gl.TEXTURE0, "color");
    this.programs.fxaa.activate();
    this.drawScreenBuffer(this.programs.fxaa);	
    
    
    if (hud != undefined)
    {
        this.programs.fullScr.activate();
        hud.draw(this.programs.fullScr);
        this.programs.fullScr.deactivate();
        
        this.frameBuffers.objidHud.bindBuffer();
        this.programs.objidscr.activate();
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
        hud.draw( this.programs.objidscr ); 
        this.programs.objidscr.deactivate();
    }
}; 

GRenderPhongStrategy.tempObjIdA = new Uint8Array(4);

/**
 * Get the object id of the object at the provided mouse location
 * @param {number}
 * @param {number}
 */
GRenderPhongStrategy.prototype.getObjectIdAt = function ( x, y )
{
    this.frameBuffers.objid.getColorValueAt(x, y, GRenderPhongStrategy.tempObjIdA);
    
    return ( GRenderPhongStrategy.tempObjIdA[0] << 16 |
             GRenderPhongStrategy.tempObjIdA[1] << 8  |
             GRenderPhongStrategy.tempObjIdA[2] );
};

/**
 * Get the object id of the object at the provided mouse location
 * @param {number}
 * @param {number}
 */
GRenderPhongStrategy.prototype.getHudObjectIdAt = function ( x, y )
{
    this.frameBuffers.objidHud.getColorValueAt(x, y, GRenderDeferredStrategy.tempObjIdA);
    
    return ( GRenderDeferredStrategy.tempObjIdA[0] << 16 |
             GRenderDeferredStrategy.tempObjIdA[1] << 8  |
             GRenderDeferredStrategy.tempObjIdA[2] );
};



