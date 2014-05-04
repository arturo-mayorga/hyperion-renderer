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

GLight.prototype.setIndex = function ( index )
{
    this.index = index;
};

GLight.prototype.setPosition = function( x, y, z )
{
    this.position[0] = x;
    this.position[1] = y;
    this.position[2] = z;
};

GLight.prototype.getPosition = function( position )
{
    position[0] = this.position[0];
    position[1] = this.position[1];
    position[2] = this.position[2];
};

GLight.prototype.bindToContext = function( gl )
{
    this.gl = gl;
};

GLight.prototype.draw = function ( parentMvMat, shader )
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
	
	this.camera = undefined;
}

GScene.prototype.getChildren = function()
{
    return this.children;
};

GScene.prototype.getLights = function()
{
    return this.lights;
};

GScene.prototype.bindToContext = function( gl )
{
    this.gl = gl;
    
    this.drawMode = gl.TRIANGLES;
    
    this.camera.bindToContext( gl );
    var childCount = this.children.length;
    for (var i = 0; i < childCount; ++i)
    {
        this.children[i].bindToContext( gl );
    }
    
    for (var key in this.materials)
    {
        this.materials[key].bindToContext( gl );
    }
};

GScene.prototype.drawLights = function ( shader )
{
    var lightCount = this.lights.length;
    for (var l = 0; l < lightCount; ++l)
    {
        this.lights[l].draw( this.eyeMvMatrix, shader );
    }
};

GScene.prototype.drawGeometry = function ( parentMvMatrix, shader )
{
    var childCount = this.children.length;
    for (var i = 0; i < childCount; ++i)
    {
        this.children[i].draw( parentMvMatrix, this.materials, shader, this.drawMode );
    }
};

GScene.prototype.drawThroughCamera = function ( camera, shader )
{
    camera.draw( this.eyeMvMatrix, shader );    
    this.drawLights( shader );    
    this.drawGeometry( this.eyeMvMatrix, shader );
};


GScene.prototype.draw = function( shader )
{
    this.camera.draw( this.eyeMvMatrix, shader );
    this.drawLights( shader );
    this.drawGeometry( this.eyeMvMatrix, shader );
};

GScene.prototype.setDrawMode = function( mode )
{
    this.drawMode = mode;
};

GScene.prototype.addLight = function( light )
{
    light.bindToContext( this.gl );
    light.setIndex( this.lights.length );
    this.lights.push( light );
};

GScene.prototype.addMaterial = function( mat )
{
    var gl = this.gl;
    mat.bindToContext( gl );
    this.materials[mat.getName()] = mat;
};

GScene.prototype.addChild = function( child )
{
    child.bindToContext(this.gl);
    this.children.push(child);
};

GScene.prototype.setCamera = function( camera )
{
    this.camera = camera;
};

GScene.prototype.getCamera = function()
{
    return this.camera;
};

