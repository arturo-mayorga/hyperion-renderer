
/**
 * @constructor
 */
function GTexture( mtlargs, path ) 
{
	this.scale = vec2.fromValues(1, 1);
	
	
    this.path = path;
    
    var aLen = mtlargs.length;
    for (var i = 0; i < aLen; ++i)
    {
        if ( mtlargs[i] == "-s" )
        {
            this.scale[0] = parseFloat(mtlargs[++i]);
            this.scale[1] = parseFloat(mtlargs[++i]);
        }
        else
        {
            this.name = mtlargs[i];
        }
    }
}
	
GTexture.prototype.draw = function(glTextureTarget, textureUniform, scaleUniform)
{    
    if (this.glTHandle != undefined)
    {
        if ( null != textureUniform )
        {
            this.gl.activeTexture(glTextureTarget);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.glTHandle);
            this.gl.uniform1i(textureUniform, 0);
        }
        
        if ( null != scaleUniform )
        {
            this.gl.uniform2fv(scaleUniform, this.scale);
        }
    }
}

GTexture.prototype.release = function()
{
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
}

GTexture.prototype.bindToContext = function( gl )
{
    this.gl = gl;
    
    this.loadTexture();
}

GTexture.prototype.getName = function()
{
    return this.name;
}

GTexture.prototype.loadTexture = function() 
{
    var _this = this;
    
    this.image = new Image();
    this.image.onload = this.handleTextureLoaded.bind(this);
    this.image.src = this.path+this.name;
}

GTexture.prototype.handleTextureLoaded = function() 
{
    if (this.gl !== undefined)
    {
        this.sendTextureToGl();
    }
    
    this.image.loaded = true;
}

GTexture.prototype.sendTextureToGl = function()
{
    var _gl = this.gl;
    this.glTHandle = _gl.createTexture();
    
    _gl.bindTexture(_gl.TEXTURE_2D, this.glTHandle);
    _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, this.image);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.LINEAR);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR_MIPMAP_NEAREST);
    _gl.generateMipmap(_gl.TEXTURE_2D);
    _gl.bindTexture(_gl.TEXTURE_2D, null);
}
	
