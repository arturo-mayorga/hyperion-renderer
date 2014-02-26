function GMtlLoader( scene_ )
{
	function GMtlReader( mtlStrA, path )
	{
	    var _path = path;
		var _materials = {};
		var _currentMtl = undefined;
		
		var init_GMtlReader = function ( mtlStrA )
		{
			var size = mtlStrA.length;
			for ( var i = 0; i < size; ++i )
			{
				var stra = mtlStrA[i].split(" ");
				
				var handler = lineHandlerMap[stra[0]];
				if (handler != undefined)
				{
					handler(stra);
				}
				else
				{
					//console.debug("Cant handle [" + mtlStrA[i] + "]");
				}
			}
		}
		
		this.getMaterials = function()
		{
			return _materials;
		}
		
		function process_comment(lineA)
		{
		}
		
		function process_newmtl( lineA )
		{
			_currentMtl = new GMaterial( lineA[1] );
			_materials[lineA[1]] = _currentMtl;
		}
		
		var process_ka = function( lineA )
		{
			_currentMtl.setKa( [parseFloat(lineA[1]),
			                    parseFloat(lineA[2]),
			                    parseFloat(lineA[3])] );
		}
		
		var process_kd = function( lineA )
		{
			_currentMtl.setKd( [parseFloat(lineA[1]),
			                    parseFloat(lineA[2]),
			                    parseFloat(lineA[3])] );
		}
		
		var process_ks = function( lineA )
		{
			_currentMtl.setKs( [parseFloat(lineA[1]),
			                    parseFloat(lineA[2]),
			                    parseFloat(lineA[3])] );
		}
		
		var process_mapKd = function( lineA )
		{
		    var texArgs = [];
		    
		    for (var i = 1; i < lineA.length; ++i)
		    {
		        texArgs.push(lineA[i]);
		    }
		    
		    var texture = new GTexture(texArgs, _path);
		    
		    _currentMtl.setMapKd(texture);
		}
		
		var lineHandlerMap = 
		{
			"#":    process_comment,
			newmtl: process_newmtl,
			ka:     process_ka,
			kd:     process_kd,
			ks:     process_ks,
			map_kd: process_mapKd,
		}
		
		init_GMtlReader ( mtlStrA );
	}


	var _client = new XMLHttpRequest();
	var _target = scene_;
	
	this.loadMtl = function ( path, source )
	{
		_client.open('GET', path + source);
		_client.onreadystatechange = function() 
		{
			if ( _client.readyState == 4 )
			{
				var i = 0;
				var mtlFile = _client.responseText.split("\n");
				
				var mtlReader = new GMtlReader (mtlFile, path);
				
				var mtls = mtlReader.getMaterials();
				
				for (var key in mtls)
				{
					_target.addMaterial(mtls[key]);
				}				
			}
		}
		_client.send();
	}
}

