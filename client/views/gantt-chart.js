Template.ganttChart.rendered = function () {
	Deps.autorun(function () {
		renderChart('#gantt-chart');
	});
};

var defaultConfigs = {
	scale: "weeks",
	minScale: "days",
	maxScale: "months",
	navigate: "scroll",
	onItemClick: function(data) {
		alert("Item clicked - show some details");
	},
	onAddClick: function(dt, rowId) {
		alert("Empty space clicked - add an item!");
	},
	onRender: function() {
		console.log("chart rendered");
	}
};

function renderChart(selector) {
	var data = getChartData();
	var configs = _.merge(defaultConfigs, {source: data});
	$('#gantt-chart').gantt(configs);
}

function getChartData() {
	var currentParentID = getCurrentParent();
	var parent = Tasks.findOne(currentParentID);
	if (!parent)
		return [];
	var children = parent.descendants();
	return children.map(convertTaskToGanttFormat);
}

function convertTaskToGanttFormat(task) {
	return {
		name: task.name,
		desc: '',
		values: [{
			from: task.from,
			to: task.to,
			dataObj: task._id,
			customClass: [(task.done ? 'gantt-task-done' : ''), (task.active ? 'gantt-task-active' : '')].join(' ')
		}]
	};
}