// Copyright (C) 2014 Arturo Mayorga
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy 
// of this software and associated documentation files (the "Software"), to deal 
// in the Software without restriction, including without limitation the rights 
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
// copies of the Software, and to permit persons to whom the Software is 
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in 
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
// SOFTWARE.


/**
 * @constructor
 * @implements {SceneDrawableObserver}
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
	
	this.activeLightIndex = 0;
	
	this.drawSectionEnum = 
	{
	    STATIC: 0,
	    ARMATURE: 1
	};
	
	this.drawSection = this.drawSectionEnum.STATIC;
	this.deferredDrawCommands = [];
	
	this.isVisible = true;
}

/**
 * This function is part of SceneDrawableObserver sends a defer request to the 
 * observer.  This is useful, for example, in situations where the Drawable is 
 * not provided a shader that accepts all the attributes it can offer.  The idea 
 * is to defer drawing until a more suitable shader becomes available.
 * The observer needs to report on it's ability to service 
 * the deferral request.  If the observer can't service the deferral request, the
 * Drawable needs to make do with whatever shader is available at the moment.
 * @param {DrawCommand} Draw command being requested for deferral
 * @param {number} Condition code as defined by SceneDrawableDeferConditionCode that is cause for the deferral
 * @return {boolean} True if the draw can be deferred, false otherwise
 */
GScene.prototype.onDeferredDrawRequested = function ( command, conditionCode ) 
{ 
    if ( conditionCode === SceneDrawableDeferConditionCode.ARMATURE_REQUEST &&
         this.drawSection === this.drawSectionEnum.STATIC )
    {
        this.deferredDrawCommands.push( command );
        return true;
    }
    
    return false; 
};


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
 * @return {Array.<GLight>} List of lights attached to the scene
 */
GScene.prototype.getLights = function()
{
    return this.lights;
};

/**
 * Return the currently active light
 * @return {GLight}
 */
GScene.prototype.getActiveLight = function()
{
    return this.lights[this.activeLightIndex];
};

/**
 * Set the index of the currently active light
 * @param {number} Index of the light that needs to be activated
 */
GScene.prototype.setActiveLightIndex = function( lightIndex )
{
    this.activeLightIndex = lightIndex;
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
        this.lights[l].draw( this.eyeMvMatrix, shader, l );
    }
};

/**
 * Draw only the active light.  This is meant to be used by pass commands
 * that only draw one light at a time
 * @param {GShader} Shader program to use for drawing this light
 */
GScene.prototype.drawActiveLight = function ( shader )
{
    if (this.lights.length > this.activeLightIndex)
    {
        this.lights[this.activeLightIndex].draw( this.eyeMvMatrix, shader, 0 );
    }
};

/**
 * @para {boolean} New visibility value
 */
GScene.prototype.setVisibility = function ( visibility )
{
    this.isVisible = visibility;
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
 * @param {ShaderComposite} Shader to use for rendering
 */
GScene.prototype.drawThroughCamera = function ( camera, shaderComposite )
{
    if ( false === this.isVisible )
    {
        return;
    }
    
    this.drawSection = this.drawSectionEnum.STATIC;
    
    var shader = shaderComposite.getStaticShader();
    shader.activate();
    
    camera.draw( this.tempMatrix, shader );    
    this.drawLights( shader );    
    this.drawGeometry( this.tempMatrix, shader );
    
    shader.deactivate();
    
    this.drawSection = this.drawSectionEnum.ARMATURE;
    
    shader = shaderComposite.getArmatureShader();
    shader.activate();
    
    camera.draw( this.tempMatrix, shader );
    this.drawLights( shader );
    
    for ( var i in this.deferredDrawCommands )
    {
        this.deferredDrawCommands[i].run( shader );
    }
    
    shader.deactivate();
    
    this.deferredDrawCommands = [];
};

/**
 * Render the scene with the provided shader program
 * @param {ShaderComposite} Shader program to use for rendering
 */
GScene.prototype.draw = function( shaderComposite )
{
    if ( false === this.isVisible )
    {
        return;
    }
    
    this.drawSection = this.drawSectionEnum.STATIC;
    
    var shader = shaderComposite.getStaticShader();
    shader.activate();
    
    this.camera.draw( this.eyeMvMatrix, shader );
    this.drawLights( shader );
    this.drawGeometry( this.eyeMvMatrix, shader );
    
    shader.deactivate();
    
    this.drawSection = this.drawSectionEnum.ARMATURE;
    
    shader = shaderComposite.getArmatureShader();
    shader.activate();
    
    this.camera.draw( this.eyeMvMatrix, shader );
    this.drawLights( shader );
    
    for ( var i in this.deferredDrawCommands )
    {
        this.deferredDrawCommands[i].run( shader );
    }
    
    shader.deactivate();
    
    this.deferredDrawCommands = [];
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
    this.lights.push( light );
};

/**
 * Remove a light from the scene
 * @param {number} light that we want to delete
 * @return {boolean} true if the light was deleted, false otherwise
 */
GScene.prototype.removeLight = function( index )
{
    if ( index >= this.lights.length )
    {
        return false;
    }
    
    this.lights.splice( index, 1 );
    return true;
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
 * Remove a material from the scene
 * @param {GMaterial} material that is being removed from the scene
 * @return {boolean} true if the material was removed false otherwise
 */
GScene.prototype.removeMaterial = function( mat )
{
    if ( undefined === this.materials[mat.getName()] )
    {
        return false;
    }
    
    delete this.materials[mat.getName()];
    return true;
};

/**
 * Get the list of materials in the scene
 * @return {Array<GMaterial>}
 */
GScene.prototype.getMaterials = function()
{
    var ret = [];
    for (var key in this.materials)
    {
        ret.push(this.materials[key]);
    }
    
    return ret;
};

/**
 * Add a child to the scene
 * @param {SceneDrawable} Child to add to the scene
 */
GScene.prototype.addChild = function( child )
{
    child.bindToContext( this.gl );
    child.setObserver( this );
    this.children.push( child );
};

/**
 * Remove a child from the scene
 * @param {SceneDrawable} Child to remove from the scene
 */
GScene.prototype.removeChild = function( child )
{
    var i = this.children.indexOf( child );
    
    if ( i < 0 )
    {
        return;
    }
    
    this.children.splice( i, 1 );
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

