Template.newTask.events({
	'submit': function (e, tmpl) {
		e.preventDefault();

		var form = $(e.target);

		var data = {
			name: form.find('.task-name').val(),
			description: form.find('.task-description').val(),
			from: new Date(form.find('.task-from').val()),
			to: new Date(form.find('.task-to').val()),
			done: form.find('.task-done').prop('checked'),
			active: form.find('.task-active').prop('checked')
		};

		var currentlyEditingTask = Session.get('currentlyEditingTask');
		if (currentlyEditingTask) {
			var n = Tasks.update(currentlyEditingTask, {$set: data});
			console.log(n);
		} else {
			data.parent = getCurrentParent();
			Tasks.add(data);
		}
	}
});