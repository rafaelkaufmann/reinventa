getCurrentParent = function () {
	return Session.get('currentParent') || '0';
};

setCurrentParent = function (id) {
	return Session.set('currentParent', id);
};