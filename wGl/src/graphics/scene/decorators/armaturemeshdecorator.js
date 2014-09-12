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
 * @extends {MeshDecorator}
 * @param {Mesh} mesh Skin that is being decorated
 * @param {Skin} skin Skin to apply to the mesh
 * @param {Array.<Bone>} bones Array of bones
 */
function ArmatureMeshDecorator( mesh, skin, bones )
{
    this.rootBones = [];
    this.bones = bones;
    this.skin = skin;
    
    this.identMat = mat4.create();
    
    for ( var i in bones )
    {
        var thisBone = bones[i];
        var parentId = thisBone.getParentId();
        
        if ( parentId >= 0 )
        {
            bones[parentId].addChild( thisBone );
        }
        else
        {
            this.rootBones.push(thisBone);
        }
    }
    
    for ( var j in this.rootBones )
    {
        this.rootBones[j].calculateRestPoseMatrix( this.identMat );
    }
    
    this.boneMatrixCollection = new Float32Array( this.bones.length * 32 ); // 16 for vert mat and 16 for normal mat
    
    MeshDecorator.call( this, mesh );
} 

ArmatureMeshDecorator.prototype = Object.create( MeshDecorator.prototype );

/**
 * Draw this object
 * @param {Array.<number>} List of numbers representing the parent 4 by 4 view matrix
 * @param {Array.<GMaterial>} List of materials to use for rendering
 * @param {GShader} Shader program to use for rendering
 * @param {number} Draw mode for drawing the VBOs
 */
ArmatureMeshDecorator.prototype.draw = function( parentMvMat, materials, shader, drawMode )
{
    if ( null === shader.uniforms.aMatrixUniform )
    {
        var dCommand = new DrawCommand( this, parentMvMat, materials, drawMode );
        if ( this.requestDeferredDraw( dCommand, SceneDrawableDeferConditionCode.ARMATURE_REQUEST) )
        {
            // the current shader does not have armature support and we are 
            // going to defer until we have a more suitable shader
            return;
        }
    }
    
    var gl = this.gl; 
    
    this.skin.draw( shader );
    
    for ( var i in this.rootBones )
    {
        this.rootBones[i].calculateMatrices( this.identMat );
    }
    
    for ( var i in this.bones )
    {
        this.bones[i].populateMatrixCollection( this.boneMatrixCollection, i|0 );
    }
    
    if ( null != shader.uniforms.aMatrixUniform )
    {
        gl.uniformMatrix4fv( shader.uniforms.aMatrixUniform, false, 
                             this.boneMatrixCollection );
    }
    
    MeshDecorator.prototype.draw.call( this, parentMvMat, materials, shader, drawMode );
};

/**
 * Called to delete all the resources under this drawable
 */
ArmatureMeshDecorator.prototype.deleteResources = function () 
{
    this.skin.deleteResources();
    MeshDecorator.prototype.deleteResources.call( this );
};

/**
 * Called to bind this object to a gl context
 * @param {WebGLRenderingContext} Context to bind to this object
 */
ArmatureMeshDecorator.prototype.bindToContext = function( gl )
{
    MeshDecorator.prototype.bindToContext.call( this, gl );
    this.skin.bindToContext( gl );
    this.gl = gl;
};


