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
function GObjReaderObserver () {}

/**
 * This function is called whenever a new GeometryTriMesh object is loaded
 * @param {GeometryTriMesh} mesh New object that was just made available
 */
GObjReaderObserver.prototype.onNewMeshAvailable = function ( mesh ) {};

/**
 * @constructor
 * @param {string} path Path to the location of this obj file's resources
 * @param {Array.<string>} objStrA Lines of the obj file
 * @param {GScene} scene Target scene for the loading process
 * @param {GGroup} group Target group for the loading process
 * @param {GObjReaderObserver} observer Observer to the loading process
 */
function GObjReader( path, objStrA, scene, group, observer )
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
	};

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
        "s"      :this.process_smooth,
		"f"      :this.process_face,
		"mtllib" :this.process_mtllib,
		"usemtl" :this.process_usemtl,
		"invnv"  :this.process_invnv
	}
}

/**
 * Advance through the loading process
 * @param {number} time Milliseconds since the last update
 */
GObjReader.prototype.update = function (time)
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
        this.process_end_of_file();
		//console.debug("Loaded " + this.polyCount + " polygons in " + Object.keys(this.groupMap).length + " objects.");
		this.isLoadComplete = true;
	}
	
};
 
/** 
 * Remove unimportant tokens from the token array
 * @param {Array.<string>} stra Token array
 * @return {Array.<string>} Scrubbed token array
 */
GObjReader.prototype.scrub = function( stra )
{
    // find all the unprintable characters that might sneak in...
    //From https://github.com/slevithan/XRegExp/blob/master/src/addons/unicode/unicode-categories.js#L28
    var re = /[\0-\x1F\x7F-\x9F\xAD\u0378\u0379\u037F-\u0383\u038B\u038D\u03A2\u0528-\u0530\u0557\u0558\u0560\u0588\u058B-\u058E\u0590\u05C8-\u05CF\u05EB-\u05EF\u05F5-\u0605\u061C\u061D\u06DD\u070E\u070F\u074B\u074C\u07B2-\u07BF\u07FB-\u07FF\u082E\u082F\u083F\u085C\u085D\u085F-\u089F\u08A1\u08AD-\u08E3\u08FF\u0978\u0980\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FC-\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0C00\u0C04\u0C0D\u0C11\u0C29\u0C34\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5A-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C80\u0C81\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0D01\u0D04\u0D0D\u0D11\u0D3B\u0D3C\u0D45\u0D49\u0D4F-\u0D56\u0D58-\u0D5F\u0D64\u0D65\u0D76-\u0D78\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F5-\u13FF\u169D-\u169F\u16F1-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180F\u181A-\u181F\u1878-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191D-\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C80-\u1CBF\u1CC8-\u1CCF\u1CF7-\u1CFF\u1DE7-\u1DFB\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u200B-\u200F\u202A-\u202E\u2060-\u206F\u2072\u2073\u208F\u209D-\u209F\u20BB-\u20CF\u20F1-\u20FF\u218A-\u218F\u23F4-\u23FF\u2427-\u243F\u244B-\u245F\u2700\u2B4D-\u2B4F\u2B5A-\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E3C-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u312E-\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FCD-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA698-\uA69E\uA6F8-\uA6FF\uA78F\uA794-\uA79F\uA7AB-\uA7F7\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C5-\uA8CD\uA8DA-\uA8DF\uA8FC-\uA8FF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9E0-\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAA7C-\uAA7F\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F-\uABBF\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE27-\uFE2F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD-\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFFB\uFFFE\uFFFF]/g;

	var len = stra.length;
	var ret = [];
	for (var i = 0; i < len; ++i)
	{
        stra[i] = stra[i].replace(re, "");
		if (stra[i] != "")
		{
			ret.push(stra[i]);
		}
	}
	return ret;
};

/**
 * This function is called while processing a comment line (starting with '#')
 * @param {Array.<string>} lineA
 */
GObjReader.prototype.process_comment = function( lineA ) {};

/**
 * This function is called while processing a group line (starting with 'o' or 'g')
 * @param {Array.<string>} lineA
 */
GObjReader.prototype.process_group = function( lineA )
{
    this.finalizeCurrentMesh();

    var name = lineA[1];

    for (var i = 2; i < lineA.length; ++i)
    {
        name += " " + lineA[i];
    }
	
	this.startNewGroup( name );
	
	//console.debug("adding group: " + name);
};

/**
 * This function is called while processing a vertex line (starting with 'v')
 * @param {Array.<string>} lineA
 */
GObjReader.prototype.process_vert = function( lineA )
{
	var vec = vec3.fromValues(parseFloat(lineA[1]),
							  parseFloat(lineA[2]),
							  parseFloat(lineA[3]));
	this.objGVerts.push(vec);
};

/**
 * This function is called while processing a texture vertex line (starting with 'tv')
 * @param {Array.<string>} lineA
 */
GObjReader.prototype.process_texVert = function( lineA )
{
	var vec = vec2.fromValues(parseFloat(lineA[1]),
							  parseFloat(lineA[2]));
							  
	this.objTVerts.push(vec);
};

