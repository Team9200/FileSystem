DirectoryWatcher
================

A directory watcher that keeps an in memory list of the files in the directory, perfoming diffs on them when events arise from the underlying 
[FSWatcher](http://nodejs.org/api/fs.html#fs_class_fs_fswatcher), which doesn't always reports back the files that are related to an event.

The API also provides "nicer" events using the [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter) API: "change", "add", "delete". (currently "change" doesn't function properly *if* the underlying watcher does not return the changed filename)

### Install ###

```
	npm install directory-watcher
```


### create a watcher using [FSWatcher](http://nodejs.org/api/fs.html#fs_class_fs_fswatcher) ###

```
var DirectoryWatcher = require('directory-watcher');

DirectoryWatcher.create('/path/to/somewhere', function(err, watcher) {
	watcher.once('change', function(files) {
		console.log('will fire once');		
	});

	watcher.on('delete', function(files) {
		console.log('%s deleted', files);
	});

	watcher.on('add', function(files) {
		console.log('%s added', files);
	});
});

```


### using without [FSWatcher](http://nodejs.org/api/fs.html#fs_class_fs_fswatcher) or with external FSWatcher (untested) ###

```
var DirectoryWatcher = require('directory-watcher');

DirectoryWatcher.createEx('/path/to/somewhere', function(err, watcher) {
	var onFileEvent = watcher.listener();
	onFileEvent('rename', undefined);
});

```

or

```
var DirectoryWatcher = require('directory-watcher');
var fs = require('fs');

DirectoryWatcher.createEx('/path/to/somewhere', function(err, watcher) {
	fs.watch(path, watcher.listener(), { persistent: false });
});

```
note that watcher.kill() will only clear the internal files cache in this instance