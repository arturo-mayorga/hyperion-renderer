function GMaterial ( name )
{
	var _name = name;
	var gl = undefined;
	var _Ka = vec4.create();
	var _Kd = vec4.create();
	var _Ks = vec4.create();
	var _mapKd = undefined;

	this.bindToContext = function( gl_ )
	{
		gl = gl_;
		
		if (_mapKd != undefined) {_mapKd.bindToContext(gl);}
	}
	
	this.getName = function()
	{
		return _name;
	}
	
	this.draw = function()
	{
		if ( null != gl.shaderProgram.Ka )
		{
			gl.uniform4fv(gl.shaderProgram.Ka, _Ka);
		}
		
		if ( null != gl.shaderProgram.Kd )
		{
		    _Kd[3] = (_mapKd==undefined)?1.0:0.0;
			gl.uniform4fv(gl.shaderProgram.Kd, _Kd);
		}
		
		if ( null != gl.shaderProgram.Ks )
		{
			gl.uniform4fv(gl.shaderProgram.Ks, _Ks);
		}
		
		if ( _mapKd != undefined)
		{
            gl.activeTexture(gl.TEXTURE0);
            _mapKd.bind();
            gl.uniform1i(gl.shaderProgram.texture0, 0);
		}
		else
		{
		    gl.whiteTexture.bind();
		    //gl.bindTexture(gl.TEXTURE_2D, null);
		}
	}
	
	this.setKd = function( Kd_ )
	{
		_Kd[0] = Kd_[0];
		_Kd[1] = Kd_[1];
		_Kd[2] = Kd_[2];
		_Kd[3] = 1.0;
	}
	
	this.setKs = function( Ks_ )
	{
		_Ks[0] = Ks_[0];
		_Ks[1] = Ks_[1];
		_Ks[2] = Ks_[2];
		_Ks[3] = 1.0;
	}
	
	this.setKa = function( Ka_ )
	{
		_Ka[0] = Ka_[0];
		_Ka[1] = Ka_[1];
		_Ka[2] = Ka_[2];
		_Ka[3] = 1.0;
	}
	
	this.setMapKd = function( texture )
	{
	    _mapKd = texture;
	}
}

