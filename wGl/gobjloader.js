function GObjLoader( scene_ )
{

	function VboMesh(name)
	{
		var _name = name;
		var _matName = "";
		
		this.gVerts = [];
		this.nVerts = [];
		this.tVerts = [];
		this.indices = [];
		
		this.setMtlName = function( matName )
		{
			_matName = matName;
		}
		
		this.getMtlName = function( matName )
		{
			return _matName;
		}
		
		this.getName = function()
		{
			return _name;
		}
		
		this.getTVerBuffer = function()
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
		
		this.getVertBuffer = function()
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
		
		this.getNormBuffer = function()
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
	}

	function GObjReader( path, objStrA, scene )
	{
		var _objGVerts = [];
		var _objTVerts = [];
		var _objNormals = [];
		var _currentMesh = undefined;
		var _scene = scene;
        var _path = path;

		var _currentIndex = 0;
		
		var _groupList = {};
		
		this.getMesh = function ()
		{
			return _groupList;
		}
		
		function IndexRecord ( string )
		{
			var tokens = string.split("/");
			this.vertIdx = parseFloat(tokens[0])-1;
			this.textIdx = parseFloat(tokens[1])-1;
			this.normIdx = parseFloat(tokens[2])-1;			
		}
		
		
		var init_GObjReader = function ( objStrA )
		{
			var size = objStrA.length;
			for ( var i = 0; i < size; ++i )
			{
				var stra = scrub(objStrA[i].split(" "));
								
                if ( stra.length > 1 )
                {
                    var handler = lineHandlerMap[stra[0]];
                    if (handler != undefined)
                    {
                        handler(stra);
                    }
                    else
                    {
                        console.debug("Cant handle [" + objStrA[i] + "]");
                    }
                }
			}
		}
        
        function scrub(stra)
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
		
		
		function process_comment(lineA)
		{
		}
		
		var _invertNormals = false;
		function process_group(lineA)
		{
			_invertNormals = false;
			
			if ( _currentMesh != undefined )
			{
				_groupList[_currentMesh.getName()] = _currentMesh;
			}
			
			_currentVertIMap = {};
			_currentTextIMap = {};
			
			var name = lineA[1];
			
			
			for (var i = 2; i < lineA.length; ++i)
			{
				name += " " + lineA[i];
			}
			
			while (_groupList[name] != undefined)
			{
				name += "_";
				//console.debug("name collision detected: " + name);
			}
			
			_currentMesh = new VboMesh(name);
			_currentIndex = 0;	
			
			console.debug("adding group: " + name);
		}
		
		function process_vert ( lineA )
		{
			var vec = vec3.fromValues(parseFloat(lineA[1]),
									  parseFloat(lineA[2]),
									  parseFloat(lineA[3]));
			_objGVerts.push(vec);
		}
		
		function process_texVert ( lineA )
		{
			var vec = vec2.fromValues(parseFloat(lineA[1]),
									  parseFloat(lineA[2]));
									  
			_objTVerts.push(vec);
		}
		
		function process_normal( lineA )
		{
			var vec = vec3.fromValues(parseFloat(lineA[1]),
									  parseFloat(lineA[2]),
									  parseFloat(lineA[3]));
			_objNormals.push(vec);
		}
		
		function process_face( lineA )
		{
			for (var i = 1; i <= 3; ++i)
			{
				var idxs = new IndexRecord( lineA[i] );
				
				var vert = _objGVerts[idxs.vertIdx];
				var norm = _objNormals[idxs.normIdx];
				var vtex = _objTVerts[idxs.textIdx];
				
				if (vtex == undefined)
				{
				    vtex = [0,0];
				}
				
				if ( _invertNormals )
				{
					norm[0] *= -1;
					norm[1] *= -1;
					norm[2] *= -1;
				}
				
				_currentMesh.gVerts.push(vert);
				_currentMesh.nVerts.push(norm);
				_currentMesh.tVerts.push(vtex);
				_currentMesh.indices.push(_currentIndex++);
			}
		}
		
		function process_mtllib( lineA )
		{
			var ldr = new GMtlLoader(_scene);
			ldr.loadMtl(_path, lineA[1]);
		}
		
		function process_usemtl( lineA )
		{
			_currentMesh.setMtlName( lineA[1] );
		}
		
		function process_invnv( lineA )
		{
			_invertNormals = true;
		}
		
		var lineHandlerMap = 
		{
			"#":process_comment,
			g  :process_group,
			v  :process_vert,
			vt :process_texVert,
			vn :process_normal,
			f  :process_face,
			mtllib :process_mtllib,
			usemtl :process_usemtl,
			invnv  :process_invnv,
		}
		
		init_GObjReader ( objStrA );
	}


	var _client = new XMLHttpRequest();
	var _target = scene_;
	
	this.loadObj = function ( path, source )
	{
		_client.open('GET', path + source);
		_client.onreadystatechange = function() 
		{
			if ( _client.readyState == 4 )
			{
				var i = 0;
				var _pen_obj = _client.responseText.split("\n");
				
				testReader = new GObjReader (path, _pen_obj, _target);
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
					_target.addChild(obj);
				}
				
				console.debug("finished loading OBJ");
			}
		}
		_client.send();
	}
	
}

