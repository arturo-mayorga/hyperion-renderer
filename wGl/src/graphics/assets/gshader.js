/**
 * @constructor
 * @param {string} Source for the vertex shader
 * @param {string} Source for the fragment shader
 */
function GShader(vertex, fragment)
{
    this.vertex = vertex;
    this.fragment = fragment;
}

/**
 * Create the shader object and send to the GPU. This has to be called once for
 * the vertex shader and once for the fragment shader.
 * @param {string} source for this shader
 * @param {number} Constant containing the shader type
 * @return {WebGLShader}
 */
GShader.prototype.getShader = function (shaderScript, shaderType) 
{
    var gl = this.gl;
    var shader;
    shader = gl.createShader(shaderType);

    gl.shaderSource(shader, shaderScript);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) 
    {
        console.debug(shaderScript);
        console.debug(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
};

/**
 * Destroy this shader and return the system resource to the GPU.
 * NOTE: once this function is used the GShader object
 * is no longer valid and should be discarted
 */
GShader.prototype.destroy = function ()
{
    var gl = this.gl;
    
    gl.detachShader(this.glProgram, this.vShader);
    gl.detachShader(this.glProgram, this.fShader);
    gl.deleteProgram(this.glProgram);
    gl.deleteShader(this.vShader);
    gl.deleteShader(this.fShader);
};

/**
 * Called to bind this shader program to a gl context
 * @param {WebGLRenderingContext} Context to bind to this texture
 */
GShader.prototype.bindToContext = function ( gl )
{
    this.gl = gl;
    
    var fragmentShader = this.getShader(this.fragment, gl.FRAGMENT_SHADER);
    var vertexShader = this.getShader(this.vertex, gl.VERTEX_SHADER);

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) 
    { 
        console.debug(gl.getProgramInfoLog(shaderProgram));
        console.debug("Could not initialise shaders");
    }
    
    var attr = {};
    attr.positionVertexAttribute = gl.getAttribLocation( shaderProgram, "aPositionVertex" );
    attr.textureVertexAttribute  = gl.getAttribLocation( shaderProgram, "aTextureVertex" );
    attr.normalVertexAttribute   = gl.getAttribLocation( shaderProgram, "aNormalVertex" );
    
    var uniforms = {};
    uniforms.pMatrixUniform  = gl.getUniformLocation( shaderProgram, "uPMatrix" );
    uniforms.mvMatrixUniform = gl.getUniformLocation( shaderProgram, "uMVMatrix" );
    uniforms.nMatrixUniform  = gl.getUniformLocation( shaderProgram, "uNMatrix" );
    uniforms.hMatrixUniform  = gl.getUniformLocation( shaderProgram, "uHMatrix" );
    uniforms.Ka              = gl.getUniformLocation( shaderProgram, "uKa" );
    uniforms.Kd              = gl.getUniformLocation( shaderProgram, "uKd" );
    uniforms.mapKd           = gl.getUniformLocation( shaderProgram, "uMapKd" );
    uniforms.mapKdScale      = gl.getUniformLocation( shaderProgram, "uMapKdScale" );
    uniforms.Ks              = gl.getUniformLocation( shaderProgram, "uKs" );
    
    uniforms.mapNormal       = gl.getUniformLocation( shaderProgram, "uMapNormal" );
    uniforms.mapPosition     = gl.getUniformLocation( shaderProgram, "uMapPosition" );
    uniforms.mapShadow       = gl.getUniformLocation( shaderProgram, "uMapShadow" );
    uniforms.mapPing         = gl.getUniformLocation( shaderProgram, "uMapPing" );
    
    uniforms.lightPosition0  = gl.getUniformLocation( shaderProgram, "uLightPosition0" );
    uniforms.lightPosition1  = gl.getUniformLocation( shaderProgram, "uLightPosition1" );
    uniforms.lightPosition2  = gl.getUniformLocation( shaderProgram, "uLightPosition2" );
    uniforms.lightPosition3  = gl.getUniformLocation( shaderProgram, "uLightPosition3" );
    uniforms.lightPosition4  = gl.getUniformLocation( shaderProgram, "uLightPosition4" );
    uniforms.lightPosition5  = gl.getUniformLocation( shaderProgram, "uLightPosition5" );
    uniforms.lightPosition6  = gl.getUniformLocation( shaderProgram, "uLightPosition6" );
    uniforms.lightPosition7  = gl.getUniformLocation( shaderProgram, "uLightPosition7" );
    uniforms.lightPosition8  = gl.getUniformLocation( shaderProgram, "uLightPosition8" );
    
    uniforms.shadowMatrix    = gl.getUniformLocation( shaderProgram, "uShadowMatrix" );
    
    this.attributes = attr;
    this.uniforms = uniforms;
    this.glProgram = shaderProgram;
    this.vShader = vertexShader;
    this.fShader = fragmentShader;
}

/**
 * This needs to be called when switching to a different shader program to release
 * the attribute bindings
 */
GShader.prototype.deactivate = function()
{
    var gl = this.gl;
    
    if (this.glProgram != undefined)
	{
		if ( -1 < this.attributes.positionVertexAttribute)
		{
			gl.disableVertexAttribArray(this.attributes.positionVertexAttribute);
		}
		
		if ( -1 < this.attributes.textureVertexAttribute)
		{
			gl.disableVertexAttribArray(this.attributes.textureVertexAttribute);
		}
	
		if ( -1 < this.attributes.normalVertexAttribute)
		{
			gl.disableVertexAttribArray(this.attributes.normalVertexAttribute);
		}
	}
}

/**
 * This needs to be called when starting to use this shader program to activate
 * the attribute bindings
 */
GShader.prototype.activate = function()
{
    var gl = this.gl;
    
    gl.useProgram(this.glProgram);

    if ( -1 < this.attributes.positionVertexAttribute)
    {
        gl.enableVertexAttribArray(this.attributes.positionVertexAttribute);
    }
    
    if ( -1 < this.attributes.textureVertexAttribute)
    {
        gl.enableVertexAttribArray(this.attributes.textureVertexAttribute);
    }

    if ( -1 < this.attributes.normalVertexAttribute)
    {
        gl.enableVertexAttribArray(this.attributes.normalVertexAttribute);
    } 
}


