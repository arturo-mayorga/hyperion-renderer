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

GLight.prototype.setPosition = function( x, y, z )
{
    this.uPosition[0] = x;
    this.uPosition[1] = y;
    this.uPosition[2] = z;
};

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
	this.gl = undefined;
	this.children = [];
	this.eyeMvMatrix = mat4.create();
	
	this.materials = {};
	this.lights = [];
	
	this.camera;
}
	
GScene.prototype.addLight = function( light )
{
    this.lights.push( light );
};

GScene.prototype.getChildren = function()
{
    return this.children;
};

GScene.prototype.bindToContext = function(gl)
{
    this.gl = gl;
    
    this.drawMode = gl.TRIANGLES;
    
    this.camera.bindToContext(gl);
    var childCount = this.children.length;
    for (var i = 0; i < childCount; ++i)
    {
        this.children[i].bindToContext(gl);
    }
    
    for (var key in this.materials)
    {
        this.materials[key].bindToContext(gl);
    }
};


GScene.prototype.draw = function( shader )
{
    this.camera.draw(this.eyeMvMatrix, shader);
    
    var childCount = this.children.length;
    for (var i = 0; i < childCount; ++i)
    {
        this.children[i].draw(this.eyeMvMatrix, this.materials, shader, this.drawMode);
    }
};

GScene.prototype.setDrawMode = function( mode )
{
    this.drawMode = mode;
};

GScene.prototype.addMaterial = function( mat )
{
    var gl = this.gl;
    mat.bindToContext(gl);
    this.materials[mat.getName()] = mat;
};

GScene.prototype.addChild = function(child)
{
    child.bindToContext(this.gl);
    this.children.push(child);
};

GScene.prototype.setCamera = function(camera)
{
    this.camera = camera;
};

GScene.prototype.getCamera = function()
{
    return this.camera;
};

