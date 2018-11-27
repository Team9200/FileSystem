const fs= require('fs');
const uuid= require('uuid');
const buffreverse = require('buffer-reverse/inplace');
const sha256File = require('sha256-file');
const md5File = require('md5-file');

global.storageName = "C:/Users/NGA/Desktop/FileSystem/test.storage";

global.RHB = 256;			// Root Header Bytes
global.BPB = 1/8;			// Body per bitmap Bytes		 
global.NHB = 256; 			// Normal Header Bytes
global.BDB = 1024*1024;		// Body Bytes;
global.HPB = 1/32;			// header per bitmap Bytes

function byteSet(hexStr){

	if(hexStr.length % 2 != 0){

		return "0"+hexStr;

	}
	return hexStr;

}

function buff2Hexa(buffer){

	return parseInt("0x"+buffer.toString('hex'),16);

}

function getFileSize(filename) {			// get File Name / return File Size

	return new Promise(function(resolve, reject){

	    const stats = fs.statSync(filename);
	    const fileSizeInBytes = stats.size;
	    resolve(fileSizeInBytes);

    })

}

function blockNum(size){

	var root = RHB ;
	var bitmap = BPB; 
	var header = NHB;
	var body = BDB;
	var bn= 8*(size-root)/((bitmap*8)+(HPB*8)+(header*4*8)+(body*8));
	
	return Math.floor(bn);

}

function bitMapSize(size){

	return Math.ceil(blockNum(size)/8);

}

function bodyBitMapSize(size){

	return Math.ceil(blockNum(size)/8);

}
function headerBitMapSize(size){

	return Math.ceil(blockNum(size)/32);

}


function headerSize(size){

	return headerNum(size)*128;

}

function headerNum(size){

	return Math.ceil(blockNum(size)/4);

}

module.exports = {

	buff2Hexa : buff2Hexa,
	blockNum : blockNum,
	bodyBitMapSize : bodyBitMapSize,
	headerBitMapSize : headerBitMapSize,
	headerSize : headerSize,
	headerNum : headerNum,
	getFileSize : getFileSize,
	byteSet : byteSet


};

