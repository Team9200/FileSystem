const fs = require('fs');
const file = require('./file');
const buffreverse = require('buffer-reverse/inplace');

function fileCopy(srcfd, dstfd, offset, srcSize, dstSize){

	return new Promise(function(resolve, reject){

		var count = Math.ceil(srcSize/ (BDB-32));								// loof count == used block 
		var start = RHB + file.headerBitMapSize(dstSize) + file.bodyBitMapSize(dstSize) + file.headerSize(dstSize);

		for(var index = 0; index < count ;index++){

			(function(index, count){

				this.setTimeout(function(){

					try{

						if(index == count-1) resolve("done");

						var sbuf = new Buffer(BDB-32);
						var head = 0;
						var tail = 0;

						if(index != 0){

							var head = start + (BDB*offset[index-1]);

						}
						if(index != count-1) {

							var tail = start + (BDB*offset[index+1]);

						}

						var tmp = Buffer.concat([Buffer.concat([buffreverse(Buffer.from(file.byteSet(head.toString(16)),'hex'))],16),Buffer.concat([buffreverse(Buffer.from(file.byteSet(tail.toString(16)),'hex'))],16)],32);
					    fs.readSync(srcfd, sbuf, 0, sbuf.length, sbuf.length * index);
					   
					    var result = Buffer.concat([tmp,sbuf],BDB);
					    fs.writeSync(dstfd ,result ,0, result.length, start + (BDB*offset[index]));



					}
					catch(err){

						reject("fileCopy function error : ",index,err);
					}

				}, 60);

			})(index,count);

		}
	});

}
function fileExtract(storage, unknownFile , unknownFileSize, unknownFileStart){


	return new Promise(function(resolve, reject){

		var count = Math.ceil(unknownFileSize/(BDB-32));
		var last = unknownFileSize - ((BDB-32)*(count-1));
		var next = unknownFileStart;

		for(var index = 0; index < count ;index++){

			(function(index, count){

				this.setTimeout(function(){

					if(index == count -1){

						var buffer = new Buffer(last);
						fs.readSync(storage, buffer, 0, buffer.length, next+32);
						fs.writeSync(unknownFile, buffer, 0, buffer.length, index*(BDB-32));
						resolve(1);

						
					}
					else{

						var buffer = new Buffer(BDB-32);
						var buff = new Buffer(32);
						fs.readSync(storage, buffer, 0, buffer.length, next+32);
						fs.readSync(storage, buff, 0, buff.length, next);
						fs.writeSync(unknownFile, buffer, 0, buffer.length, index*(BDB-32));
	
						next = file.buff2Hexa(buffreverse(buff.slice(16,32)));


					}					

				}, 60);

			})(index,count);

		}


	});


}

module.exports = {

	fileCopy : fileCopy,
	extract : fileExtract

};
