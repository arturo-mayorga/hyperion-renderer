/**
 * @constructor
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
}

GMaterial.prototype.getName = function()
{
    return this.name;
}

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
    
    
}

GMaterial.prototype.setKd = function( Kd_ )
{
    this.Kd[0] = Kd_[0];
    this.Kd[1] = Kd_[1];
    this.Kd[2] = Kd_[2];
    this.Kd[3] = 1.0;
}

GMaterial.prototype.setKs = function( Ks_ )
{
    this.Ks[0] = Ks_[0];
    this.Ks[1] = Ks_[1];
    this.Ks[2] = Ks_[2];
    this.Ks[3] = 1.0;
}

GMaterial.prototype.setKa = function( Ka_ )
{
    this.Ka[0] = Ka_[0];
    this.Ka[1] = Ka_[1];
    this.Ka[2] = Ka_[2];
    this.Ka[3] = 1.0;
}

GMaterial.prototype.setMapKd = function( texture )
{
    this.mapKd = texture;
}
