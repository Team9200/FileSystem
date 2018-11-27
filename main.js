const fs= require('fs');
const uuid= require('uuid');
const buffreverse = require('buffer-reverse/inplace');
const sha256File = require('sha256-file');
const md5File = require('md5-file');
const DirectoryWatcher = require('directory-watcher');



const bit = require('./modules/bit-vector');
const normalHeader = require('./modules/normalHeader');
const rootHeader = require('./modules/rootHeader');
const body = require('./modules/body');
const file = require('./modules/file');
const dirwatch = require('./modules/DirectoryWatcher')

global.storageName = "test.storage";

global.RHB = 256;			// Root Header Bytes
global.BPB = 1/8;			// Body per bitmap Bytes		 
global.NHB = 256; 			// Normal Header Bytes
global.BDB = 1024*1024;		// Body Bytes;
global.HPB = 1/32;			// header per bitmap Bytes


function recive(unknownFileName){

	return new Promise(async function(resolve, reject){

		var storage = await fs.openSync(storageName,"r+");
		var storageSize= await file.getFileSize(storageName);

		var collector = uuid.v1();
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
		
		await fs.closeSync(unknownFile)
		await fs.closeSync(storage);
		await fs.unlinkSync(unknownFileName);		

		console.log("recive Success.");

		//////////////////////////////////////////////////////////////////////////////////////////////
		resolve(1);

	});

}
async function extract(){

	var storage = await fs.openSync(storageName,"r+");
	var storageSize= await file.getFileSize(storageName);
	var unknownFile = await fs.openSync("output/unknown","w+");

	var usedHeader = await bit.usedSpace(storage, storageSize);												// 사용중인 헤더들

	if(usedHeader.length == 0)

		throw new Error('Dose not have a file'); //err

	var headerStart = RHB + file.headerBitMapSize(storageSize) + file.bodyBitMapSize(storageSize);			// 헤더 시작주소
	var header = await normalHeader.parse(storage, storageSize, headerStart, usedHeader[Math.floor(Math.random()*usedHeader.length)]);		// 추출할 헤더.

	console.log("extracting...");

	await body.extract(storage,unknownFile ,header.size, header.start);			// 추출.
	await fs.closeSync(storage);
	await fs.closeSync(unknownFile);

	console.log("extract Success.");

}
function start(){

	var storageMonitor = new dirwatch.DirectoryWatcher("storage", true);

	storageMonitor.start(3000);

	storageMonitor.on("fileAdded", function (fileDetail) {			// file add
	  	
	  	console.log("File Added: " + fileDetail.fullPath.split("\\")[1]);
	  	var file =fileDetail.fullPath.split("\\")[1];
	  	
	  	if(file == "give"){

	  		extract();
	  		fs.unlinkSync(fileDetail.fullPath);
	  	}

	  	else
	  		recive(fileDetail.fullPath);

	});

	// Let us know that directory monitoring is happening and where.
	console.log("Directory Monitoring of " + storageMonitor.root + " has started");




}
start();