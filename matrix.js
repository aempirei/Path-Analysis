/*
 * linear algebra library
 * Copyright(c) 2015 256 LLC | 20 GOTO 10
 * Written by Christopher Abad <aempirei@256.bz>
 */

"use strict";

function readOnly(o,s,x) {
	Object.defineProperty(o,s,{writable:false,value:x});
}

function transposeIndex(i,j) {
	return this.parent.index(j,i);
}

function subIndex(i,j) {
	return this.parent.index(i + this.i0, j + this.j0);
}

function linearIndex(i,j) {
	return i + j * this.width;
}

function Matrix(width,height,parent,index) {

	readOnly(this,'width',width);
	readOnly(this,'height',height);
	readOnly(this,'parent',parent);

	if(parent === undefined) {

		readOnly(this,'data',[]);
		readOnly(this,'index',linearIndex);

		var i = width * height;

		while(i--)
			this.data[i] = 0;
	} else {

		readOnly(this,'index',index === undefined ? subIndex : index);

		readOnly(this,'data',parent.data);
	}
}

Matrix.prototype.get = function(i,j) {
	return this.data[this.index(i,j)];
};

Matrix.prototype.set = function(i,j,x) {
	return ( this.data[this.index(i,j)] = x );
};

Matrix.prototype.transpose = function() {
	return new Matrix(this.height,this.width,this,transposeIndex);
};

Matrix.prototype.submatrix = function(w,h,i,j) {
	var m = new Matrix(w,h,this);
	readOnly(m,'i0',i);
	readOnly(m,'j0',j);
	return m;
};

Matrix.prototype.row = function(j) {
	return this.submatrix(this.width,1,0,j);
};

Matrix.prototype.column = function(i) {
	return this.submatrix(1,this.height,i,0);
};

Matrix.prototype.foreach = function(f) {
	for(var i = 0; i < this.width; i++)
		for(var j = 0; j < this.height; j++)
			f.call(this,i,j);
	return this;
};

Matrix.prototype.times = function(x) {

	if(x instanceof this.constructor) {

		var A = this;

		if(x.height !== A.width)
			throw 'left matrix width and right matrix height not equal!';

		var m = new Matrix(x.width,A.height);

		return m.foreach(function(i,j) {

			var dot = 0;

			for(var k = 0; k < A.width; k++)
				dot += A.get(k,j) * x.get(i,k);

			m.set(i, j, dot);
		});

	}

	return this.copy().foreach(function(i,j) { m.set(i, j, x * m.get(i,j)); });
};

Matrix.prototype.plus = function(b) {
	return this.copy().foreach(function(i,j) { this.set(i, j, this.get(i,j) + b.get(i,j)); });
};

Matrix.prototype.copy = function() {
	var a = new Matrix(this.width, this.height);
	var b = this;
	return a.foreach(function(i,j) { this.set(i, j, b.get(i,j)); });
};

Matrix.prototype.toString = function() {

	var s = '';

	for(var j = 0; j < this.height; j++) {

		s += j.toString() + ':';

		for(var i = 0; i < this.width; i++)
			s += ' ' + this.get(i,j);

		s += "\n";
	}

	s += "\n";

	return s;
};

window.onload = function(e) {
	d.appendChild(document.createTextNode("Window Loaded!"));
	var m = new Matrix(2,3);
	m.foreach(function(i,j) { this.set(i,j,i+j*2); });
	d.appendChild(document.createElement("br"));
	d.appendChild(document.createTextNode(m.width + "x" + m.height)); d.appendChild(document.createElement("br"));
	var pre = document.createElement("pre");
	pre.appendChild(document.createTextNode(m.toString()));
	var a = m.plus(m).times(m.transpose());
	pre.appendChild(document.createTextNode(a.toString()));
	d.appendChild(pre); d.appendChild(document.createElement("br"));
};
