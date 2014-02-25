function GTexture( mtlargs, path ) 
{
    var _scale;
	var _name;
	var _gl;
	var _glTHandle;
	var _image;
	var _path;
	var _xScale;
	var _yScale;
	
	function init_GTexture( a, path )
	{
		_path = path;
		_scale = 1;
		
		var aLen = a.length;
		for (var i = 0; i < aLen; ++i)
		{
			if ( a[i] == "s" )
			{
				_xScale = parseFloat(a[++i]);
				_yScale = parseFloat(a[++i]);
			}
			else
			{
				_name = a[i];
			}
		}
	}
	
	this.bind = function()
	{
		_gl.bindTexture(gl.TEXTURE_2D, _glHandle);
	}
	
	this.release = function()
	{
		_gl.bindTexture(gl.TEXTURE_2D, null);
	}
	
	this.bindToContext = function( gl_ )
	{
		_gl = gl_;
		_glHandle = _gl.createTexture();
		
		loadTexture();
	}
	
	this.getName = function()
	{
	    return _name;
	}
	
	function loadTexture() 
	{
		_image = new Image();
		_image.onload = handleTextureLoaded;
		_image.src = _path+_name;
	}

	function handleTextureLoaded() 
	{
		if (_gl !== undefined)
		{
			sendTextureToGl();
		}
		
		_image.loaded = true;
	}
	
	function sendTextureToGl()
	{
		_gl.bindTexture(_gl.TEXTURE_2D, _glHandle);
		_gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, _image);
		_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.LINEAR);
		_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR_MIPMAP_NEAREST);
		_gl.generateMipmap(_gl.TEXTURE_2D);
		_gl.bindTexture(_gl.TEXTURE_2D, null);
	}
	
	init_GTexture( mtlargs, path );
}