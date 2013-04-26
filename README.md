# node-mpq

node-mpq is a port of the [mpyq](https://github.com/arkx/mpyq) python library developed by [arkx](https://github.com/arkx).

The reason for development are two-fold
 * I saw that [comsat](https://github.com/tec27/comsat) was calling python to decrypt the replays and I felt like it was an unnecessary dependency
 * I like the concept of node.js and wanted a project that I could play around with it in

Currently, I am only attempting to port and so I am ignoring the best practices of node.js development.  Once I have a working module, I'll begin reworking the API to fit common needs.

Tests can be run via mocha
