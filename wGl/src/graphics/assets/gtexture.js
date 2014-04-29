
/**
 * @constructor
 */
function GTexture( mtlargs, path ) 
{
	this.scale = vec2.fromValues(1, 1);
    this.path = path;
    this.processArgs( mtlargs );
}

GTexture.prototype.processArgs = function( args )
{
    if ( undefined == args ) return;
    
    var aLen = args.length;
    for (var i = 0; i < aLen; ++i)
    {
        if ( args[i] == "-s" )
        {
            this.scale[0] = parseFloat(args[++i]);
            this.scale[1] = parseFloat(args[++i]);
        }
        else
        {
            this.name = args[i];
        }
    }
};
	
GTexture.prototype.draw = function(glTextureTarget, textureUniform, scaleUniform)
{    
    if (undefined != this.glTHandle &&
        undefined != glTextureTarget )
    {
        this.gl.activeTexture(glTextureTarget);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.glTHandle);
        
        if ( null != textureUniform )
        {    
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
    if ( undefined != this.path &&
         undefined != this.name )
    {
        this.image = new Image();
        this.image.onload = this.handleTextureLoaded.bind(this);
        this.image.src = this.path+this.name;
    }
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

GTexture.prototype.setTextureHandle = function( handle )
{
    this.glTHandle = handle;
};
	
