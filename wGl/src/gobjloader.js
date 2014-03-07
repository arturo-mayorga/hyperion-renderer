
/**
 * @constructor
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
	this.GObjReader = function( path, objStrA, scene )
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

		this.currentIndex = 0;
		
		this.groupList = {};
		
		this.invertNormals = false;
		
		var lineHandlerMap = 
		{
			"#"    :this.process_comment,
			g      :this.process_group,
			v      :this.process_vert,
			vt     :this.process_texVert,
			vn     :this.process_normal,
			f      :this.process_face,
			mtllib :this.process_mtllib,
			usemtl :this.process_usemtl,
			invnv  :this.process_invnv
		}
		
		
		
        var size = objStrA.length;
        for ( var i = 0; i < size; ++i )
        {
            var stra = this.scrub(objStrA[i].split(" "));
                            
            if ( stra.length > 1 )
            {
                this.handler = lineHandlerMap[stra[0]];
                if (this.handler != undefined)
                {
                    this.handler(stra);
                }
                else
                {
                    console.debug("Cant handle [" + objStrA[i] + "]");
                }
            }
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
            this.groupList[this.currentMesh.getName()] = this.currentMesh;
        }
        
        this.currentVertIMap = {};
        this.currentTextIMap = {};
        
        var name = lineA[1];
        
        
        for (var i = 2; i < lineA.length; ++i)
        {
            name += " " + lineA[i];
        }
        
        while (this.groupList[name] != undefined)
        {
            name += "_";
        }
        
        this.currentMesh = new VboMesh(name);
        this.currentIndex = 0;	
        
        console.debug("adding group: " + name);
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
}
	
GObjLoader.prototype.loadObj = function ( path, source )
{
    this.client.open('GET', path + source);
    this.client.onreadystatechange = function() 
    {
        if ( this.client.readyState == 4 )
        {
            var i = 0;
            var obj = this.client.responseText.split("\n");
            
            testReader = new this.GObjReader (path, obj, this.target);
            var meshList = testReader.getMesh();
            var meshCnt = meshList.lenght;
            
            for (var key in meshList)
            {
                var thisMesh = meshList[key];
                var obj = new GObject(thisMesh.getVertBuffer(),
                                      thisMesh.getTVerBuffer(),
                                      thisMesh.getNormBuffer(),
                                      thisMesh.indices,
                                      key);
                                      
                obj.setMtlName(thisMesh.getMtlName());
                this.target.addChild(obj);
            }
            
            console.debug("finished loading OBJ");
        }
    }.bind(this);
    this.client.send();
}
	


