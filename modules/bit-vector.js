const fs = require('fs');
const file = require('./file');

function bitSet(fd, storageSize, freeSpace, section){

	return new Promise(function(resolve, reject){

		var index = Math.floor(freeSpace/8);			// bitMap offset
		var buffer = new Buffer(1);					
		
		if(section == "body")
			
			var start = RHB+ file.headerBitMapSize(storageSize)+ index;

		if(section == "header")

			var start = RHB + index;


		try{

			fs.readSync(fd, buffer,0, 1, start);	//	이전 버퍼 받아오기
		
		}
		catch(err){

			reject("bitSet fs.readSync Error : "+err);

		}

		var tmp = (buffer[0]+(1<<(7-freeSpace%8))).toString(16);
		var newBuff = Buffer.from(tmp,'hex');					// 버퍼값 변경 -> 이전 버퍼 + 자리값


		try{

			fs.writeSync(fd, newBuff, 0, 1 , start);			// 파일에 쓰기

		}
		catch(err){

			reject("bitSet fs.writeSync Error : "+err);

		}
		resolve();

	});
	
}


function bitClear(fd, storageSize, freeSpace, section){

	return new Promise(function(resolve, reject){

		var index = Math.floor(freeSpace/8);
		var buffer = new Buffer(1);

		if(section == "body")
			
			var start = RHB+ file.headerBitMapSize(storageSize)+ index;

		if(section == "header")

			var start = RHB + index;

		try{

			fs.readSync(fd, buffer,0, 1, start);	//	이전 버퍼 받아오기
		
		}
		catch(err){

			reject("bitClear fs.readSync Error : "+err);

		}


		var tmp = (buffer[0]^(1<<(7-freeSpace%8))).toString(16);
		var newBuff = Buffer.from(tmp,'hex');					// 버퍼값 변경 -> 이전 버퍼 - 자리값

		try{

			fs.writeSync(fd, newBuff, 0, 1 , start);			// 파일에 쓰기

		}
		catch(err){

			reject("bitClear fs.writeSync Error : "+err);

		}

		
		resolve("bitset");

	});

}

function bitSearch(fd, storageSize, needSpace ,section){

	return new Promise(function(resolve, reject){

		if(section == "header"){

			var bitMapSize = file.headerBitMapSize(storageSize);
			var start = RHB			// root header bytes

		}

		if(section == "body"){
		
			var bitMapSize = file.bodyBitMapSize(storageSize);
			var start = RHB + file.headerBitMapSize(storageSize);
			
		}

		var buffer = new Buffer(bitMapSize);
		fs.readSync(fd, buffer,0, bitMapSize, start);

		var count = needSpace;
		var num = count;
		var freeSpace=new Array();
		
		for(i=0; i<buffer.length && count > 0; i++){

			if(!(buffer[i] & 255 < 255)) {
				

				if(!(buffer[i] & 128)){

					freeSpace.push((8*i));
					count--;

				}

				if(!(buffer[i] & 64)){

					freeSpace.push((8*i)+1);
					count--;

				}

				if(!(buffer[i] & 32)){

					freeSpace.push((8*i)+2);
					count--;

				}

				if(!(buffer[i] & 16)){

					freeSpace.push((8*i)+3);
					count--;

				}

				if(!(buffer[i] & 8)){

					freeSpace.push((8*i)+4);
					count--;

				}

				if(!(buffer[i] & 4)){

					freeSpace.push((8*i)+5);
					count--;

				}

				if(!(buffer[i] & 2)){

					freeSpace.push((8*i)+6);
					count--;

				}

				if(!(buffer[i] & 1)){

					freeSpace.push((8*i)+7);
					count--;

				}					
			}
		}
		resolve(freeSpace.splice(0,num));

	});

}
function usedSearch(fd, storageSize){

	return new Promise(function(resolve, reject){

		var bitMapSize = file.headerBitMapSize(storageSize);
		var start = RHB			// root header bytes

		var buffer = new Buffer(bitMapSize);
		fs.readSync(fd, buffer,0, bitMapSize, start);

		var usedSpace=new Array();

		for(i=0; i<buffer.length; i++){

			if((buffer[i] | 0 != 0)) {

				if((buffer[i] & 128)){

					usedSpace.push((8*i));

				}

				if((buffer[i] & 64)){

					usedSpace.push((8*i)+1);

				}

				if((buffer[i] & 32)){

					usedSpace.push((8*i)+2);
					
				}

				if((buffer[i] & 16)){

					usedSpace.push((8*i)+3);
					

				}

				if((buffer[i] & 8)){

					usedSpace.push((8*i)+4);
					
				}

				if((buffer[i] & 4)){

					usedSpace.push((8*i)+5);
					
				}

				if((buffer[i] & 2)){

					usedSpace.push((8*i)+6);
					
				}

				if((buffer[i] & 1)){

					usedSpace.push((8*i)+7);
					
				}					
			}
		}
		resolve(usedSpace);

	});

}
module.exports = {

	set : bitSet,
	clear : bitClear,
	emptySpace : bitSearch,
	usedSpace : usedSearch


};