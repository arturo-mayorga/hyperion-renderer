/**
 * @interface
 */
function GObjLoaderObserver () {}
GObjLoaderObserver.prototype.onObjLoaderCompleted = function () {};

/**
 * @interface
 */
function GObjReaderObserver () {}
GObjReaderObserver.prototype.onNewMeshAvailable = function ( mesh ) {} 

/**
 * @param {number} progress Progress value
 */
GObjLoaderObserver.prototype.onObjLoaderProgress = function ( progress ) {};


/**
 * @constructor
 * @implements {GObjReaderObserver}
 */
function GObjLoader( scene_ )
{

    /**
     * @constructor
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
		
    VboMesh.prototype.setMtlName = function( matName )
    {
        this.matName = matName;
    }
    
    VboMesh.prototype.getMtlName = function()
    {
        return this.matName;
    }
    
    VboMesh.prototype.getName = function()
    {
        return this.name;
    }
    
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
    }
    
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
    }
    
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
    }
	
    /**
     * @constructor
     */
	this.GObjReader = function( path, objStrA, scene, observer )
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
        this.path = path;
        this.objStrA = objStrA;
		this.observer = observer;

		this.currentIndex = 0;
		
		this.groupList = [];
		this.groupMap = {};
		
		this.invertNormals = false;
		this.isLoadComplete = false;
		this.updateIndex = 0;
		
		this.lineHandlerMap = 
		{
			"#"      :this.process_comment,
			"g"      :this.process_group,
			"v"      :this.process_vert,
			"vt"     :this.process_texVert,
			"vn"     :this.process_normal,
			"f"      :this.process_face,
			"mtllib" :this.process_mtllib,
			"usemtl" :this.process_usemtl,
			"invnv"  :this.process_invnv
		}
	}
	
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
                    console.debug("Cant handle [" + objStrA[this.updateIndex ] + "]");
                }
            }
            
            ++this.updateIndex;
        }
        else
        {
            this.isLoadComplete = true;
        }
        
	}
	
	this.GObjReader.prototype.getMesh = function ()
    {
        return this.groupList;
    }
        
    this.GObjReader.prototype.scrub = function(stra)
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
    }
    
    
    this.GObjReader.prototype.process_comment = function(lineA)
    {
    }
    
    
    this.GObjReader.prototype.process_group = function(lineA)
    {
        this.invertNormals = false;
        
        if ( this.currentMesh != undefined )
        {
            this.groupMap[this.currentMesh.getName()] = this.currentMesh;
            this.groupList.push(this.currentMesh);
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
    }
    
    this.GObjReader.prototype.process_vert = function( lineA )
    {
        var vec = vec3.fromValues(parseFloat(lineA[1]),
                                  parseFloat(lineA[2]),
                                  parseFloat(lineA[3]));
        this.objGVerts.push(vec);
    }
    
    this.GObjReader.prototype.process_texVert = function( lineA )
    {
        var vec = vec2.fromValues(parseFloat(lineA[1]),
                                  parseFloat(lineA[2]));
                                  
        this.objTVerts.push(vec);
    }
    
    this.GObjReader.prototype.process_normal = function( lineA )
    {
        var vec = vec3.fromValues(parseFloat(lineA[1]),
                                  parseFloat(lineA[2]),
                                  parseFloat(lineA[3]));
        this.objNormals.push(vec);
    }
    
    this.GObjReader.prototype.process_face = function( lineA )
    {
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
    }
    
    this.GObjReader.prototype.process_mtllib = function( lineA )
    {
        var ldr = new GMtlLoader(this.scene);
        ldr.loadMtl(this.path, lineA[1]);
    }
    
    this.GObjReader.prototype.process_usemtl = function( lineA )
    {
        this.currentMesh.setMtlName( lineA[1] );
    }
    
    this.GObjReader.prototype.process_invnv = function( lineA )
    {
        this.invertNormals = true;
    }

	this.client = new XMLHttpRequest();
	this.target = scene_;
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
}
	
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
}

/**
 * @param {number} time Time value
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
    
    while ( ( (new Date().getTime()) - timeStart) < this.availableTime )
    {
        if ( this.isReadComplete )
        {
			if (this.observer != undefined)
            {
                this.observer.onObjLoaderCompleted();
                return;
            }
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
            }
        }
        else if ( this.isDownloadComplete )
        {    
            var i = 0;
            var obj = this.client.responseText.split("\n");
			this.objLineCount = obj.length;
			this.testReader = new this.GObjReader (this.currentPath, obj, this.target, this);
			this.isReaderReady = true;
        }
    }
}

GObjLoader.prototype.onNewMeshAvailable = function ( mesh )
{
	var obj = new GObject(mesh.getVertBuffer(),
						  mesh.getTVerBuffer(),
						  mesh.getNormBuffer(),
						  mesh.indices,
						  mesh.getName());
                                      
	obj.setMtlName(mesh.getMtlName());
	this.target.addChild(obj);
}

/**
 * @param {GObjLoaderObserver} observer Observer that receives updates
 */
GObjLoader.prototype.setObserver = function ( observer )
{
    this.observer = observer;
}
	


