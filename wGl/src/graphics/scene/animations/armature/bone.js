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
 * @param {string} name of this bone 
 * @param {number} parent id for this bone
 * @param {Array.<number>} position for this bone
 * @param {Array.<number>} rotation quaternion
 * @param {Array.<number>} scale factors
 */
function Bone( name, parentId, position, rotQuat, scale )
{
    this.name = name;
    this.parentId = parentId; 
    
    this.currentPosition = vec3.fromValues( position[0], position[1], position[2] );
    this.currentRotQuat  = quat.fromValues( rotQuat[0], rotQuat[1], rotQuat[2], rotQuat[3] );
    this.currentScale    = vec3.fromValues( scale[0], scale[1], scale[2] );
      
    this.children = [];
    this.parent = undefined;
    
    this.normalMatrix   = mat4.create();
    this.boneMatrix     = mat4.create();
    this.restPoseMatrix = mat4.create();
} 

/**
 * Set the current values for the bone
 * @param {Array.<number>} position for this bone
 * @param {Array.<number>} rotation quaternion
 * @param {Array.<number>} scale factors
 */
Bone.prototype.setCurrentValues = function ( position, rotation, scale )
{
    this.currentPosition[0] = position[0];
    this.currentPosition[1] = position[1];
    this.currentPosition[2] = position[2];
    
    this.currentRotQuat[0] = rotation[0];
    this.currentRotQuat[1] = rotation[1];
    this.currentRotQuat[2] = rotation[2];
    this.currentRotQuat[3] = rotation[3];
    
    this.currentScale[0] = scale[0];
    this.currentScale[1] = scale[1];
    this.currentScale[2] = scale[2];
};

/** 
 * Add a child bone to this bone hirearchy
 * @param {Bone} child bone to add to the hirearchy
 */
Bone.prototype.addChild = function ( childBone )
{
    if ( undefined != childBone.parent )
    {
        childBone.parent.children.splice 
        (
            childBone.parent.children.indexOf( childBone ),
            1
        );
    }
    
    this.children.push( childBone );
    childBone.parent = this;
};

/**
 * Get the parent id for this bone
 * @return {number} Id for the parent bone
 */
Bone.prototype.getParentId = function()
{
    return this.parentId;
};


/**
 * Iterate through the entire hirearchy and calculate the rest-pose matrices for 
 * each bone.
 * @param {Array.<number>} parent matrix
 */
Bone.prototype.calculateRestPoseMatrix = function ( parentMat )
{
    mat4.fromRotationTranslation( this.restPoseMatrix, this.currentRotQuat, this.currentPosition );
   
    mat4.multiply(this.restPoseMatrix, parentMat, this.restPoseMatrix);
    
    for ( var i in this.children )
    {
        this.children[i].calculateRestPoseMatrix( this.restPoseMatrix );
    }
    
    mat4.invert(this.restPoseMatrix, this.restPoseMatrix); 
};

/**
 * Iterate through the entire hirearchy and calculate the matrices for each
 * bone.
 * @param {Array.<number>} parent matrix
 */
Bone.prototype.calculateMatrices = function( parentMat )
{
    mat4.fromRotationTranslation( this.boneMatrix, this.currentRotQuat, this.currentPosition );
    
    mat4.multiply(this.boneMatrix, parentMat, this.boneMatrix);
    
    for ( var i in this.children )
    {
        this.children[i].calculateMatrices( this.boneMatrix );
    }
    
    mat4.multiply(this.boneMatrix, this.boneMatrix, this.restPoseMatrix);
    
    // mat4 normalMatrix = transpose(inverse(modelView));
    mat4.invert(this.normalMatrix, this.boneMatrix);
    mat4.transpose(this.normalMatrix, this.normalMatrix);
};

/**
 * Populate the matrix collection into the procided index
 * @param {Array.<number>} array containing the matrix collection
 * @param {number} index representing the position on the matrix collection
 */
Bone.prototype.populateMatrixCollection = function( matrixCollection, idx )
{
    var sIdx = idx*32;
    
    for ( var i = 0; i < 16; ++i )
    {
        matrixCollection[ i + sIdx ] = this.boneMatrix[i];
        matrixCollection[ i + sIdx + 16 ] = this.normalMatrix[i];
    }
};




