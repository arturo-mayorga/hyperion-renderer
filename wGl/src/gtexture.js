function GTexture( mtlargs, path ) 
{
	var _name;
	var _gl;
	var _glTHandle;
	var _image;
	var _path;
	var _scale = vec2.fromValues(1, 1);
	
	function init_GTexture( a, path )
	{
		_path = path;
		
		var aLen = a.length;
		for (var i = 0; i < aLen; ++i)
		{
			if ( a[i] == "-s" )
			{
				_scale[0] = parseFloat(a[++i]);
				_scale[1] = parseFloat(a[++i]);
			}
			else
			{
				_name = a[i];
			}
		}
	}
	
	this.draw = function(glTextureTarget, textureUniform, scaleUniform)
	{    
	    if (_glTHandle != undefined)
	    {
	        if ( null != textureUniform )
	        {
                _gl.activeTexture(glTextureTarget);
                _gl.bindTexture(_gl.TEXTURE_2D, _glTHandle);
                _gl.uniform1i(textureUniform, 0);
	        }
	        
	        if ( null != scaleUniform )
	        {
	            _gl.uniform2fv(scaleUniform, _scale);
	        }
		}
	}
	
	this.release = function()
	{
		_gl.bindTexture(_gl.TEXTURE_2D, null);
	}
	
	this.bindToContext = function( gl_ )
	{
		_gl = gl_;
		
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
	    
		_glTHandle = _gl.createTexture();
	   // console.debug("binding: " + _glTHandle + " to " + _name);
		_gl.bindTexture(_gl.TEXTURE_2D, _glTHandle);
		_gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, _image);
		_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.LINEAR);
		_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR_MIPMAP_NEAREST);
		_gl.generateMipmap(_gl.TEXTURE_2D);
		_gl.bindTexture(_gl.TEXTURE_2D, null);
	}
	
	init_GTexture( mtlargs, path );
}