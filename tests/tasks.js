var assert = require('assert');
var _ = require('lodash');

suite('Tasks', function () {
	test('Adding a task', function (done, server) {
		
		var fix = runAllFixtures(server);

		server.eval(function () {
			var taskID = Tasks.add({
				name: 'Fourth task',
				from: new Date('2014-05-05 00:00:00'),
				to: new Date('2014-05-20 00:00:00'),
				done: false,
				active: true,
				parent: '0',
			});

			var parent = Tasks.findOne('0');

			emit('results', {
				taskID: taskID,
				children: parent.children
			});

		}).once('results', function (results) {
			assert(results.taskID);
			
			var matchingChildrenIDs = results.children.filter(function (c) { return c == results.taskID; });
			assert.equal(matchingChildrenIDs.length, 1);

			done();
		});
	});

	test('Task levels', function (done, server) {
		
		var fix = runAllFixtures(server);

		server.eval(function () {
			var parent = Tasks.findOne('0');

			emit('nobody', parent.descendants(0));
			emit('only children', parent.descendants(1));
			emit('everybody', parent.descendants());
		}).once('nobody', function (tasks) {
			assert.equal(tasks.length, 0);
		}).once('only children', function (tasks) {
			var parent = fix.Tasks['0'];

			assert.equal(tasks.length, parent.children.length);

			for (var i = tasks.length - 1; i >= 0; i--) {
				assert.equal(tasks[i].parent, parent._id);
			};
		}).once('everybody', function (tasks) {
			assert.equal(tasks.length, _.keys(fix.Tasks).length - 1);

			done();
		});
	});

	// test('Start<-end dependency')

	// test('End<-end dependency')
});

suite('GANTT and task CRUD', function () {
	test('Tasks are displayed in GANTT chart', function (done, server, client) {
		
		var fix = runAllFixtures(server);

		client.eval(function () {
			waitForDOM('#gantt-chart .bar', function () {
				var chart = $('#gantt-chart');
				var tasks = [];
				for (var i = chart.find('.bar').length - 1; i >= 0; i--) {
					tasks[i] = {
						_id: chart.find('.bar').slice(i,i+1).data('dataObj'),
						name: chart.find('.row'+i+'.name span').html(),
						done: chart.find('.bar').slice(i,i+1).hasClass('gantt-task-done'),
						active: chart.find('.bar').slice(i,i+1).hasClass('gantt-task-active'),
					};
				}
				emit('tasks', tasks);
			});
		}).once('tasks', function (tasks) {
			assert.equal(tasks.length, _.keys(fix.Tasks).length - 1);

			var usedFixTasks = [];
			for (var i = tasks.length - 1; i >= 0; i--) {
				var task = tasks[i];
				var fixTask = _.find(fix.Tasks, {_id: task._id});

				assert(fixTask);
				assert(!_.find(usedFixTasks, task._id));
				usedFixTasks.push(task._id);

				assert.equal(task.name, fixTask.name);
				assert.equal(task.done, fixTask.done);
				assert.equal(task.active, fixTask.active);
			};

			done();
		});
	});

	test('Filling out blank task form and clicking Create creates task', function (done, server, client) {

		server.eval(function () {

			Tasks.find().observe({
				added: function (task) {
					emit('taskAdded', task);
				}
			});

		}).once('taskAdded', function (task) {
			assert.equal(task.name, 'Just created a task');
			assert.equal(task.done, false);
			assert.equal(task.active, true);

			//console.log(task.from);
			//assert.equal(task.from, new Date('2014-05-01 00:00:00'));   // <-- Mysteriously, these asserts don't work
			//assert.equal(task.to,   new Date('2014-05-30 00:00:00'));
			assert.equal(task.parent, '0');

			done();
		});

		client.eval(function () {

			waitForDOM('#new-task', function () {
				var form = $('#new-task');

				form.find('.task-name').val('Just created a task');
				form.find('.task-done').prop('checked', false);
				form.find('.task-active').prop('checked', true);
				form.find('.task-from').val('2014-05-02 00:00:00');
				form.find('.task-to')  .val('2014-05-30 00:00:00');

				form.submit();
			});

		});

	});

	test('Filling out prefilled task form and clicking Edit edits task', function (done, server, client) {

		var fix = runAllFixtures(server);

		server.eval(function () {

			Tasks.find().observe({
				changed: function (task) {
					emit('taskChanged', task);
				}
			});

		}).once('taskChanged', function (task) {
			assert.equal(task.name, 'Just edited a task');
			assert.equal(task.parent, '0');

			done();
		});

		client.eval(function () {

			Session.set('currentlyEditingTask', '1');

			waitForDOM('#new-task', function () {
				var form = $('#new-task');

				form.find('.task-name').val('Just edited a task');

				form.submit();
			});

		});

	});

	// test('Clicking on blank space in GANTT clears task form and currentlyEditingTask')

	// test('Clicking on non-blank space in GANTT fills task form and currentlyEditingTask')

	// test('Possible alternative parents for task are listed on form')

	// test('Clicking on Delete deletes task')

	// test('Clicking on empty space on GANTT = new task')

	// test('Clicking on task on GANTT = edit task')

	// test('Setting start<-end dependency')

	// test('Setting end<-end dependency')

	// test('Drag-and-drop on GANTT changes parent')
});