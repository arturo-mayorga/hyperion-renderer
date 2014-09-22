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
function GObjLoaderObserver () {}

/**
 * This function gets called whenever the observed loader completes the loading process
 * @param {GObjLoader} Loader object completing the load operation.
 */
GObjLoaderObserver.prototype.onObjLoaderCompleted = function ( loader ) {};

/**
 * @param {GObjLoader}
 * @param {number} progress Progress value
 */
GObjLoaderObserver.prototype.onObjLoaderProgress = function ( loader, progress ) {};

/**
 * @constructor
 * @implements {GObjReaderObserver}
 * @param {GScene} Target scene for this loader
 * @param {GGroup} Target group for this loader
 */
function GObjLoader( scene, group )
{
	this.client = new XMLHttpRequest();
	this.scene = scene;
	this.group = group;
	this.isDownloadComplete = false;
	this.isReaderReady = false;
	this.isReadComplete = false;
	this.insertIndex = 0;
	this.availableTime = 17;
	this.downloadProgress = 0;
	this.processProgress = 0;
	this.objLineCount = 0;
	this.objLinesProcessed = 0;
	this.totalProgress = 0;
	this.autoMergeByMaterial = false;
	this.deferredMeshMap = {};
}

/**
 * Enable auto merging
 */
GObjLoader.prototype.enableAutoMergeByMaterial = function()
{
    this.autoMergeByMaterial = true;
};

/**
 * This function loads an obj file
 * @param {string} Path for the obj file and it's resources
 * @source {string} Obj file that needs to be loaded
 */
GObjLoader.prototype.loadObj = function ( path, source )
{
    this.isDownloadComplete = false;
    this.client.open('GET', path + source);
    this.currentPath = path;
    this.client.onreadystatechange = function(e) 
    {
        if ( this.client.readyState === 4 )
        {
            this.isDownloadComplete = true;
			this.downloadProgress = 1;
        }
		else if ( this.client.readyState === 3 )
		{
			if ( e.lengthComputable )
			{
				this.downloadProgress = e.loaded / e.total;
			}
			else
			{
				this.downloadProgress += (1.0 - this.downloadProgress) / 10.0;
			}
		}
    }.bind(this);
    this.client.send();
	
	this.deferredObjectCount = 0;
	this.defferedObjectsLeft = 0;
};

/**
 * Update this obj loader
 * @param {number} Milliseconds since the last update
 */
GObjLoader.prototype.update = function ( time )
{
    var timeStart = new Date().getTime();
    
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
	
	
	var defferedProgress = (this.deferredObjectCount===0)? ((this.autoMergeByMaterial)?0.0:1.0) :((this.deferredObjectCount-this.defferedObjectsLeft)/this.deferredObjectCount);
	
	this.totalProgress = (this.downloadProgress + this.processProgress*9.0 + defferedProgress )/11.0;
	
	if (this.observer != undefined)
	{
		this.observer.onObjLoaderProgress(this, this.totalProgress);
	}
    
    while ( ( (new Date().getTime()) - timeStart) < this.availableTime )
    {
		if ( this.isIdleMode )
		{
			return;
		}
        else if ( this.isReadComplete )
        {
			if (this.observer != undefined)
			{
				this.observer.onObjLoaderCompleted( this );
			}
			
			this.isIdleMode = true;
			return;
        }
        else if ( this.isReaderReady )
        {
            if (false === this.reader.isLoadComplete)
            {
                this.reader.update( time );
				++this.objLinesProcessed;
				this.processProgress = this.objLinesProcessed / this.objLineCount;
            }
            else
            {
				// we are done processing, its time to send all deferred meshes to
				// the scene
				var keys = Object.keys(this.deferredMeshMap);
				
				if ( keys.length === 0 )
				{
					this.isReadComplete = true;
				}
				else
				{
					var thisMeshArray = this.deferredMeshMap[keys[0]];
					for ( var i in thisMeshArray )
					{
						this.sendMeshToGroup( thisMeshArray[i] );
						--this.defferedObjectsLeft;
					}
					
					delete this.deferredMeshMap[keys[0]];
				}
            }
        }
        else if ( this.isDownloadComplete )
        {    
            var i = 0;
            var obj = this.client.responseText.split("\n");
			this.objLineCount = obj.length;
			this.reader = new GObjReader (this.currentPath, obj, this.scene, this.group, this);
			this.isReaderReady = true;
        }
    }
};

/**
 * This function is called whenever a new GeometryTriMesh object is loaded
 * @param {GeometryTriMesh} New object that was just made available
 */
GObjLoader.prototype.onNewMeshAvailable = function ( mesh )
{
	if ( this.autoMergeByMaterial )
	{
	    this.deferMeshForMerge( mesh );
	}
	else
	{
	    this.sendMeshToGroup( mesh );
	}
};

/**
 * This function is called whenever a new GeometryTriMesh object is 
 * loaded and needs to be merged and optimized before adding to the scene.
 * @param {GeometryTriMesh} New object that was just made available
 */
GObjLoader.prototype.deferMeshForMerge = function ( mesh )
{
    var currentMeshArray = this.deferredMeshMap[mesh.getMtlName()];
    var MAX_INDEX_VALUE = 65535;
    
    if ( undefined === currentMeshArray )
    {
        // this is the first mesh with it's material
        currentMeshArray = [mesh];
        this.deferredMeshMap[mesh.getMtlName()] = currentMeshArray;
		++this.deferredObjectCount;
		++this.defferedObjectsLeft;
        return;
    }
    
    for ( var i in currentMeshArray )
    {
        if ( currentMeshArray[i].indices.length + mesh.indices.length <=  MAX_INDEX_VALUE )
        {
            // we found a mesh that can receive the new geometry
            currentMeshArray[i].merge( mesh );
            return;
        }
    }
    
    // could not find a mesh that can merge the new geometry, save it for later
	++this.deferredObjectCount;
	++this.defferedObjectsLeft;
    currentMeshArray.push( mesh );
};

/**
 * This function is called whenever a new GeometryTriMesh object is 
 * loaded and needs to be sent directly to the scene.
 * @param {GeometryTriMesh} New object that was just made available
 */
GObjLoader.prototype.sendMeshToGroup = function ( mesh )
{
   var obj = new Mesh( mesh.getVertBuffer(),
					   mesh.getTVerBuffer(),
					   mesh.getNormBuffer(),
					   mesh.indices,
					   mesh.getName());
                                      
	obj.setMtlName(mesh.getMtlName());
	this.group.addChild(obj); 
};

/**
 * Set the observer for the loader
 * @param {GObjLoaderObserver} observer Observer that receives updates
 */
GObjLoader.prototype.setObserver = function ( observer )
{
    this.observer = observer;
};
	


