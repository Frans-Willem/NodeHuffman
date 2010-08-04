var sys;
if (typeof(require)==="function") {
	sys=require("sys");
} else {
	sys={
		puts:function(str) { alert(str); }
	};
}

function PQ() {
	this.heap=[];
	this.len=0;
}

PQ.prototype.bubbleUp=function(node) {
	var index=node.index;
	while (true) {
		if (index==0) //Can't bubble up further
			return;
		var topindex=Math.floor((index-1)/2);
		if (node.id > this.heap[topindex].id)
			return;
		this.heap[index]=this.heap[topindex];
		this.heap[index].index=index;
		this.heap[topindex]=node;
		index=topindex;
		node.index=index;
	}
}

PQ.prototype.bubbleDown=function(node) {
	var curindex=node.index;
	var highestindex;
	while (true) {
		var leftindex=(curindex*2)+1;
		var rightindex=(curindex*2)+2;
		if (leftindex>=this.len) {
			return; //Can't bubble down lower
		}
		if (rightindex<this.len && this.heap[rightindex].id < this.heap[leftindex].id) {
			highestindex=rightindex;
		} else {
			highestindex=leftindex;
		}
		if (this.heap[highestindex].id < node.id) {
			this.heap[curindex]=this.heap[highestindex];
			this.heap[highestindex]=node;
			node.index=highestindex;
			this.heap[curindex].index=curindex;
			curindex=highestindex;
		} else {
			return; //No more bubbling down, biggest element under it is not bigger
		}
	}
}

PQ.prototype.insert=function(node) {
	node.index=this.len++;
	this.heap[node.index]=node;
	this.bubbleUp(node);
}
PQ.prototype.remove=function(node) {
	var last=this.heap[--this.len];
	if (last!==node) {
		this.heap[node.index]=last;
		last.index=node.index;
		this.bubbleDown(last);
	}
	node.index=-1;
}
PQ.prototype.top=function() {
	return (this.len>0)?this.heap[0]:undefined;
}

function isNumeric(n) {
	return Math.floor(n)==n;
}

function HuffmanTree() {
	this._paths={};
	this._nextId=0;
	this._objNYT={stub:"NYT"};
	this._objEnd={stub:"END"};
	this._nodeChar={};
	this._blocks={};
	this._blocks[0]=new PQ();
	if (true) {
		this._root={
			id: this._nextId++,
			data: [],
			weight: 0
		};
		this._root.parent=this._root;
		this._nodeNYT=this._root.data[0]={
			id: this._nextId++,
			data: this._objNYT,
			weight: 0,
			parent: this._root
		};
		this._nodeEnd=this._root.data[1]={
			id: this._nextId++,
			data: this._objEnd,
			weight: 0,
			parent: this._root
		};
		this._blocks[0].insert(this._root);
		this._blocks[0].insert(this._nodeNYT);
		this._blocks[0].insert(this._nodeEnd);
	} else {
		this._root=this._nodeNYT={
			id: this._nextId++,
			data: this._objNYT,
			weight: 0
		};
		this._root.parent=this._root;
		this._blocks[0].insert(this._root);
	}
	var alphabet="ABCDEFGHIJKLMNOPQRTSUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	//Generate _compressRoot
	var bits=Math.floor(Math.log(alphabet.length)/Math.log(2));
	this._compressRoot=[];
	var i,bit,set,current,next;
	for (i=0; i<(1<<bits); i++) {
		current=this._compressRoot;
		for (bit=0; bit+1<bits; bit++) {
			set=((i & (1<<bit))!=0)?1:0;
			next=current[set];
			if (typeof(next)!=="object") current=current[set]=[];
			else current=next;
		}
		set=((i & (1<<bit))!=0)?1:0;
		current[set]=alphabet.charAt(i);
	}
	
	this._compressed="";
	this._compressCurrent=this._compressRoot;
	
	//Generate uncompressTable
	this._uncompressTable={};
	for (i=0; i<(1<<bits); i++) {
		var b=[];
		for (bit=0; bit<bits; bit++) {
			set=((i & (1<<bit))!=0)?1:0;
			b.push(set);
		}
		this._uncompressTable[alphabet.charAt(i)]=b;
	}
	this._uncompressStage=((this._root === this._nodeNYT)?(HuffmanTree.uncompressStage.nytSize):(HuffmanTree.uncompressStages.normal));
	this._uncompressNode=this._root;
	this._uncompressNytSize=0;
	this._uncompressNytReceived=0;
	this._uncompressNyt=0;
	this._uncompressed="";
}

