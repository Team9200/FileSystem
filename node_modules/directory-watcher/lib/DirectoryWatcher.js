var logerror = require('debug')('directory-watcher:error');
var loginfo = require('debug')('directory-watcher:info');
var events = require('events');
var fs = require('fs');
var $u = require('util');
var _ = require('lodash');
var path = require('path');

function DirectoryWatcher(path, initCallback) {

	var self = this;

	fs.readdir(path, function(err, files) {

		if (err === null) {
			
			self.path = path;			
			self.files = files;

		} else {
		
			logerror('failed to read files due to an error', err);
		}
		
		if (initCallback)
			initCallback(err, self);	
	});
}

$u.inherits(DirectoryWatcher, events.EventEmitter);

// factory that creates a watcher using the fs.watch api (instead of fs.watchFile)
DirectoryWatcher.create = function(path, cb) {
	new DirectoryWatcher(path, function(err, watcher) {
		if (err !== null) {
			cb(err);
		} else {
			watcher._internalFSWatcher = fs.watch(path, watcher.listener(), { persistent: false });
			cb(null, watcher);
		}
	});
};

// creates a watcher without attaching it to an underlying mechanism
DirectoryWatcher.createEx = function(path, cb) {
	new DirectoryWatcher(path, cb);
};

DirectoryWatcher.prototype.listener = function() {
	var self = this;

	return function(event, filename) {	
		self._onWatchEvent(event, filename);				
	};
};

DirectoryWatcher.prototype.kill = function () {
	if (this._internalFSWatcher) {		
		this._internalFSWatcher.close()
		this._internalFSWatcher = undefined;		
	} 

	this.files = [];
};

DirectoryWatcher.prototype._onWatchEvent = function(event, filename) {

	if (event === 'rename') {
		this._onRenameEvent(filename);		
	} else if (event === 'change') {
		this._onChangeEvent(filename);
	} else {
		loginfo('Unknown event from file watcher', event);
	}

};

DirectoryWatcher.prototype._onRenameEvent = function (filename) {
	
	var self = this;
	
	if (typeof(filename) === 'undefined' || filename === null) {
		
		loginfo('rename event, no filename was supplied, will do diff on directory');

		fs.readdir(self.path, function(err, files) {			
			
			var deleted = _.difference(self.files, files);
			var added = _.difference(files, self.files);
			var changed = _.intersection(files, self.files);

			if (deleted.length > 0) {				
				loginfo('delete: %s', deleted);
				self.files = files;
				self.emit('delete', deleted);								
			}

			if (added.length > 0) {				
				loginfo('add: %s', added);
				self.files = self.files.concat(added);
				self.emit('add', added);			
			}

			if (changed.length > 0) {
				loginfo('change: %s', changed)
				self._onChangeEvent(changed)
			}

		});

	} else {
		
		loginfo('rename event for file %s', filename);

		var index = this.files.indexOf(filename);
		
		// file was deleted or changed
		if (index >= 0) {

			fs.exists(path.join(this.path, filename), function(exists) {
				
				if (exists) {				
					// changed
					self._onChangeEvent(filename)
				} else {
					//deleted							
					self.files = self.files.splice(index, 1);
					self.emit('delete', [filename]);
				}
			})

		// file was added
		} else {

			self.files.push(filename);
			self.emit('add', [filename]);
		} 
	}
};

DirectoryWatcher.prototype._onChangeEvent = function(filename) {
	var self = this;

	if (typeof(filename) === 'undefined' || filename === null) {
		//TODO: must implement a solution to this
		throw new Error('filename was not supplied by underlying implementation / OS so a change event will not be fired');

	} else {

		loginfo('change event for file %s', filename);
		self.emit('change', [filename]);
	}
};

module.exports = DirectoryWatcher;