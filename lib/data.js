const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

const lib = {
  baseDir: path.join(__dirname, '/../.data/'),
  create(dir, file, data, callBack) {
    fs.open(`${this.baseDir}${dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
      console.log(err, 'errerrerrerr')
      console.log(fileDescriptor, 'fileDescriptor')
      if (!err && fileDescriptor) {
        const stringData = JSON.stringify(data);
        fs.writeFile(fileDescriptor, stringData, (err) => {
          if (!err) {
            fs.close(fileDescriptor, (err) => {
              if (!err) {
                callBack(null);
              } else {
                callBack('error closing new file')
              }
            });
          } else {
            callBack('error writing to new file');
          }
        });
      } else {
        callBack('could not create a file it may already exist');
      }
    });
  },

  read(dir, file, callBack) {
    fs.readFile(lib.baseDir+dir+'/'+file+'.json', 'utf-8', (err, data) => {
      if (!err && data) {
        const parsedData = helpers.parseJsonToObject(data);
        callBack(null, parsedData);
      } else {
        callBack(err, data);
      }
    });
  },

  update(dir, file, data, callBack) {
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'r+', (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        const stringData = JSON.stringify(data);
        fs.truncate(fileDescriptor, (err) => {
          if (!err) {
            fs.writeFile(fileDescriptor, stringData, (err) => {
              if (!err) {
                fs.close(fileDescriptor, (err) => {
                  if (!err) {
                    callBack(null);
                  } else {
                    callBack('error on closing the file')
                  }
                })
              } else {
                callBack('error writing on existing file');
              }
            })
          } else {
            callBack('error on truncating file');
          }
        })
      } else {
        callBack('could not update file. It may not exist yet');
      }
    });
  },

  delete(dir, file, callBack) {
    fs.unlink(lib.baseDir+dir+'/'+file+'.json', (err) => {
      if (!err) {
        callBack(null);
      } else {
        callBack('error on deleting file');
      }
    })
  },

  list(dir, callBack) {
    fs.readdir(lib.baseDir+dir+'/', (err, data) => {
      if (!err && data && data.length) {
        const trimmedFileNames = [];
        data.forEach(fileName => trimmedFileNames.push(fileName.replace('.json', '')));
        callBack(null, trimmedFileNames);
      } else {
        callBack(err, data);
      }
    })
  }
};

module.exports = lib;