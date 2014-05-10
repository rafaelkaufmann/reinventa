Package.describe({
  summary: "Package for jQuery-GANTT"
});

Package.on_use(function (api) {
  api.use('jquery', 'client');

  api.add_files([
    'lib/jquery.fn.gantt.js',
  ], 'client'
  );

});