HuffmanTree.uncompressStages={
	normal: 0, //Normally traversing through tree
	nytSize: 1, //Getting the size of an NYT character
	nytChar: 2, //Getting an NYT character,
	flushing: 3 //Flushing character
};

HuffmanTree.prototype._outputCompressedBit=function(bit) {
	this._compressCurrent=this._compressCurrent[bit];
	if (typeof(this._compressCurrent)!=="object") {
		this._compressed+=this._compressCurrent;
		this._compressCurrent=this._compressRoot;
	}
	
}
HuffmanTree.prototype._flushCompressed=function() {
	while (this._compressCurrent!==this._compressRoot) {
		this._compressCurrent=this._compressCurrent[0];
		if (typeof(this._compressCurrent)!=="object") {
			this._compressed+=this._compressCurrent;
			this._compressCurrent=this._compressRoot;
		}
	}
	var s=this._compressed;
	this._compressed="";
	this.onCompressed(s);
}
HuffmanTree.prototype.onCompressed=function() {};
HuffmanTree.prototype.onUncompressed=function() {};

HuffmanTree.prototype._outputCompressedNode=function(node) {
	var out=[];
	var isEnd=(node===this._nodeEnd);
	var i=0;
	while (node!==this._root) {
		var parent=node.parent;
		if (parent.data[0]===node) out[i++]=0;
		else if (parent.data[1]===node) out[i++]=1;
		node=parent;
	}
	for (i=0; i<out.length; i++) {
		var bit=out[out.length-(i+1)];
		this._outputCompressedBit(bit);
	}
	if (isEnd) {
		this._flushCompressed();
	}
	/*var str="";
	while (out.length) {
		str+=out.pop();
	}*/
	//sys.puts("Out: "+str);
}

HuffmanTree.prototype._outputCompressedChar=function(chr) {
	chr=chr.charCodeAt(0);
	var bits=Math.ceil(Math.log(chr)/Math.log(2));
	if (bits<=8) {
		bits=8;
		this._outputCompressedBit(1)
	} else if (bits<=16) {
		bits=16;
		this._outputCompressedBit(0);
		this._outputCompressedBit(1);
	} else if (bits<=32) {
		bits=32;
		this._outputCompressedBit(0);
		this._outputCompressedBit(0);
		this._outputCompressedBit(1);
	} else throw new Error("Invalid character");
	for (var bit=0; bit<bits; bit++) {
		this._outputCompressedBit((chr >> bit)&1);
	}
}

HuffmanTree.prototype._getEarliestByWeight=function(weight) {
	var block=this._blocks[weight];
	var earliest=undefined;
	for (var id in block) {
		var cur=block[id];
		if (typeof(cur)==="object") {
			if (earliest===undefined || cur.id<earliest.id) {
				earliest=cur;
			}
		}
	}
	return earliest;
}

HuffmanTree.prototype._splitNYT=function(node,chr) {
	var oldNYT=node;
	var newnode={id:this._nextId++,data:chr,weight:1,parent:oldNYT};
	this._nodeNYT={id:this._nextId++,data:this._objNYT,weight:0,parent:oldNYT};
	if (typeof(this._blocks[1])!=="object")
		this._blocks[1]=new PQ();
	oldNYT.data=[this._nodeNYT,newnode];
	this._blocks[1].insert(newnode);
	this._blocks[0].insert(this._nodeNYT);
	return newnode;
}

HuffmanTree.prototype.swapNodes=function(a,b) {
	//this.printTree();
	var adata=a.data;
	var aweight=a.weight;
	var aparent=a.parent;
	
	a.data=b.data;
	a.weight=b.weight;
	
	b.data=adata;
	b.weight=aweight;
	
	if (typeof(a.data)==="object") {
		if (a.data===this._objNYT) {
			this._nodeNYT=a;
		} else if (a.data===this._objEnd) {
			this._nodeEnd=a;
		} else {
			a.data[0].parent=a;
			a.data[1].parent=a;
		}
	} else {
		this._nodeChar[a.data]=a;
	}
	
	if (typeof(b.data)==="object") {
		if (b.data===this._objNYT) {
			this._nodeNYT=b;
		} else if (b.data===this._objEnd) {
			this._nodeEnd=b;
		} else {
			b.data[0].parent=b;
			b.data[1].parent=b;
		}
	} else {
		this._nodeChar[b.data]=b;
	}
}

