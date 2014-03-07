/**
 * @constructor
 */
function GMtlLoader( scene_ )
{
    /**
     * @constructor
     */
	this.GMtlReader = function( mtlStrA, path )
	{
	    this.path = path;
		this.materials = {};
		this.currentMtl = undefined;
		
		var lineHandlerMap = 
		{
			"#":    this.process_comment,
			newmtl: this.process_newmtl,
			ka:     this.process_ka,
			kd:     this.process_kd,
			ks:     this.process_ks,
			map_kd: this.process_mapKd
		}
		
		
        var size = mtlStrA.length;
        for ( var i = 0; i < size; ++i )
        {
            var stra = mtlStrA[i].split(" ");
            
            this.handler = lineHandlerMap[stra[0]];
            if (this.handler != undefined)
            {
                this.handler(stra);
            }
            else
            {
                //console.debug("Cant handle [" + mtlStrA[i] + "]");
            }
        }
	}
		
    this.GMtlReader.prototype.getMaterials = function()
    {
        return this.materials;
    }
    
    this.GMtlReader.prototype.process_comment = function (lineA)
    {
    }
    
    this.GMtlReader.prototype.process_newmtl = function ( lineA )
    {
        this.currentMtl = new GMaterial( lineA[1] );
        this.materials[lineA[1]] = this.currentMtl;
    }
    
    this.GMtlReader.prototype.process_ka = function( lineA )
    {
        this.currentMtl.setKa( [parseFloat(lineA[1]),
                                parseFloat(lineA[2]),
                                parseFloat(lineA[3])] );
    }
    
    this.GMtlReader.prototype.process_kd = function( lineA )
    {
        this.currentMtl.setKd( [parseFloat(lineA[1]),
                                parseFloat(lineA[2]),
                                parseFloat(lineA[3])] );
    }
    
    this.GMtlReader.prototype.process_ks = function( lineA )
    {
        this.currentMtl.setKs( [parseFloat(lineA[1]),
                                parseFloat(lineA[2]),
                                parseFloat(lineA[3])] );
    }
    
    this.GMtlReader.prototype.process_mapKd = function( lineA )
    {
        var texArgs = [];
        
        for (var i = 1; i < lineA.length; ++i)
        {
            texArgs.push(lineA[i]);
        }
        
        var texture = new GTexture(texArgs, this.path);
        
        this.currentMtl.setMapKd(texture);
    }

	this.client = new XMLHttpRequest();
	this.target = scene_;
}
	
GMtlLoader.prototype.loadMtl = function ( path, source )
{
    this.client.open('GET', path + source);
    this.client.onreadystatechange = function() 
    {
        if ( this.client.readyState == 4 )
        {
            var i = 0;
            var mtlFile = this.client.responseText.split("\n");
            
            var mtlReader = new this.GMtlReader (mtlFile, path);
            
            var mtls = mtlReader.getMaterials();
            
            for (var key in mtls)
            {
                this.target.addMaterial(mtls[key]);
            }				
        }
    }.bind(this);
    this.client.send();
}