/**
 * This function is called while processing a comment line (starting with 'vn')
 * @param {Array.<string>} lineA
 */
GObjReader.prototype.process_normal = function( lineA )
{
	var vec = vec3.fromValues(parseFloat(lineA[1]),
							  parseFloat(lineA[2]),
							  parseFloat(lineA[3]));
	this.objNormals.push(vec);
};

GObjReader.prototype.process_smooth = function( lineA )
{
    var smoothVal = false;

    if ( "on" === lineA[1] ||
         "1" === lineA[1] )
    {
        smoothVal = true;
    }

    if ( undefined !== this.currentMesh )
    {
        this.currentMesh.setSmoothing( smoothVal );
    }
};

/**
 * This is a helper function to be used when processing faces
 * @param {Array<string>} triDef
 */
GObjReader.prototype.process_triangle = function ( triDef )
{
    if ( this.currentMesh == undefined )
    {
        this.startNewGroup( "process_face" );
    }

    var tempNorm = [];

    ++this.polyCount;
    for (var i = 0; i < 3; ++i)
    {
        var idxs = new this.IndexRecord( triDef[i] );

        var vert = this.objGVerts[idxs.vertIdx];
        var norm = this.objNormals[idxs.normIdx];
        var vtex = this.objTVerts[idxs.textIdx];

        if (vtex === undefined)
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
        if ( undefined !== norm )
        {   // deffer saving the normal in case we have to calculate our own
            tempNorm.push(norm);
        }
        this.currentMesh.tVerts.push(vtex);
        this.currentMesh.indices.push(this.currentIndex++);
    }

    if ( tempNorm.length !== 3 )
    {
        // we have to calculate our own normals
        tempNorm = [];
        var vLen = this.currentMesh.gVerts.length;
        var a = vec3.create();
        var b = vec3.create();
        var c = vec3.create();
        vec3.subtract( a, this.currentMesh.gVerts[vLen-2], this.currentMesh.gVerts[vLen-3] );
        vec3.subtract( b, this.currentMesh.gVerts[vLen-1], this.currentMesh.gVerts[vLen-3] );
        vec3.cross( c, a, b );
        vec3.normalize( c, c );

        tempNorm.push(c); tempNorm.push(c); tempNorm.push(c);
    }

    this.currentMesh.nVerts.push(tempNorm[0]);
    this.currentMesh.nVerts.push(tempNorm[1]);
    this.currentMesh.nVerts.push(tempNorm[2]);
};

/**
 * This function is called while processing a face line (starting with 'f')
 * @param {Array.<string>} lineA
 */
GObjReader.prototype.process_face = function( lineA )
{
    var i = 0;
    var numPoints = lineA.length - 1;

    for ( i = 0; i < numPoints-2; ++i )
    {
        var triDef = [];

        triDef.push( lineA[1] );
        triDef.push( lineA[i+2] );
        triDef.push( lineA[i+3] );

        this.process_triangle( triDef );
    }

};

/**
 * This function is called while processing a material line (starting with 'mtllib')
 * @param {Array.<string>} lineA
 */
GObjReader.prototype.process_mtllib = function( lineA )
{
	var ldr = new GMtlLoader(this.scene);
	ldr.loadMtl(this.path, lineA[1]);
};

/**
 * This function is called while processing a use material line (starting with 'usemtl')
 * @param {Array.<string>} lineA
 */
GObjReader.prototype.process_usemtl = function( lineA )
{
    if ( this.currentMesh == undefined ||
         this.currentMesh.gVerts.length !== 0 )
    {
        this.finalizeCurrentMesh();
        this.startNewGroup( lineA[1] );
    }

	this.currentMesh.setMtlName( lineA[1] );
};

/**
 * This function is called while processing a invert normals line (starting with 'invnv')
 * @param {Array.<string>} lineA
 */
GObjReader.prototype.process_invnv = function( lineA )
{
	this.invertNormals = true;
};

/**
 * This function is called at the end of the file
 * @param lineA
 */
GObjReader.prototype.process_end_of_file = function( lineA )
{
    this.finalizeCurrentMesh();
};

/**
 * Finish the current mesh, save it on the hash and notify the observer.
 * This is a helper function for reading obj files
 */
GObjReader.prototype.finalizeCurrentMesh = function()
{
    this.invertNormals = false;

    if ( this.currentMesh != undefined )
    {
        this.currentMesh.prepareToClose();
        this.groupMap[this.currentMesh.getName()] = this.currentMesh;
        this.observer.onNewMeshAvailable(this.currentMesh);
    }
};

/**
 * Helper function to start a new geometry group
 * @param name
 */
GObjReader.prototype.startNewGroup = function( name )
{
    this.currentVertIMap = {};
    this.currentTextIMap = {};

    while (this.groupMap[name] != undefined)
    {
        name += "_";
    }

    this.currentMesh = new GeometryTriMesh(name);
    this.currentIndex = 0;
};

