const fs=require('fs');
const file = require('./modules/file');
const normalHeader = require('./modules/normalHeader');
const bit = require('./modules/bit-vector');

global.storageName = "test.storage";

global.RHB = 256;			// Root Header Bytes
global.BPB = 1/8;			// Body per bitmap Bytes		 
global.NHB = 256; 			// Normal Header Bytes
global.BDB = 1024*1024;		// Body Bytes;
global.HPB = 1/32;			// header per bitmap Bytes


async function headerJson(){

	var storage = await fs.openSync(storageName,"r+");
	var storageSize= await file.getFileSize(storageName);
	var headerStart = RHB + file.headerBitMapSize(storageSize) + file.bodyBitMapSize(storageSize);

	var usedHeader = await bit.usedSpace(storage,storageSize);

	console.log(usedHeader);

	var result = new Array();

	usedHeader.forEach(async function(freeSpace,index){

		var header = await normalHeader.parse(storage , storageSize, headerStart, freeSpace);
		result[index] = header
	});

	var f= await fs.openSync('header.json',"w+");
	console.log(result);
	fs.writeSync(f, JSON.stringify(result));

}

headerJson();