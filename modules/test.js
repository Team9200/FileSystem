const fs= require('fs');
const uuid= require('uuid');
const buffreverse = require('buffer-reverse/inplace');
const sha256File = require('sha256-file');
const md5File = require('md5-file');

const bit = require('./modules/bit-vector');
const normalHeader = require('./modules/normalHeader');
const rootHeader = require('./modules/rootHeader');
const body = require('./modules/body');
const file = require('./modules/file');

global.storageName = "C:/Users/NGA/Desktop/FileSystem/test.storage";

global.RHB = 256;			// Root Header Bytes
global.BPB = 1/8;			// Body per bitmap Bytes		 
global.NHB = 256; 			// Normal Header Bytes
global.BDB = 1024*1024;		// Body Bytes;
global.HPB = 1/32;			// header per bitmap Bytes


async function recive(){

	var storage = await fs.openSync(storageName,"r+");
	var storageSize= await file.getFileSize(storageName);

	var collector = uuid.v1();
	var unknownFileName = "../ctf.zip";
	var unknownFile = fs.openSync(unknownFileName,"r+");
	var unknownFileSize = await file.getFileSize(unknownFileName);
	var date = 1543123401002;
	var needSpace = Math.ceil(unknownFileSize/((1024*1024)-32));

	//////////////////////////////////////////////////////////////////////////////////////////////
	// bitMap Check..

	var headerSpace = await bit.emptySpace(storage, storageSize, 1, "header");			// 	fd, storageSize, needSpace ,section 
	var bodySpace = await bit.emptySpace(storage, storageSize, needSpace, "body");		// fd, storageSize, needSpace ,section 

	if(headerSpace.length == 0){

		throw new Error('Header bitMap not enough space '); //err

	}
	if(bodySpace.length == 0){

		throw new Error('Header bitMap not enough space '); //err

	}

	var bodyStart = RHB + file.headerBitMapSize(storageSize) + file.bodyBitMapSize(storageSize) + file.headerSize(storageSize) + (BDB*bodySpace[0]);
	var headerStart = RHB + file.headerBitMapSize(storageSize) + file.bodyBitMapSize(storageSize);
	//////////////////////////////////////////////////////////////////////////////////////////////
	// bitMap Set..

	await bit.set(storage, storageSize, headerSpace[0], "header");					// fd, storageSize, freeSpace, section

	bodySpace.forEach(async function(freeSpace){									//fd, storageSize, freeSpace, section

		await bit.set(storage, storageSize, freeSpace, "body");

	});

	//////////////////////////////////////////////////////////////////////////////////////////////
	// header set..

	var headerBuffer = await normalHeader.create(collector, unknownFileName, unknownFileSize, bodyStart, date);
	await normalHeader.set(storage, headerBuffer, headerSpace[0], headerStart);		//storage, buffer ,offset, start

	//////////////////////////////////////////////////////////////////////////////////////////////
	// body set..

	await body.fileCopy(unknownFile, storage, bodySpace, unknownFileSize, storageSize);		// srcfd, dstfd, offset, srcSize, dstSize

	//////////////////////////////////////////////////////////////////////////////////////////////
	// root header update..

	await rootHeader.update(storage, unknownFileSize)



	//////////////////////////////////////////////////////////////////////////////////////////////
	await fs.closeSync(storage);

	console.log("done");

	//////////////////////////////////////////////////////////////////////////////////////////////



}
async function extract(){

	var storage = await fs.openSync(storageName,"r+");
	var storageSize= await file.getFileSize(storageName);

	var unknownFile = await fs.openSync("unknown","w+");

	var usedHeader = await bit.usedSpace(storage, storageSize);
	var headerStart = RHB + file.headerBitMapSize(storageSize) + file.bodyBitMapSize(storageSize);
	console.log(usedHeader[Math.floor(Math.random()*usedHeader.length)]);
	var header = await normalHeader.parse(storage, storageSize, headerStart, usedHeader[Math.floor(Math.random()*usedHeader.length)]);

	console.log(header);
	body.extract(storage,unknownFile ,header.size, header.start);

}

//recive();
extract();

