var assert = require('assert');
var _ = require('lodash');

suite('Tasks', function () {
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

				console.log('Comparing', task._id, 'with', fixTask._id);
				assert.equal(task.name, fixTask.name);
				assert.equal(task.done, fixTask.done);
				assert.equal(task.active, fixTask.active);
			};

			done();
		});
	});
});