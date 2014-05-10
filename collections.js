Tasks = new Meteor.Collection('tasks', {
	transform: function (task) {
		task.descendants = function (levels) {
			if (!task.children || levels === 0) return [];

			var children = Tasks.find({_id: {$in: this.children}}).fetch();

			var grandChildren = children.map(function (child) {
				return child.descendants(levels ? levels - 1 : undefined);
			});
			
			return _.flatten([children, grandChildren]);
		};
		return task;
	}
});