HuffmanTree.prototype._updateTree=function(node) {
	while (true) {
		//Step 2: If this is not the highest (=earliest) node in the block, swap it
		var earliest=this._blocks[node.weight].top();
		if (earliest!==node && node.parent!==earliest) {
			this.swapNodes(earliest,node);
			node=earliest;
		}
		//Step 3: Increase weight for current node
		//delete this._blocks[node.weight][node.id];
		this._blocks[node.weight].remove(node);
		node.weight++;
		if (typeof(this._blocks[node.weight])!=="object") {
			this._blocks[node.weight]=new PQ();
		}
		this._blocks[node.weight].insert(node);
		//Step 4: If this is not the root node go to parent node then go to step 2. If this is the root, end.
		if (this._root===node) {
			break;
		}
		node=node.parent;
	}
}

HuffmanTree.prototype.compressCharacter=function(chr) {
	var node;
	if (chr==this._objEnd) node=this._nodeEnd;
	else node=this._nodeChar[chr];
	if (typeof(node)!=="object") {
		node=this._nodeNYT;
		this._outputCompressedNode(node);
		this._outputCompressedChar(chr);
		this._nodeChar[chr]=this._splitNYT(node,chr);
	} else {
		this._outputCompressedNode(node);
	}
	this._updateTree(node);
}

HuffmanTree.prototype.compressFlush=function() {
	return this.compressCharacter(this._objEnd);
}

HuffmanTree.prototype._uncompressBit=function(bit) {
	switch (this._uncompressStage) {
		case HuffmanTree.uncompressStages.normal:{
			if (!Array.isArray(this._uncompressNode.data) || this._uncompressNode.data.length!==2) {
				sys.puts(sys.inspect(this._uncompressNode)+" "+(this._uncompressNode===this._root));
				throw new Error("Invalid node!");
			}
			this._uncompressNode=this._uncompressNode.data[bit];
			if (this._uncompressNode===this._nodeNYT) {
				this._uncompressNytSize=0;
				this._uncompressStage=HuffmanTree.uncompressStages.nytSize;
			} else if (this._uncompressNode===this._nodeEnd) {
				this._updateTree(this._uncompressNode);
				var d=this._uncompressed;
				this._uncompressed="";
				this._uncompressStage=HuffmanTree.uncompressStages.flushing;
				this._uncompressNode=this._root;
				this.onUncompressed(d);
			} else if (typeof(this._uncompressNode.data)!=="object") {
				this._uncompressed+=this._uncompressNode.data;
				this._updateTree(this._uncompressNode);
				this._uncompressNode=this._root;
			}
			break;
		};
		case HuffmanTree.uncompressStages.nytSize:{
			if (bit==0) this._uncompressNytSize++;
			else {
				this._uncompressNytSize=1<<(3+this._uncompressNytSize);
				this._uncompressNytReceived=0;
				this._uncompressNyt=0;
				this._uncompressStage=HuffmanTree.uncompressStages.nytChar;
			}
			break;
		};
		case HuffmanTree.uncompressStages.nytChar:{
			var cur=this._uncompressNytReceived++;
			if (bit!==0) {
				this._uncompressNyt|=(1<<cur);
			}
			if (this._uncompressNytReceived===this._uncompressNytSize) {
				//Move on to next
				var chr=String.fromCharCode(this._uncompressNyt);
				this._nodeChar[chr]=this._splitNYT(this._uncompressNode,chr);
				this._updateTree(this._uncompressNode);
				this._uncompressed+=chr;
				
				this._uncompressNode=this._root;
				this._uncompressNytSize=0;
				this._uncompressStage=(this._uncompressNode===this._nodeNYT)?HuffmanTree.uncompressStages.nytSize:HuffmanTree.uncompressStages.normal;
			}
			break;
		};
		case HuffmanTree.uncompressStages.flushing: {
			break;
		}
	}
}

HuffmanTree.prototype.printTree=function() {
	return this.printNode(this._root);
}
HuffmanTree.prototype.printNode=function(node) {
	var seen={};
	var self=this;
	function printNode(node) {
		if (node===undefined)
			return "##";
		if (seen[node.id])
			return "##";
		seen[node.id]=true;
		if (node===self._nodeNYT) {
			return "[NYT]";
		}
		if (node===self._nodeEnd) {
			return "[End]";
		}
		if (typeof(node.data)!=="object") {
			return "[chr '"+node.data+"']";
		}
		return "["+printNode(node.data[0])+","+printNode(node.data[1])+"]";
	}
	return printNode(node);
}

