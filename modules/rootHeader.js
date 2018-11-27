const fs = require('fs');
const file = require('./file');
const buffreverse = require('buffer-reverse/inplace');

global.storageName = "C:/Users/NGA/Desktop/FileSystem/test.storage";		// 나중에 설치경로 받아와서 넣기.

global.RHB = 256;			// Root Header Bytes
global.BPB = 1/8;			// Body per bitmap Bytes		 
global.NHB = 256; 			// Nomal Header Bytes
global.BDB = 1024*1024;		// Body Bytes;
global.HPB = 1/32;			// header per bitmap Bytes


function rootHeader(uuid,storageSize){

	return new Promise(function(resolve,reject){

		var s = storageSize; 															// s -> fullsize
		var bn = file.blockNum(s); 														// 블록량 
		var rs = s-(RHB+(Math.ceil(bn*HPB))+(Math.ceil(bn*BPB))+(NHB*Math.ceil(bn))); 	// rs -> 남은 사이즈
		rs= file.byteSet(rs.toString(16)); 											
		s=file.byteSet(s.toString(16));

		var tbuf1 = Buffer.from(uuid);
		var ubuf = Buffer.concat([tbuf1],48);

		var tbuf2 = buffreverse(Buffer.from(s, 'hex'));
		var sbuf1 = Buffer.concat([tbuf2],16);

		var tbuf3 = buffreverse(Buffer.from(rs, 'hex'));
		var sbuf2 = Buffer.concat([tbuf3],16);

		var arr = [ubuf,sbuf1,sbuf2];
		var result = Buffer.concat(arr,256);

		resolve(result);

	});

}

function updateRootHeader(fd, usedSize){

	return new Promise(function(resolve,reject){

		var size = new Buffer(16);

		try{

			fs.readSync(fd, size, 0, 16, 64);

		}
		catch(err){

			reject("updateRootHeader fs.readSync err : ",err);

		}

		size = buffreverse(size);			// 이전 사이즈


		var newSize = file.byteSet((file.buff2Hexa(size)-usedSize).toString(16));
		newSize = Buffer.from(newSize,'hex');

		try{

			fs.writeSync(fd, buffreverse(newSize),0, newSize.length, 64);	// 업데이트 사이즈.

		}
		catch(err){

			reject("updateRootHeader fs.writeSync err : ",err);

		}

		resolve(1);

	});

}

module.exports = {

	update : updateRootHeader,
	create : rootHeader

};