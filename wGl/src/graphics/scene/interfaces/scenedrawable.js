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
 * @enum {number}
 */
var SceneDrawableDeferConditionCode = 
{
    ARMATURE_REQUEST: 0
};
 
/**
 * @interface
 */
function SceneDrawableObserver()
{ 
}

/**
 * This function sends a defer request to the observer.  This is useful, for example, 
 * in situations where the Drawable is not provided a shader that accepts all the 
 * attributes it can offer.  The idea is to defer drawing until a more suitable shader 
 * becomes available.  The observer needs to report on it's ability to service 
 * the deferral request.  If the observer can't service the deferral request, the
 * Drawable needs to make do with whatever shader is available at the moment.
 * @param {DrawCommand} Draw command being requested for deferral
 * @param {number} Condition code as defined by SceneDrawableDeferConditionCode that is cause for the deferral
 * @return {boolean} True if the draw can be deferred, false otherwise
 */
SceneDrawableObserver.prototype.onDeferredDrawRequested = function ( command, conditionCode ) { return false; };

/**
 * @constructor
 */
function SceneDrawable()
{
    this.observer = undefined;
    var objid_ = SceneDrawable.instanceCounter;
    this.objid_ = objid_;
    this.objid = [ (0x000000ff & (objid_>>16))/255, 
                   (0x000000ff & (objid_>>8))/255, 
                   (0x000000ff & objid_)/255, 1];
    SceneDrawable.instanceCounter += 1;
}

SceneDrawable.instanceCounter = 0;

/** 
 * @return {number}
 */
SceneDrawable.prototype.getObjId = function()
{
    return this.objid_;
};

/**
 * Set the observer for this drawable
 * @param {SceneDrawableObserver} new observer for this drawable
 */
SceneDrawable.prototype.setObserver = function ( observer )
{
    this.observer = observer;
};

/**
 * Send out a deferred draw request to the observer.  See notes for 
 * SceneDrawableObserver.onDeferredDrawRequested()
 * @param {DrawCommand} Draw command being requested for deferral
 * @param {number} Condition code as defined by SceneDrawableDeferConditionCode that is cause for the deferral
 * @return {boolean} True if the draw can be deferred, false otherwise
 */
SceneDrawable.prototype.requestDeferredDraw = function( command, conditionCode )
{
    if ( undefined != this.observer )
    {
        return this.observer.onDeferredDrawRequested( command, conditionCode );
    }
    
    return false;
}

/**
 * Get the name of this Drawable
 * @param {string} The name of this object
 */
SceneDrawable.prototype.getName = function () { return ""; };

/**
 * Set the model view matrix for this group
 * @param {Array.<number>} Array of numbers representing the 4 by 4 model view matrix
 */
SceneDrawable.prototype.setMvMatrix = function( mat ) {};

/**
 * Called to bind this object to a gl context
 * @param {WebGLRenderingContext} Context to bind to this object
 */
SceneDrawable.prototype.bindToContext = function( gl ) {};

/**
 * Called to delete all the resources under this drawable
 */
SceneDrawable.prototype.deleteResources = function () {};

/**
 * Draw this group
 * @param {Array.<number>} List of numbers representing the parent 4 by 4 view matrix
 * @param {Array.<GMaterial>} List of materials to use for rendering
 * @param {GShader} Shader program to use for rendering
 * @param {number} Draw mode for drawing the VBOs
 */
SceneDrawable.prototype.draw = function( parentMvMat, materials, shader, drawMode ) {};

