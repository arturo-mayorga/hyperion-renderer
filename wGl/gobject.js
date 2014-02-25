function GMaterial ( name )
{
	var _name = name;
	var gl = undefined;
	var _Ka = vec4.create();
	var _Kd = vec4.create();
	var _Ks = vec4.create();

	this.bindToContext = function( gl_ )
	{
		gl = gl_;
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
			gl.uniform4fv(gl.shaderProgram.Kd, _Kd);
		}
		
		if ( null != gl.shaderProgram.Ks )
		{
			gl.uniform4fv(gl.shaderProgram.Ks, _Ks);
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
}

function GObject(verts, colors, indices, name)
{
   var vertBuffer;
   var colorBuffer;
   var indexBuffer;
   var vertA = verts;
   var coloA = colors;
   var indxA = indices; 
   var mvMatrix = mat4.create(); 
   mat4.identity(mvMatrix);
   var gl = undefined;
   var _name = name;
   var _mtlName = undefined;
   var _material = undefined;

	this.setMtlName = function( mName )
	{
		_mtlName = mName;
		_material = undefined;
	}
   
   this.setMvMatrix = function(mat)
   {
		mat4.copy(mvMatrix, mat);
   }
   
   this.bindToContext = function(gl_)
   {
		if (gl_ == undefined) return;
		gl = gl_;
		vertBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertA), gl.STATIC_DRAW);
		vertBuffer.itemSize = 3;
		vertBuffer.numItems = vertA.length/3;

		colorBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coloA), gl.STATIC_DRAW);
		colorBuffer.itemSize = 3;
		colorBuffer.numItems = coloA.length/3;
		
		indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indxA), gl.STATIC_DRAW);
		indexBuffer.itemSize = 1;
		indexBuffer.numItems = indxA.length;

		vertA = undefined;
		coloA = undefined;
		indxA = indxA;
   }
   
   var _drawMvMatrix = mat4.create();
   
   this.draw = function(parentMvMat, materials)
   {
		if (gl.shaderProgram.vertexPositionAttribute > -1)
		{
			gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
			gl.vertexAttribPointer(gl.shaderProgram.vertexPositionAttribute, vertBuffer.itemSize, gl.FLOAT, false, 0, 0);
		}

		if (gl.shaderProgram.vertexNormalAttribute > -1)
		{
			gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
			gl.vertexAttribPointer(gl.shaderProgram.vertexNormalAttribute, colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
		}
		
		if ( null != gl.shaderProgram.mvMatrixUniform )
		{
			mat4.multiply(_drawMvMatrix, parentMvMat, mvMatrix);
			gl.uniformMatrix4fv(gl.shaderProgram.mvMatrixUniform, false, _drawMvMatrix);
		}
		
		if ( _material == undefined &&
			 _mtlName != undefined )
		{
			_material = materials[_mtlName];
		}
		
		if ( _material != undefined )
		{
			_material.draw();
		}
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.drawElements(gl.TRIANGLES, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
   }
}

