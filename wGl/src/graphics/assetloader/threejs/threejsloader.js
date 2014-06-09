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
 * @interface
 */
function ThreejsLoaderObserver () {}

/**
 * This function gets called whenever the observed loader completes the loading process
 * @param {ThreejsLoader} Loader object completing the load operation.
 */
ThreejsLoaderObserver.prototype.onThreejsLoaderCompleted = function ( loader ) {};

/**
 * @param {ThrejsLoader}
 * @param {number} progress Progress value
 */
ThreejsLoaderObserver.prototype.onThreejsLoaderProgress = function ( loader, progress ) {};

/**
 * @param {ArmatureAnimator} New armature animator connected to the loaded mesh
 */
ThreejsLoaderObserver.prototype.onThreejsLoaderArmatureAnimatorLoaded = function ( animator ) {};

/**
 * @constructor
 * @implements {ThreejsReaderObserver}
 * @param {GScene} Target scene for this loader
 * @param {GGroup} Target group for this loader
 */
function ThreejsLoader( scene, group )
{
	this.client = new XMLHttpRequest();
	this.scene = scene;
	this.group = group;
	this.isDownloadComplete = false;
	this.isReaderReady = false;
	this.isReadComplete = false;
	this.availableTime = 17;
	this.downloadProgress = 0;
	this.totalProgress = 0;
}



/**
 * This function loads a json file
 * @param {string} Path for the json file and it's resources
 * @source {string} json file that needs to be loaded
 */
ThreejsLoader.prototype.loadJson = function ( path, source )
{
    this.isDownloadComplete = false;
    this.client.open('GET', path + source);
	this.client.responseType = "json";
    this.currentPath = path;
    this.client.onload = function(e) 
    {
		var status = this.client.status;
		if (status == 200) {
			this.jsonToRead = this.client.response;
			this.isDownloadComplete = true;
		} else {
			// ...something went wrong.
		}
    }.bind(this);
    this.client.send();
};

/**
 * Update the available time and current progress
 * @param {number} Milliseconds sine the last update
 */
ThreejsLoader.prototype.updateTimeAndProgress = function ( time )
{
    var targetTime = 17;
    
    if (time > targetTime)
    {
        --this.availableTime;
    }
    else
    {
        ++this.availableTime;
    }
	
	if ( this.availableTime <= 0 )
	{
		this.availableTime = 5;
	}
	
	if ( undefined != this.observer &&
	     undefined != this.reader )
	{
	    this.totalProgress = this.reader.getProgress();
		this.observer.onThreejsLoaderProgress(this, this.totalProgress);
	}
};

/**
 * Update this json loader
 * @param {number} Milliseconds since the last update
 */
ThreejsLoader.prototype.update = function ( time )
{
    var timeStart = new Date().getTime();
    
    this.updateTimeAndProgress( time );
    
    while ( ( (new Date().getTime()) - timeStart) < this.availableTime )
    {
        if ( this.isReadComplete )
        {
            return;
        }
        else if ( this.isReaderReady )
        {
            this.updateReaderReady( time );
        }
		else if ( this.isDownloadComplete )
		{
		    this.reader = new ThreejsReader( this.currentPath, this.jsonToRead, 
		                                     this.scene, this.group, this );
		    this.isReaderReady = true;
		}
    }
};

/**
 * Update this json loader when the reader is ready
 * @param {number} Milliseconds since the last update
 */
ThreejsLoader.prototype.updateReaderReady = function ( time )
{
    this.reader.update( time );
    
    if ( this.reader.isComplete() )
    {
        this.isReadComplete = true;
        
        this.assembleAnimator();
        
        if ( undefined != this.observer )
        {
            this.observer.onThreejsLoaderCompleted( this );
        }
    } 
};

ThreejsLoader.prototype.assembleAnimator = function()
{
	var jAnimations = this.jsonToRead.animations;
	var animator = new ArmatureAnimator();
    
	for (var i in jAnimations )
    {
        var jAnim = jAnimations[i];
        var frameCount = jAnim. hierarchy[0].keys.length;
        var boneCount = jAnim. hierarchy.length;
        
        var animation = new Animation( jAnim.name, jAnim.fps, jAnim.length );
        
        for ( var f = 0; f < frameCount; ++f )
        {
            var keyframe = new Keyframe();
            
            for ( var b = 0; b < boneCount; ++b )
            {
                var bone = jAnim. hierarchy[b].keys[f];
                keyframe.addBoneInformation( bone.pos, bone.rot, bone.scl );
            }
            
            animation.addKeyframe( keyframe );
        }
        
        animator.addAnimation( animation );
    }
    
    animator.setTarget( this.armature );
    
    if ( undefined != this.observer )
    {
        this.observer.onThreejsLoaderArmatureAnimatorLoaded( animator );
    }
};

/**
 * This function is called whenever a new GeometryTriMesh object is loaded
 * @param {GeometryTriMesh} New mesh that was just made available
 * @param {GeometrySkin} Skin complementing the mesh
 */
ThreejsLoader.prototype.onNewMeshAvailable = function ( proxyMesh, proxySkin )
{
	var mesh = new Mesh( proxyMesh.getVertBuffer(),
		 			     proxyMesh.getTVerBuffer(),
					     proxyMesh.getNormBuffer(),
					     proxyMesh.indices,
					     proxyMesh.getName() );
	mesh.setMtlName( proxyMesh.getMtlName() );
	
	var skin = new Skin( proxySkin.getSkinBuffer() );
	var bones = this.createBones();
	
	this.armature = new ArmatureMeshDecorator( mesh, skin, bones );
	
	this.group.addChild( this.armature ); 
};

/**
 * Return a list of bone objects as defined in the loaded json
 * @return {Array.<Bone>} Array of bones defined in the json
 */
ThreejsLoader.prototype.createBones = function ()
{
    var bones = [];
    var jsonBones = this.jsonToRead.bones;
    
    for ( var i in jsonBones )
    {
        var newBone = new Bone( jsonBones[i].name, jsonBones[i].parent, jsonBones[i].pos, 
                                jsonBones[i].rotq, jsonBones[i].scl );
        
        bones.push( newBone );
    }
    
    return bones;
};

/**
 * Set the observer for the loader
 * @param {ThreejsLoaderObserver} observer Observer that receives updates
 */
ThreejsLoader.prototype.setObserver = function ( observer )
{
    this.observer = observer;
};
	


