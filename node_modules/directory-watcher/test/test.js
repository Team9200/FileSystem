var DirectoryWatcher = require('../lib/DirectoryWatcher.js')
var fs = require('fs')
var rimraf = require('rimraf')
var path = require('path')
var assert = require('assert')
var util = require('util')
var child = require('child_process')

var TEST_DIR = path.join(__dirname, 'test_dir')

describe('DirectoryWatcher', function() {

	var watcher

	beforeEach(function(done) {
		rimraf(TEST_DIR, function(err) {
			if (err) return done(err)

			fs.mkdirSync(TEST_DIR)

			writeTestFile('1')

			setTimeout(function() {

				DirectoryWatcher.create(TEST_DIR, function(err, _watcher) {
					if (err) return done(err)

					watcher = _watcher
					done()
				})
			}, 500)
		})
	})

	afterEach(function() {
		watcher.kill()
	})

	it('loads a list of files in the watched directory when it is created', function() {

		assert.ok(util.isArray(watcher.files))

		assert.strictEqual(watcher.files.length, 1)

		assert.strictEqual(watcher.files[0], '1')
	})

	it('emits an event when files are added', function(done) {
		var count = 0
		var actual = []

		watcher.on('add', function(files) {

			actual = actual.concat(files)
			if (++count === 2) {
				assert.deepEqual(actual, ['3', '4'])
				done()
			}
		})

		writeTestFile('3')
		writeTestFile('4')
	})

	it('emits an event when files are deleted', function(done) {

		watcher.on('delete', function(files) {
			assert.deepEqual(files, ['1'])
			done()
		})

		deleteTestFile('1')
	})

	it('emits an event when files change', function(done) {

		watcher.on('add', function(files) {
			assert.deepEqual(files, ['5'])
			child.exec('echo 123 >> ' + path.join(TEST_DIR, '5'), function(err, stdout, stderr) {

			})
		})

		watcher.on('change', function(files) {
			assert.deepEqual(files, ['5'])
			done()
		})

		writeTestFile('5')
	})

	describe('works when underlying watcher does not provide filenames', function() {
		it('for added files', function(done) {
			// reset the current files
			watcher.files = []

			watcher.on('add', function(files) {
				assert.deepEqual(files, ['1'])
				done()
			})

			// simulate a rename event with no files
			watcher._onRenameEvent(null)
		})

		it('for deleted files', function(done) {
			// make the watcher think it had an x file
			watcher.files.push('x')

			watcher.on('delete', function(files) {
				assert.deepEqual(files, ['x'])
				done()
			})

			// simulate a rename event with no files
			watcher._onRenameEvent(null)
		})
	})
})

function writeTestFile(name) {
	fs.writeFileSync(path.join(TEST_DIR, name), name)
}

function deleteTestFile(name) {
	fs.unlink(path.join(TEST_DIR, name))
}

function changeTestFile(name) {
	fs.appendFileSync(path.join(TEST_DIR, name), name)
}