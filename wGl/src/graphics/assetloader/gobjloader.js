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
 * @interface
 */
function GObjReaderObserver () {}

/**
 * This function is called whenever a new VboMesh object is loaded
 * @param {VboMesh} New object that was just made available
 */
GObjReaderObserver.prototype.onNewMeshAvailable = function ( mesh ) {};

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

    /**
     * @constructor
     * @param {string} Name of this Vbo instance
     */
	function VboMesh(name)
	{
		this.name = name;
		this.matName = "";
		
		this.gVerts = [];
		this.nVerts = [];
		this.tVerts = [];
		this.indices = [];
	}
	
	/**
	 * merge the provided mesh to this merge
	 * @param {VboMesh} the mesh containing the new geometry
	 */
	VboMesh.prototype.merge = function( mesh )
	{
	    var prevIdxLen = this.indices.length;
	    var newIdxLen = mesh.indices.length;
	    
	    this.gVerts = this.gVerts.concat( mesh.gVerts );
	    this.nVerts = this.nVerts.concat( mesh.nVerts );
	    this.tVerts = this.tVerts.concat( mesh.tVerts );
	    
	    for ( var i = 0; i < newIdxLen; ++i )
	    {
	        this.indices.push( i + prevIdxLen );
	    }
	};
		
	/**
	 * Sets the material name for this instance
	 * @param {string} New name for this instance
	 */
    VboMesh.prototype.setMtlName = function( matName )
    {
        this.matName = matName;
    };
    
    /**
     * Returns the material name for this instance
     * @return {string} The current name for this instance
     */
    VboMesh.prototype.getMtlName = function()
    {
        return this.matName;
    };
    
    /**
     * Returns the name of this instance
     * @return {string} Instance name
     */
    VboMesh.prototype.getName = function()
    {
        return this.name;
    };
    
    /**
     * Returns the texture vertex buffer
     * @return {Array.<number>} Buffer with texture vertex values
     */
    VboMesh.prototype.getTVerBuffer = function()
    {
        var len = this.gVerts.length;
        var ret = [];
        for (var i = 0; i < len; ++i)
        {
            var _this = this.tVerts[i];
            if ( _this != undefined )
            {
                for( var j = 0; j < 2; ++j)
                {
                    ret.push(_this[j]); 
                }
            }
            else
            {
                ret.push(0);
            }
        }
        
        return ret;
    };
    
    /**
     * Returns the vertex buffer
     * @return {Array.<number>} Buffer with vertex values.
     */
    VboMesh.prototype.getVertBuffer = function()
    {
        var len = this.gVerts.length;
        var ret = [];
        for (var i = 0; i < len; ++i)
        {
            var _this = this.gVerts[i];
            for( var j = 0; j < 3; ++j)
            {
                ret.push(_this[j]); 
            }
        }
        
        return ret;
    };
    
    /**
     * Returns the normals buffer
     * @return {Array.<number>} Buffer with normal values.
     */
    VboMesh.prototype.getNormBuffer = function()
    {
        var len = this.nVerts.length;
        var ret = [];
        for (var i = 0; i < len; ++i)
        {
            var _this = this.nVerts[i];
            for (var j = 0; j < 3; ++j)
            {
                ret.push(_this[j]);
            }
        }
        
        return ret;
    };
	
    /**
     * @constructor
     * @param {string} Path to the location of this obj file's resources
     * @param {Array.<string>} Lines of the obj file
     * @param {GScene} Target scene for the loading process
     * @param {GGroup} Target group for the loading process
     * @param {GObjReaderObserver} Observer to the loading process
     */
	this.GObjReader = function( path, objStrA, scene, group, observer )
	{
	    /**
	     * @struct
	     */
        this.IndexRecord = function( string )
        {
            var tokens = string.split("/");
            this.vertIdx = parseFloat(tokens[0])-1;
            this.textIdx = parseFloat(tokens[1])-1;
            this.normIdx = parseFloat(tokens[2])-1;			
        }
    
		this.objGVerts = [];
		this.objTVerts = [];
		this.objNormals = [];
		this.currentMesh = undefined;
		this.scene = scene;
		this.group = group;
        this.path = path;
        this.objStrA = objStrA;
		this.observer = observer;

		this.currentIndex = 0;
		
		this.groupMap = {};
		
		this.invertNormals = false;
		this.isLoadComplete = false;
		this.updateIndex = 0;
		this.polyCount = 0;
		
		this.lineHandlerMap = 
		{
			"#"      :this.process_comment,
			"o"      :this.process_group,
			"g"      :this.process_group,
			"v"      :this.process_vert,
			"vt"     :this.process_texVert,
			"vn"     :this.process_normal,
			"f"      :this.process_face,
			"mtllib" :this.process_mtllib,
			"usemtl" :this.process_usemtl,
			"invnv"  :this.process_invnv
		}
	};
	
	/**
	 * Advance through the loading process
	 * @param {number} Milliseconds since the last update
	 */
	this.GObjReader.prototype.update = function (time)
	{
	   
	    
        if ( this.updateIndex < this.objStrA.length )
        {
            var stra = this.scrub(this.objStrA[this.updateIndex ].split(" "));
                            
            if ( stra.length > 1 )
            {
                this.handler = this.lineHandlerMap[stra[0]];
                if (this.handler != undefined)
                {
                    this.handler(stra);
                }
                else
                {
                   // console.debug("Cant handle [" + this.objStrA[this.updateIndex ] + "]");
                }
            }
            
            ++this.updateIndex;
        }
        else
        {
			console.debug("Loaded " + this.polyCount + " polygons in " + Object.keys(this.groupMap).length + " objects.");
            this.isLoadComplete = true;
        }
        
	};
     
	/** 
	 * Remove unimportant tokens from the token array
	 * @param {Array.<string>} Token array
	 * @return {Array.<string>} Scrubbed token array
	 */
    this.GObjReader.prototype.scrub = function( stra )
    {
        var len = stra.length;
        var ret = [];
        for (var i = 0; i < len; ++i)
        {
            if (stra[i] != "")
            {
                ret.push(stra[i]);
            }
        }
        return ret;
    };
    
    /**
     * This function is called while processing a comment line (starting with '#')
     * @param {Array.<string>} 
     */
    this.GObjReader.prototype.process_comment = function( lineA ) {};
    
    /**
     * This function is called while processing a group line (starting with 'o' or 'g')
     * @param {Array.<string>} 
     */
    this.GObjReader.prototype.process_group = function(lineA)
    {
        this.invertNormals = false;
        
        if ( this.currentMesh != undefined )
        {
            this.groupMap[this.currentMesh.getName()] = this.currentMesh;
			this.observer.onNewMeshAvailable(this.currentMesh);
        }
        
        this.currentVertIMap = {};
        this.currentTextIMap = {};
        
        var name = lineA[1];
        
        
        for (var i = 2; i < lineA.length; ++i)
        {
            name += " " + lineA[i];
        }
        
        while (this.groupMap[name] != undefined)
        {
            name += "_";
        }
        
        this.currentMesh = new VboMesh(name);
        this.currentIndex = 0;	
        
        //console.debug("adding group: " + name);
    };
    
    /**
     * This function is called while processing a vertex line (starting with 'v')
     * @param {Array.<string>} 
     */
    this.GObjReader.prototype.process_vert = function( lineA )
    {
        var vec = vec3.fromValues(parseFloat(lineA[1]),
                                  parseFloat(lineA[2]),
                                  parseFloat(lineA[3]));
        this.objGVerts.push(vec);
    };
    
    /**
     * This function is called while processing a texture vertex line (starting with 'tv')
     * @param {Array.<string>} 
     */
    this.GObjReader.prototype.process_texVert = function( lineA )
    {
        var vec = vec2.fromValues(parseFloat(lineA[1]),
                                  parseFloat(lineA[2]));
                                  
        this.objTVerts.push(vec);
    };
    
    /**
     * This function is called while processing a comment line (starting with 'vn')
     * @param {Array.<string>} 
     */
    this.GObjReader.prototype.process_normal = function( lineA )
    {
        var vec = vec3.fromValues(parseFloat(lineA[1]),
                                  parseFloat(lineA[2]),
                                  parseFloat(lineA[3]));
        this.objNormals.push(vec);
    };
    
    /**
     * This function is called while processing a face line (starting with 'f')
     * @param {Array.<string>} 
     */
    this.GObjReader.prototype.process_face = function( lineA )
    {
		++this.polyCount;
        for (var i = 1; i <= 3; ++i)
        {
            var idxs = new this.IndexRecord( lineA[i] );
            
            var vert = this.objGVerts[idxs.vertIdx];
            var norm = this.objNormals[idxs.normIdx];
            var vtex = this.objTVerts[idxs.textIdx];
            
            if (vtex == undefined)
            {
                vtex = [0,0];
            }
            
            if ( this.invertNormals )
            {
                var temp = norm;
                norm = vec3.create();
                norm[0] = -1*temp[0];
                norm[1] = -1*temp[1];
                norm[2] = -1*temp[2];
            }
            
            this.currentMesh.gVerts.push(vert);
            this.currentMesh.nVerts.push(norm);
            this.currentMesh.tVerts.push(vtex);
            this.currentMesh.indices.push(this.currentIndex++);
        }
    };
    
    /**
     * This function is called while processing a material line (starting with 'mtllib')
     * @param {Array.<string>} 
     */
    this.GObjReader.prototype.process_mtllib = function( lineA )
    {
        var ldr = new GMtlLoader(this.scene);
        ldr.loadMtl(this.path, lineA[1]);
    };
    
    /**
     * This function is called while processing a use material line (starting with 'usemtl')
     * @param {Array.<string>} 
     */
    this.GObjReader.prototype.process_usemtl = function( lineA )
    {
        this.currentMesh.setMtlName( lineA[1] );
    };
    
    /**
     * This function is called while processing a invert normals line (starting with 'invnv')
     * @param {Array.<string>} 
     */
    this.GObjReader.prototype.process_invnv = function( lineA )
    {
        this.invertNormals = true;
    };

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
    this.autoMergeByMaterial = true;;
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
        if ( this.client.readyState == 4 )
        {
            this.isDownloadComplete = true;
			this.downloadProgress = 1;
        }
		else if ( this.client.readyState == 3 )
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
	
	this.totalProgress = (this.downloadProgress + this.processProgress*10.0)/11.0;
	
	if (this.observer != undefined)
	{
		this.observer.onObjLoaderProgress(this, this.totalProgress);
	}
    
    while ( ( (new Date().getTime()) - timeStart) < this.availableTime )
    {
        if ( this.isReadComplete )
        {
			return;
        }
        else if ( this.isReaderReady )
        {
            if (false == this.testReader.isLoadComplete)
            {
                this.testReader.update( time );
				++this.objLinesProcessed;
				this.processProgress = this.objLinesProcessed / this.objLineCount;
            }
            else
            {
                this.isReadComplete = true;
				if (this.observer != undefined)
				{
				    // we are done processing, its time to send all deferred meshes to
                    // the scene
                    for ( var mtlName in this.deferredMeshMap )
                    {
                        var thisMeshArray = this.deferredMeshMap[mtlName];
                        for ( var i in thisMeshArray )
                        {
                            this.sendMeshToGroup( thisMeshArray[i] );
                        }
                    }
                    this.deferredMeshMap = {};
                    
					this.observer.onObjLoaderCompleted( this );
					return;
				}
            }
        }
        else if ( this.isDownloadComplete )
        {    
            var i = 0;
            var obj = this.client.responseText.split("\n");
			this.objLineCount = obj.length;
			this.testReader = new this.GObjReader (this.currentPath, obj, this.scene, this.group, this);
			this.isReaderReady = true;
        }
    }
};

/**
 * This function is called whenever a new VboMesh object is loaded
 * @param {VboMesh} New object that was just made available
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
 * This function is called whenever a new VboMesh object is 
 * loaded and needs to be merged and optimized before adding to the scene.
 * @param {VboMesh} New object that was just made available
 */
GObjLoader.prototype.deferMeshForMerge = function ( mesh )
{
    var currentMeshArray = this.deferredMeshMap[mesh.getMtlName()];
    var MAX_INDEX_VALUE = 65535;
    
    if ( undefined == currentMeshArray )
    {
        // this is the first mesh with it's material
        currentMeshArray = [mesh];
        this.deferredMeshMap[mesh.getMtlName()] = currentMeshArray;
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
    currentMeshArray.push( mesh );
};

/**
 * This function is called whenever a new VboMesh object is 
 * loaded and needs to be sent directly to th e scene.
 * @param {VboMesh} New object that was just made available
 */
GObjLoader.prototype.sendMeshToGroup = function ( mesh )
{
   var obj = new GObject(mesh.getVertBuffer(),
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
	


