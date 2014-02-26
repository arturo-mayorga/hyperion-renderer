function GObject(verts, tverts, normals, indices, name)
{
   var vertBuffer;
   var tverBuffer;
   var normlBuffer;
   var indexBuffer;
   var vertA = verts;
   var tverA = tverts;
   var normA = normals;
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
		
		tverBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, tverBuffer); 
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tverA), gl.STATIC_DRAW);
		tverBuffer.itemSize = 2;
		tverBuffer.numItems = tverA.length/2;

		normlBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, normlBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normA), gl.STATIC_DRAW);
		normlBuffer.itemSize = 3;
		normlBuffer.numItems = normA.length/3;
		
		indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indxA), gl.STATIC_DRAW);
		indexBuffer.itemSize = 1;
		indexBuffer.numItems = indxA.length;
		
		if (indexBuffer.numItems !=  normlBuffer.numItems  ||
		    indexBuffer.numItems !=  tverBuffer.numItems || 
		    indexBuffer.numItems != vertBuffer.numItems)
		{
		    console.debug("gObject: index missmatch [" + _name + "]");
		    _valid = false;
		}
   }
   
   var _valid = true;
   var _drawMvMatrix = mat4.create();
   
   this.draw = function(parentMvMat, materials)
   {
       if ( !_valid ) return;
       
		if (gl.shaderProgram.positionVertexAttribute > -1)
		{
			gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
			gl.vertexAttribPointer(gl.shaderProgram.positionVertexAttribute, 
			                       vertBuffer.itemSize, gl.FLOAT, false, 0, 0);
		}

		if (gl.shaderProgram.normalVertexAttribute > -1)
		{
			gl.bindBuffer(gl.ARRAY_BUFFER, normlBuffer);
			gl.vertexAttribPointer(gl.shaderProgram.normalVertexAttribute, 
			                       normlBuffer.itemSize, gl.FLOAT, false, 0, 0);
		}
		
		if (gl.shaderProgram.textureVertexAttribute > -1)
		{
			gl.bindBuffer(gl.ARRAY_BUFFER, tverBuffer);
			gl.vertexAttribPointer(gl.shaderProgram.textureVertexAttribute, 
			                       tverBuffer.itemSize, gl.FLOAT, false, 0, 0);
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
		
		if (indexBuffer.numItems !=  normlBuffer.numItems  ||
		    indexBuffer.numItems !=  tverBuffer.numItems || 
		    indexBuffer.numItems != vertBuffer.numItems)
		{
		    console.debug("gObject: index missmatch [" + _name + "]");
		    _valid = false;
		}
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.drawElements(gl.TRIANGLES, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
   }
}

