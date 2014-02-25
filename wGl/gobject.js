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

