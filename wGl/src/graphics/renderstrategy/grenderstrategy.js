/** 
 * @constructor
 */
function GRenderStrategy( gl, shaderSrcMap )
{
    this.gl = gl;
    
    this.initTextureFramebuffer();
    this.initShaders(shaderSrcMap);
    
    this.initScreenVBOs();
}

GRenderStrategy.prototype.initScreenVBOs = function()
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

GRenderStrategy.prototype.initTextureFramebuffer = function()
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

GRenderStrategy.prototype.initShaders = function (shaderSrcMap) 
{
    var gl = this.gl;
      
    var phong = new GShader(shaderSrcMap["phong-vs.c"], shaderSrcMap["phong-fs.c"]);
    phong.bindToContext(gl);
    
    var fullScr = new GShader(shaderSrcMap["fullscr-vs.c"], shaderSrcMap["fullscr-fs.c"]);
    fullScr.bindToContext(gl);
    
    this.fullScreenProgram = fullScr;
    this.phongShader = phong;
};

GRenderStrategy.prototype.drawScreenBuffer = function(shader)
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

GRenderStrategy.prototype.draw = function ( scene, hud )
{
    var gl = this.gl;
    this.phongShader.activate();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFramebuffer);
    gl.viewport(0, 0, 1024, 1024);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);	
    scene.draw(this.phongShader);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.phongShader.deactivate();
    
    this.fullScreenProgram.activate();
    
    this.drawScreenBuffer(this.fullScreenProgram);	
    
    if (hud != undefined)
    {
        hud.draw(this.fullScreenProgram);
    }
    this.fullScreenProgram.deactivate();
};





