
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
			_children[i].draw(_eyeMvMatrix, _materials, shader);
		}
	}
	
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

