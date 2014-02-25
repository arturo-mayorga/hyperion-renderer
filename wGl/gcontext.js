function GContext(canvas)
{
	var scene;
	var gl;
	var rttFramebuffer;
	var rttTexture;
	
	var screenVertBuffer;
	var screenTextBuffer;
	var screenIndxBuffer;
	
	this.setScene = function (scene_)
	{
		scene = scene_;
		scene.bindToContext(gl);
	}
	
	this.draw = function()
	{
		bindShader(gl.shaderProgram);
		gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
        gl.viewport(0, 0, 512, 512);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);	
		scene.draw();
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		bindShader(gl.fullscreenProgram);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, rttTexture);
		gl.uniform1i(gl.fullscreenProgram.samplerUniform, gl.fullscreenProgram.texture0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, screenVertBuffer);
		gl.vertexAttribPointer(gl.fullscreenProgram.vertexPositionAttribute, screenVertBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, screenTextBuffer);
		gl.vertexAttribPointer(gl.fullscreenProgram.vertexTextureAttribute, screenTextBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, screenIndxBuffer);
		gl.drawElements(gl.TRIANGLES, screenIndxBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
	}

    function init_GContext(canvas)
	{
		gl = canvas.getContext("experimental-webgl", { antialias: true } );
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
		
		initTextureFramebuffer();
		initShaders();
		
		gl.clearColor(0.5, 0.7, 0.5, 1.0);
		gl.enable(gl.DEPTH_TEST);
		
		
		screenVertBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, screenVertBuffer);
        
        gl.bufferData(gl.ARRAY_BUFFER,
					  new Float32Array([-1,-1,0,
										1,-1,0,
										1,1,0,
										-1,1,0]),
					  gl.STATIC_DRAW);
        
		screenVertBuffer.itemSize = 3;
		screenVertBuffer.numItems = 4;
		
		screenTextBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, screenTextBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, 
					  new Float32Array([0,0,  
										1,0,  
										1,1,  
										0,1]), 
					  gl.STATIC_DRAW);
		screenTextBuffer.itemSize = 2;
		screenTextBuffer.numItems = 4;
		
		screenIndxBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, screenIndxBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, 
					  new Uint16Array([0, 1, 2, 2, 3, 0]),
					  gl.STATIC_DRAW);
		screenIndxBuffer.itemSize = 1;
		screenIndxBuffer.numItems = 6;
	}
	
	function initTextureFramebuffer()
	{
		rttFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
        rttFramebuffer.width = 512;
        rttFramebuffer.height = 512;
        
        rttTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, rttTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rttFramebuffer.width, rttFramebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        
        var renderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, rttFramebuffer.width, rttFramebuffer.height);
        
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
        
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
        {
            alert("incomplete famebuffer");
        }
        
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
        
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}
	var _currentProgram;
	function bindShader(shaderProgram)
	{
		if ( _currentProgram != undefined )
		{
			/*if ( -1 < shaderProgram.vertexPositionAttribute )
			{
				gl.disableVertexAttribArray(shaderProgram.vertexPositionAttribute);
			}
			
			if ( -1 < shaderProgram.vertexTextureAttribute )
			{
				gl.disableVertexAttribArray(shaderProgram.vertexTextureAttribute);
			}

			if ( -1 < shaderProgram.vertexNormalAttribute )
			{
				gl.disableVertexAttribArray(shaderProgram.vertexNormalAttribute);
			}*/
		}

	
		gl.useProgram(shaderProgram);
		_currentProgram = shaderProgram;

		if ( -1 < (shaderProgram.vertexPositionAttribute = 
		     gl.getAttribLocation(shaderProgram, "aVertexPosition")))
		{
			gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
		}
		
		if ( -1 < (shaderProgram.vertexTextureAttribute = 
		     gl.getAttribLocation(shaderProgram, "aVertexTexture")))
		{
			gl.enableVertexAttribArray(shaderProgram.vertexTextureAttribute);
		}

		if ( -1 < (shaderProgram.vertexNormalAttribute = 
		     gl.getAttribLocation(shaderProgram, "aVertexNormal")))
		{
			gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
		}
			
		shaderProgram.texture0 = gl.getUniformLocation(shaderProgram, "texture0");
		shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
		shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
		shaderProgram.Ka = gl.getUniformLocation(shaderProgram, "Ka");
		shaderProgram.Kd = gl.getUniformLocation(shaderProgram, "Kd");
		shaderProgram.Ks = gl.getUniformLocation(shaderProgram, "Ks");
		
	}
	
	function createShaderProgram(vertex, fragment)
	{
		var fragmentShader = getShader(gl, fragment);
		var vertexShader = getShader(gl, vertex);

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
	
	function initShaders() 
	{
		
		gl.shaderProgram = createShaderProgram("shader-vs", "shader-fs");
		
		gl.fullscreenProgram = createShaderProgram("fullscreen-vs", "fullscreen-fs");
	}
	
	function getShader(gl, id) 
	{
		var shaderScript = document.getElementById(id);
		if (!shaderScript) {
			return null;
		}

		var str = "";
		var k = shaderScript.firstChild;
		while (k) {
			if (k.nodeType == 3) {
				str += k.textContent;
			}
			k = k.nextSibling;
		}

		var shader;
		if (shaderScript.type == "x-shader/x-fragment") {
			shader = gl.createShader(gl.FRAGMENT_SHADER);
		} else if (shaderScript.type == "x-shader/x-vertex") {
			shader = gl.createShader(gl.VERTEX_SHADER);
		} else {
			return null;
		}

		gl.shaderSource(shader, str);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			alert(gl.getShaderInfoLog(shader));
			return null;
		}

		return shader;
	}
	
	init_GContext(canvas);
}

