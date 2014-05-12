Template.newTask.events({
	'submit': function (e, tmpl) {
		e.preventDefault();

		var data = {
			name: $('.task-name').val(),
			description: $('.task-description').val(),
			from: new Date($('.task-from').val()),
			to: new Date($('.task-to').val()),
			done: $('.task-done').prop('checked'),
			active: $('.task-active').prop('checked'),
			parent: getCurrentParent()
		};

		Tasks.add(data);
	}
});