HuffmanTree.prototype.uncompressCharacter=function(chr) {
	var bits=this._uncompressTable[chr];
	if (typeof(bits)==="object" && Array.isArray(bits)) {
		var self=this;
		bits.forEach(function(x) {
			self._uncompressBit(x);
		});
		if (this._uncompressStage===HuffmanTree.uncompressStages.flushing) {
			this._uncompressStage=HuffmanTree.uncompressStages.normal;
		}
	} else throw new Error("Invalid character "+chr);
}

function go() {
	var hf=new HuffmanTree();
	var send="[0,{\"0\":[\"o\",{\"msg\":\"Hello world\",\"set\":{\"t\":1,\"i\":1},\"get\":{\"t\":1,\"i\":2},\"timerAsync\":{\"t\":1,\"i\":3},\"timerCustom\":{\"t\":1,\"i\":4}}],\"1\":[\"f\",{}],\"2\":[\"f\",{}],\"3\":[\"f\",{}],\"4\":[\"f\",{}]},\"ipc\",{\"t\":1,\"i\":0}]\n[1,{},{\"t\":0,\"i\":\"1\"},{\"t\":0,\"i\":\"0\"},\"Hello world\"]\n[1,{\"0\":[\"f\",{}]},{\"t\":0,\"i\":\"2\"},{\"t\":0,\"i\":\"0\"},{\"t\":1,\"i\":0}]\n[1,{},{\"t\":0,\"i\":\"0\"},{\"t\":2},\"Hello world\"]\n[2,\"0\"]\n[1,{\"0\":[\"f\",{}]},{\"t\":0,\"i\":\"3\"},{\"t\":0,\"i\":\"0\"},{\"t\":1,\"i\":0}]\n[1,{\"1\":[\"f\",{}]},{\"t\":0,\"i\":\"4\"},{\"t\":0,\"i\":\"0\"},{\"t\":1,\"i\":1}]\n[2,\"0\",\"1\",\"2\",\"3\",\"4\"]\n[1,{},{\"t\":0,\"i\":\"0\"},{\"t\":2}]\n[2,\"0\"]\n[1,{},{\"t\":0,\"i\":\"1\"},{\"t\":2}]\n[2,\"1\"]";
	send=send+send;
	send=send+send;
	send=send+send;
	send=send+send;
	send=send+send;
	send=send+send;
	send=send+send;
	//send=send.substr(0,50);
	//send=send+send;
	//var send="abcd\n";
	send="abcdefghijklmnopqrstuvwxyz";
	for (var doubleup=0; doubleup<0; doubleup++);
		send+=send;
	
	var sent="";
	var lines=[];
	hf.onCompressed=function(data) {
		sent+=data;
	}

	//hf.printTree();
	var start=new Date();
	for (var trip=0; trip<10000; trip++) {
		for (var i=0; i<26; i++) {
			/*var c=send.charAt(i);
			if (c==="\n") hf.compressFlush();
			else hf.compressCharacter(c);*/
			hf.compressCharacter(String.fromCharCode(97+i));
		}
	}
	hf.compressFlush();
	var end=new Date();
	var duration=end-start;
	var sentCompressed=sent.length;
	var sentUncompressed=i*trip;
	sys.puts("Sent: "+Math.ceil((sentCompressed*100)/sentUncompressed)+"% ("+sentCompressed+"/"+sentUncompressed+") "+duration);
	sys.puts("comp kbps: "+((sentUncompressed/1024)/(duration/1000)));
	/*var n=0;
	sys.puts("Output: "+lines[n]+" "+send.split("\n")[n]);*/
	
	start=new Date();
	var hf2=new HuffmanTree();
	var got=0;
	hf2.onUncompressed=function(data) {
		if (got++<5) {
			sys.puts("Line: "+data.substr(0,10));
		}
	}
	for (i=0; i<sent.length; i++) {
		hf2.uncompressCharacter(sent[i]);
	}
	end=new Date();
	duration=end-start;
	sys.puts("decomp kbps (input): "+((sent.length/1024)/(duration/1000)));
	sys.puts("decomp kbps (output): "+(((send.length*3)/1024)/(duration/1000)));
	//sys.puts("Uncomp: "+JSON.stringify(hf2._uncompressed.substr(0,100)));
	return false;
}

if (typeof(require)==="function") go();
if (typeof(window)==="object") {
	window.onload=function() {
		document.getElementById("gobtn").onclick=go;
	}
}