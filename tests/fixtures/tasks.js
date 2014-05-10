addFixtures('Tasks', [
	{
		_id: '0',
		name: 'Project',
		children: ['1', '2']
	},
	{
		_id: '1',
		name: 'First task',
		from: new Date('2014-05-01 00:00:00'),
		to: new Date('2014-05-03 00:00:00'),
		done: true,
		active: false,
		parent: '0'
	},
	{
		_id: '2',
		name: 'Second task',
		from: new Date('2014-05-03 00:00:00'),
		to: new Date('2014-05-20 00:00:00'),
		done: false,
		active: true,
		parent: '0',
		children: ['3']
	},
	{
		_id: '3',
		name: 'Third task',
		from: new Date('2014-05-05 00:00:00'),
		to: new Date('2014-05-20 00:00:00'),
		done: false,
		active: true,
		parent: '2',
		dependsOn: '1'
	},
]);