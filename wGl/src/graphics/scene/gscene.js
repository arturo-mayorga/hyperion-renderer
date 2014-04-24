/**
 * @constructor
 */
function GLight()
{
    this.position  = vec3.create();
    this.color     = vec3.create();
    this.uPosition = vec3.create();
    this.index = 0;
}

GLight.prototype.bindToContext = function( gl )
{
    this.gl = gl;
};

GLight.prototype.draw = function (parentMvMat, shader)
{
    vec3.transformMat4(this.uPosition, this.position, parentMvMat);
    
    var uniform =  null;
    
    switch (this.index)
    {
        case 0: uniform = shader.uniforms.lightPosition0; break;
        case 1: uniform = shader.uniforms.lightPosition1; break;
        case 2: uniform = shader.uniforms.lightPosition2; break;
        case 3: uniform = shader.uniforms.lightPosition3; break;
        case 4: uniform = shader.uniforms.lightPosition4; break;
        case 5: uniform = shader.uniforms.lightPosition5; break;
        case 6: uniform = shader.uniforms.lightPosition6; break;
        case 7: uniform = shader.uniforms.lightPosition7; break;
        case 8: uniform = shader.uniforms.lightPosition8; break;
    }
    
    if ( null != uniform )
    {
        this.gl.uniform3fv(uniform, this.uPosition);
    }
    
};



/**
 * @constructor
 */
function GScene()
{
	var gl = undefined;
	var _children = [];
	var _eyeMvMatrix = mat4.create();
	
	var _materials = {};
	
	var camera;
	
	this.getChildren = function()
	{
		return _children;
	}
	
	this.bindToContext = function(gl_)
	{
		gl = gl_;
		
		this.drawMode = gl.TRIANGLES;
		
		camera.bindToContext(gl);
		var childCount = _children.length;
		for (var i = 0; i < childCount; ++i)
		{
			_children[i].bindToContext(gl);
		}
		
		for (var key in _materials)
		{
			_materials[key].bindToContext(gl);
		}
	}
	
	
	this.draw = function( shader )
	{
		camera.draw(_eyeMvMatrix, shader);
		
	    var childCount = _children.length;
		for (var i = 0; i < childCount; ++i)
		{
			_children[i].draw(_eyeMvMatrix, _materials, shader, this.drawMode);
		}
	}
	
	this.setDrawMode = function( mode )
	{
	    this.drawMode = mode;
	};
	
	this.addMaterial = function( mat )
	{
		mat.bindToContext(gl);
		_materials[mat.getName()] = mat;
	}
	
	this.addChild = function(child)
	{
		child.bindToContext(gl);
		_children.push(child);
	}
	
	this.setCamera = function(camera_)
	{
		camera = camera_;
	}
	
	this.getCamera = function()
	{
		return camera;
	}
}

