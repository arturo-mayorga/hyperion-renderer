/**
 * @constructor
 * @param {string} Name for this material instance
 */
function GMaterial ( name )
{
	this.name = name;
	this.gl = undefined;
	this.Ka = vec4.create();
	this.Kd = vec4.create();
	this.Ks = vec4.create();
	this.mapKd = undefined;
}

/**
 * Called to bind this material to a gl context
 * @param {WebGLRenderingContext} Context to bind to this texture
 */
GMaterial.prototype.bindToContext = function( gl_ )
{
    this.gl = gl_;
    var gl = this.gl;
    
    if (this.mapKd != undefined) 
    {
        this.mapKd.bindToContext(gl);
    }
    else
    {
        this.mapKd = gl.whiteTexture;
    }
};

/**
 * Get the name for this material
 * @return {string} Name of this material
 */
GMaterial.prototype.getName = function()
{
    return this.name;
};

/**
 * Draw this material
 * @param {GShader} Shader program to use for drawing this material
 */
GMaterial.prototype.draw = function( shader )
{
    var gl = this.gl;
    
    if ( null != shader.uniforms.Ka )
    {
        gl.uniform4fv(shader.uniforms.Ka, this.Ka);
    }
    
    if ( null != shader.uniforms.Kd )
    {
        this.Kd[3] = (this.mapKd===gl.whiteTexture)?1.0:0.0;
        gl.uniform4fv(shader.uniforms.Kd, this.Kd);
    }
    
    this.mapKd.draw(gl.TEXTURE0, 
                shader.uniforms.mapKd,
                shader.uniforms.mapKdScale);
    
    if ( null != shader.uniforms.Ks )
    {
        gl.uniform4fv(shader.uniforms.Ks, this.Ks);
    }
};

/**
 * Set the diffuse color in RGBA format
 * @param {Array.<number>} Array containing the RGBA components for the color
 */
GMaterial.prototype.setKd = function( Kd_ )
{
    this.Kd[0] = Kd_[0];
    this.Kd[1] = Kd_[1];
    this.Kd[2] = Kd_[2];
    this.Kd[3] = 1.0;
};

/**
 * Set the specular color in RGBA format
 * @param {Array.<number>} Array containing the RGBA components for the color
 */
GMaterial.prototype.setKs = function( Ks_ )
{
    this.Ks[0] = Ks_[0];
    this.Ks[1] = Ks_[1];
    this.Ks[2] = Ks_[2];
    this.Ks[3] = 1.0;
};

/**
 * Set the ambient color in RGBA format
 * @param {Array.<number>} Array containing the RGBA components for the color
 */
GMaterial.prototype.setKa = function( Ka_ )
{
    this.Ka[0] = Ka_[0];
    this.Ka[1] = Ka_[1];
    this.Ka[2] = Ka_[2];
    this.Ka[3] = 1.0;
};

/**
 * Set the diffuse texture for this material
 * @param {GTexture} Diffuse texture for this material
 */
GMaterial.prototype.setMapKd = function( texture )
{
    this.mapKd = texture;
};
