/*
 * linear algebra library
 * Copyright(c) 2015 256 LLC | 20 GOTO 10
 * Written by Christopher Abad <aempirei@256.bz>
 */

"use strict";

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

	this.width = width;
	this.height = height;
	this.parent = parent;

	if(parent === undefined) {

		this.data = [];
		this.index = linearIndex;

		var i = width * height;

		while(i--)
			this.data[i] = 0;
	} else {

		this.index = index;
		this.data = parent.data;
	}
}

Matrix.prototype.get = function(i,j) {
	return this.data[this.index(i,j)];
};

Matrix.prototype.set = function(i,j,x) {
	return ( this.data[this.index(i,j)] = x );
};

Matrix.prototype.transpose = function() {
	return new this.constructor(this.height,this.width,this,transposeIndex);
};

Matrix.prototype.submatrix = function(w,h,i,j) {
	var m = new this.constructor(w,h,this,subIndex);
	m.i0 = i;
	m.j0 = j;
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

Matrix.prototype.times = function(b) {

	if(b instanceof this.constructor) {

		var a = this;

		var m = new this.constructor(b.width,a.height);

		return m.foreach(function(i,j) {

			var dot = 0;

			for(var k = 0; k < a.width; k++)
				dot += a.get(k,j) * b.get(i,k);

			m.set(i, j, dot);
		});

	}

	return this.copy().timesEq(b);
};

Matrix.prototype.timesEq = function(b) {
	return this.foreach(function(i,j) { this.set(i, j, b * this.get(i,j)); });
}

Matrix.prototype.minus = function(b) {
	return this.copy().minusEq(b);
};

Matrix.prototype.minusEq = function(b) {
	return this.foreach(function(i,j) { this.set(i, j, this.get(i,j) - b.get(i,j)); });
};

Matrix.prototype.plus = function(b) {
	return this.copy().plusEq(b);
};

Matrix.prototype.plusEq = function(b) {
	return this.foreach(function(i,j) { this.set(i, j, this.get(i,j) + b.get(i,j)); });
};

Matrix.prototype.assign = function(b) {
	return this.foreach(function(i,j) { this.set(i, j, b.get(i,j)); });
};

Matrix.prototype.copy = function() {
	var a = new this.constructor(this.width, this.height);
	return a.assign(this);
};

Matrix.prototype.toString = function() {

	var pad_sz = 2;
	var s = '';

	for(var j = 0; j < this.height; j++) {

		s += j.toString() + ':';

		for(var i = 0; i < this.width; i++)
			s += ' '.repeat(1 + Math.max(0, pad_sz - this.get(i,j).toString().length)) + this.get(i,j);

		s += "\n";
	}

	s += "\n";

	return s;
};

Matrix.prototype.rowswap = function(j1,j2) {

	for(var i = 0; i < this.width; i++) {

		var x1 = this.get(i,j1);
		var x2 = this.get(i,j2);

		this.set(i,j1,x2);
		this.set(i,j2,x1);
	}

	return this;
};

Matrix.identity = function(n) {
	var m = new Matrix(n,n);
	return m.foreach(function(i,j) { this.set(i, j, i == j ? 1 : 0); });
};

window.onload = function(e) {
	d.appendChild(document.createTextNode("Window Loaded!"));
	var m = new Matrix(1,3);
	m.foreach(function(i,j) { this.set(i,j,1+i+j*2); });
	d.appendChild(document.createElement("br"));
	d.appendChild(document.createTextNode(m.width + "x" + m.height));
	d.appendChild(document.createElement("br"));
	var pre = document.createElement("pre");
	pre.appendChild(document.createTextNode(m.toString()));
	var a = m.plus(m).times(m.transpose()).times(2);
	var b = m.plus(m).transpose().times(m).times(2);
	pre.appendChild(document.createTextNode(a.toString()));
	pre.appendChild(document.createTextNode(b.toString()));
	d.appendChild(pre);
	d.appendChild(document.createElement("br"));
};
