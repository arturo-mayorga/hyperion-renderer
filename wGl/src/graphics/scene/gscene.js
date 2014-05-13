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

/**
 * Set the index for this light
 * @param {number} Index value for this light
 */
GLight.prototype.setIndex = function ( index )
{
    this.index = index;
};

/**
 * Set the position of this light
 * @param {number} X component of the light position
 * @param {number} Y component of the light position
 * @param {number} Z component of the light position
 */
GLight.prototype.setPosition = function( x, y, z )
{
    this.position[0] = x;
    this.position[1] = y;
    this.position[2] = z;
};

/**
 * Used to get the position of the light
 * @param {Array.<number>} Out param that will contain the position of the light
 */
GLight.prototype.getPosition = function( position )
{
    position[0] = this.position[0];
    position[1] = this.position[1];
    position[2] = this.position[2];
};

/**
 * Called to bind this light to a gl context
 * @param {WebGLRenderingContext} Context to bind to this light
 */
GLight.prototype.bindToContext = function( gl )
{
    this.gl = gl;
};

/**
 * @param {Array.<number>} List of numbers representing the 4 by 4 view matrix
 * @param {GShader} Shader to use to draw this light
 */
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
	
	this.tempMatrix = mat4.create();
	
	this.materials = {};
	this.lights = [];
	
	this.camera = undefined;
}

/**
 * Returns the list of children attached to the scene
 * @return {Array.<GGroup>} List of children attached to the scene
 */
GScene.prototype.getChildren = function()
{
    return this.children;
};

/**
 * Returns the list of lights attached to the scene
 * @return {Array.<GLights>} List of lights attached to the scene
 */
GScene.prototype.getLights = function()
{
    return this.lights;
};

/**
 * Called to bind this scene to a gl context
 * @param {WebGLRenderingContext} Context to bind to this scene
 */
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

/**
 * Draw the lights on this scene
 * @param {GShader} Shader to use for drawing the lights
 */
GScene.prototype.drawLights = function ( shader )
{
    var lightCount = this.lights.length;
    for (var l = 0; l < lightCount; ++l)
    {
        this.lights[l].draw( this.eyeMvMatrix, shader );
    }
};

/**
 * Draw the geometry using the provided view matrix and shader
 * @param {Array.<number>} Array of numbers that represent the 4 by 4 view matrix
 * @param {GShader} Shader program to use for rendering
 */
GScene.prototype.drawGeometry = function ( parentMvMatrix, shader )
{
    var childCount = this.children.length;
    for (var i = 0; i < childCount; ++i)
    {
        this.children[i].draw( parentMvMatrix, this.materials, shader, this.drawMode );
    }
};

/**
 * Draw the scene through a custom camera without having to attach it to the scene
 * @param {GCamera} Camera to use for rendering
 * @param {GShader} Shader to use for rendering
 */
GScene.prototype.drawThroughCamera = function ( camera, shader )
{
    camera.draw( this.tempMatrix, shader );    
    this.drawLights( shader );    
    this.drawGeometry( this.tempMatrix, shader );
};

/**
 * Render the scene with the provided shader program
 * @param {GShader} Shader program to use for rendering
 */
GScene.prototype.draw = function( shader )
{
    this.camera.draw( this.eyeMvMatrix, shader );
    this.drawLights( shader );
    this.drawGeometry( this.eyeMvMatrix, shader );
};

/**
 * Set the draw mode
 * @param {number} Mode: gl.POINTS, gl.TRIANGLES etc 
 */
GScene.prototype.setDrawMode = function( mode )
{
    this.drawMode = mode;
};

/**
 * Add a new light to the scene
 * @param {GLight} New light
 */
GScene.prototype.addLight = function( light )
{
    light.bindToContext( this.gl );
    light.setIndex( this.lights.length );
    this.lights.push( light );
};

/**
 * Add a material to the scene
 * @param {GMaterial} New material to add to the scene
 */
GScene.prototype.addMaterial = function( mat )
{
    var gl = this.gl;
    mat.bindToContext( gl );
    this.materials[mat.getName()] = mat;
};

/**
 * Add a child to the scene
 * @param {GGroup|GObject} Child to add to the scene
 */
GScene.prototype.addChild = function( child )
{
    child.bindToContext(this.gl);
    this.children.push(child);
};

/**
 * Set the camera for the scene
 * @param {GCamera}
 */
GScene.prototype.setCamera = function( camera )
{
    this.camera = camera;
};

/**
 * Return a reference to the camera in the scene
 * @return {GCamera}
 */
GScene.prototype.getCamera = function()
{
    return this.camera;
};

