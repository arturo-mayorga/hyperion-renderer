/**
 * @constructor
 */
function GContext(canvas, shaderSrcMap)
{
	this.scene            = undefined;
	this.gl               = undefined;
	this.rttFramebuffer   = undefined;
	this.rttTexture       = undefined;
	this.screenVertBuffer = undefined;
	this.screenTextBuffer = undefined;
	this.screenIndxBuffer = undefined;
	this.currentProgram   = undefined;
	
	var whiteTexture = new GTexture(["white.jpg"], "assets/2d/");
    
    this.gl = canvas.getContext("experimental-webgl", { antialias: true } );
	
    var gl = this.gl;
    
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    
    this.initTextureFramebuffer();
    this.initShaders(shaderSrcMap);
    
    gl.clearColor(0.1, 0.3, 0.1, 1.0);
    gl.enable(gl.DEPTH_TEST);
    
    
    this.screenVertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.screenVertBuffer);
    
    gl.bufferData(gl.ARRAY_BUFFER,
                  new Float32Array([-1,-1,0,
                                    1,-1,0,
                                    1,1,0,
                                    -1,1,0]),
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
    
    whiteTexture.bindToContext(gl);
    gl.whiteTexture = whiteTexture;
	
}
	
GContext.prototype.setScene = function (scene_)
{
    this.scene = scene_;
    this.scene.bindToContext(this.gl);
}

GContext.prototype.draw = function()
{
    var gl = this.gl;
    this.bindShader(gl.shaderProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFramebuffer);
    gl.viewport(0, 0, 1024, 1024);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);	
    scene.draw();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    this.drawScreenBuffer();	
}

GContext.prototype.drawScreenBuffer = function()
{
    var gl = this.gl;
	
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    this.bindShader(gl.fullscreenProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.rttTexture);
    gl.uniform1i(gl.fullscreenProgram.map_Kd, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.screenVertBuffer);
    gl.vertexAttribPointer(gl.fullscreenProgram.positionVertexAttribute, 
                           this.screenVertBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.screenTextBuffer);
    gl.vertexAttribPointer(gl.fullscreenProgram.textureVertexAttribute, 
                           this.screenTextBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.screenIndxBuffer);
    gl.drawElements(gl.TRIANGLES, this.screenIndxBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

GContext.prototype.initTextureFramebuffer = function()
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
}

GContext.prototype.bindShader = function(shaderProgram)
{
    var gl = this.gl;
    
    if (this.currentProgram != undefined)
	{
		if ( -1 < this.currentProgram.positionVertexAttribute)
		{
			gl.disableVertexAttribArray(this.currentProgram.positionVertexAttribute);
		}
		
		if ( -1 < this.currentProgram.textureVertexAttribute)
		{
			gl.disableVertexAttribArray(this.currentProgram.textureVertexAttribute);
		}
	
		if ( -1 < this.currentProgram.normalVertexAttribute)
		{
			gl.disableVertexAttribArray(this.currentProgram.normalVertexAttribute);
		}
	}
    
    gl.useProgram(shaderProgram);
    this.currentProgram = shaderProgram;

    if ( -1 < (shaderProgram.positionVertexAttribute = 
         gl.getAttribLocation(shaderProgram, "aPositionVertex")))
    {
        gl.enableVertexAttribArray(shaderProgram.positionVertexAttribute);
    }
    
    if ( -1 < (shaderProgram.textureVertexAttribute = 
         gl.getAttribLocation(shaderProgram, "aTextureVertex")))
    {
        gl.enableVertexAttribArray(shaderProgram.textureVertexAttribute);
    }

    if ( -1 < (shaderProgram.normalVertexAttribute = 
         gl.getAttribLocation(shaderProgram, "aNormalVertex")))
    {
        gl.enableVertexAttribArray(shaderProgram.normalVertexAttribute);
    }
        
    
    shaderProgram.pMatrixUniform  = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.nMatrixUniform  = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.Ka              = gl.getUniformLocation(shaderProgram, "uKa");
    shaderProgram.Kd              = gl.getUniformLocation(shaderProgram, "uKd");
    shaderProgram.mapKd           = gl.getUniformLocation(shaderProgram, "uMapKd");
    shaderProgram.mapKdScale      = gl.getUniformLocation(shaderProgram, "uMapKdScale");
    shaderProgram.Ks              = gl.getUniformLocation(shaderProgram, "uKs");
    
}

GContext.prototype.createShaderProgram = function (vertex, fragment)
{
    var gl = this.gl;
    var fragmentShader = this.getShader(fragment, gl.FRAGMENT_SHADER);
    var vertexShader = this.getShader(vertex, gl.VERTEX_SHADER);

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) 
    {
        alert("Could not initialise shaders");
    }
    
    
    return shaderProgram;
}

GContext.prototype.initShaders = function (shaderSrcMap) 
{
    var gl = this.gl;
    gl.shaderProgram = this.createShaderProgram(shaderSrcMap["phong-vs.c"], shaderSrcMap["phong-fs.c"]);
    
    gl.fullscreenProgram = this.createShaderProgram(shaderSrcMap["fullscr-vs.c"], shaderSrcMap["fullscr-fs.c"]);
}

GContext.prototype.getShader = function (shaderScript, shaderType) 
{
    var gl = this.gl;
    var shader;
    shader = gl.createShader(shaderType);

    gl.shaderSource(shader, shaderScript);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}


