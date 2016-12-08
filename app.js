var express = require('express');
var app = express();
var fs = require("fs");
var contents = fs.readFileSync("data.json");
var data = JSON.parse(contents);

var findTorrent = function(data, hash) {
  for(var i = 0; i < data.length; i++) {
    if(data[i].info_hash === hash) {
      return data[i];
    }
  }
  return false;
}

var findID = function(data, qPort, qip) {
  for(var i = 0; i < data.length; i++) {
    //console.log(data[i].peer_id);
    if(data[i].port == qPort && data[i].ip === qip) {
      return true;
    }
  }
  return false;
}


app.get('/', function(req, res) {
  //data.test = req.query.test;
  //console.log(req.query);
  //data.info_hash = req.query.info_hash;
  //data.info_hash.ip = req.connection.remoteAddress;
  //data.info_hash.port = req.query.port;
  var torrent = findTorrent(data, req.query.info_hash);
  if (torrent === false){
    var obj = {"info_hash" : req.query.info_hash, "peers" : [{ "peer_id" : req.query.peer_id, "ip" : req.connection.remoteAddress, "port" : req.connection.remotePort}]};
    data.push(obj);
    torrent = obj;
    //console.log(obj.peers);
  }
  else {
    var peer = findID(torrent.peers, req.query.port, req.connection.remoteAddress);
    if(peer === false){
      var obj = { "peer_id" : req.query.peer_id, "ip" : req.connection.remoteAddress, "port" : req.connection.remotePort };
      torrent.peers.push(obj);
    }
  }

  var response = bencode(torrent);

  //console.log(data);

  fs.writeFileSync("data.json", JSON.stringify(data, null, 2), 'utf-8');
  res.send(response);
});

var bencode = function(torrent) {
  var response = 'd8:intervali120e5:peersld'
  for(var i = 0; i < torrent.peers.length; i++) {
    response = response.concat('7:peer id');
    response = response.concat(torrent.peers[i].peer_id.length + ':');
    response = response.concat(torrent.peers[i].peer_id);
    response = response.concat('2:ip');
    response = response.concat(torrent.peers[i].ip.length + ':');
    response = response.concat(torrent.peers[i].ip);
    response = response.concat('4:port');
    response = response.concat('i' + torrent.peers[i].port + 'e');
  }
  response = response.concat('eee');
  //console.log(response);
  return response;
}

app.listen(3000, function() {
  console.log('Example app listening on port 3000!');
});
